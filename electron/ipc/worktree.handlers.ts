/**
 * Worktree IPC Handlers
 *
 * Handles worktree-related operations for branch information display.
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { WorktreesRepository } from '../../db/repositories';
import type { Worktree } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Register all worktree-related IPC handlers.
 *
 * @param worktreesRepository - The worktrees repository for database operations
 */
export function registerWorktreeHandlers(worktreesRepository: WorktreesRepository): void {
  // Get a worktree by ID
  ipcMain.handle(
    IpcChannels.worktree.get,
    async (_event: IpcMainInvokeEvent, id: number): Promise<undefined | Worktree> => {
      try {
        return worktreesRepository.findById(id);
      } catch (error) {
        console.error('[IPC Error] worktree:get:', error);
        throw error;
      }
    }
  );

  // Get a worktree by workflow ID
  ipcMain.handle(
    IpcChannels.worktree.getByWorkflowId,
    async (_event: IpcMainInvokeEvent, workflowId: number): Promise<undefined | Worktree> => {
      try {
        return worktreesRepository.findByWorkflowId(workflowId);
      } catch (error) {
        console.error('[IPC Error] worktree:getByWorkflowId:', error);
        throw error;
      }
    }
  );

  // List all worktrees with optional filters
  ipcMain.handle(
    IpcChannels.worktree.list,
    async (
      _event: IpcMainInvokeEvent,
      options?: { repositoryId?: number; status?: string }
    ): Promise<Array<Worktree>> => {
      try {
        return worktreesRepository.findAll(options);
      } catch (error) {
        console.error('[IPC Error] worktree:list:', error);
        throw error;
      }
    }
  );
}
