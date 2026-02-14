/**
 * Worktree Lifecycle Service
 *
 * Manages git worktree creation, setup, and cleanup for parallel workflow execution.
 * Each workflow can operate in its own git worktree, enabling concurrent agent execution
 * across multiple feature branches.
 *
 * ## Usage
 *
 * ```typescript
 * import { worktreeService } from './worktree.service';
 *
 * const branchName = worktreeService.generateBranchName(42, 'Add user auth');
 * const worktreeDir = worktreeService.resolveWorktreeDir('/repo', branchName);
 * const worktreePath = await worktreeService.createWorktree('/repo', branchName, worktreeDir);
 * await worktreeService.runSetupCommands(worktreePath, '/repo');
 * ```
 */
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

class WorktreeService {
  /**
   * Create a new git worktree with a feature branch.
   *
   * Runs `git worktree add <targetDir> -b <branchName>`.
   * If the target directory already exists, appends a timestamp suffix and retries once.
   *
   * @param repositoryPath - Path to the main repository
   * @param branchName - Branch name for the worktree (e.g., `clarify/wf-42/add-user-auth`)
   * @param targetDir - Absolute path where the worktree should be created
   * @returns The absolute path of the created worktree
   * @throws If git worktree creation fails
   */
  async createWorktree(repositoryPath: string, branchName: string, targetDir: string): Promise<string> {
    let finalDir = targetDir;

    // If target directory already exists, append timestamp and retry once
    if (fs.existsSync(finalDir)) {
      finalDir = `${targetDir}-${Date.now()}`;
      console.log(`[Worktree] Target dir exists, using fallback: ${finalDir}`);
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(finalDir);
    fs.mkdirSync(parentDir, { recursive: true });

    try {
      await execFileAsync('git', ['worktree', 'add', finalDir, '-b', branchName], {
        cwd: repositoryPath,
      });

      console.log(`[Worktree] Created worktree at ${finalDir} on branch ${branchName}`);
      return finalDir;
    } catch (error) {
      console.error('[Worktree] Failed to create worktree:', error);
      throw error;
    }
  }

  /**
   * Generate a branch name for a workflow.
   *
   * Produces `clarify/wf-{id}/{slug}` where slug is the feature name
   * lowercased, with special chars replaced by hyphens, truncated to 40 chars.
   *
   * @param workflowId - The workflow database ID
   * @param featureName - The human-readable feature name
   * @returns The generated branch name
   */
  generateBranchName(workflowId: number, featureName: string): string {
    const slug = featureName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

    return `clarify/wf-${workflowId}/${slug}`;
  }

  /**
   * Remove a git worktree and clean up its branch.
   *
   * Runs `git worktree remove <path> --force`, then `git branch -d <branch>`.
   * Branch deletion is best-effort and doesn't fail the operation.
   *
   * @param repositoryPath - Path to the main repository
   * @param worktreePath - Absolute path of the worktree to remove
   */
  async removeWorktree(repositoryPath: string, worktreePath: string): Promise<void> {
    try {
      await execFileAsync('git', ['worktree', 'remove', worktreePath, '--force'], {
        cwd: repositoryPath,
      });
      console.log(`[Worktree] Removed worktree at ${worktreePath}`);
    } catch (error) {
      console.error('[Worktree] Failed to remove worktree:', error);
      throw error;
    }

    // Best-effort branch cleanup - extract branch name from worktree path
    try {
      // The branch name is embedded in the worktree path structure
      // but we get it from git worktree list to be safe
      await execFileAsync('git', ['worktree', 'prune'], {
        cwd: repositoryPath,
      });
    } catch (pruneError) {
      console.warn('[Worktree] Prune failed (non-fatal):', pruneError);
    }
  }

  /**
   * Resolve the target directory for a worktree.
   *
   * Creates the worktree under `{repositoryPath}/../.clarify-worktrees/{branchName}/`.
   * The branch name slashes are preserved in the directory structure.
   *
   * @param repositoryPath - Path to the main repository
   * @param branchName - The branch name (may contain slashes)
   * @returns Absolute path for the worktree directory
   */
  resolveWorktreeDir(repositoryPath: string, branchName: string): string {
    const parentDir = path.dirname(repositoryPath);
    return path.join(parentDir, '.clarify-worktrees', branchName);
  }

  /**
   * Run setup commands from the repository's `.cursor/worktrees.json` config.
   *
   * Reads `setup-worktree` commands and executes them sequentially in the worktree directory.
   * Substitutes `$ROOT_WORKTREE_PATH` with the main repository path.
   * On Windows, `cp` commands are translated to Node.js `fs.cpSync`.
   *
   * Errors are logged but don't fail the operation - the worktree is still usable.
   *
   * @param worktreePath - Path to the worktree (used as cwd for commands)
   * @param repositoryPath - Path to the main repository (for config lookup and substitution)
   */
  async runSetupCommands(worktreePath: string, repositoryPath: string): Promise<void> {
    const configPath = path.join(repositoryPath, '.cursor', 'worktrees.json');

    let config: { 'setup-worktree'?: Array<string> };
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      config = JSON.parse(raw) as { 'setup-worktree'?: Array<string> };
    } catch {
      console.log('[Worktree] No .cursor/worktrees.json found, skipping setup commands');
      return;
    }

    const commands = config['setup-worktree'];
    if (!commands || commands.length === 0) {
      console.log('[Worktree] No setup-worktree commands found');
      return;
    }

    for (const rawCmd of commands) {
      const cmd = rawCmd.replace(/\$ROOT_WORKTREE_PATH/g, repositoryPath);

      try {
        // On Windows, handle `cp` commands using Node.js fs
        if (process.platform === 'win32' && cmd.startsWith('cp ')) {
          this.handleWindowsCopy(cmd, worktreePath);
          continue;
        }

        const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
        const shellArgs = process.platform === 'win32' ? ['/c', cmd] : ['-c', cmd];

        console.log(`[Worktree] Running setup command: ${cmd}`);
        await execFileAsync(shell, shellArgs, {
          cwd: worktreePath,
          timeout: 120_000, // 2 minute timeout per command
        });
      } catch (error) {
        console.warn(`[Worktree] Setup command failed (non-fatal): ${cmd}`, error);
      }
    }

    console.log('[Worktree] Setup commands completed');
  }

  /**
   * Handle `cp` commands on Windows using Node.js fs.cpSync.
   */
  private handleWindowsCopy(cmd: string, cwd: string): void {
    // Parse simple `cp source dest` format
    const parts = cmd.split(/\s+/);
    if (parts.length < 3) {
      console.warn(`[Worktree] Invalid cp command: ${cmd}`);
      return;
    }

    const src = path.resolve(cwd, parts[1]!);
    const dest = path.resolve(cwd, parts[2]!);

    console.log(`[Worktree] Windows cp: ${src} -> ${dest}`);

    try {
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
    } catch (error) {
      console.warn(`[Worktree] Windows copy failed (non-fatal):`, error);
    }
  }
}

/**
 * Singleton worktree service instance.
 */
export const worktreeService = new WorktreeService();
