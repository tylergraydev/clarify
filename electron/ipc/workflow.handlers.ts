/**
 * Workflow IPC Handlers
 *
 * Handles all workflow management operations including:
 * - Creating workflows with configuration
 * - Lifecycle management (start, pause, resume, cancel)
 * - Querying workflows by ID or with filters
 */
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { WorkflowsRepository } from "../../db/repositories";
import type { NewWorkflow, Workflow } from "../../db/schema";

import { IpcChannels } from "./channels";

/**
 * Filter options for listing workflows
 */
interface WorkflowListFilters {
  projectId?: number;
  status?: string;
  type?: string;
}

/**
 * Register all workflow-related IPC handlers.
 *
 * @param workflowsRepository - The workflows repository for database operations
 */
export function registerWorkflowHandlers(
  workflowsRepository: WorkflowsRepository
): void {
  // Create a new workflow
  ipcMain.handle(
    IpcChannels.workflow.create,
    (_event: IpcMainInvokeEvent, data: NewWorkflow): Workflow => {
      return workflowsRepository.create(data);
    }
  );

  // Start a workflow (update status to running)
  ipcMain.handle(
    IpcChannels.workflow.start,
    (_event: IpcMainInvokeEvent, id: number): undefined | Workflow => {
      return workflowsRepository.start(id);
    }
  );

  // Pause a running workflow (update status to paused)
  ipcMain.handle(
    IpcChannels.workflow.pause,
    (_event: IpcMainInvokeEvent, id: number): undefined | Workflow => {
      return workflowsRepository.updateStatus(id, "paused");
    }
  );

  // Resume a paused workflow (update status to running)
  ipcMain.handle(
    IpcChannels.workflow.resume,
    (_event: IpcMainInvokeEvent, id: number): undefined | Workflow => {
      return workflowsRepository.updateStatus(id, "running");
    }
  );

  // Cancel a workflow (update status to cancelled)
  ipcMain.handle(
    IpcChannels.workflow.cancel,
    (_event: IpcMainInvokeEvent, id: number): undefined | Workflow => {
      return workflowsRepository.updateStatus(id, "cancelled");
    }
  );

  // Get a workflow by ID
  ipcMain.handle(
    IpcChannels.workflow.get,
    (_event: IpcMainInvokeEvent, id: number): undefined | Workflow => {
      return workflowsRepository.findById(id);
    }
  );

  // List workflows with optional filters
  ipcMain.handle(
    IpcChannels.workflow.list,
    (
      _event: IpcMainInvokeEvent,
      filters?: WorkflowListFilters
    ): Array<Workflow> => {
      return workflowsRepository.findAll(filters);
    }
  );
}
