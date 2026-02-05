/**
 * Base Agent Step Service
 *
 * Abstract base class that provides foundational abstraction for all agent step services
 * (clarification, refinement, file discovery). Uses the template method pattern to allow
 * step-specific customization while maintaining consistent session lifecycle, retry tracking,
 * and configuration management patterns.
 *
 * ## Responsibilities
 *
 * - Session lifecycle management (create, track, cleanup)
 * - Retry tracking with exponential backoff
 * - Agent configuration loading from database (4-repository pattern)
 * - Timeout setup and management
 * - Phase change emission
 * - State extraction (template method for step-specific state)
 *
 * ## Generic Type Parameters
 *
 * - `TAgentConfig`: The agent configuration type (e.g., ClarificationAgentConfig)
 * - `TSession`: The active session tracking type (e.g., ActiveClarificationSession)
 * - `TOptions`: The service options type (e.g., ClarificationServiceOptions)
 * - `TPhase`: The service phase enum type (e.g., ClarificationServicePhase)
 * - `TOutcome`: The outcome discriminated union type (e.g., ClarificationOutcome)
 * - `TStreamMessage`: The stream message type (e.g., ClarificationStreamMessage)
 *
 * ## Usage Example
 *
 * ```typescript
 * class ClarificationStepService extends BaseAgentStepService<
 *   ClarificationAgentConfig,
 *   ActiveClarificationSession,
 *   ClarificationServiceOptions,
 *   ClarificationServicePhase,
 *   ClarificationOutcome,
 *   ClarificationStreamMessage
 * > {
 *   protected buildPrompt(options: ClarificationServiceOptions): string {
 *     return `Analyze the following feature request...`;
 *   }
 *
 *   protected processStructuredOutput(result: SDKResultMessage, sessionId: string): ClarificationOutcome {
 *     // Validate and transform structured output to outcome
 *   }
 *
 *   protected createSession(workflowId: number, options: ClarificationServiceOptions): ActiveClarificationSession {
 *     // Initialize session with step-specific state
 *   }
 *
 *   protected extractState(session: ActiveClarificationSession): ClarificationServiceState {
 *     return {
 *       agentConfig: session.agentConfig,
 *       phase: session.phase,
 *       questions: session.questions,
 *       skipReason: session.skipReason,
 *     };
 *   }
 * }
 * ```
 */

import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

import type { BaseAgentConfig } from './agent-sdk-executor';
import type { StepAuditLogger } from './step-audit-logger';

import { getDatabase } from '../../../db';
import {
  createAgentHooksRepository,
  createAgentSkillsRepository,
  createAgentsRepository,
  createAgentToolsRepository,
} from '../../../db/repositories';
import { debugLoggerService } from '../debug-logger.service';
import { MAX_RETRY_ATTEMPTS, STEP_TIMEOUTS, StepName } from './agent-step-constants';
import { calculateBackoffDelay, RetryTracker } from './retry-backoff';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Minimum required fields for any service options.
 */
export interface BaseServiceOptions {
  /** The selected agent to use */
  agentId: number;
  /** The path to the repository being analyzed */
  repositoryPath: string;
  /** The ID of the current workflow step */
  stepId: number;
  /** Optional timeout in seconds for agent operations */
  timeoutSeconds?: number;
  /** The ID of the workflow this operation belongs to */
  workflowId: number;
}

/**
 * Minimum required fields for any active session.
 */
export interface BaseSessionFields {
  /** AbortController for cancellation support */
  abortController: AbortController;
  /** Agent configuration after loading (null before loading) */
  agentConfig: BaseAgentConfig | null;
  /** Service options for this session */
  options: BaseServiceOptions;
  /** Current execution phase */
  phase: string;
  /** Unique session identifier */
  sessionId: string;
  /** Timeout ID for cleanup */
  timeoutId: null | ReturnType<typeof setTimeout>;
}

// =============================================================================
// Base Agent Step Service Class
// =============================================================================

/**
 * Abstract base class for agent step services.
 *
 * Provides common functionality for session management, retry tracking,
 * agent configuration loading, and timeout handling. Concrete services
 * extend this class and implement step-specific template methods.
 */
