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
  ipcMain.handle(IpcChannels.step.get, (_event: IpcMainInvokeEvent, id: number): undefined | WorkflowStep => {
    try {
      return workflowStepsRepository.findById(id);
    } catch (error) {
      console.error('[IPC Error] step:get:', error);
      throw error;
    }
  });

  // List steps with optional filters (workflowId, status)
  ipcMain.handle(
    IpcChannels.step.list,
    (_event: IpcMainInvokeEvent, filters?: StepListFilters): Array<WorkflowStep> => {
      try {
        return workflowStepsRepository.findAll(filters);
      } catch (error) {
        console.error('[IPC Error] step:list:', error);
        throw error;
      }
    }
  );

  // Edit step output text (marks as edited with timestamp)
  ipcMain.handle(
    IpcChannels.step.edit,
    (_event: IpcMainInvokeEvent, id: number, outputText: string): undefined | WorkflowStep => {
      try {
        return workflowStepsRepository.markEdited(id, outputText);
      } catch (error) {
        console.error('[IPC Error] step:edit:', error);
        throw error;
      }
    }
  );

  // Complete a step with output text and duration
  ipcMain.handle(
    IpcChannels.step.complete,
    (_event: IpcMainInvokeEvent, id: number, outputText?: string, durationMs?: number): undefined | WorkflowStep => {
      try {
        return workflowStepsRepository.complete(id, outputText ?? '', durationMs ?? 0);
      } catch (error) {
        console.error('[IPC Error] step:complete:', error);
        throw error;
      }
    }
  );

  // Fail a step with an error message
  ipcMain.handle(
    IpcChannels.step.fail,
    (_event: IpcMainInvokeEvent, id: number, errorMessage: string): undefined | WorkflowStep => {
      try {
        return workflowStepsRepository.fail(id, errorMessage);
      } catch (error) {
        console.error('[IPC Error] step:fail:', error);
        throw error;
      }
    }
  );

  // Mark step for regeneration (reset status to pending for retry)
  ipcMain.handle(IpcChannels.step.regenerate, (_event: IpcMainInvokeEvent, id: number): undefined | WorkflowStep => {
    try {
      return workflowStepsRepository.updateStatus(id, 'pending');
    } catch (error) {
      console.error('[IPC Error] step:regenerate:', error);
      throw error;
    }
  });

  // Skip a step (mark as skipped)
  ipcMain.handle(IpcChannels.step.skip, (_event: IpcMainInvokeEvent, id: number): undefined | WorkflowStep => {
    try {
      return workflowStepsRepository.skip(id);
    } catch (error) {
      console.error('[IPC Error] step:skip:', error);
      throw error;
    }
  });
}
