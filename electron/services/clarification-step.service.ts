/**
 * Clarification Step Service
 *
 * Orchestrates the clarification step of the workflow pipeline.
 * This service manages the execution of the clarification agent,
 * which assesses feature request clarity and generates clarifying questions.
 *
 * ## Responsibilities
 *
 * - Load agent configuration from database
 * - Execute clarification agent via Claude Agent SDK
 * - Parse agent output for SKIP/QUESTIONS detection
 * - Handle timeout with configurable duration
 * - Manage state transitions through the clarification process
 *
 * ## State Machine
 *
 * idle -> loading_agent -> executing -> processing_response -> waiting_for_user | complete | error
 *                                                           -> cancelled | timeout
 *
 * @see {@link ../../lib/validations/clarification.ts Clarification Types}
 */

import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

import { randomUUID } from 'crypto';

import type {
  ClarificationAgentConfig,
  ClarificationOutcome,
  ClarificationQuestion,
  ClarificationRefinementInput,
  ClarificationServiceOptions,
  ClarificationServicePhase,
  ClarificationServiceState,
  ClarificationStreamMessage,
  ClarificationUsageStats,
} from '../../lib/validations/clarification';
import type { StepOutcomeWithPause } from './agent-step';
import type { ActiveToolInfo, ExecuteAgentResult } from './agent-step/step-types';

import {
  clarificationAgentOutputFlatSchema,
  clarificationAgentOutputJSONSchema,
} from '../../lib/validations/clarification';
import { AgentSdkExecutor } from './agent-step/agent-sdk-executor';
import { MAX_RETRY_ATTEMPTS, STEP_TIMEOUTS } from './agent-step/agent-step-constants';
import { createTimeoutPromise } from './agent-step/agent-timeout-manager';
import { BaseAgentStepService } from './agent-step/base-agent-step-service';
import { buildOutcomeWithPauseInfo } from './agent-step/outcome-builder';
import { StepAuditLogger } from './agent-step/step-audit-logger';
import { buildErrorOutcomeFromResult, handleStepError } from './agent-step/step-error-handler';
import { StructuredOutputValidator } from './agent-step/structured-output-validator';
import { extractUsageStats } from './agent-step/usage-stats';
import { debugLoggerService } from './debug-logger.service';

/**
 * Default timeout for clarification operations in seconds.
 */
const DEFAULT_TIMEOUT_SECONDS = STEP_TIMEOUTS.clarification;

/**
 * Extended outcome that includes pause information.
 * Uses generic StepOutcomeWithPause to combine clarification outcome with pause/retry fields.
 */
export type ClarificationOutcomeWithPause = StepOutcomeWithPause<ClarificationOutcome, ClarificationUsageStats>;

/**
 * Active clarification session tracking.
 */
interface ActiveClarificationSession {
  abortController: AbortController;
  activeTools: Array<ActiveToolInfo>;
  agentConfig: ClarificationAgentConfig | null;
  options: ClarificationServiceOptions;
  phase: ClarificationServicePhase;
  questions: Array<ClarificationQuestion> | null;
  sessionId: string;
  skipReason: null | string;
  streamingText: string;
  thinkingBlocks: Array<string>;
  timeoutId: null | ReturnType<typeof setTimeout>;
}

/**
 * Clarification Step Service
 *
 * Manages the clarification step of workflow pipelines.
 * Loads agent configuration from the database and executes
 * the clarification agent to assess feature request clarity.
 *
 * Extends BaseAgentStepService to leverage shared abstractions:
 * - AgentSdkExecutor for SDK query execution
 * - StepAuditLogger for consistent audit logging
 * - StructuredOutputValidator for output validation
 * - AgentTimeoutManager for timeout handling
 * - OutcomeBuilder for pause information
 */
class ClarificationStepService extends BaseAgentStepService<
  ClarificationAgentConfig,
  ActiveClarificationSession,
  ClarificationServiceOptions,
  ClarificationServicePhase,
  ClarificationOutcome,
  ClarificationStreamMessage
