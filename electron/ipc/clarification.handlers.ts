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

import type { WorkflowsRepository, WorkflowStepsRepository } from '../../db/repositories';
import type {
  ClarificationOutcome,
  ClarificationQuestion,
  ClarificationRefinementInput,
  ClarificationStreamMessage,
} from '../../lib/validations/clarification';

import { type ClarificationOutcomeWithPause, clarificationStepService } from '../services/clarification-step.service';
import { IpcChannels } from './channels';
import { advanceWorkflowAfterSkip, advanceWorkflowAfterStep, createStreamForwarder, parseOutputStructured, validateNumberId, validateString } from './ipc-utils';

/**
 * Input for starting a clarification session.
 */
interface ClarificationStartInput {
  /** Optional agent ID override. When provided, takes precedence over the step's configured agent. */
  agentId?: number;
  /** The feature request text to analyze */
  featureRequest: string;
  /** Whether to keep existing questions and append new ones instead of replacing */
  keepExistingQuestions?: boolean;
  /** The path to the repository being analyzed */
  repositoryPath: string;
  /** Optional guidance text from the user to influence a rerun */
  rerunGuidance?: string;
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
  workflowsRepository: WorkflowsRepository,
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

        // Always validate step exists and belongs to the workflow
        const step = workflowStepsRepository.findById(stepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${stepId}`);
        }

        if (step.workflowId !== workflowId) {
          throw new Error(`Step ${stepId} does not belong to workflow ${workflowId}`);
        }

        // Use passed agentId if provided, otherwise look up from the workflow step
        const agentId = typedInput.agentId ?? step.agentId ?? undefined;

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

        // Create stream message handler to forward events to renderer.
        // Injects workflowId into every message so the renderer can filter
        // by workflow and avoid cross-workflow stream contamination.
        const handleStreamMessage = createStreamForwarder<ClarificationStreamMessage>(
          getMainWindow,
          IpcChannels.clarification.stream,
          { workflowId },
        );

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

        const workflow = workflowsRepository.findById(workflowId);
        const pauseBehavior = ((workflow?.pauseBehavior ?? 'auto_pause') as 'auto_pause' | 'continuous');
        persistOutcomeToStep(workflowStepsRepository, workflowsRepository, stepId, workflowId, pauseBehavior, outcome);

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
      questions: Array<{
        allowOther?: boolean;
        header: string;
        options?: Array<{ description: string; label: string }>;
        question: string;
        questionType?: 'checkbox' | 'radio' | 'text';
      }>;
      selectedOptions: Record<string, Array<string> | string>;
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

        // Validate each answer matches its question type
        for (const question of typedInput.questions) {
          const questionIndex = typedInput.questions.indexOf(question).toString();
          const answer = typedInput.answers[questionIndex];

          if (!answer) {
            throw new Error(`Missing answer for question: "${question.header}"`);
          }

          const questionType = question.questionType ?? 'radio'; // Default to radio for backward compatibility

          // Type-specific validation
          if (questionType === 'radio') {
            if (answer.type !== 'radio') {
              throw new Error(`Invalid answer type for radio question: "${question.header}"`);
            }

            // Validate selected option is valid (if provided and not an "Other" answer)
            if (answer.selected && !answer.other) {
              const validLabels = question.options?.map((opt) => opt.label) ?? [];

              if (validLabels.length > 0 && !validLabels.includes(answer.selected)) {
                throw new Error(
                  `Invalid selection "${answer.selected}" for question "${question.header}". Valid options: ${validLabels.join(', ')}`
                );
              }
            }

            // Require either selected or other
            if (!answer.selected && !answer.other) {
              throw new Error(`No answer provided for question: "${question.header}"`);
            }
          } else if (questionType === 'checkbox') {
            if (answer.type !== 'checkbox') {
              throw new Error(`Invalid answer type for checkbox question: "${question.header}"`);
            }

            // Validate all selected options are valid
            if (answer.selected.length > 0) {
              const validLabels = question.options?.map((opt) => opt.label) ?? [];

              if (validLabels.length > 0) {
                // When "Other" is provided, only validate the predefined selections
                const selectionsToValidate = answer.other
                  ? answer.selected.filter((label) => label !== answer.other)
                  : answer.selected;

                const invalidSelections = selectionsToValidate.filter((label) => !validLabels.includes(label));

                if (invalidSelections.length > 0) {
                  throw new Error(
                    `Invalid selections for "${question.header}": ${invalidSelections.join(', ')}. Valid options: ${validLabels.join(', ')}`
                  );
                }
              }
            }

            // Require either selections or other
            if (answer.selected.length === 0 && !answer.other) {
              throw new Error(`No answer provided for question: "${question.header}"`);
            }
          } else if (questionType === 'text') {
            if (answer.type !== 'text') {
              throw new Error(`Invalid answer type for text question: "${question.header}"`);
            }

            if (!answer.text || answer.text.trim() === '') {
              throw new Error(`No answer provided for text question: "${question.header}"`);
            }
          }
        }

        console.log('[IPC] clarification:submitAnswers', {
          answersCount: Object.keys(typedInput.answers).length,
          questionsCount: typedInput.questions.length,
          stepId: typedInput.stepId,
          workflowId: typedInput.workflowId,
        });

        const result = clarificationStepService.submitAnswers(typedInput);

        // Persist the submitted answers into the step's outputStructured so the UI
        // can derive the "answered" phase from step data after a refetch.
        const step = workflowStepsRepository.findById(typedInput.stepId);
        if (step) {
          const existingOutput = parseOutputStructured(step.outputStructured);

          workflowStepsRepository.update(typedInput.stepId, {
            completedAt: new Date().toISOString(),
            outputStructured: {
              ...existingOutput,
              answers: typedInput.answers,
            },
            status: 'completed',
          });

          // Advance workflow based on pause behavior
          advanceWorkflowAfterStep(workflowsRepository, workflowStepsRepository, typedInput.workflowId, typedInput.stepId);
        }

        return result;
      } catch (error) {
        console.error('[IPC Error] clarification:submitAnswers:', error);
        throw error;
      }
    }
  );

  // Submit manual edits to clarification
  ipcMain.handle(
    IpcChannels.clarification.submitEdits,
    (_event: IpcMainInvokeEvent, workflowId: unknown, editedText: unknown): ClarificationOutcome => {
      try {
        const validatedWorkflowId = validateNumberId(workflowId, 'workflowId');
        const validatedText = validateString(editedText, 'editedText');

        console.log('[IPC] clarification:submitEdits', {
          editedTextLength: validatedText.length,
          workflowId: validatedWorkflowId,
        });

        return clarificationStepService.submitEdits(validatedWorkflowId, validatedText);
      } catch (error) {
        console.error('[IPC Error] clarification:submitEdits:', error);
        throw error;
      }
    }
  );

  // Skip clarification with optional reason
  ipcMain.handle(
    IpcChannels.clarification.skip,
    (_event: IpcMainInvokeEvent, workflowId: unknown, reason?: unknown): ClarificationOutcome => {
      try {
        const validatedWorkflowId = validateNumberId(workflowId, 'workflowId');
        const validatedReason = reason !== undefined && reason !== null ? validateString(reason, 'reason') : undefined;

        console.log('[IPC] clarification:skip', {
          reason: validatedReason,
          workflowId: validatedWorkflowId,
        });

        const result = clarificationStepService.skipClarification(validatedWorkflowId, validatedReason);

        // If no active session exists (pending or already-completed step), skip directly via the repository
        if (result.type === 'ERROR' && result.error === 'Session not found') {
          const steps = workflowStepsRepository.findByWorkflowId(validatedWorkflowId);
          const clarificationStep = steps.find((s) => s.stepType === 'clarification');

          if (!clarificationStep) {
            throw new Error(`No clarification step found for workflow ${validatedWorkflowId}`);
          }

          const skipReason = validatedReason ?? 'Manually skipped by user';

          // Mark the step as skipped in the database
          const skippedStep = workflowStepsRepository.skip(clarificationStep.id);

          // Preserve existing output (e.g. questions from a completed run) and add skip info
          const existingOutput = parseOutputStructured(clarificationStep.outputStructured);

          workflowStepsRepository.update(clarificationStep.id, {
            outputStructured: {
              ...existingOutput,
              skipped: true,
              skipReason,
            },
          });

          // Auto-advance to the next step based on workflow pause behavior
          if (skippedStep) {
            advanceWorkflowAfterSkip(workflowsRepository, workflowStepsRepository, skippedStep.workflowId, skippedStep.stepNumber);
          }

          return {
            assessment: { reason: skipReason, score: 5 },
            reason: skipReason,
            type: 'SKIP_CLARIFICATION',
          };
        }

        return result;
      } catch (error) {
        console.error('[IPC Error] clarification:skip:', error);
        throw error;
      }
    }
  );

  // Retry clarification with exponential backoff
  ipcMain.handle(
    IpcChannels.clarification.retry,
    async (_event: IpcMainInvokeEvent, input: unknown): Promise<ClarificationOutcomeWithPause> => {
      try {
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

        // Cancel the existing session first if it's still active
        await clarificationStepService.cancelClarification(workflowId);

        // Always validate step exists and belongs to the workflow
        const step = workflowStepsRepository.findById(stepId);
        if (!step) {
          throw new Error(`Workflow step not found: ${stepId}`);
        }

        if (step.workflowId !== workflowId) {
          throw new Error(`Step ${stepId} does not belong to workflow ${workflowId}`);
        }

        // Reset step and workflow status if awaiting_input
        if (step.status === 'awaiting_input') {
          workflowStepsRepository.update(stepId, { status: 'running' });
        }
        const currentWorkflow = workflowsRepository.findById(workflowId);
        if (currentWorkflow && currentWorkflow.status === 'awaiting_input') {
          workflowsRepository.updateStatus(workflowId, 'running');
        }

        // Use passed agentId if provided, otherwise look up from the workflow step
        const agentId = typedInput.agentId ?? step.agentId ?? undefined;

        if (!agentId) {
          throw new Error(`No agent assigned to clarification step ${stepId}`);
        }

        const retryCount = clarificationStepService.getRetryCount(workflowId);
        const isRetryLimitReached = clarificationStepService.isRetryLimitReached(workflowId);

        console.log('[IPC] clarification:retry', {
          agentId,
          isRetryLimitReached,
          retryCount,
          stepId,
          workflowId,
        });

        // Create stream message handler to forward events to renderer.
        // Injects workflowId into every message so the renderer can filter
        // by workflow and avoid cross-workflow stream contamination.
        const handleStreamMessage = createStreamForwarder<ClarificationStreamMessage>(
          getMainWindow,
          IpcChannels.clarification.stream,
          { workflowId },
        );

        // If keepExistingQuestions, load existing questions from the step's outputStructured
        let existingQuestions: Array<ClarificationQuestion> | undefined;
        if (typedInput.keepExistingQuestions) {
          const existingStep = workflowStepsRepository.findById(stepId);
          if (existingStep?.outputStructured) {
            const parsed = parseOutputStructured(existingStep.outputStructured);
            existingQuestions = parsed?.questions as Array<ClarificationQuestion> | undefined;
          }
        }

        // Use the new retry method with exponential backoff
        const outcome = await clarificationStepService.retryClarification(
          {
            agentId,
            existingQuestions,
            featureRequest,
            keepExistingQuestions: typedInput.keepExistingQuestions,
            repositoryPath,
            rerunGuidance: typedInput.rerunGuidance,
            stepId,
            timeoutSeconds: typedInput.timeoutSeconds,
            workflowId,
          },
          handleStreamMessage
        );

        // Use merged persistence if keeping existing questions, otherwise normal persistence
        const retryWorkflow = workflowsRepository.findById(workflowId);
        const retryPauseBehavior = ((retryWorkflow?.pauseBehavior ?? 'auto_pause') as 'auto_pause' | 'continuous');
        if (typedInput.keepExistingQuestions && outcome.type === 'QUESTIONS_FOR_USER') {
          persistOutcomeToStepMerged(workflowStepsRepository, workflowsRepository, stepId, workflowId, retryPauseBehavior, outcome);
        } else {
          persistOutcomeToStep(workflowStepsRepository, workflowsRepository, stepId, workflowId, retryPauseBehavior, outcome);
        }

        return outcome;
      } catch (error) {
        console.error('[IPC Error] clarification:retry:', error);
        throw error;
      }
    }
  );

  // Get current session state
  ipcMain.handle(IpcChannels.clarification.getState, (_event: IpcMainInvokeEvent, workflowId: unknown) => {
    try {
      const validatedWorkflowId = validateNumberId(workflowId, 'workflowId');

      console.log('[IPC] clarification:getState', { workflowId: validatedWorkflowId });

      return clarificationStepService.getState(validatedWorkflowId);
    } catch (error) {
      console.error('[IPC Error] clarification:getState:', error);
      throw error;
    }
  });
}

/**
 * Persists a clarification outcome to the workflow step record in the database.
 *
 * After the clarification agent completes, the in-memory session is cleaned up.
 * Without persisting, the UI cannot determine the outcome from the step record
 * and will remain stuck showing a "running" spinner.
 *
 * @param workflowStepsRepository - Repository for updating step records
 * @param stepId - The workflow step ID to update
 * @param outcome - The clarification outcome to persist
 */
function persistOutcomeToStep(
  workflowStepsRepository: WorkflowStepsRepository,
  workflowsRepository: WorkflowsRepository,
  stepId: number,
  workflowId: number,
  pauseBehavior: 'auto_pause' | 'continuous',
  outcome: ClarificationOutcomeWithPause
): void {
  switch (outcome.type) {
    case 'ERROR':
      workflowStepsRepository.fail(stepId, outcome.error ?? 'Unknown error');
      break;
    case 'QUESTIONS_FOR_USER':
      workflowStepsRepository.update(stepId, {
        outputStructured: {
          assessment: outcome.assessment,
          questions: outcome.questions,
        },
        status: 'awaiting_input',
      });
      workflowsRepository.updateStatus(workflowId, 'awaiting_input');
      break;
    case 'SKIP_CLARIFICATION':
      workflowStepsRepository.update(stepId, {
        completedAt: new Date().toISOString(),
        outputStructured: {
          assessment: outcome.assessment,
          skipped: true,
          skipReason: outcome.reason,
        },
        status: 'completed',
      });
      if (pauseBehavior === 'auto_pause') {
        workflowsRepository.updateStatus(workflowId, 'paused');
      }
      break;
    case 'TIMEOUT':
      workflowStepsRepository.fail(stepId, outcome.error ?? `Timed out after ${outcome.elapsedSeconds}s`);
      break;
    // CANCELLED: No persistence needed — user-initiated cancellation is handled separately
  }
}

/**
 * Persists a clarification outcome by merging new questions with existing ones.
 *
 * Used when the user has "Keep existing questions" enabled. Concatenates existing
 * questions with newly generated questions, uses the latest assessment, and omits
 * answers so the UI renders in the `unanswered` phase (forcing the user to review
 * and submit answers for all questions together).
 *
 * @param workflowStepsRepository - Repository for updating step records
 * @param stepId - The workflow step ID to update
 * @param outcome - The clarification outcome containing new questions
 */
function persistOutcomeToStepMerged(
  workflowStepsRepository: WorkflowStepsRepository,
  workflowsRepository: WorkflowsRepository,
  stepId: number,
  workflowId: number,
  pauseBehavior: 'auto_pause' | 'continuous',
  outcome: ClarificationOutcomeWithPause
): void {
  if (outcome.type !== 'QUESTIONS_FOR_USER') {
    // Non-question outcomes should never reach here, but handle gracefully
    persistOutcomeToStep(workflowStepsRepository, workflowsRepository, stepId, workflowId, pauseBehavior, outcome);
    return;
  }

  // Load existing questions from the step
  const existingStep = workflowStepsRepository.findById(stepId);
  let existingQuestions: Array<ClarificationQuestion> = [];
  if (existingStep?.outputStructured) {
    const parsed = parseOutputStructured(existingStep.outputStructured);
    existingQuestions = (parsed?.questions as Array<ClarificationQuestion>) ?? [];
  }

  // Merge: existing questions first, then new questions
  const mergedQuestions = [...existingQuestions, ...outcome.questions];

  workflowStepsRepository.update(stepId, {
    outputStructured: {
      assessment: outcome.assessment,
      questions: mergedQuestions,
      // Deliberately omit `answers` to force `unanswered` UI phase
    },
    status: 'awaiting_input',
  });
  workflowsRepository.updateStatus(workflowId, 'awaiting_input');
}

