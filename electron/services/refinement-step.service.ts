/**
 * Refinement Step Service
 *
 * Orchestrates the refinement step of the workflow pipeline.
 * This service manages the execution of the refinement agent,
 * which takes the original feature request along with clarification
 * context (Q&A pairs) and produces a refined, enhanced feature description.
 *
 * ## Responsibilities
 *
 * - Load agent configuration from database
 * - Execute refinement agent via Claude Agent SDK
 * - Parse agent output for refined feature text
 * - Handle timeout with configurable duration (180s default for deeper exploration)
 * - Manage state transitions through the refinement process
 *
 * ## State Machine
 *
 * idle -> loading_agent -> executing -> processing_response -> complete | error
 *                                                          -> cancelled | timeout
 *
 * Extends BaseAgentStepService to leverage shared abstractions:
 * - AgentSdkExecutor for SDK query execution
 * - StepAuditLogger for consistent audit logging
 * - StructuredOutputValidator for output validation
 * - AgentTimeoutManager for timeout handling
 * - OutcomeBuilder for pause information
 *
 * @see {@link ../../lib/validations/refinement.ts Refinement Types}
 */

import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

import { randomUUID } from 'crypto';

import type {
  RefinementAgentConfig,
  RefinementOutcome,
  RefinementServiceOptions,
  RefinementServicePhase,
  RefinementServiceState,
  RefinementStreamMessage,
  RefinementUsageStats,
} from '../../lib/validations/refinement';
import type { ActiveToolInfo, ExecuteAgentResult, OutcomePauseInfo } from './agent-step/step-types';

import { refinementAgentOutputFlatSchema, refinementAgentOutputJSONSchema } from '../../lib/validations/refinement';
import { AgentSdkExecutor } from './agent-step/agent-sdk-executor';
import { MAX_RETRY_ATTEMPTS, STEP_TIMEOUTS } from './agent-step/agent-step-constants';
import { createTimeoutPromise } from './agent-step/agent-timeout-manager';
import { BaseAgentStepService } from './agent-step/base-agent-step-service';
import { buildErrorOutcomeWithRetry, buildOutcomeWithPauseInfo } from './agent-step/outcome-builder';
import { calculateBackoffDelay, isTransientError } from './agent-step/retry-backoff';
import { StepAuditLogger } from './agent-step/step-audit-logger';
import { StructuredOutputValidator } from './agent-step/structured-output-validator';
import { extractUsageStats } from './agent-step/usage-stats';
import { debugLoggerService } from './debug-logger.service';

/**
 * Default timeout for refinement operations in seconds.
 * Longer than clarification (120s) to allow for deeper codebase exploration.
 */
const DEFAULT_TIMEOUT_SECONDS = STEP_TIMEOUTS.refinement;

/**
 * Extended outcome fields for pause and retry information.
 * Uses shared OutcomePauseInfo type with refinement-specific usage stats.
 */
export type RefinementOutcomePauseInfo = OutcomePauseInfo<RefinementUsageStats>;

/**
 * Extended outcome that includes pause information.
 */
export type RefinementOutcomeWithPause = RefinementOutcome & RefinementOutcomePauseInfo;

/**
 * Active refinement session tracking.
 */
interface ActiveRefinementSession {
  abortController: AbortController;
  activeTools: Array<ActiveToolInfo>;
  agentConfig: null | RefinementAgentConfig;
  options: RefinementServiceOptions;
  phase: RefinementServicePhase;
  refinedText: null | string;
  sessionId: string;
  streamingText: string;
  thinkingBlocks: Array<string>;
  timeoutId: null | ReturnType<typeof setTimeout>;
}

/**
 * Refinement Step Service
 *
 * Manages the refinement step of workflow pipelines.
 * Loads agent configuration from the database and executes
 * the refinement agent to produce an enhanced feature description
 * by combining the original request with clarification context.
 *
 * Extends BaseAgentStepService to leverage shared abstractions:
 * - AgentSdkExecutor for SDK query execution
 * - StepAuditLogger for consistent audit logging
 * - StructuredOutputValidator for output validation
 * - AgentTimeoutManager for timeout handling
 * - OutcomeBuilder for pause information
 */
class RefinementStepService extends BaseAgentStepService<
  RefinementAgentConfig,
  ActiveRefinementSession,
  RefinementServiceOptions,
  RefinementServicePhase,
  RefinementOutcome,
  RefinementStreamMessage