> {
  private auditLogger = new StepAuditLogger('clarification');
  private sdkExecutor = new AgentSdkExecutor<
    ClarificationAgentConfig,
    ActiveClarificationSession,
    ClarificationStreamMessage
  >();
  private structuredValidator = new StructuredOutputValidator(clarificationAgentOutputFlatSchema);

  /**
   * Cancel an active clarification session.
   *
   * Uses the template method from BaseAgentStepService for standardized cleanup.
   *
   * @param workflowId - The workflow ID to cancel
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the cancelled outcome
   */
  async cancelClarification(
    workflowId: number,
    onStreamMessage?: (message: ClarificationStreamMessage) => void
  ): Promise<ClarificationOutcome> {
    return this.cancelSession(workflowId, this.auditLogger, onStreamMessage);
  }

  /**
   * Retry a failed clarification with exponential backoff.
   *
   * Automatically increments retry count and applies backoff delay.
   * If retry limit is reached, returns an error with skip fallback flag.
   *
   * Uses the template method from BaseAgentStepService for standardized retry logic.
   *
   * @param options - The clarification service options
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the clarification outcome
   */
  async retryClarification(
    options: ClarificationServiceOptions,
    onStreamMessage?: (message: ClarificationStreamMessage) => void
  ): Promise<ClarificationOutcomeWithPause> {
    return this.retrySession(
      options.workflowId,
      options,
      this.startClarification.bind(this),
      this.auditLogger,
      onStreamMessage
    );
  }

  /**
   * Skip clarification for this session.
   *
   * Used when the user chooses to skip clarification manually,
   * or when auto-skip is enabled for clear features.
   *
   * @param workflowId - The workflow ID
   * @param reason - The reason for skipping
   * @returns The skip outcome
   */
  skipClarification(workflowId: number, reason?: string): ClarificationOutcome {
    const session = this.activeSessions.get(workflowId);
    if (!session) {
      return {
        error: 'Session not found',
        type: 'ERROR',
      };
    }

    debugLoggerService.logSdkEvent(session.sessionId, 'Clarification skipped manually', {
      reason,
    });

    const skipReason = reason ?? 'User skipped clarification';

    // Audit log: clarification skipped
    this.auditLogger.logStepCompleted(
      workflowId,
      session.options.stepId,
      session.agentConfig?.id ?? 0,
      session.agentConfig?.name ?? 'Unknown',
      'Clarification step skipped by user',
      {
        phase: session.phase,
        reason: skipReason,
        sessionId: session.sessionId,
      }
    );

    // Clear timeout if active
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
    }

    // Abort if still running
    if (!session.abortController.signal.aborted) {
      session.abortController.abort();
    }

    session.phase = 'complete';
    session.skipReason = skipReason;

    // Clean up
    this.cleanupSession(workflowId);

    return {
      assessment: { reason: session.skipReason, score: 5 },
      reason: session.skipReason,
      type: 'SKIP_CLARIFICATION',
    };
  }

  /**
   * Start the clarification process.
   *
   * Initializes a new clarification session:
   * 1. Loads agent configuration from database
   * 2. Creates an agent stream session with the agent's system prompt
   * 3. Configures tools based on agent's allowed tools
   * 4. Sets up timeout handling with AbortController
   *
   * @param options - The clarification service options
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the clarification outcome with pause information
   */
  async startClarification(
    options: ClarificationServiceOptions,
    onStreamMessage?: (message: ClarificationStreamMessage) => void
  ): Promise<ClarificationOutcomeWithPause> {
    // Initialize session using base class helper
    const { session, timeoutSeconds, workflowId } = this.initializeSession(options, this.auditLogger, {
      agentId: options.agentId,
      featureRequestLength: options.featureRequest.length,
      repositoryPath: options.repositoryPath,
      stepId: options.stepId,
      timeoutSeconds: options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS,
    });

    try {
      // Phase: Loading agent
      session.phase = 'loading_agent';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      const agentConfig = await this.loadAgentConfig(workflowId, options.agentId);
      session.agentConfig = agentConfig;

      debugLoggerService.logSdkEvent(session.sessionId, 'Agent configuration loaded', {
        agentName: agentConfig.name,
        hooksCount: agentConfig.hooks.length,
        model: agentConfig.model,
        skillsCount: agentConfig.skills.length,
        toolsCount: agentConfig.tools.length,
      });

      // Audit log: agent configuration loaded
      this.auditLogger.logAgentLoaded(workflowId, options.stepId, agentConfig.id, agentConfig.name, {
        hooksCount: agentConfig.hooks.length,
        model: agentConfig.model,
        permissionMode: agentConfig.permissionMode,
        sessionId: session.sessionId,
        skillsCount: agentConfig.skills.length,
        toolsCount: agentConfig.tools.length,
      });

      // Phase: Executing
      session.phase = 'executing';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      // Set up timeout using AgentTimeoutManager
      const { cleanup: cleanupTimeout, promise: timeoutPromise } = createTimeoutPromise<
        ExecuteAgentResult<ClarificationOutcome, ClarificationUsageStats>
      >({
        abortController: session.abortController,
        onTimeout: () => {
          session.phase = 'timeout';
          this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

          debugLoggerService.logSdkEvent(session.sessionId, 'Clarification timed out', {
            elapsedSeconds: timeoutSeconds,
          });

          // Audit log: clarification timeout
          this.auditLogger.logStepTimeout(
            workflowId,
            options.stepId,
            agentConfig.id,
            agentConfig.name,
            timeoutSeconds,
            {
              sessionId: session.sessionId,
            }
          );

          return {
            outcome: {
              elapsedSeconds: timeoutSeconds,
              error: `Clarification timed out after ${timeoutSeconds} seconds`,
              type: 'TIMEOUT',
            },
          };
        },
        timeoutSeconds,
      });

      // Execute the agent
      const executionPromise = this.executeAgent(session, agentConfig, onStreamMessage);

      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // Clear timeout if execution completed first
      cleanupTimeout();

      // Clean up session on success
      this.cleanupSession(workflowId);

      // Add pause information and usage to successful outcomes using OutcomeBuilder
      const outcomeWithPause = buildOutcomeWithPauseInfo(
        result.outcome,
        workflowId,
        false, // clarification is not a gate step
        result,
        true // skipFallbackAvailable
      );

      debugLoggerService.logSdkEvent(session.sessionId, 'Clarification completed with pause info', {
        hasSdkSessionId: !!result.sdkSessionId,
        hasUsage: !!result.usage,
        outcomeType: result.outcome.type,
        pauseRequested: outcomeWithPause.pauseRequested,
      });

      return outcomeWithPause;
    } catch (error) {
      session.phase = 'error';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      // Use centralized error handler for consistent logging
      const errorResult = handleStepError({
        agentId: session.agentConfig?.id,
        agentName: session.agentConfig?.name,
        auditLogger: this.auditLogger,
        error,
        getRetryCount: () => this.getRetryCount(workflowId),
        isRetryLimitReached: () => this.isRetryLimitReached(workflowId),
        sessionId: session.sessionId,
        stepId: options.stepId,
        stepName: 'Clarification',
        workflowId,
      });

      // Clean up session (but keep retry count for potential retry)
      this.activeSessions.delete(workflowId);

      // Return extended outcome with retry information
      return buildErrorOutcomeFromResult(errorResult, true) as ClarificationOutcomeWithPause;
    }
  }

  /**
   * Submit user answers for refinement.
   *
   * Takes the user's answers to clarification questions and
   * formats them for the next workflow step.
   *
   * @param input - The refinement input with answers
   * @returns The formatted refinement output
   */
  submitAnswers(input: ClarificationRefinementInput): {
    formattedAnswers: string;
    questions: Array<ClarificationQuestion>;
    selectedOptions: Record<string, Array<string> | string>;
  } {
    const { answers, questions, stepId, workflowId } = input;
    const selectedOptions: Record<string, Array<string> | string> = {};

    // Validate all questions have answers
    for (const question of questions) {
      const questionIndex = questions.indexOf(question).toString();
      const answer = answers[questionIndex];

      if (!answer) {
        throw new Error(`Missing answer for question: "${question.header}"`);
      }
    }

    // Build formatted answers string
    const formattedLines: Array<string> = [];

    for (const question of questions) {
      const questionIndex = questions.indexOf(question).toString();
      const answer = answers[questionIndex]!; // Safe - validated above

      if (answer.type === 'radio') {
        // Radio: single selection with optional "Other" text
        selectedOptions[question.header] = answer.selected || 'Other';

        formattedLines.push(`**${question.header}**: ${answer.selected || 'Other'}`);

        if (answer.selected) {
          const selectedOption = question.options?.find((opt) => opt.label === answer.selected);

          if (selectedOption?.description) {
            formattedLines.push(`  ${selectedOption.description}`);
          }
        }

        if (answer.other) {
          formattedLines.push(`  Other: ${answer.other}`);
        }
      } else if (answer.type === 'checkbox') {
        // Checkbox: multiple selections with optional "Other" text
        selectedOptions[question.header] = answer.selected;

        formattedLines.push(`**${question.header}**:`);

        answer.selected.forEach((label) => {
          const option = question.options?.find((opt) => opt.label === label);

          formattedLines.push(`  - ${label}`);
          if (option?.description) {
            formattedLines.push(`    ${option.description}`);
          }
        });

        if (answer.other) {
          formattedLines.push(`  - Other: ${answer.other}`);
        }
      } else if (answer.type === 'text') {
        // Text: open-ended response
        selectedOptions[question.header] = answer.text;
        formattedLines.push(`**${question.header}**: ${answer.text}`);
      }
    }

    debugLoggerService.logSdkEvent('system', 'Clarification answers submitted', {
      questionCount: questions.length,
      selectedCount: Object.keys(selectedOptions).length,
    });

    // Audit log: clarification answers submitted
    this.auditLogger.logStepCompleted(
      workflowId,
      stepId,
      0, // agentId not available in this context
      'Clarification',
      'User submitted answers to clarifying questions',
      {
        answeredCount: Object.keys(selectedOptions).length,
        questionCount: questions.length,
        selectedOptions,
      }
    );

    return {
      formattedAnswers: formattedLines.join('\n'),
      questions,
      selectedOptions,
    };
  }

  /**
   * Submit manual edits to the clarification.
   *
   * Allows the user to provide custom clarification text
   * instead of answering the generated questions.
   *
   * @param workflowId - The workflow ID
   * @param editedText - The user's edited clarification text
   * @returns The skip outcome with the edited text as reason
   */
  submitEdits(workflowId: number, editedText: string): ClarificationOutcome {
    const session = this.activeSessions.get(workflowId);

    debugLoggerService.logSdkEvent(session?.sessionId ?? 'unknown', 'Clarification edits submitted', {
      editLength: editedText.length,
    });

    // Audit log: clarification questions edited (use logStepCompleted)
    if (session) {
      this.auditLogger.logStepCompleted(
        workflowId,
        session.options.stepId,
        session.agentConfig?.id ?? 0,
        session.agentConfig?.name ?? 'Unknown',
        'User provided manual clarification text',
        {
          editedTextLength: editedText.length,
          sessionId: session.sessionId,
        }
      );

      // Clean up session
      if (session.timeoutId) {
        clearTimeout(session.timeoutId);
      }
      if (!session.abortController.signal.aborted) {
        session.abortController.abort();
      }
      this.cleanupSession(workflowId);
    }

    return {
      assessment: { reason: 'User provided manual clarification', score: 5 },
      reason: editedText,
      type: 'SKIP_CLARIFICATION',
    };
  }

  // ===========================================================================
  // Protected Template Method Implementations
  // ===========================================================================

  /**
   * Build cancelled outcome specific to clarification step.
   *
   * @param _session - The active session (unused for clarification)
   * @returns The clarification cancelled outcome
   */
  protected buildCancelledOutcome(_session: ActiveClarificationSession): ClarificationOutcome {
    return {
      reason: 'User cancelled clarification',
      type: 'CANCELLED',
    };
  }

  /**
   * Build error outcome when maximum retry attempts are reached.
   *
   * Note: retryCount and skipFallbackAvailable are added by the base class
   * template method to avoid duplicating intersection type fields.
   *
   * @param _workflowId - The workflow ID (unused)
   * @returns The clarification error outcome
   */
  protected buildMaxRetryErrorOutcome(_workflowId: number): ClarificationOutcome {
    return {
      error: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Please skip clarification or try again later.`,
      type: 'ERROR',
    };
  }

  /**
   * Build error outcome when no active session found.
   *
   * @param _workflowId - The workflow ID (unused)
   * @returns The clarification error outcome
   */
  protected buildNotFoundErrorOutcome(_workflowId: number): ClarificationOutcome {
    return {
      error: 'Session not found',
      type: 'ERROR',
    };
  }

  /**
   * Build the clarification prompt for the agent.
   *
   * The prompt focuses on the task (analyzing the feature request) without
   * specifying output format. The SDK's structured output feature (outputFormat)
   * automatically constrains the model to produce valid JSON matching the schema.
   *
   * @param options - The clarification service options
   * @returns The formatted prompt
   */
  protected buildPrompt(options: ClarificationServiceOptions): string {
    const featureRequest = options.featureRequest;
    return `Analyze the following feature request for clarity and completeness.

## Feature Request

${featureRequest}

## Your Task

1. **Assess Clarity**: Score the feature request from 1-5 based on how clear and complete it is:
   - Score 1-2: Very vague, missing critical details, multiple interpretations possible
   - Score 3: Has some details but lacks specifics about scope or approach
   - Score 4-5: Clear scope, references specific patterns/files, includes technical details

2. **Decide the Outcome**:
   - If score >= 4: The request is clear enough. Set type to "SKIP_CLARIFICATION" and explain why in the reason field.
   - If score < 4: The request needs clarification. Set type to "QUESTIONS_FOR_USER" and generate targeted questions.

   **Always include an assessment**: Provide both score (1-5) and reason for the score, regardless of outcome type.

3. **If Generating Questions** (for scores 1-3):
   - Create 2-4 focused questions that will meaningfully impact implementation
   - **Choose the right question type for each question:**
     * Use "radio" (questionType: "radio") for mutually exclusive choices where the user should pick ONE option
     * Use "checkbox" (questionType: "checkbox") for non-exclusive options where the user can pick MULTIPLE
     * Use "text" (questionType: "text") for open-ended responses that can't be captured in predefined options
   - **Always enable "Other" input for option questions:**
     * Set allowOther: true for every radio/checkbox question so users can provide custom answers
     * Set allowOther: false for text questions (they're already open-ended)
   - Each radio/checkbox question needs 2-4 concrete options with descriptions
   - Text questions don't need options (just the question text)
   - Each question needs a short header (e.g., "Storage", "Scope", "UI Pattern")
   - Reference existing codebase patterns when relevant

**Question Type Examples:**
- Radio: "How should this feature store data?" (SQLite, Electron Store, In-memory) - user picks one
- Checkbox: "Which platforms should this support?" (Windows, macOS, Linux) - user can pick multiple
- Text: "Describe any specific edge cases or constraints for this feature." - open-ended answer

Focus on understanding what the user wants to build and gathering just enough information to enable high-quality implementation planning.`;
  }

  /**
   * Create a new session for the given options.
   *
   * Initializes clarification-specific session state (questions array, skipReason).
   *
   * @param _workflowId - The workflow ID (unused in this implementation)
   * @param options - The service options
   * @returns The initialized session
   */
  protected createSession(_workflowId: number, options: ClarificationServiceOptions): ActiveClarificationSession {
    return {
      abortController: new AbortController(),
      activeTools: [],
      agentConfig: null,
      options,
      phase: 'idle',
      questions: null,
      sessionId: randomUUID(),
      skipReason: null,
      streamingText: '',
      thinkingBlocks: [],
      timeoutId: null,
    };
  }

  /**
   * Extract step-specific state from a session.
   *
   * Returns only the relevant state fields for the clarification state type,
   * excluding internal tracking fields like abortController.
   *
   * @param session - The active session
   * @returns The extracted state object
   */
  protected extractState(session: ActiveClarificationSession): ClarificationServiceState {
    return {
      agentConfig: session.agentConfig,
      phase: session.phase,
      questions: session.questions,
      skipReason: session.skipReason,
    };
  }

  /**
   * Return the step name for logging.
   *
   * @returns The step name 'clarification'
   */
  protected getStepName(): string {
    return 'clarification';
  }

  /**
   * Process structured output from the SDK result message.
   *
   * Validates and transforms the SDK's structured_output field into
   * the clarification outcome type. Validates SKIP/QUESTIONS discriminated union.
   *
   * @param result - The SDK result message
   * @param sessionId - The session ID for logging
   * @returns The clarification outcome
   */
  protected processStructuredOutput(result: SDKResultMessage, sessionId: string): ClarificationOutcome {
    // Use StructuredOutputValidator to validate with the flat schema
    const validationResult = this.structuredValidator.validate(result, sessionId);

    if (!validationResult.success) {
      return {
        error: validationResult.error,
        type: 'ERROR',
      };
    }

    const flatOutput = validationResult.data;

    // Transform flat output to discriminated union and validate required fields
    if (flatOutput.type === 'SKIP_CLARIFICATION') {
      // Validate that assessment is present
      const assessmentCheck = this.structuredValidator.validateField(flatOutput, 'assessment', sessionId);
      if (!assessmentCheck.success) {
        return {
          error: 'SKIP_CLARIFICATION output missing required "assessment" field',
          type: 'ERROR',
        };
      }

      // Validate that reason is present for SKIP_CLARIFICATION
      const reasonCheck = this.structuredValidator.validateField(flatOutput, 'reason', sessionId);
      if (!reasonCheck.success) {
        return {
          error: 'SKIP_CLARIFICATION output missing required "reason" field',
          type: 'ERROR',
        };
      }

      // Return the outcome directly after manual validation
      return {
        assessment: flatOutput.assessment!,
        reason: flatOutput.reason!,
        type: 'SKIP_CLARIFICATION',
      };
    }

    // flatOutput.type === 'QUESTIONS_FOR_USER'
    // Validate that assessment is present
    const assessmentCheck = this.structuredValidator.validateField(flatOutput, 'assessment', sessionId);
    if (!assessmentCheck.success) {
      return {
        error: 'QUESTIONS_FOR_USER output missing required "assessment" field',
        type: 'ERROR',
      };
    }

    // Validate that questions is present for QUESTIONS_FOR_USER
    const questionsCheck = this.structuredValidator.validateField(flatOutput, 'questions', sessionId);
    if (!questionsCheck.success) {
      return {
        error: 'QUESTIONS_FOR_USER output missing required "questions" field',
        type: 'ERROR',
      };
    }

    // Return the outcome directly after manual validation
    return {
      assessment: flatOutput.assessment!,
      questions: flatOutput.questions!,
      type: 'QUESTIONS_FOR_USER',
    };
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Execute the clarification agent and collect output.
   *
   * @param session - The active session
   * @param agentConfig - The loaded agent configuration
   * @param onStreamMessage - Optional callback for streaming events
   * @returns The clarification outcome with usage metadata
   */
  private async executeAgent(
    session: ActiveClarificationSession,
    agentConfig: ClarificationAgentConfig,
    onStreamMessage?: (message: ClarificationStreamMessage) => void
  ): Promise<ExecuteAgentResult<ClarificationOutcome, ClarificationUsageStats>> {
    // Build the prompt for clarification using template method
    const prompt = this.buildPrompt(session.options);

    debugLoggerService.logSdkEvent(session.sessionId, 'Starting clarification agent', {
      promptLength: prompt.length,
    });

    // Audit log: clarification exploring
    this.auditLogger.logStepExploring(
      session.options.workflowId,
      session.options.stepId,
      agentConfig.id,
      agentConfig.name,
      {
        model: agentConfig.model,
        promptLength: prompt.length,
        sessionId: session.sessionId,
        toolsCount: agentConfig.tools.length,
      }
    );

    // Execute the query using AgentSdkExecutor
    const resultMessage = await this.sdkExecutor.executeQuery(
      session,
      {
        abortController: session.abortController,
        agentConfig,
        outputFormatSchema: clarificationAgentOutputJSONSchema,
        repositoryPath: session.options.repositoryPath,
      },
      prompt,
      {
        onMessageEmit: onStreamMessage,
        onPhaseChange: (phase) => {
          session.phase = phase as ClarificationServicePhase;
          this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
        },
      }
    );

    // Phase: Processing response
    session.phase = 'processing_response';
    this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

    // Handle missing result message (cancelled or null)
    if (!resultMessage) {
      return {
        outcome: {
          reason: 'Clarification was cancelled',
          type: 'CANCELLED',
        },
      };
    }

    debugLoggerService.logSdkEvent(session.sessionId, 'Processing structured output', {
      hasStructuredOutput: resultMessage.subtype === 'success' ? !!resultMessage.structured_output : false,
      resultSubtype: resultMessage.subtype,
    });

    // Log raw agent text for debugging structured output issues
    debugLoggerService.logSdkEvent(session.sessionId, 'Raw agent output for debugging', {
      streamingTextLength: session.streamingText.length,
      streamingTextPreview: session.streamingText.slice(0, 500),
      thinkingBlockCount: session.thinkingBlocks.length,
    });

    // Extract and validate structured output using template method
    const outcome = this.processStructuredOutput(resultMessage, session.sessionId);

    // Update session state based on outcome
    if (outcome.type === 'QUESTIONS_FOR_USER') {
      session.phase = 'waiting_for_user';
      session.questions = outcome.questions;
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
    } else if (outcome.type === 'SKIP_CLARIFICATION') {
      session.phase = 'complete';
      session.skipReason = outcome.reason;
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
    } else {
      session.phase = outcome.type === 'ERROR' ? 'error' : 'complete';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
    }

    debugLoggerService.logSdkEvent(session.sessionId, 'Clarification outcome determined', {
      outcomeType: outcome.type,
      phase: session.phase,
    });

    // Audit log: clarification completed with specific outcome
    if (outcome.type === 'QUESTIONS_FOR_USER') {
      this.auditLogger.logStepCompleted(
        session.options.workflowId,
        session.options.stepId,
        agentConfig.id,
        agentConfig.name,
        `Clarification agent generated ${outcome.questions.length} questions`,
        {
          assessment: outcome.assessment,
          questionCount: outcome.questions.length,
          questions: outcome.questions.map((q) => q.header),
          sessionId: session.sessionId,
        }
      );
    } else if (outcome.type === 'SKIP_CLARIFICATION') {
      this.auditLogger.logStepCompleted(
        session.options.workflowId,
        session.options.stepId,
        agentConfig.id,
        agentConfig.name,
        `Clarification completed: feature request is clear (score: ${outcome.assessment?.score ?? 'N/A'}/5)`,
        {
          assessment: outcome.assessment,
          outcomeType: outcome.type,
          reason: outcome.reason,
          sessionId: session.sessionId,
        },
        { phase: 'complete', skipReason: outcome.reason }
      );
    } else if (outcome.type === 'ERROR') {
      this.auditLogger.logStepError(
        session.options.workflowId,
        session.options.stepId,
        agentConfig.id,
        agentConfig.name,
        outcome.error ?? 'Unknown error',
        {
          error: outcome.error,
          outcomeType: outcome.type,
          sessionId: session.sessionId,
        }
      );
    }

    // Extract usage statistics from successful result
    const usage = extractUsageStats(resultMessage);

    if (usage) {
      debugLoggerService.logSdkEvent(session.sessionId, 'Usage statistics extracted', {
        costUsd: usage.costUsd,
        durationMs: usage.durationMs,
        inputTokens: usage.inputTokens,
        numTurns: usage.numTurns,
        outputTokens: usage.outputTokens,
      });
    }

    return {
      outcome,
      sdkSessionId: resultMessage.session_id,
      usage,
    };
  }


}

// Export singleton instance
export const clarificationStepService = new ClarificationStepService();
