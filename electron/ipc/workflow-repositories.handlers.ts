/**
 * Workflow Repository Association IPC Handlers
 *
 * Handles operations for associating repositories with workflows:
 * - Adding single or multiple repositories to a workflow
 * - Listing repositories for a workflow
 * - Removing a repository from a workflow
 * - Setting the primary repository
 */
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { WorkflowRepositoriesRepository } from "../../db/repositories";
import type { WorkflowRepository } from "../../db/schema";

import { IpcChannels } from "./channels";

/**
 * Register all workflow-repository association IPC handlers.
 *
 * @param workflowRepositoriesRepository - The workflow repositories repository for database operations
 */
export function registerWorkflowRepositoriesHandlers(
  workflowRepositoriesRepository: WorkflowRepositoriesRepository
): void {
  // Add a single repository to a workflow
  ipcMain.handle(
    IpcChannels.workflowRepository.add,
    (
      _event: IpcMainInvokeEvent,
      workflowId: number,
      repositoryId: number,
      isPrimary?: boolean
    ): WorkflowRepository => {
      try {
        return workflowRepositoriesRepository.addToWorkflow(
          workflowId,
          repositoryId,
          isPrimary
        );
      } catch (error) {
        console.error("[IPC Error] workflowRepository:add:", error);
        throw error;
      }
    }
  );

  // Add multiple repositories to a workflow at once
  ipcMain.handle(
    IpcChannels.workflowRepository.addMultiple,
    (
      _event: IpcMainInvokeEvent,
      workflowId: number,
      repositoryIds: Array<number>,
      primaryRepositoryId?: number
    ): Array<WorkflowRepository> => {
      try {
        return workflowRepositoriesRepository.addMultipleToWorkflow(
          workflowId,
          repositoryIds,
          primaryRepositoryId
        );
      } catch (error) {
        console.error("[IPC Error] workflowRepository:addMultiple:", error);
        throw error;
      }
    }
  );

  // List all repositories associated with a workflow
  ipcMain.handle(
    IpcChannels.workflowRepository.list,
    (
      _event: IpcMainInvokeEvent,
      workflowId: number
    ): Array<WorkflowRepository> => {
      try {
        return workflowRepositoriesRepository.findByWorkflowId(workflowId);
      } catch (error) {
        console.error("[IPC Error] workflowRepository:list:", error);
        throw error;
      }
    }
  );

  // Remove a repository from a workflow
  ipcMain.handle(
    IpcChannels.workflowRepository.remove,
    (
      _event: IpcMainInvokeEvent,
      workflowId: number,
      repositoryId: number
    ): boolean => {
      try {
        return workflowRepositoriesRepository.removeFromWorkflow(
          workflowId,
          repositoryId
        );
      } catch (error) {
        console.error("[IPC Error] workflowRepository:remove:", error);
        throw error;
      }
    }
  );

  // Set a repository as the primary for a workflow
  ipcMain.handle(
    IpcChannels.workflowRepository.setPrimary,
    (
      _event: IpcMainInvokeEvent,
      workflowId: number,
      repositoryId: number
    ): undefined | WorkflowRepository => {
      try {
        return workflowRepositoriesRepository.setPrimary(
          workflowId,
          repositoryId
        );
      } catch (error) {
        console.error("[IPC Error] workflowRepository:setPrimary:", error);
        throw error;
      }
    }
  );
}
