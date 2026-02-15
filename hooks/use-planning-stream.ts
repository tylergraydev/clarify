'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PlanningServicePhase, PlanningStreamMessage } from '@/types/electron';
import type { StreamToolEvent } from '@/types/workflow-stream';

import { useElectronDb } from '@/hooks/use-electron';

// =============================================================================
// Types
// =============================================================================

/**
 * Accumulated state from planning stream messages.
 */
export interface PlanningStreamState {
  /** Current phase of the planning service */
  currentPhase: null | PlanningServicePhase;
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

/**
 * Return type for the usePlanningStream hook.
 */
export interface UsePlanningStreamReturn extends PlanningStreamState {
  /** Reset all accumulated state to initial values */
  reset: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const INITIAL_STATE: PlanningStreamState = {
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
const TERMINAL_PHASES = new Set<PlanningServicePhase>([
  'awaiting_review',
  'cancelled',
  'complete',
  'error',
  'timeout',
]);

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook that subscribes to planning stream messages and accumulates
 * them into structured state.
 *
 * Follows the same pattern as useClarificationStream but for the
 * planning service's streaming output.
 */
export function usePlanningStream({
  enabled,
  workflowId,
}: {
  enabled: boolean;
  workflowId: number;
}): UsePlanningStreamReturn {
  const [state, setState] = useState<PlanningStreamState>(INITIAL_STATE);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<null | string>(null);
  const [trackedWorkflowId, setTrackedWorkflowId] = useState(workflowId);

  const { planning } = useElectronDb();

  // Reset accumulated state when workflowId changes to prevent cross-workflow leakage.
  if (trackedWorkflowId !== workflowId) {
    setState(INITIAL_STATE);
    setTrackedWorkflowId(workflowId);
  }

  // Reset the session ID ref when workflowId changes.
  useEffect(() => {
    sessionIdRef.current = null;
  }, [workflowId]);

  const handleMessage = useCallback(
    (message: PlanningStreamMessage) => {
      if (message.workflowId !== workflowId) {
        return;
      }

      if (sessionIdRef.current === null) {
        sessionIdRef.current = message.sessionId;
      }

      if (message.sessionId !== sessionIdRef.current) {
        return;
      }

      setState((prev) => {
        const sessionStartedAt = prev.sessionStartedAt ?? message.timestamp;

        switch (message.type) {
          case 'extended_thinking_heartbeat':
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

  useEffect(() => {
    if (!enabled) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    unsubscribeRef.current = planning.onStreamMessage(handleMessage);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, handleMessage, planning]);

  const reset = useCallback(() => {
    sessionIdRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    reset,
  };
}
