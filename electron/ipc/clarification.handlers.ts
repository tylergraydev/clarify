/**
 * Clarification IPC Handlers
 *
 * Handles all clarification step operations for the workflow pipeline.
 * Bridges renderer requests to the ClarificationStepService.
 *
 * Channels:
 * - clarification:start - Start clarification with workflowId, stepId
 * - clarification:submitAnswers - Submit user answers to questions
 * - clarification:submitEdits - Submit manual edits to clarification
 * - clarification:skip - Skip clarification with reason
 * - clarification:retry - Retry clarification (not yet implemented)
 * - clarification:getState - Get current session state
 *
 * @see {@link ../services/clarification-step.service.ts ClarificationStepService}
 */
import { type BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { WorkflowStepsRepository } from '../../db/repositories';
import type {
  ClarificationOutcome,
  ClarificationRefinementInput,
  ClarificationServiceState,
  ClarificationStreamMessage,
} from '../../lib/validations/clarification';

import { type ClarificationOutcomeWithPause, clarificationStepService } from '../services/clarification-step.service';
import { IpcChannels } from './channels';

/**
 * Input for starting a clarification session.
 */
interface ClarificationStartInput {
  /** The feature request text to analyze */
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
 * Register all clarification-related IPC handlers.
 *
 * @param workflowStepsRepository - The workflow steps repository for looking up step data
 * @param getMainWindow - Function to get the main BrowserWindow for streaming events
 */
export function registerClarificationHandlers(
  workflowStepsRepository: WorkflowStepsRepository,
  getMainWindow: () => BrowserWindow | null
): void {
  // Start a new clarification session
  ipcMain.handle(
    IpcChannels.clarification.start,
    async (_event: IpcMainInvokeEvent, input: unknown): Promise<ClarificationOutcomeWithPause> => {
      try {
        // Validate input structure
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object');
        }

        const typedInput = input as ClarificationStartInput;

        // Validate required parameters
        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');
        const featureRequest = validateString(typedInput.featureRequest, 'featureRequest');
        const repositoryPath = validateString(typedInput.repositoryPath, 'repositoryPath');

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
          throw new Error(`No agent assigned to clarification step ${stepId}`);
        }

        console.log('[IPC] clarification:start', {
          agentId,
          featureRequestLength: featureRequest.length,
          repositoryPath,
          stepId,
          workflowId,
        });

        // Create stream message handler to forward events to renderer
        const handleStreamMessage = (message: ClarificationStreamMessage): void => {
          const mainWindow = getMainWindow();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IpcChannels.clarification.stream, message);
          }
        };

        // Call the service with the complete options and stream callback
        const outcome = await clarificationStepService.startClarification(
          {
            agentId,
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
        console.error('[IPC Error] clarification:start:', error);
        throw error;
      }
    }
  );

  // Submit user answers to clarification questions
  ipcMain.handle(
    IpcChannels.clarification.submitAnswers,
    (
      _event: IpcMainInvokeEvent,
      input: unknown
    ): {
      formattedAnswers: string;
      questions: Array<{ header: string; options: Array<{ description: string; label: string }>; question: string }>;
      selectedOptions: Record<string, string>;
    } => {
      try {
        // Validate input structure
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object');
        }

        const typedInput = input as ClarificationRefinementInput;

        // Validate required fields
        validateNumberId(typedInput.workflowId, 'workflowId');
        validateNumberId(typedInput.stepId, 'stepId');

        if (!typedInput.questions || !Array.isArray(typedInput.questions)) {
          throw new Error('Invalid input: expected questions array');
        }

        if (!typedInput.answers || typeof typedInput.answers !== 'object') {
          throw new Error('Invalid input: expected answers object');
        }

        console.log('[IPC] clarification:submitAnswers', {
          answersCount: Object.keys(typedInput.answers).length,
          questionsCount: typedInput.questions.length,
          stepId: typedInput.stepId,
          workflowId: typedInput.workflowId,
        });

        return clarificationStepService.submitAnswers(typedInput);
      } catch (error) {
        console.error('[IPC Error] clarification:submitAnswers:', error);
        throw error;
      }
    }
  );

  // Submit manual edits to clarification
  ipcMain.handle(
    IpcChannels.clarification.submitEdits,
    (_event: IpcMainInvokeEvent, sessionId: unknown, editedText: unknown): ClarificationOutcome => {
      try {
        if (!isValidSessionId(sessionId)) {
          throw new Error(`Invalid session ID: ${String(sessionId)}`);
        }

        const validatedText = validateString(editedText, 'editedText');

        console.log('[IPC] clarification:submitEdits', {
          editedTextLength: validatedText.length,
          sessionId,
        });

        return clarificationStepService.submitEdits(sessionId, validatedText);
      } catch (error) {
        console.error('[IPC Error] clarification:submitEdits:', error);
        throw error;
      }
    }
  );

  // Skip clarification with optional reason
  ipcMain.handle(
    IpcChannels.clarification.skip,
    (_event: IpcMainInvokeEvent, sessionId: unknown, reason?: unknown): ClarificationOutcome => {
      try {
        if (!isValidSessionId(sessionId)) {
          throw new Error(`Invalid session ID: ${String(sessionId)}`);
        }

        const validatedReason = reason !== undefined && reason !== null ? validateString(reason, 'reason') : undefined;

        console.log('[IPC] clarification:skip', {
          reason: validatedReason,
          sessionId,
        });

        return clarificationStepService.skipClarification(sessionId, validatedReason);
      } catch (error) {
        console.error('[IPC Error] clarification:skip:', error);
        throw error;
      }
    }
  );

  // Retry clarification with exponential backoff
  ipcMain.handle(
    IpcChannels.clarification.retry,
    async (_event: IpcMainInvokeEvent, sessionId: unknown, input: unknown): Promise<ClarificationOutcomeWithPause> => {
      try {
        if (!isValidSessionId(sessionId)) {
          throw new Error(`Invalid session ID: ${String(sessionId)}`);
        }

        // Cancel the existing session first if it's still active
        clarificationStepService.cancelClarification(sessionId);

        // Validate input for restart
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object for retry');
        }

        const typedInput = input as ClarificationStartInput;

        // Validate required parameters
        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');
        const featureRequest = validateString(typedInput.featureRequest, 'featureRequest');
        const repositoryPath = validateString(typedInput.repositoryPath, 'repositoryPath');

        // Look up the workflow step to get the agentId
        const step = workflowStepsRepository.findById(stepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${stepId}`);
        }

        const agentId = step.agentId;
        if (!agentId) {
          throw new Error(`No agent assigned to clarification step ${stepId}`);
        }

        const retryCount = clarificationStepService.getRetryCount(sessionId);
        const isRetryLimitReached = clarificationStepService.isRetryLimitReached(sessionId);

        console.log('[IPC] clarification:retry', {
          agentId,
          isRetryLimitReached,
          previousSessionId: sessionId,
          retryCount,
          stepId,
          workflowId,
        });

        // Use the new retry method with exponential backoff
        return clarificationStepService.retryClarification(
          {
            agentId,
            featureRequest,
            repositoryPath,
            stepId,
            timeoutSeconds: typedInput.timeoutSeconds,
            workflowId,
          },
          sessionId
        );
      } catch (error) {
        console.error('[IPC Error] clarification:retry:', error);
        throw error;
      }
    }
  );

  // Get current session state
  ipcMain.handle(
    IpcChannels.clarification.getState,
    (_event: IpcMainInvokeEvent, sessionId: unknown): ClarificationServiceState | null => {
      try {
        if (!isValidSessionId(sessionId)) {
          throw new Error(`Invalid session ID: ${String(sessionId)}`);
        }

        console.log('[IPC] clarification:getState', { sessionId });

        return clarificationStepService.getState(sessionId);
      } catch (error) {
        console.error('[IPC Error] clarification:getState:', error);
        throw error;
      }
    }
  );
}

/**
 * Validates that a value is a valid session ID.
 *
 * @param value - The value to validate
 * @returns True if valid session ID
 */
function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
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
