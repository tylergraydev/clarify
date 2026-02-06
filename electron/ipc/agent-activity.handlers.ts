/**
 * Agent Activity IPC Handlers
 *
 * Handles read operations for agent activity records, enabling the renderer
 * process to fetch persisted activity data by step or workflow.
 *
 * Channels:
 * - agentActivity:getByStepId - Get all activity records for a workflow step
 * - agentActivity:getByWorkflowId - Get all activity records for a workflow
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { AgentActivityRepository } from '../../db/repositories';
import type { AgentActivity } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Register all agent activity IPC handlers.
 *
 * @param agentActivityRepository - The agent activity repository for database operations
 */
export function registerAgentActivityHandlers(agentActivityRepository: AgentActivityRepository): void {
  // Get all activity records for a specific workflow step
  ipcMain.handle(
    IpcChannels.agentActivity.getByStepId,
    (_event: IpcMainInvokeEvent, stepId: number): Array<AgentActivity> => {
      try {
        return agentActivityRepository.findByStepId(stepId);
      } catch (error) {
        console.error('[IPC Error] agentActivity:getByStepId:', error);
        throw error;
      }
    }
  );

  // Get all activity records for a workflow (across all steps)
  ipcMain.handle(
    IpcChannels.agentActivity.getByWorkflowId,
    (_event: IpcMainInvokeEvent, workflowId: number): Array<AgentActivity> => {
      try {
        return agentActivityRepository.findByWorkflowId(workflowId);
      } catch (error) {
        console.error('[IPC Error] agentActivity:getByWorkflowId:', error);
        throw error;
      }
    }
  );
}
