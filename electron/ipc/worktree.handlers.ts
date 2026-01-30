/**
 * Worktree IPC Handlers
 *
 * Handles worktree-related operations for branch information display.
 */
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { WorktreesRepository } from "../../db/repositories";
import type { Worktree } from "../../db/schema";

import { IpcChannels } from "./channels";

/**
 * Register all worktree-related IPC handlers.
 *
 * @param worktreesRepository - The worktrees repository for database operations
 */
export function registerWorktreeHandlers(
  worktreesRepository: WorktreesRepository
): void {
  // Get a worktree by ID
  ipcMain.handle(
    IpcChannels.worktree.get,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<undefined | Worktree> => {
      return worktreesRepository.findById(id);
    }
  );

  // Get a worktree by workflow ID
  ipcMain.handle(
    IpcChannels.worktree.getByWorkflowId,
    async (
      _event: IpcMainInvokeEvent,
      workflowId: number
    ): Promise<undefined | Worktree> => {
      return worktreesRepository.findByWorkflowId(workflowId);
    }
  );

  // List all worktrees with optional filters
  ipcMain.handle(
    IpcChannels.worktree.list,
    async (
      _event: IpcMainInvokeEvent,
      options?: { repositoryId?: number; status?: string }
    ): Promise<Array<Worktree>> => {
      return worktreesRepository.findAll(options);
    }
  );
}
