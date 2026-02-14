/**
 * Step IPC Handlers
 *
 * Handles all workflow step management operations including:
 * - Getting step by ID
 * - Listing steps by workflow ID
 * - Editing step output text
 * - Starting steps
 * - Completing steps with output
 * - Failing steps with error messages
 * - Marking steps for regeneration
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type {
  RepositoriesRepository,
  SettingsRepository,
  WorkflowsRepository,
  WorkflowStepsRepository,
  WorktreesRepository,
} from '../../db/repositories';
import type { NewWorkflowStep, WorkflowStep } from '../../db/schema';
import type { WorkflowPoolManager } from '../services/workflow-pool-manager.service';

import { IpcChannels } from './channels';
import { maybeCleanupWorktree } from './worktree.handlers';

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
 * @param workflowsRepository - The workflows repository for pause behavior and status
 */
export function registerStepHandlers(
  workflowStepsRepository: WorkflowStepsRepository,
  workflowsRepository: WorkflowsRepository,
  worktreesRepository?: WorktreesRepository,
  repositoriesRepository?: RepositoriesRepository,
  settingsRepository?: SettingsRepository,
  workflowPoolManager?: WorkflowPoolManager
): void {
  type PauseBehavior = 'auto_pause' | 'continuous';
  const RUNNING_STATUSES = ['running', 'paused', 'editing', 'awaiting_input'] as const;

  const shouldAutoAdvance = (pauseBehavior: PauseBehavior): boolean => {
    return pauseBehavior === 'continuous';
  };

  const maybeStartNextStep = (step: WorkflowStep): void => {
    const workflow = workflowsRepository.findById(step.workflowId);
    if (!workflow || workflow.status !== 'running') {
      return;
    }

    const pauseBehavior = (workflow.pauseBehavior ?? 'auto_pause') as PauseBehavior;

    const steps = workflowStepsRepository.findByWorkflowId(step.workflowId);
    const hasRunningStep = steps.some((existing) =>
      RUNNING_STATUSES.includes(existing.status as (typeof RUNNING_STATUSES)[number])
    );
    if (hasRunningStep) {
      return;
    }

    const nextStep = steps
      .filter((existing) => existing.status === 'pending' && existing.stepNumber > step.stepNumber)
      .sort((a, b) => a.stepNumber - b.stepNumber)[0];

    if (!nextStep) {
      // Workflow is complete - fire-and-forget worktree cleanup
      if (worktreesRepository && repositoriesRepository && settingsRepository) {
        maybeCleanupWorktree(
          step.workflowId,
          worktreesRepository,
          repositoriesRepository,
          settingsRepository
        ).catch((error) => {
          console.error('[Worktree] cleanup on completion failed:', error);
        });
      }

      // Try to start next queued workflow now that a slot is free
      if (workflowPoolManager) {
        workflowPoolManager.tryDequeueNext().catch((error) => {
          console.error('[WorkflowPool] dequeue on completion failed:', error);
        });
      }
      return;
    }

    if (!shouldAutoAdvance(pauseBehavior)) {
      workflowsRepository.updateStatus(step.workflowId, 'paused');
      return;
    }

    workflowStepsRepository.start(nextStep.id);
  };
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

  // Start a step (transition to running)
  ipcMain.handle(IpcChannels.step.start, (_event: IpcMainInvokeEvent, id: number): undefined | WorkflowStep => {
    try {
      const step = workflowStepsRepository.start(id);
      if (step) {
        const workflow = workflowsRepository.findById(step.workflowId);
        if (workflow && (workflow.status === 'paused' || workflow.status === 'awaiting_input')) {
          workflowsRepository.updateStatus(step.workflowId, 'running');
        }
      }
      return step;
    } catch (error) {
      console.error('[IPC Error] step:start:', error);
      throw error;
    }
  });

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
        const step = workflowStepsRepository.complete(id, outputText ?? '', durationMs ?? 0);
        if (step) {
          maybeStartNextStep(step);
        }
        return step;
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
        const step = workflowStepsRepository.fail(id, errorMessage);

        // If workflow transitions to failed, try to dequeue next queued workflow
        if (step && workflowPoolManager) {
          const workflow = workflowsRepository.findById(step.workflowId);
          if (workflow && workflow.status === 'failed') {
            workflowPoolManager.tryDequeueNext().catch((error) => {
              console.error('[WorkflowPool] dequeue on failure failed:', error);
            });
          }
        }

        return step;
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
      const step = workflowStepsRepository.skip(id);
      if (step) {
        maybeStartNextStep(step);
      }
      return step;
    } catch (error) {
      console.error('[IPC Error] step:skip:', error);
      throw error;
    }
  });

  // Update a step with partial data
  ipcMain.handle(
    IpcChannels.step.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewWorkflowStep>): undefined | WorkflowStep => {
      try {
        return workflowStepsRepository.update(id, data);
      } catch (error) {
        console.error('[IPC Error] step:update:', error);
        throw error;
      }
    }
  );
}