> {
  private auditLogger = new StepAuditLogger('refinement');
  private sdkExecutor = new AgentSdkExecutor<
    RefinementAgentConfig,
    ActiveRefinementSession,
    RefinementStreamMessage
  >();
  private structuredValidator = new StructuredOutputValidator(refinementAgentOutputFlatSchema);

  /**
   * Cancel an active refinement session.
   *
   * @param workflowId - The workflow ID to cancel
   * @returns The cancelled outcome
   */
  cancelRefinement(workflowId: number): RefinementOutcome {
    const session = this.activeSessions.get(workflowId);
    if (!session) {
      return {
        error: 'Session not found',
        type: 'ERROR',
      };
    }

    debugLoggerService.logSession(session.sessionId, 'cancel', {
      phase: session.phase,
      reason: 'User cancelled',
    });

    // Audit log: refinement cancelled
    this.auditLogger.logStepCancelled(
      workflowId,
      session.options.stepId,
      session.agentConfig?.id,
      session.agentConfig?.name,
      {
        phase: session.phase,
        reason: 'User cancelled',
        sessionId: session.sessionId,
      }
    );

    // Clear timeout if active
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
    }

    // Abort the SDK operation
    session.abortController.abort();
    session.phase = 'cancelled';

    // Clean up
    this.cleanupSession(workflowId);

    return {
      reason: 'User cancelled refinement',
      type: 'CANCELLED',
    };
  }

  /**
   * Retry a failed refinement with exponential backoff.
   *
   * Automatically increments retry count and applies backoff delay.
   * If retry limit is reached, returns an error.
   *
   * @param options - The refinement service options
   * @returns Promise resolving to the refinement outcome
   */
  async retryRefinement(options: RefinementServiceOptions): Promise<RefinementOutcomeWithPause> {
    const workflowId = options.workflowId;

    // Check if retry limit reached
    if (this.isRetryLimitReached(workflowId)) {
      debugLoggerService.logSdkEvent(workflowId.toString(), 'Retry limit reached', {
        maxRetries: MAX_RETRY_ATTEMPTS,
      });

      // Audit log: retry limit reached
      this.auditLogger.logRetryLimitReached(workflowId, options.stepId, MAX_RETRY_ATTEMPTS, {
        workflowId,
      });

      return {
        error: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Please skip refinement or try again later.`,
        retryCount: MAX_RETRY_ATTEMPTS,
        skipFallbackAvailable: true,
        type: 'ERROR',
      };
    }

    // Increment retry count
    const newRetryCount = this.retryTracker.incrementRetryCount(workflowId.toString());

    // Calculate and apply backoff delay
    const backoffDelay = calculateBackoffDelay(newRetryCount);

    debugLoggerService.logSdkEvent(workflowId.toString(), 'Retrying refinement with backoff', {
      backoffDelayMs: backoffDelay,
      retryCount: newRetryCount,
    });

    // Audit log: retrying refinement
    this.auditLogger.logRetryStarted(workflowId, options.stepId, newRetryCount, MAX_RETRY_ATTEMPTS, {
      backoffDelayMs: backoffDelay,
      workflowId,
    });

    // Wait for backoff delay
    await new Promise((resolve) => setTimeout(resolve, backoffDelay));

    // Start new refinement session
    const outcome = await this.startRefinement(options);

    // Update the outcome with the correct retry count
    return {
      ...outcome,
      retryCount: newRetryCount,
    };
  }

  /**
   * Start the refinement process.
   *
   * Initializes a new refinement session:
   * 1. Loads agent configuration from database
   * 2. Creates an agent stream session with the agent's system prompt
   * 3. Configures tools based on agent's allowed tools
   * 4. Sets up timeout handling with AbortController
   *
   * @param options - The refinement service options
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the refinement outcome with pause information
   */
  async startRefinement(
    options: RefinementServiceOptions,
    onStreamMessage?: (message: RefinementStreamMessage) => void
  ): Promise<RefinementOutcomeWithPause> {
    const workflowId = options.workflowId;
    const timeoutSeconds = options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;

    // Initialize session using createSession template method
    const session = this.createSession(workflowId, options);
    this.activeSessions.set(workflowId, session);

    debugLoggerService.logSession(session.sessionId, 'start', {
      agentId: options.agentId,
      clarificationQuestionCount: options.clarificationContext.questions.length,
      repositoryPath: options.repositoryPath,
      stepId: options.stepId,
      timeoutSeconds,
      workflowId,
    });

    // Audit log: refinement started
    this.auditLogger.logStepStarted(workflowId, options.stepId, options.agentId, {
      clarificationQuestionCount: options.clarificationContext.questions.length,
      featureRequestLength: options.featureRequest.length,
      repositoryPath: options.repositoryPath,
      sessionId: session.sessionId,
      timeoutSeconds,
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
        ExecuteAgentResult<RefinementOutcome, RefinementUsageStats>
      >({
        abortController: session.abortController,
        onTimeout: () => {
          session.phase = 'timeout';
          this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

          debugLoggerService.logSdkEvent(session.sessionId, 'Refinement timed out', {
            elapsedSeconds: timeoutSeconds,
          });

          // Audit log: refinement timeout
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
              error: `Refinement timed out after ${timeoutSeconds} seconds`,
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
        false, // refinement is not a gate step
        result,
        true // skipFallbackAvailable
      );

      debugLoggerService.logSdkEvent(session.sessionId, 'Refinement completed with pause info', {
        hasSdkSessionId: !!result.sdkSessionId,
        hasUsage: !!result.usage,
        outcomeType: result.outcome.type,
        pauseRequested: outcomeWithPause.pauseRequested,
      });

      return outcomeWithPause;
    } catch (error) {
      session.phase = 'error';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const retryCount = this.getRetryCount(workflowId);
      const isRetryable = isTransientError(errorMessage);
      const retryLimitReached = this.isRetryLimitReached(workflowId);

      debugLoggerService.logSdkEvent(session.sessionId, 'Refinement error', {
        error: errorMessage,
        isRetryable,
        retryCount,
        retryLimitReached,
      });

      // Audit log: refinement error
      this.auditLogger.logStepError(
        workflowId,
        options.stepId,
        session.agentConfig?.id,
        session.agentConfig?.name,
        errorMessage,
        {
          error: errorMessage,
          isRetryable,
          retryCount,
          retryLimitReached,
          sessionId: session.sessionId,
          stack: errorStack,
        }
      );

      // Clean up session (but keep retry count for potential retry)
      this.activeSessions.delete(workflowId);

      // Return extended outcome with retry information using OutcomeBuilder
      return buildErrorOutcomeWithRetry(errorMessage, retryCount, true, errorStack) as RefinementOutcomeWithPause;
    }
  }

  // ===========================================================================
  // Protected Template Method Implementations
  // ===========================================================================

  /**
   * Build the refinement prompt for the agent.
   *
   * Combines the original feature request with the clarification context
   * (questions and answers) to create a comprehensive prompt for producing
   * a refined feature description.
   *
   * @param options - The refinement service options
   * @returns The formatted prompt
   */
  protected buildPrompt(options: RefinementServiceOptions): string {
    const { clarificationContext, featureRequest } = options;

    // Format the clarification Q&A pairs
    const clarificationPairs = clarificationContext.questions
      .map((question, index) => {
        const answer = clarificationContext.answers[index.toString()];
        if (!answer) return null;

        let answerText: string;
        if (answer.type === 'text') {
          answerText = answer.text;
        } else if (answer.type === 'radio') {
          answerText = answer.selected || answer.other || 'No response';
          if (answer.other && answer.selected) {
            answerText = `${answer.selected} (Additional: ${answer.other})`;
          }
        } else if (answer.type === 'checkbox') {
          const selections = answer.selected.join(', ');
          answerText = answer.other ? `${selections} (Additional: ${answer.other})` : selections;
        } else {
          answerText = 'No response';
        }

        return `**${question.header}**\nQ: ${question.question}\nA: ${answerText}`;
      })
      .filter(Boolean)
      .join('\n\n');

    // Include assessment context if available
    const assessmentContext = clarificationContext.assessment
      ? `\n\n## Initial Assessment\n\nClarity Score: ${clarificationContext.assessment.score}/5\nReason: ${clarificationContext.assessment.reason}`
      : '';

    return `You are refining a feature request based on user-provided clarifications.

## Original Feature Request

${featureRequest}
${assessmentContext}

## Clarification Context

The following questions were asked to clarify the feature request, along with the user's answers:

${clarificationPairs}

## Your Task

Based on the original feature request and the clarification answers above, produce a **refined feature request** that:

1. **Incorporates all clarifications**: Weave the user's answers naturally into the description
2. **Resolves ambiguities**: Replace vague statements with specific requirements from the answers
3. **Maintains coherence**: Write as a single, well-structured feature description (not a list of Q&A)
4. **Preserves intent**: Keep the user's original vision while adding necessary detail
5. **Is implementation-ready**: Include enough detail for the next planning step

The refined text should be a prose narrative that reads as if the user had provided this complete description from the start. Do not include section headers like "Clarifications" - integrate everything seamlessly.

**Important**: Output only the refined feature request text. The system will extract your response automatically.`;
  }

  /**
   * Create a new session for the given options.
   *
   * Initializes refinement-specific session state (refinedText field).
   *
   * @param _workflowId - The workflow ID (unused in this implementation)
   * @param options - The service options
   * @returns The initialized session
   */
  protected createSession(_workflowId: number, options: RefinementServiceOptions): ActiveRefinementSession {
    return {
      abortController: new AbortController(),
      activeTools: [],
      agentConfig: null,
      options,
      phase: 'idle',
      refinedText: null,
      sessionId: randomUUID(),
      streamingText: '',
      thinkingBlocks: [],
      timeoutId: null,
    };
  }

  /**
   * Extract step-specific state from a session.
   *
   * Returns only the relevant state fields for the refinement state type,
   * excluding internal tracking fields like abortController.
   *
   * @param session - The active session
   * @returns The extracted state object
   */
  protected extractState(session: ActiveRefinementSession): RefinementServiceState {
    return {
      agentConfig: session.agentConfig,
      phase: session.phase,
      refinedText: session.refinedText,
    };
  }

  /**
   * Process structured output from the SDK result message.
   *
   * For refinement, the output is a simple object with a refinedText field.
   * This method validates the output and transforms it to the proper outcome type.
   *
   * @param result - The SDK result message
   * @param sessionId - The session ID for logging
   * @returns The refinement outcome
   */
  protected processStructuredOutput(result: SDKResultMessage, sessionId: string): RefinementOutcome {
    // Use StructuredOutputValidator to validate with the flat schema
    const validationResult = this.structuredValidator.validate(result, sessionId);

    if (!validationResult.success) {
      return {
        error: validationResult.error,
        type: 'ERROR',
      };
    }

    const output = validationResult.data;

    // Validate that refinedText is present and non-empty
    const refinedTextCheck = this.structuredValidator.validateField(output, 'refinedText', sessionId);
    if (!refinedTextCheck.success) {
      return {
        error: 'Agent output missing required "refinedText" field or field is empty',
        type: 'ERROR',
      };
    }

    // Return the success outcome
    return {
      refinedText: output.refinedText!,
      type: 'SUCCESS',
    };
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Execute the refinement agent and collect output.
   *
   * @param session - The active session
   * @param agentConfig - The loaded agent configuration
   * @param onStreamMessage - Optional callback for streaming events
   * @returns The refinement outcome with usage metadata
   */
  private async executeAgent(
    session: ActiveRefinementSession,
    agentConfig: RefinementAgentConfig,
    onStreamMessage?: (message: RefinementStreamMessage) => void
  ): Promise<ExecuteAgentResult<RefinementOutcome, RefinementUsageStats>> {
    // Build the prompt for refinement using template method
    const prompt = this.buildPrompt(session.options);

    debugLoggerService.logSdkEvent(session.sessionId, 'Starting refinement agent', {
      allowedToolsCount: agentConfig.tools.length,
      clarificationQuestionCount: session.options.clarificationContext.questions.length,
      model: agentConfig.model,
      promptLength: prompt.length,
    });

    // Audit log: refinement exploring
    this.auditLogger.logStepExploring(
      session.options.workflowId,
      session.options.stepId,
      agentConfig.id,
      agentConfig.name,
      {
        clarificationQuestionCount: session.options.clarificationContext.questions.length,
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
        outputFormatSchema: refinementAgentOutputJSONSchema,
        repositoryPath: session.options.repositoryPath,
      },
      prompt,
      {
        onMessageEmit: onStreamMessage,
        onPhaseChange: (phase) => {
          session.phase = phase as RefinementServicePhase;
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
          reason: 'Refinement was cancelled',
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
    if (outcome.type === 'SUCCESS') {
      session.phase = 'complete';
      session.refinedText = outcome.refinedText;
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
    } else {
      session.phase = outcome.type === 'ERROR' ? 'error' : 'complete';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
    }

    debugLoggerService.logSdkEvent(session.sessionId, 'Refinement outcome determined', {
      outcomeType: outcome.type,
      phase: session.phase,
      refinedTextLength: outcome.type === 'SUCCESS' ? outcome.refinedText.length : 0,
    });

    // Audit log: refinement completed with specific outcome
    if (outcome.type === 'SUCCESS') {
      this.auditLogger.logStepCompleted(
        session.options.workflowId,
        session.options.stepId,
        agentConfig.id,
        agentConfig.name,
        'Refinement completed successfully',
        {
          outcomeType: outcome.type,
          refinedTextLength: outcome.refinedText.length,
          refinedTextPreview: outcome.refinedText.slice(0, 200),
          sessionId: session.sessionId,
        },
        { phase: 'complete', refinedTextLength: outcome.refinedText.length }
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
export const refinementStepService = new RefinementStepService();
