'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AgentStreamAPI,
  AgentStreamClientMessage,
  AgentStreamMessage,
  AgentStreamOptions,
  AgentStreamPortReadyMessage,
  AgentStreamSession,
  AgentStreamState,
  UseAgentStreamReturn,
} from '@/types/agent-stream';

/**
 * Logging prefix for consistent console output.
 */
const LOG_PREFIX = '[useAgentStream]';

/**
 * Initial state for a new streaming session.
 */
const INITIAL_STATE: AgentStreamState = {
  activeTools: [],
  error: null,
  inputRequest: null,
  messages: [],
  result: null,
  sessionId: null,
  status: 'initializing',
  text: '',
  thinking: [],
  toolResults: [],
};

/**
 * Type for messages that can come from the stream.
 * Includes both SDK messages and local port_ready messages.
 */
type StreamMessage = AgentStreamMessage | AgentStreamPortReadyMessage;

/**
 * Hook for managing agent streaming sessions.
 *
 * Provides state management and control functions for bidirectional
 * streaming communication with the Claude Agent SDK via MessagePorts.
 *
 * @returns Stream state and control functions
 *
 * @example
 * ```tsx
 * const { start, cancel, sendResponse, status, text, activeTools } = useAgentStream();
 *
 * // Start a stream
 * await start({ prompt: 'Analyze the code', allowedTools: ['Read', 'Grep'] });
 *
 * // Cancel if needed
 * await cancel();
 *
 * // Respond to input requests
 * if (inputRequest) {
 *   sendResponse({ answer: 'user response' });
 * }
 * ```
 */
