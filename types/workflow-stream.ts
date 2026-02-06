/**
 * Shared streaming types used by all workflow step stream hooks and UI components.
 * Step-agnostic so clarification, refinement, file discovery, and planning
 * all use the same shapes.
 */

/** Common stream content state shared by all step stream hooks. */
export interface StreamContentState {
  /** Current phase label (resolved by the step's hook, not a phase enum) */
  currentPhase: null | string;
  /** Whether the stream is actively receiving messages */
  isStreaming: boolean;
  /** Timestamp (ms) when the session ended, null if still active */
  sessionEndedAt: null | number;
  /** Timestamp (ms) when the first message was received, null if not started */
  sessionStartedAt: null | number;
  /** Accumulated text content from text_delta messages */
  textContent: string;
  /** Accumulated thinking content from thinking_delta messages */
  thinkingContent: string;
  /** Paired tool events from tool_start/tool_stop messages */
  toolEvents: Array<StreamToolEvent>;
}

/** A paired tool event with start/stop timing. Used by all step stream hooks. */
export interface StreamToolEvent {
  /** Input parameters passed to the tool */
  input: Record<string, unknown>;
  /** Timestamp (ms) when the tool started */
  startedAt: number;
  /** Timestamp (ms) when the tool stopped, null if still running */
  stoppedAt: null | number;
  /** Name of the tool invoked */
  toolName: string;
  /** Unique identifier for this tool use */
  toolUseId: string;
}
