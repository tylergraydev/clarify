/**
 * Refinement IPC Handlers
 *
 * Handles all refinement step operations for the workflow pipeline.
 * Bridges renderer requests to the RefinementStepService.
 *
 * Channels:
 * - refinement:start - Start refinement with workflowId, stepId, featureRequest, clarificationContext
 * - refinement:cancel - Cancel an active refinement session
 * - refinement:getState - Get current session state
 * - refinement:retry - Retry refinement with exponential backoff
 * - refinement:regenerate - Regenerate refined text with additional guidance
 * - refinement:getResult - Get the final result of a completed session
 *
 * @see {@link ../services/refinement-step.service.ts RefinementStepService}
 */
import { type BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { WorkflowStepsRepository } from '../../db/repositories';
import type {
  RefinementOutcome,
  RefinementRegenerateInput,
  RefinementServiceOptions,
  RefinementStreamMessage,
} from '../../lib/validations/refinement';

import { type RefinementOutcomeWithPause, refinementStepService } from '../services/refinement-step.service';
import { IpcChannels } from './channels';

/**
 * Input for starting a refinement session.
 */
interface RefinementStartInput {
  /** Context from the clarification step (questions and answers) */
  clarificationContext: RefinementServiceOptions['clarificationContext'];
  /** The feature request text to refine */
  featureRequest: string;
  /** The path to the repository being analyzed */
  repositoryPath: string;
  /** The ID of the current workflow step */
  stepId: number;
  /** Optional timeout in seconds */
  timeoutSeconds?: number;
  /** The ID of the workflow */
  workflowId: number;
}

/**
 * Register all refinement-related IPC handlers.
 *
 * @param workflowStepsRepository - The workflow steps repository for looking up step data
 * @param getMainWindow - Function to get the main BrowserWindow for streaming events
 */
export function registerRefinementHandlers(
  workflowStepsRepository: WorkflowStepsRepository,
  getMainWindow: () => BrowserWindow | null
): void {
  // Start a new refinement session
  ipcMain.handle(
    IpcChannels.refinement.start,
    async (_event: IpcMainInvokeEvent, input: unknown): Promise<RefinementOutcomeWithPause> => {
      try {
        // Validate input structure
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object');
        }

        const typedInput = input as RefinementStartInput;

        // Validate required parameters
        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');
        const featureRequest = validateString(typedInput.featureRequest, 'featureRequest');
        const repositoryPath = validateString(typedInput.repositoryPath, 'repositoryPath');

        // Validate clarification context
        if (!typedInput.clarificationContext || typeof typedInput.clarificationContext !== 'object') {
          throw new Error('Invalid input: expected clarificationContext object');
        }

        if (!typedInput.clarificationContext.questions || !Array.isArray(typedInput.clarificationContext.questions)) {
          throw new Error('Invalid input: expected clarificationContext.questions array');
        }

        if (!typedInput.clarificationContext.answers || typeof typedInput.clarificationContext.answers !== 'object') {
          throw new Error('Invalid input: expected clarificationContext.answers object');
        }

        // Look up the workflow step to get the agentId
        const step = workflowStepsRepository.findById(stepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${stepId}`);
        }

        if (step.workflowId !== workflowId) {
          throw new Error(`Step ${stepId} does not belong to workflow ${workflowId}`);
        }

        // Get agentId from the step
        const agentId = step.agentId;
        if (!agentId) {
          throw new Error(`No agent assigned to refinement step ${stepId}`);
        }

        console.log('[IPC] refinement:start', {
          agentId,
          clarificationQuestionsCount: typedInput.clarificationContext.questions.length,
          featureRequestLength: featureRequest.length,
          repositoryPath,
          stepId,
          workflowId,
        });

        // Create stream message handler to forward events to renderer
        const handleStreamMessage = (message: RefinementStreamMessage): void => {
          const mainWindow = getMainWindow();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IpcChannels.refinement.stream, message);
          }
        };

        // Call the service with the complete options and stream callback
        const outcome = await refinementStepService.startRefinement(
          {
            agentId,
            clarificationContext: typedInput.clarificationContext,
            featureRequest,
            repositoryPath,
            stepId,
            timeoutSeconds: typedInput.timeoutSeconds,
            workflowId,
          },
          handleStreamMessage
        );

        return outcome;
      } catch (error) {
        console.error('[IPC Error] refinement:start:', error);
        throw error;
      }
    }
  );

  // Cancel an active refinement session
  ipcMain.handle(IpcChannels.refinement.cancel, (_event: IpcMainInvokeEvent, workflowId: unknown): RefinementOutcome => {
    try {
      const validatedWorkflowId = validateNumberId(workflowId, 'workflowId');

      console.log('[IPC] refinement:cancel', { workflowId: validatedWorkflowId });

      return refinementStepService.cancelRefinement(validatedWorkflowId);
    } catch (error) {
      console.error('[IPC Error] refinement:cancel:', error);
      throw error;
    }
  });

  // Get current session state
  ipcMain.handle(
    IpcChannels.refinement.getState,
    (_event: IpcMainInvokeEvent, workflowId: unknown) => {
      try {
        const validatedWorkflowId = validateNumberId(workflowId, 'workflowId');

        console.log('[IPC] refinement:getState', { workflowId: validatedWorkflowId });

        return refinementStepService.getState(validatedWorkflowId);
      } catch (error) {
        console.error('[IPC Error] refinement:getState:', error);
        throw error;
      }
    }
  );

  // Retry refinement with exponential backoff
  ipcMain.handle(
    IpcChannels.refinement.retry,
    async (_event: IpcMainInvokeEvent, input: unknown): Promise<RefinementOutcomeWithPause> => {
      try {
        // Validate input for restart
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object for retry');
        }

        const typedInput = input as RefinementStartInput;

        // Validate required parameters
        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');
        const featureRequest = validateString(typedInput.featureRequest, 'featureRequest');
        const repositoryPath = validateString(typedInput.repositoryPath, 'repositoryPath');

        // Validate clarification context
        if (!typedInput.clarificationContext || typeof typedInput.clarificationContext !== 'object') {
          throw new Error('Invalid input: expected clarificationContext object');
        }

        // Look up the workflow step to get the agentId
        const step = workflowStepsRepository.findById(stepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${stepId}`);
        }

        const agentId = step.agentId;
        if (!agentId) {
          throw new Error(`No agent assigned to refinement step ${stepId}`);
        }

        const retryCount = refinementStepService.getRetryCount(workflowId);
        const isRetryLimitReached = refinementStepService.isRetryLimitReached(workflowId);

        console.log('[IPC] refinement:retry', {
          agentId,
          isRetryLimitReached,
          retryCount,
          stepId,
          workflowId,
        });

        // Use the retry method with exponential backoff
        return refinementStepService.retryRefinement({
          agentId,
          clarificationContext: typedInput.clarificationContext,
          featureRequest,
          repositoryPath,
          stepId,
          timeoutSeconds: typedInput.timeoutSeconds,
          workflowId,
        });
      } catch (error) {
        console.error('[IPC Error] refinement:retry:', error);
        throw error;
      }
    }
  );

  // Regenerate refined text with additional guidance
  ipcMain.handle(
    IpcChannels.refinement.regenerate,
    async (_event: IpcMainInvokeEvent, input: unknown): Promise<RefinementOutcomeWithPause> => {
      try {
        // Validate input structure
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object');
        }

        const typedInput = input as RefinementRegenerateInput & {
          clarificationContext: RefinementServiceOptions['clarificationContext'];
          featureRequest: string;
          repositoryPath: string;
          timeoutSeconds?: number;
        };

        // Validate required parameters
        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');
        const guidance = validateString(typedInput.guidance, 'guidance');
        const featureRequest = validateString(typedInput.featureRequest, 'featureRequest');
        const repositoryPath = validateString(typedInput.repositoryPath, 'repositoryPath');

        // Validate clarification context
        if (!typedInput.clarificationContext || typeof typedInput.clarificationContext !== 'object') {
          throw new Error('Invalid input: expected clarificationContext object');
        }

        // Look up the workflow step to get the agentId
        const step = workflowStepsRepository.findById(stepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${stepId}`);
        }

        const agentId = step.agentId;
        if (!agentId) {
          throw new Error(`No agent assigned to refinement step ${stepId}`);
        }

        console.log('[IPC] refinement:regenerate', {
          agentId,
          guidanceLength: guidance.length,
          stepId,
          workflowId,
        });

        // Create stream message handler
        const handleStreamMessage = (message: RefinementStreamMessage): void => {
          const mainWindow = getMainWindow();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IpcChannels.refinement.stream, message);
          }
        };

        // Augment the feature request with the regeneration guidance
        const augmentedFeatureRequest = `${featureRequest}

## Additional Guidance for Refinement

The user has requested regeneration with the following guidance:

${guidance}`;

        // Start a new refinement with the augmented feature request
        const outcome = await refinementStepService.startRefinement(
          {
            agentId,
            clarificationContext: typedInput.clarificationContext,
            featureRequest: augmentedFeatureRequest,
            repositoryPath,
            stepId,
            timeoutSeconds: typedInput.timeoutSeconds,
            workflowId,
          },
          handleStreamMessage
        );

        return outcome;
      } catch (error) {
        console.error('[IPC Error] refinement:regenerate:', error);
        throw error;
      }
    }
  );

  // Get the result of a completed refinement session
  // This channel exists for parity with the channel definition but delegates to getState
  ipcMain.handle(
    IpcChannels.refinement.getResult,
    (_event: IpcMainInvokeEvent, workflowId: unknown) => {
      try {
        const validatedWorkflowId = validateNumberId(workflowId, 'workflowId');

        console.log('[IPC] refinement:getResult', { workflowId: validatedWorkflowId });

        // Return the same state as getState - the caller can extract the result
        return refinementStepService.getState(validatedWorkflowId);
      } catch (error) {
        console.error('[IPC Error] refinement:getResult:', error);
        throw error;
      }
    }
  );
}

/**
 * Validates that a value is a valid number ID.
 *
 * @param value - The value to validate
 * @param name - The name of the parameter for error messages
 * @returns The validated number
 * @throws Error if the value is not a valid number
 */
function validateNumberId(value: unknown, name: string): number {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    throw new Error(`Invalid ${name}: expected positive number, got ${String(value)}`);
  }
  return value;
}

/**
 * Validates that a value is a non-empty string.
 *
 * @param value - The value to validate
 * @param name - The name of the parameter for error messages
 * @returns The validated string
 * @throws Error if the value is not a non-empty string
 */
function validateString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${name}: expected non-empty string`);
  }
  return value;
}
