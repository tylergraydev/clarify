/**
 * Repository IPC Handlers
 *
 * Handles all repository management operations including:
 * - CRUD operations for repositories
 * - Path-based repository lookup
 * - Project-based filtering
 * - Default repository management for projects
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { RepositoriesRepository } from '../../db/repositories';
import type { NewRepository, Repository } from '../../db/schema';

import { IpcChannels } from './channels';

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
 */
export function registerRepositoryHandlers(repositoriesRepository: RepositoriesRepository): void {
  // Create a new repository
  ipcMain.handle(
    IpcChannels.repository.create,
    (_event: IpcMainInvokeEvent, data: NewRepository): Repository => {
      return repositoriesRepository.create(data);
    }
  );

  // Get a repository by ID
  ipcMain.handle(
    IpcChannels.repository.get,
    (_event: IpcMainInvokeEvent, id: number): Repository | undefined => {
      return repositoriesRepository.findById(id);
    }
  );

  // List repositories with optional project filter
  ipcMain.handle(
    IpcChannels.repository.list,
    (_event: IpcMainInvokeEvent, filters?: RepositoryListFilters): Array<Repository> => {
      return repositoriesRepository.findAll(filters);
    }
  );

  // Update a repository
  ipcMain.handle(
    IpcChannels.repository.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewRepository>): Repository | undefined => {
      return repositoriesRepository.update(id, data);
    }
  );

  // Delete a repository
  ipcMain.handle(
    IpcChannels.repository.delete,
    (_event: IpcMainInvokeEvent, id: number): boolean => {
      return repositoriesRepository.delete(id);
    }
  );

  // Find a repository by file path
  ipcMain.handle(
    IpcChannels.repository.findByPath,
    (_event: IpcMainInvokeEvent, path: string): Repository | undefined => {
      return repositoriesRepository.findByPath(path);
    }
  );

  // Set a repository as the default for its project
  ipcMain.handle(
    IpcChannels.repository.setDefault,
    (_event: IpcMainInvokeEvent, id: number): Repository | undefined => {
      return repositoriesRepository.setAsDefault(id);
    }
  );

  // Find all repositories for a project
  ipcMain.handle(
    IpcChannels.repository.findByProject,
    (_event: IpcMainInvokeEvent, projectId: number): Array<Repository> => {
      return repositoriesRepository.findByProjectId(projectId);
    }
  );
}
