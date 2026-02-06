/**
 * Agent Step Shared Types
 *
 * Common type definitions used across all agent step services.
 * These types provide a consistent interface for session management,
 * tool tracking, and outcome handling.
 */

/**
 * Active tool being used by the agent during execution.
 */
export interface ActiveToolInfo {
  /** Input parameters passed to the tool */
  toolInput: Record<string, unknown>;
  /** Name of the tool being executed */
  toolName: string;
  /** Unique identifier for this tool use instance */
  toolUseId: string;
}

/**
 * Base structure for active agent sessions.
 *
 * Provides common fields that all step-specific sessions extend.
 * Each step service defines its own session interface with additional
 * step-specific fields.
 *
 * @template TAgentConfig - Step-specific agent configuration type
 * @template TServiceOptions - Step-specific service options type
 * @template TServicePhase - Step-specific phase enum type
 */
export interface BaseActiveSession<TAgentConfig, TServiceOptions, TServicePhase> {
  /** AbortController for cancellation support */
  abortController: AbortController;
  /** Tools currently being executed by the agent */
  activeTools: Array<ActiveToolInfo>;
  /** Agent configuration loaded from database */
  agentConfig: null | TAgentConfig;
  /** Service options passed at session start */
  options: TServiceOptions;
  /** Current execution phase */
  phase: TServicePhase;
  /** Unique identifier for this session */
  sessionId: string;
  /** Accumulated streaming text from the agent */
  streamingText: string;
  /** Extended thinking blocks captured during execution */
  thinkingBlocks: Array<string>;
  /** Timeout handle for timeout enforcement */
  timeoutId: null | ReturnType<typeof setTimeout>;
}

/**
 * Internal result from agent execution including usage metadata.
 *
 * @template TOutcome - Step-specific outcome type
 * @template TUsage - Step-specific usage statistics type
 */
export interface ExecuteAgentResult<TOutcome, TUsage = unknown> {
  /** The execution outcome (success, error, etc.) */
  outcome: TOutcome;
  /** SDK session ID for tracking/resumption */
  sdkSessionId?: string;
  /** Usage statistics from the SDK */
  usage?: TUsage;
}

/**
 * Extended outcome fields for pause and retry information.
 *
 * These fields are added to step-specific outcomes to track
 * session state across retries and pause points.
 *
 * @template TUsage - Step-specific usage statistics type
 */
export interface OutcomePauseInfo<TUsage = unknown> {
  /** Whether the workflow should pause after this step */
  pauseRequested?: boolean;
  /** Current retry count for this session */
  retryCount?: number;
  /** SDK session ID for potential resumption */
  sdkSessionId?: string;
  /** Whether skip fallback is available (clarification/refinement only) */
  skipFallbackAvailable?: boolean;
  /** Usage statistics from SDK result */
  usage?: TUsage;
}

/**
 * Pause behaviors supported by workflows.
 *
 * - continuous: Run without pausing until completion
 * - auto_pause: Pause after every step
 */
export type PauseBehavior = 'auto_pause' | 'continuous';

/**
 * Snapshot of current session state for external monitoring.
 *
 * @template TServicePhase - Step-specific phase enum type
 */
export interface SessionState<TServicePhase> {
  /** Tools currently being executed */
  activeTools: Array<ActiveToolInfo>;
  /** Current execution phase */
  phase: TServicePhase;
  /** Accumulated streaming text */
  streamingText: string;
  /** Extended thinking blocks */
  thinkingBlocks: Array<string>;
}

/**
 * Type alias for step-specific outcome pause info.
 * Convenience re-export for services.
 *
 * @template TUsage - Step-specific usage statistics type
 */
export type StepOutcomePauseInfo<TUsage = unknown> = OutcomePauseInfo<TUsage>;

/**
 * Type alias for outcomes combined with pause information.
 * Used by all step services to create their OutcomeWithPause types.
 *
 * @template TOutcome - Step-specific outcome type
 * @template TUsage - Step-specific usage statistics type
 */
export type StepOutcomeWithPause<TOutcome, TUsage = unknown> = OutcomePauseInfo<TUsage> & TOutcome;
