/**
 * Repository IPC Handlers
 *
 * Handles all repository management operations including:
 * - CRUD operations for repositories
 * - Path-based repository lookup
 * - Project-based filtering
 * - Default repository management for projects
 */
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { RepositoriesRepository } from "../../db/repositories";
import type { NewRepository, Repository } from "../../db/schema";

import { IpcChannels } from "./channels";

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
export function registerRepositoryHandlers(
  repositoriesRepository: RepositoriesRepository
): void {
  // Create a new repository
  ipcMain.handle(
    IpcChannels.repository.create,
    (_event: IpcMainInvokeEvent, data: NewRepository): Repository => {
      try {
        return repositoriesRepository.create(data);
      } catch (error) {
        console.error("[IPC Error] repository:create:", error);
        throw error;
      }
    }
  );

  // Get a repository by ID
  ipcMain.handle(
    IpcChannels.repository.get,
    (_event: IpcMainInvokeEvent, id: number): Repository | undefined => {
      try {
        return repositoriesRepository.findById(id);
      } catch (error) {
        console.error("[IPC Error] repository:get:", error);
        throw error;
      }
    }
  );

  // List repositories with optional project filter
  ipcMain.handle(
    IpcChannels.repository.list,
    (
      _event: IpcMainInvokeEvent,
      filters?: RepositoryListFilters
    ): Array<Repository> => {
      try {
        return repositoriesRepository.findAll(filters);
      } catch (error) {
        console.error("[IPC Error] repository:list:", error);
        throw error;
      }
    }
  );

  // Update a repository
  ipcMain.handle(
    IpcChannels.repository.update,
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<NewRepository>
    ): Repository | undefined => {
      try {
        return repositoriesRepository.update(id, data);
      } catch (error) {
        console.error("[IPC Error] repository:update:", error);
        throw error;
      }
    }
  );

  // Delete a repository
  ipcMain.handle(
    IpcChannels.repository.delete,
    (_event: IpcMainInvokeEvent, id: number): boolean => {
      try {
        return repositoriesRepository.delete(id);
      } catch (error) {
        console.error("[IPC Error] repository:delete:", error);
        throw error;
      }
    }
  );

  // Find a repository by file path
  ipcMain.handle(
    IpcChannels.repository.findByPath,
    (_event: IpcMainInvokeEvent, path: string): Repository | undefined => {
      try {
        return repositoriesRepository.findByPath(path);
      } catch (error) {
        console.error("[IPC Error] repository:findByPath:", error);
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
        console.error("[IPC Error] repository:setDefault:", error);
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
        console.error("[IPC Error] repository:clearDefault:", error);
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
        console.error("[IPC Error] repository:findByProject:", error);
        throw error;
      }
    }
  );
}
