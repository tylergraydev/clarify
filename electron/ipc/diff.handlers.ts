/**
 * Diff IPC Handlers
 *
 * Handles git diff operations including:
 * - Getting diffs between refs or working directory
 * - Getting single file diffs
 * - Git status, log, and branch listing
 * - Worktree diff (committed + uncommitted)
 * - File content at specific refs
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { DiffOptions, FileDiffOptions, GitBranch, GitDiffResult, GitLogEntry, GitLogOptions, GitStatusResult } from '../../types/diff';

import { gitService } from '../services/git.service';
import { IpcChannels } from './channels';

/**
 * Register all diff-related IPC handlers.
 */
export function registerDiffHandlers(): void {
  // Get diff between refs or working directory
  ipcMain.handle(
    IpcChannels.diff.getDiff,
    async (_event: IpcMainInvokeEvent, repoPath: string, options?: DiffOptions): Promise<GitDiffResult> => {
      try {
        return await gitService.getDiff(repoPath, options);
      } catch (error) {
        console.error('[IPC Error] diff:getDiff:', error);
        throw error;
      }
    }
  );

  // Get diff for a specific file
  ipcMain.handle(
    IpcChannels.diff.getFileDiff,
    async (_event: IpcMainInvokeEvent, repoPath: string, options: FileDiffOptions): Promise<GitDiffResult> => {
      try {
        return await gitService.getFileDiff(repoPath, options);
      } catch (error) {
        console.error('[IPC Error] diff:getFileDiff:', error);
        throw error;
      }
    }
  );

  // Get git status
  ipcMain.handle(
    IpcChannels.diff.getStatus,
    async (_event: IpcMainInvokeEvent, repoPath: string): Promise<GitStatusResult> => {
      try {
        return await gitService.getStatus(repoPath);
      } catch (error) {
        console.error('[IPC Error] diff:getStatus:', error);
        throw error;
      }
    }
  );

  // Get git log
  ipcMain.handle(
    IpcChannels.diff.getLog,
    async (_event: IpcMainInvokeEvent, repoPath: string, options?: GitLogOptions): Promise<Array<GitLogEntry>> => {
      try {
        return await gitService.getLog(repoPath, options);
      } catch (error) {
        console.error('[IPC Error] diff:getLog:', error);
        throw error;
      }
    }
  );

  // Get file content at a ref
  ipcMain.handle(
    IpcChannels.diff.getFileContent,
    async (_event: IpcMainInvokeEvent, repoPath: string, filePath: string, ref?: string): Promise<string> => {
      try {
        return await gitService.getFileContent(repoPath, filePath, ref);
      } catch (error) {
        console.error('[IPC Error] diff:getFileContent:', error);
        throw error;
      }
    }
  );

  // Get worktree diff (committed + uncommitted)
  ipcMain.handle(
    IpcChannels.diff.getWorktreeDiff,
    async (
      _event: IpcMainInvokeEvent,
      worktreePath: string,
      baseBranch?: string
    ): Promise<{ committed: GitDiffResult; uncommitted: GitDiffResult }> => {
      try {
        return await gitService.getWorktreeDiff(worktreePath, baseBranch);
      } catch (error) {
        console.error('[IPC Error] diff:getWorktreeDiff:', error);
        throw error;
      }
    }
  );

  // Get branches
  ipcMain.handle(
    IpcChannels.diff.getBranches,
    async (_event: IpcMainInvokeEvent, repoPath: string): Promise<Array<GitBranch>> => {
      try {
        return await gitService.getBranches(repoPath);
      } catch (error) {
        console.error('[IPC Error] diff:getBranches:', error);
        throw error;
      }
    }
  );
}
