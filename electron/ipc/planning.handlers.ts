/**
 * Planning IPC Handlers
 *
 * Handles all implementation planning step operations for the workflow pipeline.
 * Bridges renderer requests to the PlanningStepService.
 *
 * Channels:
 * - planning:start - Start plan generation
 * - planning:submitFeedback - Submit user feedback for plan regeneration
 * - planning:approvePlan - Approve the current plan and complete the step
 * - planning:editPlan - Save a user-edited plan and complete the step
 * - planning:cancel - Cancel active planning session
 * - planning:retry - Retry planning from scratch
 * - planning:getState - Get current session state
 *
 * @see {@link ../services/planning-step.service.ts PlanningStepService}
 */
import { type BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { WorkflowsRepository, WorkflowStepsRepository } from '../../db/repositories';
import type {
  ImplementationPlan,
  PlanIteration,
  PlanningOutcome,
  PlanningStreamMessage,
} from '../../lib/validations/planning';

import { type PlanningOutcomeWithPause, planningStepService } from '../services/planning-step.service';
import { IpcChannels } from './channels';
import { advanceWorkflowAfterStep, createStreamForwarder, parseOutputStructured, validateNumberId, validateString } from './ipc-utils';

interface PlanningEditInput {
  editedPlan: ImplementationPlan;
  stepId: number;
  workflowId: number;
}

interface PlanningFeedbackInput {
  feedback: string;
  stepId: number;
  workflowId: number;
}

interface PlanningStartInput {
  agentId?: number;
  repositoryPath: string;
  stepId: number;
  timeoutSeconds?: number;
  workflowId: number;
}

/**
 * Register all planning-related IPC handlers.
 */
export function registerPlanningHandlers(
  workflowStepsRepository: WorkflowStepsRepository,
  workflowsRepository: WorkflowsRepository,
  getMainWindow: () => BrowserWindow | null
): void {
  // Start plan generation
  ipcMain.handle(
    IpcChannels.planning.start,
    async (_event: IpcMainInvokeEvent, input: unknown): Promise<PlanningOutcomeWithPause> => {
      try {
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object');
        }

        const typedInput = input as PlanningStartInput;

        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');
        const repositoryPath = validateString(typedInput.repositoryPath, 'repositoryPath');

        const step = workflowStepsRepository.findById(stepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${stepId}`);
        }
        if (step.workflowId !== workflowId) {
          throw new Error(`Step ${stepId} does not belong to workflow ${workflowId}`);
        }

        const agentId = typedInput.agentId ?? step.agentId ?? undefined;
        if (!agentId) {
          throw new Error(`No agent assigned to planning step ${stepId}`);
        }

        // Gather context from prior workflow steps
        const { discoveredFiles, refinedFeatureRequest } = gatherPriorStepContext(workflowStepsRepository, workflowId);

        console.log('[IPC] planning:start', {
          agentId,
          discoveredFilesCount: discoveredFiles.length,
          refinedFeatureRequestLength: refinedFeatureRequest.length,
          stepId,
          workflowId,
        });

        const handleStreamMessage = createStreamForwarder<PlanningStreamMessage>(
          getMainWindow,
          IpcChannels.planning.stream,
          { workflowId },
        );

        const outcome = await planningStepService.startPlanning(
          {
            agentId,
            discoveredFiles,
            refinedFeatureRequest,
            repositoryPath,
            stepId,
            timeoutSeconds: typedInput.timeoutSeconds,
            workflowId,
          },
          handleStreamMessage
        );

        persistPlanOutcomeToStep(workflowStepsRepository, workflowsRepository, stepId, workflowId, outcome);

        return outcome;
      } catch (error) {
        console.error('[IPC Error] planning:start:', error);
        throw error;
      }
    }
  );

  // Submit feedback for plan regeneration
  ipcMain.handle(
    IpcChannels.planning.submitFeedback,
    async (_event: IpcMainInvokeEvent, input: unknown): Promise<PlanningOutcomeWithPause> => {
      try {
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object');
        }

        const typedInput = input as PlanningFeedbackInput;

        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');
        const feedback = validateString(typedInput.feedback, 'feedback');

        const step = workflowStepsRepository.findById(stepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${stepId}`);
        }

        // Load existing iterations from step output
        const existingOutput = parseOutputStructured(step.outputStructured);
        const previousIterations = (existingOutput?.iterations as Array<PlanIteration>) ?? [];

        // Gather prior step context
        const { discoveredFiles, refinedFeatureRequest } = gatherPriorStepContext(workflowStepsRepository, workflowId);

        // Get agent ID from step
        const agentId = step.agentId;
        if (!agentId) {
          throw new Error(`No agent assigned to planning step ${stepId}`);
        }

        // Get repository path from workflow
        const workflow = workflowsRepository.findById(workflowId);
        if (!workflow) {
          throw new Error(`Workflow not found: ${workflowId}`);
        }

        // Reset step status to running during regeneration
        workflowStepsRepository.update(stepId, { status: 'running' });
        workflowsRepository.updateStatus(workflowId, 'running');

        console.log('[IPC] planning:submitFeedback', {
          feedbackLength: feedback.length,
          previousIterationCount: previousIterations.length,
          stepId,
          workflowId,
        });

        const handleStreamMessage = createStreamForwarder<PlanningStreamMessage>(
          getMainWindow,
          IpcChannels.planning.stream,
          { workflowId },
        );

        const outcome = await planningStepService.submitFeedback(
          {
            agentId,
            discoveredFiles,
            previousIterations,
            refinedFeatureRequest,
            repositoryPath: '', // Not needed for feedback regeneration
            stepId,
            userFeedback: feedback,
            workflowId,
          },
          handleStreamMessage
        );

        // Persist as a new iteration
        persistPlanOutcomeToStepWithIteration(
          workflowStepsRepository,
          workflowsRepository,
          stepId,
          workflowId,
          outcome,
          previousIterations,
          feedback
        );

        return outcome;
      } catch (error) {
        console.error('[IPC Error] planning:submitFeedback:', error);
        throw error;
      }
    }
  );

  // Approve the current plan
  ipcMain.handle(
    IpcChannels.planning.approvePlan,
    (_event: IpcMainInvokeEvent, workflowId: unknown, stepId: unknown) => {
      try {
        const validatedWorkflowId = validateNumberId(workflowId, 'workflowId');
        const validatedStepId = validateNumberId(stepId, 'stepId');

        const step = workflowStepsRepository.findById(validatedStepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${validatedStepId}`);
        }

        const existingOutput = parseOutputStructured(step.outputStructured);

        console.log('[IPC] planning:approvePlan', {
          stepId: validatedStepId,
          workflowId: validatedWorkflowId,
        });

        // Mark as approved
        workflowStepsRepository.update(validatedStepId, {
          completedAt: new Date().toISOString(),
          outputStructured: {
            ...existingOutput,
            approved: true,
            approvedAt: new Date().toISOString(),
          },
          status: 'completed',
        });

        advanceWorkflowAfterStep(workflowsRepository, workflowStepsRepository, validatedWorkflowId, validatedStepId);

        return { success: true };
      } catch (error) {
        console.error('[IPC Error] planning:approvePlan:', error);
        throw error;
      }
    }
  );

  // Save user-edited plan
  ipcMain.handle(
    IpcChannels.planning.editPlan,
    (_event: IpcMainInvokeEvent, input: unknown) => {
      try {
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object');
        }

        const typedInput = input as PlanningEditInput;

        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');

        if (!typedInput.editedPlan || typeof typedInput.editedPlan !== 'object') {
          throw new Error('Invalid input: expected editedPlan object');
        }

        const step = workflowStepsRepository.findById(stepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${stepId}`);
        }

        const existingOutput = parseOutputStructured(step.outputStructured);
        const previousIterations = (existingOutput?.iterations as Array<PlanIteration>) ?? [];

        // Add edited plan as a new iteration
        const newVersion = previousIterations.length + 1;
        const newIteration: PlanIteration = {
          createdAt: new Date().toISOString(),
          editedByUser: true,
          plan: typedInput.editedPlan,
          version: newVersion,
        };

        const updatedIterations = [...previousIterations, newIteration];

        console.log('[IPC] planning:editPlan', {
          newVersion,
          stepId,
          workflowId,
        });

        workflowStepsRepository.update(stepId, {
          completedAt: new Date().toISOString(),
          outputStructured: {
            approved: true,
            approvedAt: new Date().toISOString(),
            currentVersion: newVersion,
            iterations: updatedIterations,
          },
          status: 'completed',
        });

        advanceWorkflowAfterStep(workflowsRepository, workflowStepsRepository, workflowId, stepId);

        return { success: true };
      } catch (error) {
        console.error('[IPC Error] planning:editPlan:', error);
        throw error;
      }
    }
  );

  // Cancel active planning session
  ipcMain.handle(
    IpcChannels.planning.cancel,
    async (_event: IpcMainInvokeEvent, workflowId: unknown): Promise<PlanningOutcome> => {
      try {
        const validatedWorkflowId = validateNumberId(workflowId, 'workflowId');

        console.log('[IPC] planning:cancel', { workflowId: validatedWorkflowId });

        return await planningStepService.cancelPlanning(validatedWorkflowId);
      } catch (error) {
        console.error('[IPC Error] planning:cancel:', error);
        throw error;
      }
    }
  );

  // Retry planning from scratch
  ipcMain.handle(
    IpcChannels.planning.retry,
    async (_event: IpcMainInvokeEvent, input: unknown): Promise<PlanningOutcomeWithPause> => {
      try {
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object');
        }

        const typedInput = input as PlanningStartInput;

        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');
        const repositoryPath = validateString(typedInput.repositoryPath, 'repositoryPath');

        // Cancel existing session first
        await planningStepService.cancelPlanning(workflowId);

        const step = workflowStepsRepository.findById(stepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${stepId}`);
        }

        // Reset step status
        if (step.status === 'awaiting_input') {
          workflowStepsRepository.update(stepId, { status: 'running' });
        }
        const currentWorkflow = workflowsRepository.findById(workflowId);
        if (currentWorkflow && currentWorkflow.status === 'awaiting_input') {
          workflowsRepository.updateStatus(workflowId, 'running');
        }

        const agentId = typedInput.agentId ?? step.agentId ?? undefined;
        if (!agentId) {
          throw new Error(`No agent assigned to planning step ${stepId}`);
        }

        const { discoveredFiles, refinedFeatureRequest } = gatherPriorStepContext(workflowStepsRepository, workflowId);

        console.log('[IPC] planning:retry', {
          agentId,
          stepId,
          workflowId,
        });

        const handleStreamMessage = createStreamForwarder<PlanningStreamMessage>(
          getMainWindow,
          IpcChannels.planning.stream,
          { workflowId },
        );

        const outcome = await planningStepService.retryPlanning(
          {
            agentId,
            discoveredFiles,
            refinedFeatureRequest,
            repositoryPath,
            stepId,
            timeoutSeconds: typedInput.timeoutSeconds,
            workflowId,
          },
          handleStreamMessage
        );

        persistPlanOutcomeToStep(workflowStepsRepository, workflowsRepository, stepId, workflowId, outcome);

        return outcome;
      } catch (error) {
        console.error('[IPC Error] planning:retry:', error);
        throw error;
      }
    }
  );

  // Get current session state
  ipcMain.handle(IpcChannels.planning.getState, (_event: IpcMainInvokeEvent, workflowId: unknown) => {
    try {
      const validatedWorkflowId = validateNumberId(workflowId, 'workflowId');

      console.log('[IPC] planning:getState', { workflowId: validatedWorkflowId });

      return planningStepService.getState(validatedWorkflowId);
    } catch (error) {
      console.error('[IPC Error] planning:getState:', error);
      throw error;
    }
  });
}

/**
 * Gather context from prior workflow steps (refinement output + discovered files).
 */
function gatherPriorStepContext(
  workflowStepsRepository: WorkflowStepsRepository,
  workflowId: number
): {
  discoveredFiles: Array<{ filePath: string; priority: string; relevanceExplanation?: string }>;
  refinedFeatureRequest: string;
} {
  const steps = workflowStepsRepository.findByWorkflowId(workflowId);

  // Get refined feature request from the refinement step
  const refinementStep = steps.find((s) => s.stepType === 'refinement');
  const refinedFeatureRequest = refinementStep?.outputText ?? '';

  // Get discovered files from the discovery step
  const discoveryStep = steps.find((s) => s.stepType === 'discovery');
  let discoveredFiles: Array<{ filePath: string; priority: string; relevanceExplanation?: string }> = [];

  if (discoveryStep?.outputStructured) {
    const discoveryOutput = parseOutputStructured(discoveryStep.outputStructured);
    if (discoveryOutput?.files && Array.isArray(discoveryOutput.files)) {
      discoveredFiles = discoveryOutput.files as Array<{
        filePath: string;
        priority: string;
        relevanceExplanation?: string;
      }>;
    }
  }

  return { discoveredFiles, refinedFeatureRequest };
}

/**
 * Persist a planning outcome to the step (initial generation).
 */
function persistPlanOutcomeToStep(
  workflowStepsRepository: WorkflowStepsRepository,
  workflowsRepository: WorkflowsRepository,
  stepId: number,
  workflowId: number,
  outcome: PlanningOutcomeWithPause
): void {
  switch (outcome.type) {
    case 'CANNOT_PLAN':
      workflowStepsRepository.update(stepId, {
        completedAt: new Date().toISOString(),
        outputStructured: { cannotPlan: true, reason: outcome.reason },
        status: 'completed',
      });
      break;
    case 'ERROR':
      workflowStepsRepository.fail(stepId, outcome.error ?? 'Unknown error');
      break;
    case 'PLAN_GENERATED': {
      const iteration: PlanIteration = {
        createdAt: new Date().toISOString(),
        editedByUser: false,
        plan: outcome.plan,
        version: 1,
      };
      workflowStepsRepository.update(stepId, {
        outputStructured: {
          approved: false,
          currentVersion: 1,
          iterations: [iteration],
        },
        status: 'awaiting_input',
      });
      workflowsRepository.updateStatus(workflowId, 'awaiting_input');
      break;
    }
    case 'TIMEOUT':
      workflowStepsRepository.fail(stepId, outcome.error ?? `Timed out after ${outcome.elapsedSeconds}s`);
      break;
    // CANCELLED: No persistence needed
  }
}

/**
 * Persist a planning outcome with iteration tracking (feedback regeneration).
 */
function persistPlanOutcomeToStepWithIteration(
  workflowStepsRepository: WorkflowStepsRepository,
  workflowsRepository: WorkflowsRepository,
  stepId: number,
  workflowId: number,
  outcome: PlanningOutcomeWithPause,
  previousIterations: Array<PlanIteration>,
  feedback: string
): void {
  if (outcome.type !== 'PLAN_GENERATED') {
    // Non-plan outcomes use standard persistence
    persistPlanOutcomeToStep(workflowStepsRepository, workflowsRepository, stepId, workflowId, outcome);
    return;
  }

  const newVersion = previousIterations.length + 1;
  const newIteration: PlanIteration = {
    createdAt: new Date().toISOString(),
    editedByUser: false,
    feedback,
    plan: outcome.plan,
    version: newVersion,
  };

  const updatedIterations = [...previousIterations, newIteration];

  workflowStepsRepository.update(stepId, {
    outputStructured: {
      approved: false,
      currentVersion: newVersion,
      iterations: updatedIterations,
    },
    status: 'awaiting_input',
  });
  workflowsRepository.updateStatus(workflowId, 'awaiting_input');
}
