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
  AgentsRepository,
  SettingsRepository,
  WorkflowHistoryFilters,
  WorkflowHistoryResult,
  WorkflowsRepository,
  WorkflowStatistics,
  WorkflowStepsRepository,
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
 * @param workflowStepsRepository - The workflow steps repository for creating planning steps
 * @param settingsRepository - The settings repository for resolving default clarification agent
 * @param agentsRepository - The agents repository for fallback agent resolution
 */
export function registerWorkflowHandlers(
  workflowsRepository: WorkflowsRepository,
  workflowStepsRepository: WorkflowStepsRepository,
  settingsRepository: SettingsRepository,
  agentsRepository: AgentsRepository
): void {
  // Create a new workflow
  ipcMain.handle(IpcChannels.workflow.create, (_event: IpcMainInvokeEvent, data: NewWorkflow): Workflow => {
    try {
      return workflowsRepository.create(data);
    } catch (error) {
      console.error('[IPC Error] workflow:create:', error);
      throw error;
    }
  });

  // Start a workflow (update status to running and create planning steps)
  ipcMain.handle(
    IpcChannels.workflow.start,
    async (_event: IpcMainInvokeEvent, id: number): Promise<undefined | Workflow> => {
      try {
        // Fetch the workflow to access skipClarification flag and clarificationAgentId
        const workflow = workflowsRepository.findById(id);
        if (!workflow) {
          return undefined;
        }

        // Guard: Only start workflows in 'created' status to prevent duplicate step creation
        if (workflow.status !== 'created') {
          console.warn(`[IPC] workflow:start - workflow ${id} already has status '${workflow.status}'`);
          return workflow; // Return current state without modification
        }

        // Resolve clarification agent ID with fallback logic
        let clarificationAgentId: null | number = workflow.clarificationAgentId ?? null;

        if (clarificationAgentId === null) {
          // Fallback 1: Check default clarification agent setting
          const defaultAgentIdStr = settingsRepository.getValue('defaultClarificationAgentId');
          if (defaultAgentIdStr && defaultAgentIdStr.trim() !== '') {
            const parsedId = parseInt(defaultAgentIdStr, 10);
            if (!isNaN(parsedId)) {
              // Verify the agent exists and is active
              const defaultAgent = agentsRepository.findById(parsedId);
              if (defaultAgent && defaultAgent.deactivatedAt === null) {
                clarificationAgentId = parsedId;
                console.log(`[IPC] workflow:start - using default clarification agent: ${parsedId}`);
              }
            }
          }
        }

        if (clarificationAgentId === null) {
          // Fallback 2: Find any active planning agent
          const planningAgents = agentsRepository.findAll({ type: 'planning' });
          const firstPlanningAgent = planningAgents[0];
          if (firstPlanningAgent) {
            clarificationAgentId = firstPlanningAgent.id;
            console.log(`[IPC] workflow:start - using first available planning agent: ${clarificationAgentId}`);
          } else {
            console.warn('[IPC] workflow:start - no planning agents available for clarification step');
          }
        }

        // Start the workflow (update status to running)
        const startedWorkflow = workflowsRepository.start(id);
        if (!startedWorkflow) {
          return undefined;
        }

        // Create planning steps atomically
        // If step creation fails, we attempt to rollback the workflow status
        let createdSteps: Array<import('../../db/schema').WorkflowStep>;
        try {
          createdSteps = workflowStepsRepository.createPlanningSteps(
            id,
            workflow.skipClarification,
            clarificationAgentId
          );
        } catch (stepError) {
          // Attempt to rollback workflow status to 'created'
          console.error('[IPC Error] workflow:start - step creation failed, rolling back:', stepError);
          try {
            workflowsRepository.updateStatus(id, 'created');
          } catch (rollbackError) {
            console.error('[IPC Error] workflow:start - rollback failed:', rollbackError);
          }
          throw stepError;
        }

        // Start the first non-skipped step to trigger its execution
        // Steps are created in order, so find the first one with 'pending' status
        const firstPendingStep = createdSteps.find((step) => step.status === 'pending');
        if (firstPendingStep) {
          workflowStepsRepository.start(firstPendingStep.id);
          console.log(
            `[IPC] workflow:start - started first step: ${firstPendingStep.stepType} (id: ${firstPendingStep.id})`
          );
        }

        return startedWorkflow;
      } catch (error) {
        console.error('[IPC Error] workflow:start:', error);
        throw error;
      }
    }
  );

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
      const steps = workflowStepsRepository.findByWorkflowId(id);

      // If any step is awaiting_input, workflow should reflect that
      const awaitingStep = steps.find((s) => s.status === 'awaiting_input');
      if (awaitingStep) {
        return workflowsRepository.updateStatus(id, 'awaiting_input');
      }

      // Check if any step is actively running
      const runningStatuses = ['running', 'paused', 'editing'];
      const hasActiveStep = steps.some((s) => runningStatuses.includes(s.status));

      const updatedWorkflow = workflowsRepository.updateStatus(id, 'running');

      // If no active step, find and start the next pending step
      if (!hasActiveStep && updatedWorkflow) {
        const nextPending = steps
          .filter((s) => s.status === 'pending')
          .sort((a, b) => a.stepNumber - b.stepNumber)[0];
        if (nextPending) {
          workflowStepsRepository.start(nextPending.id);
        }
      }

      return updatedWorkflow;
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
