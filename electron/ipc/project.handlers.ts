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
  ipcMain.handle(IpcChannels.project.create, async (_event: IpcMainInvokeEvent, data: NewProject): Promise<Project> => {
    try {
      return projectsRepository.create(data);
    } catch (error) {
      console.error('[IPC Error] project:create:', error);
      throw error;
    }
  });

  // Get a project by ID
  ipcMain.handle(
    IpcChannels.project.get,
    async (_event: IpcMainInvokeEvent, id: number): Promise<Project | undefined> => {
      try {
        return projectsRepository.findById(id);
      } catch (error) {
        console.error('[IPC Error] project:get:', error);
        throw error;
      }
    }
  );

  // List all projects with optional archive inclusion
  ipcMain.handle(
    IpcChannels.project.list,
    async (_event: IpcMainInvokeEvent, options?: ProjectListOptions): Promise<Array<Project>> => {
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
    async (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Omit<NewProject, 'createdAt' | 'id'>>
    ): Promise<Project | undefined> => {
      try {
        return projectsRepository.update(id, data);
      } catch (error) {
        console.error('[IPC Error] project:update:', error);
        throw error;
      }
    }
  );

  // Archive (soft delete) a project
  ipcMain.handle(
    IpcChannels.project.delete,
    async (_event: IpcMainInvokeEvent, id: number): Promise<Project | undefined> => {
      try {
        return projectsRepository.archive(id);
      } catch (error) {
        console.error('[IPC Error] project:delete:', error);
        throw error;
      }
    }
  );

  // Add a repository to a project
  ipcMain.handle(
    IpcChannels.project.addRepo,
    async (_event: IpcMainInvokeEvent, projectId: number, repoData: AddRepoData): Promise<Repository> => {
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
}