export const useAgentStream = (): UseAgentStreamReturn => {
  // State hooks
  const [state, setState] = useState<AgentStreamState>(INITIAL_STATE);
  const [isStarting, setIsStarting] = useState(false);

  // Refs
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Handle incoming stream messages.
   * Maps SDK message types to state updates.
   */
  const handleMessage = useCallback((rawMessage: unknown) => {
    // Validate message structure before processing
    if (!isStreamMessage(rawMessage)) {
      console.warn(`${LOG_PREFIX} Received invalid message structure:`, rawMessage);
      return;
    }

    setState((prev) => {
      // Handle port ready message - only update if we don't have a sessionId yet
      // or if the sessionId matches our expected session (from start() call).
      // This prevents other streams from overwriting our session binding.
      if (rawMessage.type === 'port_ready') {
        // Only bind to this session if we're in initializing state without a session
        // or if we're explicitly waiting for this session
        if (prev.status === 'initializing' && (prev.sessionId === null || prev.sessionId === rawMessage.sessionId)) {
          return {
            ...prev,
            messages: [...prev.messages, rawMessage],
            sessionId: rawMessage.sessionId,
          };
        }
        // Ignore port_ready for sessions we're not tracking
        return prev;
      }

      // Filter to only handle messages for our session
      if (rawMessage.sessionId !== prev.sessionId) {
        return prev;
      }

      // Add to messages array for debugging (only for messages that pass session filter)
      const messages = [...prev.messages, rawMessage];

      // Handle different message types
      switch (rawMessage.type) {
        case 'budget_exceeded':
          // Budget exceeded is a terminal error state
          return {
            ...prev,
            error: `Budget limit exceeded: $${rawMessage.currentSpend?.toFixed(2)} of $${rawMessage.budgetLimit?.toFixed(2)}`,
            messages,
            status: 'error',
          };

        case 'input_request':
          return {
            ...prev,
            inputRequest: {
              inputType: rawMessage.inputType,
              prompt: rawMessage.prompt,
              requestId: rawMessage.requestId,
              toolUseId: rawMessage.toolUseId,
            },
            messages,
            status: 'waiting_input',
          };

        // Handle new SDK message types
        case 'permission_request':
          // Permission requests are handled similarly to input requests
          return {
            ...prev,
            inputRequest: {
              inputType: 'confirmation',
              prompt: `Permission requested for ${rawMessage.toolName}`,
              requestId: rawMessage.toolUseId,
              toolUseId: rawMessage.toolUseId,
            },
            messages,
            status: 'waiting_input',
          };

        case 'result': {
          // Map result subtypes to session status
          let resultStatus: AgentStreamSession['status'];
          switch (rawMessage.subtype) {
            case 'budget_exceeded':
            case 'error':
              resultStatus = 'error';
              break;
            case 'cancelled':
            case 'max_turns':
              resultStatus = 'cancelled';
              break;
            case 'success':
              resultStatus = 'completed';
              break;
            default:
              resultStatus = 'error';
          }
          return {
            ...prev,
            error: rawMessage.error ?? null,
            inputRequest: null,
            messages,
            result: rawMessage.result ?? null,
            status: resultStatus,
          };
        }

        case 'subagent_start':
          // Subagent activity tracked via messages array
          return { ...prev, messages };

        case 'subagent_stop':
          // Subagent completion tracked via messages array
          return { ...prev, messages };

        case 'system':
          if (rawMessage.subtype === 'init') {
            return {
              ...prev,
              messages,
              sessionId: rawMessage.sessionId ?? prev.sessionId,
              status: 'running',
            };
          }
          return { ...prev, messages };

        case 'text':
          // Append text content - the service sends individual text blocks,
          // not accumulated text, so we need to accumulate on the client
          return {
            ...prev,
            messages,
            text: prev.text + rawMessage.text,
          };

        case 'text_delta':
          return {
            ...prev,
            messages,
            text: prev.text + rawMessage.delta,
          };

        case 'thinking':
          // Handle thinking blocks:
          // - isFinal=true: Complete thinking block from assistant message, add as new entry
          // - isFinal=false/undefined: Streaming delta, append to last entry or create new
          if (rawMessage.isFinal) {
            return {
              ...prev,
              messages,
              thinking: [...prev.thinking, rawMessage.content],
            };
          } else {
            // Streaming thinking delta - accumulate into last entry
            if (prev.thinking.length === 0) {
              // First thinking chunk - create new entry
              return {
                ...prev,
                messages,
                thinking: [rawMessage.content],
              };
            }
            // Append to existing last thinking block
            const updatedThinking = [...prev.thinking];
            const lastIndex = updatedThinking.length - 1;
            updatedThinking[lastIndex] = updatedThinking[lastIndex] + rawMessage.content;
            return {
              ...prev,
              messages,
              thinking: updatedThinking,
            };
          }

        case 'tool_result':
          return {
            ...prev,
            activeTools: prev.activeTools.filter((t) => t.toolUseId !== rawMessage.toolUseId),
            messages,
            toolResults: [
              ...prev.toolResults,
              {
                isError: rawMessage.isError,
                output: rawMessage.output,
                toolUseId: rawMessage.toolUseId,
              },
            ],
          };

        case 'tool_use':
          return {
            ...prev,
            activeTools: [
              ...prev.activeTools,
              {
                toolInput: rawMessage.toolInput,
                toolName: rawMessage.toolName,
                toolUseId: rawMessage.toolUseId,
              },
            ],
            messages,
          };

        default:
          return { ...prev, messages };
      }
    });
  }, []);

  /**
   * Subscribe to stream messages on mount
   */
  useEffect(() => {
    const api = getAgentStreamAPI();
    if (!api) {
      console.warn(`${LOG_PREFIX} Agent stream API not available`);
      return;
    }

    // Subscribe to messages
    unsubscribeRef.current = api.onMessage(handleMessage);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [handleMessage]);

  /**
   * Start a new streaming session
   */
  const start = useCallback(async (options: AgentStreamOptions): Promise<string> => {
    const api = getAgentStreamAPI();
    if (!api) {
      throw new Error(`${LOG_PREFIX} Agent stream API not available`);
    }

    setIsStarting(true);
    setState(INITIAL_STATE);

    try {
      const { sessionId } = await api.start(options);

      setState((prev) => ({
        ...prev,
        sessionId,
        status: 'initializing',
      }));

      return sessionId;
    } finally {
      setIsStarting(false);
    }
  }, []);

  /**
   * Cancel the current session
   */
  const cancel = useCallback(async (): Promise<boolean> => {
    const api = getAgentStreamAPI();
    if (!api) {
      throw new Error(`${LOG_PREFIX} Agent stream API not available`);
    }

    if (!state.sessionId) {
      throw new Error(`${LOG_PREFIX} Cannot cancel: no active session`);
    }

    return api.cancel(state.sessionId);
  }, [state.sessionId]);

  /**
   * Send a response to an input request
   */
  const sendResponse = useCallback(
    (data: unknown): void => {
      const api = getAgentStreamAPI();
      if (!api) {
        throw new Error(`${LOG_PREFIX} Agent stream API not available`);
      }

      if (!state.sessionId) {
        throw new Error(`${LOG_PREFIX} Cannot send response: no active session`);
      }

      if (!state.inputRequest) {
        throw new Error(`${LOG_PREFIX} Cannot send response: no pending input request`);
      }

      const message: AgentStreamClientMessage = {
        data,
        requestId: state.inputRequest.requestId,
        type: 'input_response',
      };

      api.sendMessage(state.sessionId, message);

      // Update state to show we're no longer waiting
      setState((prev) => ({
        ...prev,
        inputRequest: null,
        status: 'running',
      }));
    },
    [state.sessionId, state.inputRequest]
  );

  /**
   * Send a result for a tool use request.
   * Use this for responding to tool calls like ask_clarifying_questions
   * that don't create an inputRequest but need user input.
   */
  const sendToolResult = useCallback(
    (toolUseId: string, result: unknown): void => {
      const api = getAgentStreamAPI();
      if (!api) {
        throw new Error(`${LOG_PREFIX} Agent stream API not available`);
      }

      if (!state.sessionId) {
        throw new Error(`${LOG_PREFIX} Cannot send tool result: no active session`);
      }

      const message: AgentStreamClientMessage = {
        data: result,
        requestId: toolUseId,
        type: 'input_response',
      };

      api.sendMessage(state.sessionId, message);

      // Remove the tool from activeTools since we've responded
      setState((prev) => ({
        ...prev,
        activeTools: prev.activeTools.filter((t) => t.toolUseId !== toolUseId),
        status: 'running',
      }));
    },
    [state.sessionId]
  );

  /**
   * Reset the stream state
   */
  const reset = useCallback((): void => {
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    cancel,
    isStarting,
    reset,
    sendResponse,
    sendToolResult,
    start,
  };
};

/**
 * Get the agentStream API from window.electronAPI.
 * Returns undefined if not available (e.g., in browser environment).
 */
const getAgentStreamAPI = (): AgentStreamAPI | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  // Access the electronAPI with proper typing from global declaration
  return window.electronAPI?.agentStream;
};

/**
 * Type guard to check if a value is a valid stream message.
 * Validates that the message has required base properties.
 */
const isStreamMessage = (value: unknown): value is StreamMessage => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const message = value as Record<string, unknown>;

  // Check for required type property
  if (typeof message.type !== 'string') {
    return false;
  }

  // port_ready messages have a simpler structure
  if (message.type === 'port_ready') {
    return typeof message.sessionId === 'string' && typeof message.timestamp === 'number';
  }

  // SDK messages need id, sessionId, and timestamp
  return (
    typeof message.id === 'string' && typeof message.sessionId === 'string' && typeof message.timestamp === 'number'
  );
};
