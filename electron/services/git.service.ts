/**
 * Git Service
 *
 * Provides git operations (diff, status, log, show, file content, branches)
 * for the diff viewer feature. All operations are async and shell out to git.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';

import type {
  DiffOptions,
  FileDiffOptions,
  GitBranch,
  GitDiffResult,
  GitLogEntry,
  GitLogOptions,
  GitStatusFile,
  GitStatusResult,
} from '../../types/diff';

import { parseDiff } from '../utils/diff-parser';

const execFileAsync = promisify(execFile);

const MAX_BUFFER = 50 * 1024 * 1024; // 50 MB for large diffs

class GitService {
  /**
   * List all branches (local and remote).
   */
  async getBranches(repoPath: string): Promise<Array<GitBranch>> {
    const output = await this.exec(repoPath, ['branch', '-a', '--format=%(refname:short)%09%(HEAD)']);
    const branches: Array<GitBranch> = [];

    for (const line of output.split('\n')) {
      if (!line.trim()) continue;
      const [name, head] = line.split('\t');
      if (!name) continue;

      const isRemote = name.startsWith('remotes/') || name.startsWith('origin/');
      branches.push({
        isCurrent: head === '*',
        isRemote,
        name: isRemote ? name.replace(/^remotes\//, '') : name,
      });
    }

    return branches;
  }

  /**
   * Get the diff between two refs, or the working directory diff.
   */
  async getDiff(repoPath: string, options?: DiffOptions): Promise<GitDiffResult> {
    const args = ['diff'];

    if (options?.contextLines !== undefined) {
      args.push(`-U${options.contextLines}`);
    }

    if (options?.base && options?.target) {
      args.push(`${options.base}...${options.target}`);
    } else if (options?.base) {
      args.push(options.base);
    }

    if (options?.path) {
      args.push('--', options.path);
    }

    const rawDiff = await this.exec(repoPath, args);
    return parseDiff(rawDiff);
  }

  /**
   * Get the content of a file at a specific ref.
   */
  async getFileContent(repoPath: string, filePath: string, ref?: string): Promise<string> {
    if (ref) {
      return this.exec(repoPath, ['show', `${ref}:${filePath}`]);
    }
    // Read from working directory
    const fs = await import('fs/promises');
    const path = await import('path');
    const fullPath = path.join(repoPath, filePath);
    return fs.readFile(fullPath, 'utf-8');
  }

  /**
   * Get the diff for a specific file.
   */
  async getFileDiff(repoPath: string, options: FileDiffOptions): Promise<GitDiffResult> {
    return this.getDiff(repoPath, {
      base: options.base,
      contextLines: options.contextLines,
      path: options.filePath,
      target: options.target,
    });
  }

  /**
   * Get the git log.
   */
  async getLog(repoPath: string, options?: GitLogOptions): Promise<Array<GitLogEntry>> {
    const limit = options?.limit ?? 50;
    const args = [
      'log',
      `--max-count=${limit}`,
      '--format=%H%n%h%n%an%n%ae%n%aI%n%s',
    ];

    if (options?.ref) {
      args.push(options.ref);
    }

    if (options?.path) {
      args.push('--', options.path);
    }

    const output = await this.exec(repoPath, args);
    if (!output.trim()) return [];

    const lines = output.trim().split('\n');
    const entries: Array<GitLogEntry> = [];

    // Each entry is 6 lines
    for (let i = 0; i + 5 < lines.length; i += 6) {
      entries.push({
        authorEmail: lines[i + 3]!,
        authorName: lines[i + 2]!,
        date: lines[i + 4]!,
        hash: lines[i]!,
        message: lines[i + 5]!,
        shortHash: lines[i + 1]!,
      });
    }

    return entries;
  }

  /**
   * Get the git status of the working directory.
   */
  async getStatus(repoPath: string): Promise<GitStatusResult> {
    const output = await this.exec(repoPath, ['status', '--porcelain=v1']);
    const files: Array<GitStatusFile> = [];
    let staged = 0;
    let modified = 0;
    let deleted = 0;
    let untracked = 0;

    for (const line of output.split('\n')) {
      if (!line.trim()) continue;

      const indexStatus = line[0] ?? ' ';
      const workingTreeStatus = line[1] ?? ' ';
      const filePath = line.slice(3).trim();

      // Handle renames: "R  old -> new"
      const path = filePath.includes(' -> ') ? filePath.split(' -> ')[1]! : filePath;

      files.push({ indexStatus, path, workingTreeStatus });

      if (indexStatus !== ' ' && indexStatus !== '?') staged++;
      if (workingTreeStatus === 'M') modified++;
      if (workingTreeStatus === 'D' || indexStatus === 'D') deleted++;
      if (indexStatus === '?') untracked++;
    }

    return { files, summary: { deleted, modified, staged, untracked } };
  }

  /**
   * Get the diff for a worktree (committed + uncommitted changes).
   */
  async getWorktreeDiff(
    worktreePath: string,
    baseBranch?: string
  ): Promise<{ committed: GitDiffResult; uncommitted: GitDiffResult }> {
    // Get uncommitted changes (staged + unstaged)
    const uncommitted = await this.getDiff(worktreePath);

    // Get committed changes since base branch
    let committed: GitDiffResult = { files: [], stats: { deletions: 0, fileCount: 0, insertions: 0 } };
    if (baseBranch) {
      try {
        committed = await this.getDiff(worktreePath, { base: baseBranch, target: 'HEAD' });
      } catch {
        // Base branch may not exist or have no common ancestor
      }
    }

    return { committed, uncommitted };
  }

  /**
   * Execute a git command and return stdout.
   */
  private async exec(cwd: string, args: Array<string>): Promise<string> {
    try {
      const { stdout } = await execFileAsync('git', args, {
        cwd,
        maxBuffer: MAX_BUFFER,
      });
      return stdout;
    } catch (error: unknown) {
      const execError = error as { code?: number; stderr?: string; stdout?: string };
      // Git returns exit code 1 for "no differences" in some commands
      if (execError.code === 1 && execError.stdout !== undefined) {
        return execError.stdout;
      }
      throw error;
    }
  }
}

export const gitService = new GitService();
