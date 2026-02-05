/**
 * Project IPC Handlers
 *
 * Handles all project management operations including:
 * - Creating and updating projects
 * - Listing projects with optional archive inclusion
 * - Archiving (soft delete) projects
 * - Adding repositories to projects
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { ProjectsRepository, RepositoriesRepository } from '../../db/repositories';
import type { NewProject, NewRepository, Project, Repository } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Data required to add a repository to a project
 */
interface AddRepoData {
  defaultBranch?: string;
  name: string;
  path: string;
  remoteUrl?: string;
}

/**
 * Options for listing projects
 */
interface ProjectListOptions {
  includeArchived?: boolean;
}

/**
 * Register all project-related IPC handlers.
 *
 * @param projectsRepository - The projects repository for database operations
 * @param repositoriesRepository - The repositories repository for adding repos to projects
 */
export function registerProjectHandlers(
  projectsRepository: ProjectsRepository,
  repositoriesRepository: RepositoriesRepository
): void {
  // Create a new project
  ipcMain.handle(IpcChannels.project.create, (_event: IpcMainInvokeEvent, data: NewProject): Project => {
    try {
      return projectsRepository.create(data);
    } catch (error) {
      console.error('[IPC Error] project:create:', error);
      throw error;
    }
  });

  // Get a project by ID
  ipcMain.handle(IpcChannels.project.get, (_event: IpcMainInvokeEvent, id: number): Project | undefined => {
    try {
      return projectsRepository.findById(id);
    } catch (error) {
      console.error('[IPC Error] project:get:', error);
      throw error;
    }
  });

  // List all projects with optional archive inclusion
  ipcMain.handle(
    IpcChannels.project.list,
    (_event: IpcMainInvokeEvent, options?: ProjectListOptions): Array<Project> => {
      try {
        return projectsRepository.findAll(options);
      } catch (error) {
        console.error('[IPC Error] project:list:', error);
        throw error;
      }
    }
  );

  // Update project details
  ipcMain.handle(
    IpcChannels.project.update,
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Omit<NewProject, 'createdAt' | 'id'>>
    ): Project | undefined => {
      try {
        return projectsRepository.update(id, data);
      } catch (error) {
        console.error('[IPC Error] project:update:', error);
        throw error;
      }
    }
  );

  // Archive a project (set archivedAt timestamp)
  ipcMain.handle(IpcChannels.project.archive, (_event: IpcMainInvokeEvent, id: number): Project | undefined => {
    try {
      return projectsRepository.archive(id);
    } catch (error) {
      console.error('[IPC Error] project:archive:', error);
      throw error;
    }
  });

  // Soft delete a project (calls archive for backwards compatibility)
  ipcMain.handle(IpcChannels.project.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    try {
      const result = projectsRepository.archive(id);
      return !!result;
    } catch (error) {
      console.error('[IPC Error] project:delete:', error);
      throw error;
    }
  });

  // Unarchive a project (clear archivedAt timestamp)
  ipcMain.handle(IpcChannels.project.unarchive, (_event: IpcMainInvokeEvent, id: number): Project | undefined => {
    try {
      return projectsRepository.unarchive(id);
    } catch (error) {
      console.error('[IPC Error] project:unarchive:', error);
      throw error;
    }
  });

  // Permanently delete a project and all associated data
  ipcMain.handle(IpcChannels.project.deleteHard, (_event: IpcMainInvokeEvent, id: number): void => {
    try {
      projectsRepository.delete(id);
    } catch (error) {
      console.error('[IPC Error] project:deleteHard:', error);
      throw error;
    }
  });

  // Add a repository to a project
  ipcMain.handle(
    IpcChannels.project.addRepo,
    (_event: IpcMainInvokeEvent, projectId: number, repoData: AddRepoData): Repository => {
      try {
        // Build the new repository data with project association
        const newRepo: NewRepository = {
          defaultBranch: repoData.defaultBranch ?? 'main',
          name: repoData.name,
          path: repoData.path,
          projectId,
          remoteUrl: repoData.remoteUrl ?? null,
        };

        return repositoriesRepository.create(newRepo);
      } catch (error) {
        console.error('[IPC Error] project:addRepo:', error);
        throw error;
      }
    }
  );

  // Toggle favorite status for a project
  ipcMain.handle(IpcChannels.project.toggleFavorite, (_event: IpcMainInvokeEvent, id: number): Project | undefined => {
    try {
      return projectsRepository.toggleFavorite(id);
    } catch (error) {
      console.error('[IPC Error] project:toggleFavorite:', error);
      throw error;
    }
  });

  // List all favorite projects
  ipcMain.handle(IpcChannels.project.listFavorites, (): Array<Project> => {
    try {
      return projectsRepository.findFavorites();
    } catch (error) {
      console.error('[IPC Error] project:listFavorites:', error);
      throw error;
    }
  });
}
