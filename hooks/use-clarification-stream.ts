'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ClarificationServicePhase, ClarificationStreamMessage } from '@/types/electron';
import type { StreamToolEvent } from '@/types/workflow-stream';

import { useElectronDb } from '@/hooks/use-electron';

// =============================================================================
// Types
// =============================================================================

/**
 * Accumulated state from clarification stream messages.
 */
export interface ClarificationStreamState {
  /** Current phase of the clarification service */
  currentPhase: ClarificationServicePhase | null;
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

/** @deprecated Use `StreamToolEvent` from `@/types/workflow-stream` instead. */
export type ClarificationToolEvent = StreamToolEvent;

/**
 * Return type for the useClarificationStream hook.
 */
export interface UseClarificationStreamReturn extends ClarificationStreamState {
  /** Reset all accumulated state to initial values */
  reset: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const INITIAL_STATE: ClarificationStreamState = {
  currentPhase: null,
  isStreaming: false,
  sessionEndedAt: null,
  sessionStartedAt: null,
  textContent: '',
  thinkingContent: '',
  toolEvents: [],
};

/**
 * Terminal phases that indicate streaming has ended.
 */
const TERMINAL_PHASES = new Set<ClarificationServicePhase>([
  'cancelled',
  'complete',
  'error',
  'timeout',
  'waiting_for_user',
]);

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook that subscribes to clarification stream messages and accumulates
 * them into structured state.
 *
 * Handles text deltas, phase changes, tool events, and thinking content
 * from the clarification service's streaming output.
 *
 * Messages are filtered by sessionId to ensure only messages belonging
 * to the current session are accumulated. The first received sessionId
 * is captured and subsequent messages with different sessionIds are ignored.
 *
 * @param enabled - Whether to actively subscribe to stream messages.
 *   When false, no subscription is created and no messages are received.
 * @param workflowId - The workflow ID to scope this stream to.
 *   Accepted for future use when messages include workflowId.
 *
 * @returns Accumulated stream state and a reset function.
 *
 * @example
 * ```tsx
 * const { textContent, currentPhase, toolEvents, isStreaming, reset } =
 *   useClarificationStream({ enabled: isRunning, workflowId: 42 });
 *
 * // Reset when starting a new run
 * useEffect(() => {
 *   if (isRetrying) reset();
 * }, [isRetrying, reset]);
 * ```
 */
export function useClarificationStream({
  enabled,
  workflowId,
}: {
  enabled: boolean;
  workflowId: number;
}): UseClarificationStreamReturn {
  const [state, setState] = useState<ClarificationStreamState>(INITIAL_STATE);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<null | string>(null);
  const [trackedWorkflowId, setTrackedWorkflowId] = useState(workflowId);

  const { clarification } = useElectronDb();

  // Reset accumulated state when workflowId changes to prevent cross-workflow leakage.
  // Uses the render-time reset pattern for state, and an effect for the ref.
  if (trackedWorkflowId !== workflowId) {
    setState(INITIAL_STATE);
    setTrackedWorkflowId(workflowId);
  }

  // Reset the session ID ref when workflowId changes so the hook binds to
  // the correct session for the new workflow.
  useEffect(() => {
    sessionIdRef.current = null;
  }, [workflowId]);

  /**
   * Handle an incoming clarification stream message.
   * Filters by sessionId to ensure only messages from the current session
   * are accumulated. The first message's sessionId is captured as the
   * active session; messages with a different sessionId are ignored.
   */
  const handleMessage = useCallback(
    (message: ClarificationStreamMessage) => {
      // Only process messages for this workflow.
      // The IPC stream channel is global — all messages broadcast to all subscribers.
      // Without this guard, a hook mounted for Workflow B could bind to messages
      // from Workflow A if it receives one before messages from its own workflow.
      if (message.workflowId !== workflowId) {
        return;
      }

      // Bind to the first message's sessionId regardless of message type.
      // This ensures late subscribers (e.g., page refresh mid-run) can attach
      // to an in-flight session even if the initial phase_change already fired.
      // The sessionIdRef is reset on workflowId change via useEffect, so
      // cross-workflow contamination is prevented by the reset cycle.
      if (sessionIdRef.current === null) {
        sessionIdRef.current = message.sessionId;
      }

      // Filter out messages from other sessions
      if (message.sessionId !== sessionIdRef.current) {
        return;
      }

      setState((prev) => {
        // Capture sessionStartedAt from the first message's timestamp
        const sessionStartedAt = prev.sessionStartedAt ?? message.timestamp;

        switch (message.type) {
          case 'extended_thinking_heartbeat':
            // Heartbeats indicate activity but don't carry content
            return { ...prev, isStreaming: true, sessionStartedAt };

          case 'phase_change': {
            const isTerminal = TERMINAL_PHASES.has(message.phase);
            return {
              ...prev,
              currentPhase: message.phase,
              isStreaming: !isTerminal,
              sessionEndedAt: isTerminal ? message.timestamp : prev.sessionEndedAt,
              sessionStartedAt,
            };
          }

          case 'text_delta':
            return {
              ...prev,
              isStreaming: true,
              sessionStartedAt,
              textContent: prev.textContent + message.delta,
            };

          case 'thinking_delta':
            return {
              ...prev,
              isStreaming: true,
              sessionStartedAt,
              thinkingContent: prev.thinkingContent + message.delta,
            };

          case 'thinking_start':
            // A new thinking block started; no content to accumulate yet
            return { ...prev, isStreaming: true, sessionStartedAt };

          case 'tool_start':
            return {
              ...prev,
              isStreaming: true,
              sessionStartedAt,
              toolEvents: [
                ...prev.toolEvents,
                {
                  input: message.toolInput,
                  startedAt: message.timestamp,
                  stoppedAt: null,
                  toolName: message.toolName,
                  toolUseId: message.toolUseId,
                },
              ],
            };

          case 'tool_stop':
            return {
              ...prev,
              isStreaming: true,
              sessionStartedAt,
              toolEvents: prev.toolEvents.map((event) =>
                event.toolUseId === message.toolUseId ? { ...event, stoppedAt: message.timestamp } : event
              ),
            };

          case 'tool_update':
            // Update the tool input for an in-progress tool
            return {
              ...prev,
              isStreaming: true,
              sessionStartedAt,
              toolEvents: prev.toolEvents.map((event) =>
                event.toolUseId === message.toolUseId ? { ...event, input: message.toolInput } : event
              ),
            };

          default:
            return prev;
        }
      });
    },
    [workflowId]
  );

  /**
   * Subscribe to or unsubscribe from stream messages based on the
   * `enabled` flag. Cleans up on unmount or when disabled.
   */
  useEffect(() => {
    if (!enabled) {
      // Unsubscribe if currently subscribed
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    unsubscribeRef.current = clarification.onStreamMessage(handleMessage);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, handleMessage, clarification]);

  /**
   * Reset all accumulated state to initial values.
   * Used when re-running or starting a new clarification session.
   */
  const reset = useCallback(() => {
    sessionIdRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    reset,
  };
}
