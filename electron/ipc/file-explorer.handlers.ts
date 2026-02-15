/**
 * File Explorer IPC Handlers
 *
 * Git-aware file tree browsing and fuzzy file search.
 * Uses `git ls-files` to respect .gitignore and only show tracked/untracked non-ignored files.
 */
import { execFile } from 'child_process';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

import { IpcChannels } from './channels';

const execFileAsync = promisify(execFile);

/** Entry returned by listDirectory */
interface DirectoryEntry {
  name: string;
  relativePath: string;
  type: 'directory' | 'file';
}

/** Result returned by searchFiles */
interface FileSearchResult {
  relativePath: string;
  score: number;
}

/** Cache for git ls-files output per repo */
const fileListCache = new Map<string, { files: Array<string>; timestamp: number }>();
const FILE_LIST_CACHE_TTL_MS = 30_000;

/**
 * Register all file explorer IPC handlers.
 */
export function registerFileExplorerHandlers(): void {
  /**
   * List directory contents (one level deep), respecting .gitignore.
   * Returns directories and files sorted: directories first, then alphabetical.
   */
  ipcMain.handle(
    IpcChannels.fileExplorer.listDirectory,
    async (
      _event: IpcMainInvokeEvent,
      repoPath: string,
      dirPath?: string
    ): Promise<{
      entries: Array<DirectoryEntry>;
      error?: string;
      success: boolean;
    }> => {
      try {
        const normalizedRepo = path.normalize(repoPath);
        const targetDir = dirPath
          ? path.join(normalizedRepo, dirPath)
          : normalizedRepo;

        // Verify the target is within the repo
        if (!targetDir.startsWith(normalizedRepo)) {
          return { entries: [], error: 'Path traversal detected', success: false };
        }

        // Get git-tracked files to filter against
        const gitFiles = await getGitFiles(normalizedRepo);
        const prefix = dirPath ? (dirPath.endsWith('/') ? dirPath : `${dirPath}/`) : '';

        // Find files and directories at this level from the git file list
        const filesAtLevel = new Set<string>();
        const dirsAtLevel = new Set<string>();

        for (const file of gitFiles) {
          if (!file.startsWith(prefix)) continue;
          const remainder = file.slice(prefix.length);
          const slashIdx = remainder.indexOf('/');

          if (slashIdx === -1) {
            // Direct file at this level
            filesAtLevel.add(remainder);
          } else {
            // Directory containing tracked files
            dirsAtLevel.add(remainder.slice(0, slashIdx));
          }
        }

        // Also check the actual filesystem for directories that might contain
        // only untracked (but non-ignored) files
        try {
          const dirents = await fs.readdir(targetDir, { withFileTypes: true });
          for (const dirent of dirents) {
            if (dirent.isDirectory() && !dirent.name.startsWith('.')) {
              // Check if any git file exists under this dir
              const dirPrefix = prefix + dirent.name + '/';
              const hasGitFiles = gitFiles.some((f) => f.startsWith(dirPrefix));
              if (hasGitFiles) {
                dirsAtLevel.add(dirent.name);
              }
            }
          }
        } catch {
          // Directory might not exist or be unreadable
        }

        const entries: Array<DirectoryEntry> = [];

        // Add directories first (sorted)
        for (const name of [...dirsAtLevel].sort()) {
          entries.push({
            name,
            relativePath: prefix + name,
            type: 'directory',
          });
        }

        // Add files (sorted)
        for (const name of [...filesAtLevel].sort()) {
          entries.push({
            name,
            relativePath: prefix + name,
            type: 'file',
          });
        }

        return { entries, success: true };
      } catch (error) {
        return {
          entries: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }
  );

  /**
   * Fuzzy search files in a repository.
   * Uses cached `git ls-files` output for fast searching.
   */
  ipcMain.handle(
    IpcChannels.fileExplorer.searchFiles,
    async (
      _event: IpcMainInvokeEvent,
      repoPath: string,
      query: string,
      limit?: number
    ): Promise<{
      error?: string;
      results: Array<FileSearchResult>;
      success: boolean;
    }> => {
      try {
        const maxResults = limit ?? 50;
        const gitFiles = await getGitFiles(path.normalize(repoPath));

        if (!query || query.length === 0) {
          return { results: [], success: true };
        }

        const scored: Array<FileSearchResult> = [];
        for (const file of gitFiles) {
          const score = fuzzyScore(query, file);
          if (score > 0) {
            scored.push({ relativePath: file, score });
          }
        }

        // Sort by score descending, take top N
        scored.sort((a, b) => b.score - a.score);
        const results = scored.slice(0, maxResults);

        return { results, success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          results: [],
          success: false,
        };
      }
    }
  );
}

/**
 * Simple fuzzy match scoring.
 * Higher score = better match. Returns 0 for no match.
 */
function fuzzyScore(query: string, target: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerTarget = target.toLowerCase();

  // Exact substring match gets highest bonus
  if (lowerTarget.includes(lowerQuery)) {
    // Prefer matches at path segment boundaries
    const idx = lowerTarget.indexOf(lowerQuery);
    const atBoundary = idx === 0 || lowerTarget[idx - 1] === '/';
    return 1000 + (atBoundary ? 500 : 0) + (1000 - target.length);
  }

  // Character-by-character fuzzy matching
  let queryIdx = 0;
  let score = 0;
  let consecutive = 0;

  for (let i = 0; i < lowerTarget.length && queryIdx < lowerQuery.length; i++) {
    if (lowerTarget[i] === lowerQuery[queryIdx]) {
      queryIdx++;
      consecutive++;
      score += consecutive * 10;
      // Bonus for matches at segment boundaries
      if (i === 0 || lowerTarget[i - 1] === '/' || lowerTarget[i - 1] === '.') {
        score += 50;
      }
    } else {
      consecutive = 0;
    }
  }

  // All query characters must match
  if (queryIdx < lowerQuery.length) return 0;

  return score;
}

/**
 * Get all non-ignored files in a repo via `git ls-files`.
 * Results are cached for 30 seconds per repo path.
 */
async function getGitFiles(repoPath: string): Promise<Array<string>> {
  const cached = fileListCache.get(repoPath);
  if (cached && Date.now() - cached.timestamp < FILE_LIST_CACHE_TTL_MS) {
    return cached.files;
  }

  try {
    const { stdout } = await execFileAsync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard'],
      { cwd: repoPath, maxBuffer: 10 * 1024 * 1024 }
    );

    const files = stdout
      .split('\n')
      .filter((line: string) => line.length > 0);

    fileListCache.set(repoPath, { files, timestamp: Date.now() });
    return files;
  } catch {
    return [];
  }
}
