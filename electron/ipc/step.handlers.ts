/**
 * Step IPC Handlers
 *
 * Handles all workflow step management operations including:
 * - Getting step by ID
 * - Listing steps by workflow ID
 * - Editing step output text
 * - Completing steps with output
 * - Failing steps with error messages
 * - Marking steps for regeneration
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { WorkflowStepsRepository } from '../../db/repositories';
import type { WorkflowStep } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Filter options for listing steps
 */
interface StepListFilters {
  status?: string;
  workflowId?: number;
}

/**
 * Register all step-related IPC handlers.
 *
 * @param workflowStepsRepository - The workflow steps repository for database operations
 */
export function registerStepHandlers(workflowStepsRepository: WorkflowStepsRepository): void {
  // Get a step by ID
  ipcMain.handle(
    IpcChannels.step.get,
    (_event: IpcMainInvokeEvent, id: number): undefined | WorkflowStep => {
      return workflowStepsRepository.findById(id);
    }
  );

  // List steps with optional filters (workflowId, status)
  ipcMain.handle(
    IpcChannels.step.list,
    (_event: IpcMainInvokeEvent, filters?: StepListFilters): Array<WorkflowStep> => {
      return workflowStepsRepository.findAll(filters);
    }
  );

  // Edit step output text (marks as edited with timestamp)
  ipcMain.handle(
    IpcChannels.step.edit,
    (_event: IpcMainInvokeEvent, id: number, outputText: string): undefined | WorkflowStep => {
      return workflowStepsRepository.markEdited(id, outputText);
    }
  );

  // Complete a step with output text and duration
  ipcMain.handle(
    IpcChannels.step.complete,
    (_event: IpcMainInvokeEvent, id: number, outputText: string, durationMs: number): undefined | WorkflowStep => {
      return workflowStepsRepository.complete(id, outputText, durationMs);
    }
  );

  // Fail a step with an error message
  ipcMain.handle(
    IpcChannels.step.fail,
    (_event: IpcMainInvokeEvent, id: number, errorMessage: string): undefined | WorkflowStep => {
      return workflowStepsRepository.fail(id, errorMessage);
    }
  );

  // Mark step for regeneration (reset status to pending for retry)
  ipcMain.handle(
    IpcChannels.step.regenerate,
    (_event: IpcMainInvokeEvent, id: number): undefined | WorkflowStep => {
      return workflowStepsRepository.updateStatus(id, 'pending');
    }
  );
}
