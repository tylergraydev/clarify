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

import type { AgentActivityRepository } from '../../db/repositories/agent-activity.repository';
import type {
  RefinementAgentConfig,
  RefinementOutcome,
  RefinementServiceOptions,
  RefinementServicePhase,
  RefinementServiceState,
  RefinementStreamMessage,
  RefinementUsageStats,
} from '../../lib/validations/refinement';
import type { StepOutcomeWithPause } from './agent-step';
import type { ActiveToolInfo, ExecuteAgentResult } from './agent-step/step-types';

import { refinementAgentOutputFlatSchema, refinementAgentOutputJSONSchema } from '../../lib/validations/refinement';
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
 * Default timeout for refinement operations in seconds.
 * Longer than clarification (120s) to allow for deeper codebase exploration.
 */
const DEFAULT_TIMEOUT_SECONDS = STEP_TIMEOUTS.refinement;

/**
 * Extended outcome that includes pause information.
 * Uses generic StepOutcomeWithPause to combine refinement outcome with pause/retry fields.
 */
export type RefinementOutcomeWithPause = StepOutcomeWithPause<RefinementOutcome, RefinementUsageStats>;

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
  private activityRepository: AgentActivityRepository | null = null;
  private auditLogger = new StepAuditLogger('refinement');
  private sdkExecutor = new AgentSdkExecutor<RefinementAgentConfig, ActiveRefinementSession, RefinementStreamMessage>();
  private structuredValidator = new StructuredOutputValidator(refinementAgentOutputFlatSchema);

  /**
   * Cancel an active refinement session.
   *
   * Uses the template method from BaseAgentStepService for standardized cleanup.
   *
   * @param workflowId - The workflow ID to cancel
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the cancelled outcome
   */
  async cancelRefinement(
    workflowId: number,
    onStreamMessage?: (message: RefinementStreamMessage) => void
  ): Promise<RefinementOutcome> {
    return this.cancelSession(workflowId, this.auditLogger, onStreamMessage);
  }

  /**
   * Retry a failed refinement with exponential backoff.
   *
   * Automatically increments retry count and applies backoff delay.
   * If retry limit is reached, returns an error.
   *
   * Uses the template method from BaseAgentStepService for standardized retry logic.
   *
   * @param options - The refinement service options
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the refinement outcome
   */
  async retryRefinement(
    options: RefinementServiceOptions,
    onStreamMessage?: (message: RefinementStreamMessage) => void
  ): Promise<RefinementOutcomeWithPause> {
    return this.retrySession(
      options.workflowId,
      options,
      this.startRefinement.bind(this),
      this.auditLogger,
      onStreamMessage
    );
  }

  /**
   * Set the agent activity repository for persisting activity events.
   *
   * Called during handler registration to inject the repository reference.
   *
   * @param repo - The agent activity repository instance
   */
  setAgentActivityRepository(repo: AgentActivityRepository): void {
    this.activityRepository = repo;
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
    // Initialize session using base class helper
    const { session, timeoutSeconds, workflowId } = this.initializeSession(options, this.auditLogger, {
      agentId: options.agentId,
      clarificationQuestionCount: options.clarificationContext.questions.length,
      featureRequestLength: options.featureRequest.length,
      repositoryPath: options.repositoryPath,
      stepId: options.stepId,
      timeoutSeconds: options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS,
    });

    try {
      // Phase: Loading agent
      session.phase = 'loading_agent';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      const agentConfig = this.loadAgentConfig(workflowId, options.agentId);
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
        stepName: 'Refinement',
        workflowId,
      });

      // Clean up session (but keep retry count for potential retry)
      this.activeSessions.delete(workflowId);

      // Return extended outcome with retry information
      return buildErrorOutcomeFromResult(errorResult, true) as RefinementOutcomeWithPause;
    }
  }

  // ===========================================================================
  // Protected Template Method Implementations
  // ===========================================================================

  /**
   * Build cancelled outcome specific to refinement step.
   *
   * @param _session - The active session (unused for refinement)
   * @returns The refinement cancelled outcome
   */
  protected buildCancelledOutcome(_session: ActiveRefinementSession): RefinementOutcome {
    return {
      reason: 'User cancelled refinement',
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
   * @returns The refinement error outcome
   */
  protected buildMaxRetryErrorOutcome(_workflowId: number): RefinementOutcome {
    return {
      error: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Please skip refinement or try again later.`,
      type: 'ERROR',
    };
  }

  /**
   * Build error outcome when no active session found.
   *
   * @param _workflowId - The workflow ID (unused)
   * @returns The refinement error outcome
   */
  protected buildNotFoundErrorOutcome(_workflowId: number): RefinementOutcome {
    return {
      error: 'Session not found',
      type: 'ERROR',
    };
  }

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
   * Return the step name for logging.
   *
   * @returns The step name 'refinement'
   */
  protected getStepName(): string {
    return 'refinement';
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
        activityRepository: this.activityRepository ?? undefined,
        agentConfig,
        outputFormatSchema: refinementAgentOutputJSONSchema,
        repositoryPath: session.options.repositoryPath,
        stepId: session.options.stepId,
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
