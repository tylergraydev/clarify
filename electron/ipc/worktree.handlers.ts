/**
 * Worktree IPC Handlers
 *
 * Handles worktree-related operations including:
 * - Querying worktrees by ID, workflow ID, or with filters
 * - Creating worktrees for workflow isolation
 * - Cleaning up worktrees when workflows finish
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { RepositoriesRepository, SettingsRepository, WorktreesRepository } from '../../db/repositories';
import type { Worktree } from '../../db/schema';

import { worktreeService } from '../services/worktree.service';
import { IpcChannels } from './channels';

/**
 * Input for creating a worktree via IPC
 */
interface WorktreeCreateInput {
  featureName: string;
  repositoryId: number;
  workflowId: number;
}

/**
 * Attempt to clean up a worktree for a workflow.
 *
 * Checks the `worktreeAutoCleanup` setting, finds the worktree record,
 * and removes it from disk + updates DB status.
 *
 * Exported for use by workflow and step handlers.
 */
export async function maybeCleanupWorktree(
  workflowId: number,
  worktreesRepository: WorktreesRepository,
  repositoriesRepository: RepositoriesRepository,
  settingsRepository: SettingsRepository
): Promise<boolean> {
  const autoCleanup = settingsRepository.getValue('worktreeAutoCleanup');
  if (autoCleanup === 'false') return false;

  const worktree = worktreesRepository.findByWorkflowId(workflowId);
  if (!worktree || worktree.status === 'removed') return false;

  worktreesRepository.updateStatus(worktree.id, 'cleaning');

  const repo = repositoriesRepository.findById(worktree.repositoryId);
  if (!repo) return false;

  try {
    await worktreeService.removeWorktree(repo.path, worktree.path);
    worktreesRepository.updateStatus(worktree.id, 'removed');
    return true;
  } catch (error) {
    console.error('[Worktree] cleanup failed:', error);
    // Leave status as 'cleaning' for manual cleanup
    return false;
  }
}

/**
 * Register all worktree-related IPC handlers.
 *
 * @param worktreesRepository - The worktrees repository for database operations
 * @param repositoriesRepository - The repositories repository for looking up repo paths
 * @param settingsRepository - The settings repository for reading worktree preferences
 */
export function registerWorktreeHandlers(
  worktreesRepository: WorktreesRepository,
  repositoriesRepository: RepositoriesRepository,
  settingsRepository: SettingsRepository
): void {
  // Create a worktree for a workflow
  ipcMain.handle(
    IpcChannels.worktree.create,
    async (_event: IpcMainInvokeEvent, input: WorktreeCreateInput): Promise<Worktree> => {
      try {
        const repo = repositoriesRepository.findById(input.repositoryId);
        if (!repo) {
          throw new Error(`Repository ${input.repositoryId} not found`);
        }

        const branchName = worktreeService.generateBranchName(input.workflowId, input.featureName);
        const targetDir = worktreeService.resolveWorktreeDir(repo.path, branchName);
        const worktreePath = await worktreeService.createWorktree(repo.path, branchName, targetDir);

        // Run setup commands (non-blocking errors)
        await worktreeService.runSetupCommands(worktreePath, repo.path);

        // Create DB record
        const worktree = worktreesRepository.create({
          branchName,
          path: worktreePath,
          repositoryId: input.repositoryId,
          status: 'active',
          workflowId: input.workflowId,
        });

        return worktree;
      } catch (error) {
        console.error('[IPC Error] worktree:create:', error);
        throw error;
      }
    }
  );

  // Clean up a worktree for a workflow
  ipcMain.handle(
    IpcChannels.worktree.cleanup,
    async (_event: IpcMainInvokeEvent, workflowId: number): Promise<boolean> => {
      try {
        return await maybeCleanupWorktree(
          workflowId,
          worktreesRepository,
          repositoriesRepository,
          settingsRepository
        );
      } catch (error) {
        console.error('[IPC Error] worktree:cleanup:', error);
        return false;
      }
    }
  );

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
