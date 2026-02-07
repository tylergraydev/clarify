/**
 * Repository IPC Handlers
 *
 * Handles all repository management operations including:
 * - CRUD operations for repositories
 * - Path-based repository lookup
 * - Project-based filtering
 * - Default repository management for projects
 * - Pre-delete info for workflow impact assessment
 * - Atomic delete with workflow cleanup
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type {
  RepositoriesRepository,
  WorkflowRepositoriesRepository,
  WorkflowsRepository,
} from '../../db/repositories';
import type { NewRepository, Repository } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Non-terminal workflow statuses that indicate a workflow is still active
 */
const NON_TERMINAL_STATUSES = ['created', 'running', 'paused', 'editing', 'awaiting_input'] as const;

/**
 * Result from the delete-with-cleanup operation
 */
export interface DeleteWithCleanupResult {
  cancelledCount: number;
  deleted: boolean;
}

/**
 * Result from the pre-delete info check
 */
export interface PreDeleteInfo {
  totalCount: number;
  workflows: Array<{ featureName: string; id: number; status: string }>;
}

/**
 * Filter options for listing repositories
 */
interface RepositoryListFilters {
  projectId?: number;
}

/**
 * Register all repository-related IPC handlers.
 *
 * @param repositoriesRepository - The repositories repository for database operations
 * @param workflowsRepository - The workflows repository for workflow cleanup on delete
 * @param workflowRepositoriesRepository - The workflow-repositories junction repository for finding linked workflows
 */
export function registerRepositoryHandlers(
  repositoriesRepository: RepositoriesRepository,
  workflowsRepository: WorkflowsRepository,
  workflowRepositoriesRepository: WorkflowRepositoriesRepository
): void {
  // Create a new repository
  ipcMain.handle(IpcChannels.repository.create, (_event: IpcMainInvokeEvent, data: NewRepository): Repository => {
    try {
      return repositoriesRepository.create(data);
    } catch (error) {
      console.error('[IPC Error] repository:create:', error);
      throw error;
    }
  });

  // Get a repository by ID
  ipcMain.handle(IpcChannels.repository.get, (_event: IpcMainInvokeEvent, id: number): Repository | undefined => {
    try {
      return repositoriesRepository.findById(id);
    } catch (error) {
      console.error('[IPC Error] repository:get:', error);
      throw error;
    }
  });

  // List repositories with optional project filter
  ipcMain.handle(
    IpcChannels.repository.list,
    (_event: IpcMainInvokeEvent, filters?: RepositoryListFilters): Array<Repository> => {
      try {
        return repositoriesRepository.findAll(filters);
      } catch (error) {
        console.error('[IPC Error] repository:list:', error);
        throw error;
      }
    }
  );

  // Update a repository
  ipcMain.handle(
    IpcChannels.repository.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewRepository>): Repository | undefined => {
      try {
        return repositoriesRepository.update(id, data);
      } catch (error) {
        console.error('[IPC Error] repository:update:', error);
        throw error;
      }
    }
  );

  // Delete a repository
  ipcMain.handle(IpcChannels.repository.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    try {
      return repositoriesRepository.delete(id);
    } catch (error) {
      console.error('[IPC Error] repository:delete:', error);
      throw error;
    }
  });

  // Find a repository by file path
  ipcMain.handle(
    IpcChannels.repository.findByPath,
    (_event: IpcMainInvokeEvent, path: string): Repository | undefined => {
      try {
        return repositoriesRepository.findByPath(path);
      } catch (error) {
        console.error('[IPC Error] repository:findByPath:', error);
        throw error;
      }
    }
  );

  // Set a repository as the default for its project
  ipcMain.handle(
    IpcChannels.repository.setDefault,
    (_event: IpcMainInvokeEvent, id: number): Repository | undefined => {
      try {
        return repositoriesRepository.setAsDefault(id);
      } catch (error) {
        console.error('[IPC Error] repository:setDefault:', error);
        throw error;
      }
    }
  );

  // Clear the default status from a repository
  ipcMain.handle(
    IpcChannels.repository.clearDefault,
    (_event: IpcMainInvokeEvent, id: number): Repository | undefined => {
      try {
        return repositoriesRepository.clearDefault(id);
      } catch (error) {
        console.error('[IPC Error] repository:clearDefault:', error);
        throw error;
      }
    }
  );

  // Find all repositories for a project
  ipcMain.handle(
    IpcChannels.repository.findByProject,
    (_event: IpcMainInvokeEvent, projectId: number): Array<Repository> => {
      try {
        return repositoriesRepository.findByProjectId(projectId);
      } catch (error) {
        console.error('[IPC Error] repository:findByProject:', error);
        throw error;
      }
    }
  );

  // Get pre-delete info: non-terminal workflows linked to this repository that will be affected
  ipcMain.handle(
    IpcChannels.repository.preDeleteInfo,
    (_event: IpcMainInvokeEvent, repositoryId: number): PreDeleteInfo => {
      try {
        // Find workflow IDs linked to this specific repository via the junction table
        const linkedWorkflowRecords = workflowRepositoriesRepository.findByRepositoryId(repositoryId);
        if (linkedWorkflowRecords.length === 0) {
          return { totalCount: 0, workflows: [] };
        }

        // Resolve each linked workflow and filter to non-terminal statuses
        const nonTerminal = linkedWorkflowRecords
          .map((wr) => workflowsRepository.findById(wr.workflowId))
          .filter(
            (w): w is NonNullable<typeof w> =>
              w !== undefined && NON_TERMINAL_STATUSES.includes(w.status as (typeof NON_TERMINAL_STATUSES)[number])
          );

        return {
          totalCount: nonTerminal.length,
          workflows: nonTerminal.map((w) => ({
            featureName: w.featureName,
            id: w.id,
            status: w.status,
          })),
        };
      } catch (error) {
        console.error('[IPC Error] repository:preDeleteInfo:', error);
        throw error;
      }
    }
  );

  // Delete a repository and cancel non-terminal workflows linked to it
  ipcMain.handle(
    IpcChannels.repository.deleteWithCleanup,
    (_event: IpcMainInvokeEvent, repositoryId: number): DeleteWithCleanupResult => {
      try {
        // Find workflow IDs linked to this specific repository via the junction table
        const linkedWorkflowRecords = workflowRepositoriesRepository.findByRepositoryId(repositoryId);

        // Cancel only non-terminal workflows that are linked to this repository
        let cancelledCount = 0;
        for (const wr of linkedWorkflowRecords) {
          const workflow = workflowsRepository.findById(wr.workflowId);
          if (
            workflow &&
            NON_TERMINAL_STATUSES.includes(workflow.status as (typeof NON_TERMINAL_STATUSES)[number])
          ) {
            workflowsRepository.updateStatus(workflow.id, 'cancelled');
            cancelledCount++;
          }
        }

        // Delete the repository
        const deleted = repositoriesRepository.delete(repositoryId);

        return { cancelledCount, deleted };
      } catch (error) {
        console.error('[IPC Error] repository:deleteWithCleanup:', error);
        throw error;
      }
    }
  );
}
