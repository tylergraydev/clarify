/**
 * Workflow IPC Handlers
 *
 * Handles all workflow management operations including:
 * - Creating workflows with configuration
 * - Lifecycle management (start, pause, resume, cancel)
 * - Querying workflows by ID or with filters
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type {
  WorkflowHistoryFilters,
  WorkflowHistoryResult,
  WorkflowsRepository,
  WorkflowStatistics,
} from '../../db/repositories';
import type { NewWorkflow, Workflow } from '../../db/schema';
import type { UpdateWorkflowInput } from '../../lib/validations/workflow';

import { IpcChannels } from './channels';

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
export function registerWorkflowHandlers(workflowsRepository: WorkflowsRepository): void {
  // Create a new workflow
  ipcMain.handle(IpcChannels.workflow.create, (_event: IpcMainInvokeEvent, data: NewWorkflow): Workflow => {
    try {
      return workflowsRepository.create(data);
    } catch (error) {
      console.error('[IPC Error] workflow:create:', error);
      throw error;
    }
  });

  // Start a workflow (update status to running)
  ipcMain.handle(IpcChannels.workflow.start, (_event: IpcMainInvokeEvent, id: number): undefined | Workflow => {
    try {
      return workflowsRepository.start(id);
    } catch (error) {
      console.error('[IPC Error] workflow:start:', error);
      throw error;
    }
  });

  // Pause a running workflow (update status to paused)
  ipcMain.handle(IpcChannels.workflow.pause, (_event: IpcMainInvokeEvent, id: number): undefined | Workflow => {
    try {
      return workflowsRepository.updateStatus(id, 'paused');
    } catch (error) {
      console.error('[IPC Error] workflow:pause:', error);
      throw error;
    }
  });

  // Resume a paused workflow (update status to running)
  ipcMain.handle(IpcChannels.workflow.resume, (_event: IpcMainInvokeEvent, id: number): undefined | Workflow => {
    try {
      return workflowsRepository.updateStatus(id, 'running');
    } catch (error) {
      console.error('[IPC Error] workflow:resume:', error);
      throw error;
    }
  });

  // Cancel a workflow (update status to cancelled)
  ipcMain.handle(IpcChannels.workflow.cancel, (_event: IpcMainInvokeEvent, id: number): undefined | Workflow => {
    try {
      return workflowsRepository.updateStatus(id, 'cancelled');
    } catch (error) {
      console.error('[IPC Error] workflow:cancel:', error);
      throw error;
    }
  });

  // Delete a workflow permanently
  ipcMain.handle(IpcChannels.workflow.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    try {
      return workflowsRepository.delete(id);
    } catch (error) {
      console.error('[IPC Error] workflow:delete:', error);
      throw error;
    }
  });

  // Get a workflow by ID
  ipcMain.handle(IpcChannels.workflow.get, (_event: IpcMainInvokeEvent, id: number): undefined | Workflow => {
    try {
      return workflowsRepository.findById(id);
    } catch (error) {
      console.error('[IPC Error] workflow:get:', error);
      throw error;
    }
  });

  // List workflows with optional filters
  ipcMain.handle(
    IpcChannels.workflow.list,
    (_event: IpcMainInvokeEvent, filters?: WorkflowListFilters): Array<Workflow> => {
      try {
        return workflowsRepository.findAll(filters);
      } catch (error) {
        console.error('[IPC Error] workflow:list:', error);
        throw error;
      }
    }
  );

  // List workflow history (terminal statuses only) with filters and pagination
  ipcMain.handle(
    IpcChannels.workflow.listHistory,
    (_event: IpcMainInvokeEvent, filters?: WorkflowHistoryFilters): WorkflowHistoryResult => {
      try {
        return workflowsRepository.findHistory(filters);
      } catch (error) {
        console.error('[IPC Error] workflow:listHistory:', error);
        throw error;
      }
    }
  );

  // Get workflow statistics for history view
  ipcMain.handle(
    IpcChannels.workflow.getStatistics,
    (
      _event: IpcMainInvokeEvent,
      filters?: { dateFrom?: string; dateTo?: string; projectId?: number }
    ): WorkflowStatistics => {
      try {
        return workflowsRepository.getHistoryStatistics(filters);
      } catch (error) {
        console.error('[IPC Error] workflow:getStatistics:', error);
        throw error;
      }
    }
  );

  // Update a workflow (only allowed when status is 'created')
  ipcMain.handle(
    IpcChannels.workflow.update,
    (_event: IpcMainInvokeEvent, id: number, data: UpdateWorkflowInput): Workflow => {
      try {
        return workflowsRepository.updateWorkflow(id, data);
      } catch (error) {
        console.error('[IPC Error] workflow:update:', error);
        throw error;
      }
    }
  );
}