export abstract class BaseAgentStepService<
  TAgentConfig extends BaseAgentConfig,
  TSession extends BaseSessionFields,
  TOptions extends BaseServiceOptions,
  TPhase extends string,
  TOutcome extends { type: string },
  TStreamMessage extends { sessionId: string; timestamp: number; type: string },
> {
  /**
   * Active sessions tracked by workflow ID.
   * Each workflow can have at most one active session.
   */
  protected activeSessions = new Map<number, TSession>();

  /**
   * Retry tracker for managing exponential backoff across sessions.
   */
  protected retryTracker = new RetryTracker();

  // ===========================================================================
  // Public API Methods
  // ===========================================================================

  /**
   * Get the current retry count for a workflow.
   *
   * @param workflowId - The workflow ID
   * @returns The current retry count (0 if not retried)
   */
  getRetryCount(workflowId: number): number {
    return this.retryTracker.getRetryCount(workflowId.toString());
  }

  /**
   * Get the current state of a session.
   *
   * @param workflowId - The workflow ID to query
   * @returns The current service state, or null if not found
   */
  getState(workflowId: number): null | ReturnType<typeof this.extractState> {
    const session = this.activeSessions.get(workflowId);
    if (!session) return null;

    return this.extractState(session);
  }

  /**
   * Check if retry limit has been reached for a workflow.
   *
   * @param workflowId - The workflow ID
   * @returns Whether the max retry limit has been reached
   */
  isRetryLimitReached(workflowId: number): boolean {
    return this.retryTracker.isRetryLimitReached(workflowId.toString());
  }

  /**
   * Load full agent configuration from database.
   *
   * Queries the agents, tools, skills, and hooks tables to build
   * a complete agent configuration. This method is 100% identical
   * across all agent step services (lines 215-259 from clarification service).
   *
   * @param _workflowId - The workflow ID for logging (unused in base implementation)
   * @param agentId - The agent ID to load
   * @returns The complete agent configuration
   * @throws Error if agent is not found
   */
  loadAgentConfig(_workflowId: number, agentId: number): TAgentConfig {
    const db = getDatabase();
    const agentsRepo = createAgentsRepository(db);
    const toolsRepo = createAgentToolsRepository(db);
    const skillsRepo = createAgentSkillsRepository(db);
    const hooksRepo = createAgentHooksRepository(db);

    const agent = agentsRepo.findById(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    const tools = toolsRepo.findByAgentId(agentId);
    const skills = skillsRepo.findByAgentId(agentId);
    const hooks = hooksRepo.findByAgentId(agentId);

    // TODO: Hooks are loaded for future extensibility but not yet passed to SDK options.
    // To enable hooks, convert to SDK format and add to sdkOptions:
    // sdkOptions.hooks = { PreToolUse: [...], PostToolUse: [...] }
    // See .claude/skills/claude-agent-sdk/references/hook-types.md for HookCallbackMatcher format.

    // Cast to TAgentConfig via unknown since we know the structure matches
    // (all step configs extend BaseAgentConfig with this exact structure)
    return {
      extendedThinkingEnabled: agent.extendedThinkingEnabled ?? false,
      hooks: hooks.map((h) => ({
        body: h.body,
        eventType: h.eventType,
        matcher: h.matcher,
      })),
      id: agent.id,
      maxThinkingTokens: agent.maxThinkingTokens,
      model: agent.model,
      name: agent.name,
      permissionMode: agent.permissionMode,
      skills: skills.map((s) => ({
        isRequired: s.requiredAt !== null,
        skillName: s.skillName,
      })),
      systemPrompt: agent.systemPrompt,
      tools: tools
        .filter((t) => !t.disallowedAt)
        .map((t) => ({
          toolName: t.toolName,
          toolPattern: t.toolPattern ?? '',
        })),
    } as unknown as TAgentConfig;
  }

  // ===========================================================================
  // Protected Helper Methods (Used by Subclasses)
  // ===========================================================================

  /**
   * Build the cancelled outcome specific to this step.
   *
   * Each step has a different cancelled outcome structure:
   * - Clarification: { type: 'CANCELLED', reason: string }
   * - Refinement: { type: 'CANCELLED', reason: string }
   * - File Discovery: { type: 'CANCELLED', partialCount: number, reason?: string }
   *
   * @param session - The active session being cancelled
   * @returns The step-specific cancelled outcome
   */
  protected abstract buildCancelledOutcome(session: TSession): TOutcome;

  /**
   * Build the error outcome when maximum retry attempts are reached.
   *
   * Each step has a specific error format with appropriate messages and flags:
   * - Clarification: Includes skipFallbackAvailable flag
   * - Refinement: Includes skipFallbackAvailable flag
   * - File Discovery: Includes skipFallbackAvailable flag
   *
   * @param workflowId - The workflow ID
   * @returns The step-specific error outcome for max retries
   */
  protected abstract buildMaxRetryErrorOutcome(workflowId: number): TOutcome;

  /**
   * Build the error outcome when no active session is found for cancellation.
   *
   * @param workflowId - The workflow ID that was not found
   * @returns The step-specific error outcome
   */
  protected abstract buildNotFoundErrorOutcome(workflowId: number): TOutcome;

  /**
   * Build the prompt for the agent based on service options.
   *
   * Each step has a unique prompt structure based on its purpose:
   * - Clarification: Analyzes feature request clarity
   * - Refinement: Combines feature request with clarification context
   * - File Discovery: Identifies relevant files for implementation
   *
   * @param options - The service options containing input data
   * @returns The formatted prompt string
   */
  protected abstract buildPrompt(options: TOptions): string;

  // ===========================================================================
  // Abstract Template Methods (Implemented by Subclasses)
  // ===========================================================================

  /**
   * Cancel an active session with standardized cleanup.
   *
   * Template method that handles common cancel logic:
   * 1. Session existence check
   * 2. Debug logging
   * 3. Audit logging
   * 4. Timeout cleanup
   * 5. Abort signal
   * 6. Pre-cancel hook (optional)
   * 7. Phase update
   * 8. Session cleanup
   *
   * @param workflowId - The workflow ID to cancel
   * @param auditLogger - The step audit logger for audit entries
   * @param onStreamMessage - Optional callback for streaming events
   * @returns The step-specific cancelled or error outcome
   */
  protected async cancelSession(
    workflowId: number,
    auditLogger: StepAuditLogger,
    onStreamMessage?: (message: TStreamMessage) => void
  ): Promise<TOutcome> {
    const session = this.activeSessions.get(workflowId);

    if (!session) {
      debugLoggerService.logSdkEvent('unknown', `${this.getStepName()} cancel - no active session`, { workflowId });
      return this.buildNotFoundErrorOutcome(workflowId);
    }

    debugLoggerService.logSession(session.sessionId, 'cancel', {
      stepName: this.getStepName(),
      workflowId,
    });

    // Audit log: step cancelled
    auditLogger.logStepCancelled(workflowId, session.options.stepId, session.agentConfig?.id, session.agentConfig?.name, {
      phase: session.phase,
      reason: 'User cancelled',
      sessionId: session.sessionId,
    });

    // Clear timeout if active
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
    }

    // Abort the SDK operation
    session.abortController.abort();

    // Allow subclass to perform pre-cancel actions
    if (this.onBeforeCancel) {
      await this.onBeforeCancel(session);
    }

    // Update phase to cancelled
    // Type assertion is safe because all step phase unions include 'cancelled'
    const cancelledPhase = 'cancelled' as unknown as TPhase;
    session.phase = cancelledPhase;
    this.emitPhaseChange(session.sessionId, cancelledPhase, onStreamMessage);

    // Build step-specific cancelled outcome
    const outcome = this.buildCancelledOutcome(session);

    // Cleanup
    this.cleanupSession(workflowId);

    return outcome;
  }

  /**
   * Clean up a session after completion or cancellation.
   *
   * Removes the session from the active sessions map and clears
   * the retry count to prevent memory leaks.
   *
   * @param workflowId - The workflow ID
   */
  protected cleanupSession(workflowId: number): void {
    this.activeSessions.delete(workflowId);
    this.retryTracker.clearRetryCount(workflowId.toString());
  }

  /**
   * Create a new session for the given options.
   *
   * Initializes step-specific session state (e.g., questions array for
   * clarification, discovered files array for file discovery).
   *
   * @param workflowId - The workflow ID
   * @param options - The service options
   * @returns The initialized session
   */
  protected abstract createSession(workflowId: number, options: TOptions): TSession;

  /**
   * Emit a phase change message to the stream callback.
   *
   * This method is identical across all agent step services.
   *
   * @param sessionId - The session ID
   * @param phase - The new phase
   * @param onStreamMessage - Optional callback for streaming events
   */
  protected emitPhaseChange(
    sessionId: string,
    phase: TPhase,
    onStreamMessage?: (message: TStreamMessage) => void
  ): void {
    if (onStreamMessage) {
      onStreamMessage({
        phase,
        sessionId,
        timestamp: Date.now(),
        type: 'phase_change',
      } as unknown as TStreamMessage);
    }
  }

  // ===========================================================================
  // Cancel Template Method Abstract Methods
  // ===========================================================================

  /**
   * Extract step-specific state from a session.
   *
   * Returns only the relevant state fields for the step's state type,
   * excluding internal tracking fields like abortController.
   *
   * @param session - The active session
   * @returns The extracted state object
   */
  protected abstract extractState(session: TSession): unknown;

  /**
   * Return the step name for logging (e.g., 'clarification', 'refinement', 'discovery').
   *
   * @returns The step name string
   */
  protected abstract getStepName(): string;

  /**
   * Initialize a new session for a step operation.
   *
   * Common initialization logic:
   * 1. Extract workflowId and timeoutSeconds from options
   * 2. Create session via template method
   * 3. Store in activeSessions
   * 4. Log session start
   * 5. Log step started audit event
   *
   * @param options - The service options
   * @param auditLogger - The step audit logger
   * @param metadata - Optional metadata for logging
   * @returns Object containing session, sessionId, timeoutSeconds, and workflowId
   */
  protected initializeSession(
    options: TOptions,
    auditLogger: StepAuditLogger,
    metadata?: Record<string, unknown>
  ): { session: TSession; sessionId: string; timeoutSeconds: number; workflowId: number } {
    const { timeoutSeconds = STEP_TIMEOUTS[this.getStepName() as StepName] ?? 300, workflowId } = options;

    const session = this.createSession(workflowId, options);
    this.activeSessions.set(workflowId, session);

    debugLoggerService.logSession(session.sessionId, 'start', {
      stepName: this.getStepName(),
      workflowId,
      ...metadata,
    });

    auditLogger.logStepStarted(workflowId, options.stepId, options.agentId, {
      sessionId: session.sessionId,
      ...metadata,
    });

    return {
      session,
      sessionId: session.sessionId,
      timeoutSeconds,
      workflowId,
    };
  }

  // ===========================================================================
  // Cancel Template Method Optional Hooks
  // ===========================================================================

  /**
   * Optional hook for pre-cancel actions (e.g., save partial results).
   * Override in subclass if needed.
   *
   * @param _session - The active session being cancelled
   */
  protected onBeforeCancel?(_session: TSession): Promise<void> | void;

  // ===========================================================================
  // Retry Template Method
  // ===========================================================================

  /**
   * Process structured output from the SDK result message.
   *
   * Validates and transforms the SDK's structured_output field into
   * the step's outcome type. Each step has unique validation logic:
   * - Clarification: Validates SKIP/QUESTIONS discriminated union
   * - Refinement: Validates refinedText field
   * - File Discovery: Validates discoveredFiles array
   *
   * @param result - The SDK result message
   * @param sessionId - The session ID for logging
   * @returns The step-specific outcome
   */
  protected abstract processStructuredOutput(result: SDKResultMessage, sessionId: string): TOutcome;

  // ===========================================================================
  // Process Output Template Method
  // ===========================================================================

  /**
   * Retry an agent step with exponential backoff.
   *
   * Template method implementing common retry logic:
   * 1. Check retry limit
   * 2. Increment retry count
   * 3. Calculate and wait for backoff delay
   * 4. Call step's start method
   *
   * @param workflowId - The workflow ID
   * @param options - Service options for the retry
   * @param startMethod - Bound method to call (e.g., this.startClarification.bind(this))
   * @param auditLogger - The step's audit logger
   * @param onStreamMessage - Optional stream callback
   * @returns The outcome with retry count
   */
  protected async retrySession<TOutcomeWithPause extends TOutcome & { retryCount?: number }>(
    workflowId: number,
    options: TOptions,
    startMethod: (options: TOptions, onStreamMessage?: (message: TStreamMessage) => void) => Promise<TOutcomeWithPause>,
    auditLogger: StepAuditLogger,
    onStreamMessage?: (message: TStreamMessage) => void
  ): Promise<TOutcomeWithPause> {
    const stepName = this.getStepName();

    // Check retry limit
    if (this.isRetryLimitReached(workflowId)) {
      debugLoggerService.logSdkEvent(workflowId.toString(), 'Retry limit reached', {
        maxRetries: MAX_RETRY_ATTEMPTS,
      });

      auditLogger.logRetryLimitReached(workflowId, options.stepId, MAX_RETRY_ATTEMPTS, {
        workflowId,
      });

      // Cast through unknown because TOutcome doesn't include retryCount/skipFallbackAvailable
      // but TOutcomeWithPause does (via intersection with OutcomePauseInfo)
      const errorOutcome = this.buildMaxRetryErrorOutcome(workflowId);
      return {
        ...errorOutcome,
        retryCount: MAX_RETRY_ATTEMPTS,
        skipFallbackAvailable: true,
      } as unknown as TOutcomeWithPause;
    }

    // Increment retry count
    const newRetryCount = this.retryTracker.incrementRetryCount(workflowId.toString());

    // Calculate backoff delay
    const backoffDelay = calculateBackoffDelay(newRetryCount);

    debugLoggerService.logSdkEvent(workflowId.toString(), `Retrying ${stepName} with backoff`, {
      backoffDelayMs: backoffDelay,
      retryCount: newRetryCount,
    });

    auditLogger.logRetryStarted(workflowId, options.stepId, newRetryCount, MAX_RETRY_ATTEMPTS, {
      backoffDelayMs: backoffDelay,
      workflowId,
    });

    // Wait for backoff delay
    await new Promise((resolve) => setTimeout(resolve, backoffDelay));

    // Call the start method
    const outcome = await startMethod(options, onStreamMessage);

    // Add retry count to outcome
    return {
      ...outcome,
      retryCount: newRetryCount,
    };
  }

  /**
   * Set up a timeout for an agent operation.
   *
   * Creates a timeout promise that will abort the operation after
   * the specified duration and invoke the onTimeout callback.
   *
   * This method is 90% identical across all services (slight variations
   * in the timeout outcome structure).
   *
   * @param workflowId - The workflow ID for session lookup
   * @param sessionId - The session ID for logging
   * @param timeoutSeconds - The timeout duration in seconds
   * @param abortController - The AbortController to abort on timeout
   * @param onTimeout - Callback to invoke when timeout occurs
   * @returns Promise that resolves when timeout occurs
   */
  protected setupTimeout<T>(
    workflowId: number,
    sessionId: string,
    timeoutSeconds: number,
    abortController: AbortController,
    onTimeout: (sessionId: string, elapsedSeconds: number) => T
  ): Promise<T> {
    return new Promise<T>((resolve) => {
      const session = this.activeSessions.get(workflowId);
      if (!session) {
        // Session not found, resolve immediately with error
        // Let the caller handle this edge case
        return;
      }

      session.timeoutId = setTimeout(() => {
        if (!abortController.signal.aborted) {
          abortController.abort();
          resolve(onTimeout(sessionId, timeoutSeconds));
        }
      }, timeoutSeconds * 1000);
    });
  }
}
