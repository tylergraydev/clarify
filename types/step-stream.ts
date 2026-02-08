/**
 * Shared Step Stream Message Types
 *
 * Generic base interfaces for workflow step streaming messages.
 * Each step type defines its own stream message union by combining these
 * shared types with any step-specific extensions.
 *
 * Common message types shared across all steps:
 * - Phase change (with step-specific phase enum)
 * - Text delta (incremental text output)
 * - Thinking delta (incremental thinking output)
 * - Thinking start (new thinking block)
 * - Tool start (tool execution began)
 * - Tool stop (tool execution finished)
 * - Tool update (tool input updated)
 * - Extended thinking heartbeat (progress during extended thinking)
 */

/**
 * Heartbeat message during extended thinking execution.
 * Sent periodically to indicate progress when streaming is disabled.
 */
export interface StepStreamExtendedThinkingHeartbeat extends StepStreamMessageBase {
  /** Elapsed time in milliseconds since execution started */
  elapsedMs: number;
  /** Estimated completion percentage (0-100, null if unknown) */
  estimatedProgress: null | number;
  /** Maximum thinking tokens budget */
  maxThinkingTokens: number;
  type: 'extended_thinking_heartbeat';
}

/**
 * Base interface for all step stream messages.
 * All messages include session identification and timing.
 */
export interface StepStreamMessageBase {
  /** The session ID this message belongs to */
  sessionId: string;
  /** Timestamp when the message was generated */
  timestamp: number;
  /** Message type discriminator */
  type: string;
  /** The workflow ID this message belongs to (optional - injected by IPC forwarder for some steps) */
  workflowId?: number;
}

/**
 * Stream message for phase transitions during step execution.
 */
export interface StepStreamPhaseChange<TPhase extends string = string> extends StepStreamMessageBase {
  /** The new phase the service has transitioned to */
  phase: TPhase;
  type: 'phase_change';
}

/**
 * Stream message for text delta (incremental text output).
 */
export interface StepStreamTextDelta extends StepStreamMessageBase {
  /** The incremental text content */
  delta: string;
  type: 'text_delta';
}

/**
 * Stream message for thinking delta (incremental thinking output).
 */
export interface StepStreamThinkingDelta extends StepStreamMessageBase {
  /** Index of the thinking block being updated */
  blockIndex: number;
  /** The incremental thinking content */
  delta: string;
  type: 'thinking_delta';
}

/**
 * Stream message indicating a new thinking block has started.
 */
export interface StepStreamThinkingStart extends StepStreamMessageBase {
  /** Index of the thinking block being started */
  blockIndex: number;
  type: 'thinking_start';
}

/**
 * Stream message indicating a tool has started executing.
 */
export interface StepStreamToolStart extends StepStreamMessageBase {
  /** Input parameters passed to the tool */
  toolInput: Record<string, unknown>;
  /** Name of the tool being executed */
  toolName: string;
  /** Unique identifier for this tool invocation */
  toolUseId: string;
  type: 'tool_start';
}

/**
 * Stream message indicating a tool has finished executing.
 */
export interface StepStreamToolStop extends StepStreamMessageBase {
  /** Unique identifier of the tool invocation that completed */
  toolUseId: string;
  type: 'tool_stop';
}

/**
 * Stream message indicating a tool input payload has been updated.
 */
export interface StepStreamToolUpdate extends StepStreamMessageBase {
  /** Input parameters passed to the tool */
  toolInput: Record<string, unknown>;
  /** Name of the tool being executed */
  toolName: string;
  /** Unique identifier for this tool invocation */
  toolUseId: string;
  type: 'tool_update';
}
