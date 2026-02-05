'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  FileDiscoveryOutcome,
  FileDiscoveryServicePhase,
  FileDiscoveryStreamMessage,
} from '@/types/electron';

import { getDiscoveryAPI } from './use-discovered-file-queries';

/**
 * State for the discovery stream hook.
 */
export interface DiscoveryStreamState {
  /** Current discovery outcome (set on completion) */
  outcome: FileDiscoveryOutcome | null;
  /** Current phase of the discovery service */
  phase: FileDiscoveryServicePhase;
  /** Session ID if a discovery session is active */
  sessionId: null | string;
}

/**
 * Return type for the useDiscoveryStream hook.
 */
export interface UseDiscoveryStreamReturn extends DiscoveryStreamState {
  /** All stream messages received during the session */
  messages: Array<FileDiscoveryStreamMessage>;
  /** Subscribe to stream messages with a callback */
  onMessage: (callback: (message: FileDiscoveryStreamMessage) => void) => () => void;
  /** Reset the stream state */
  reset: () => void;
  /** Set the session ID to track */
  setSessionId: (sessionId: null | string) => void;
}

/**
 * Initial state for the discovery stream.
 */
const INITIAL_STREAM_STATE: DiscoveryStreamState = {
  outcome: null,
  phase: 'idle',
  sessionId: null,
};

/**
 * Hook for subscribing to file discovery streaming events.
 *
 * This hook manages the subscription to the discovery stream and provides
 * state updates based on incoming stream messages. It filters messages
 * by session ID to support multiple concurrent discovery sessions.
 *
 * @example
 * ```tsx
 * const { phase, outcome, messages, setSessionId, reset } = useDiscoveryStream();
 *
 * // Start discovery and set session ID
 * const { sdkSessionId } = await startDiscovery(input);
 * setSessionId(sdkSessionId);
 *
 * // Monitor phase changes
 * useEffect(() => {
 *   if (phase === 'complete') {
 *     console.log('Discovery completed:', outcome);
 *   }
 * }, [phase, outcome]);
 *
 * // Reset when done
 * reset();
 * ```
 */
export function useDiscoveryStream(): UseDiscoveryStreamReturn {
  const [state, setState] = useState<DiscoveryStreamState>(INITIAL_STREAM_STATE);
  const [messages, setMessages] = useState<Array<FileDiscoveryStreamMessage>>([]);
  const callbacksRef = useRef<Set<(message: FileDiscoveryStreamMessage) => void>>(new Set());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Handle incoming stream messages.
   */
  const handleMessage = useCallback((message: FileDiscoveryStreamMessage) => {
    setState((prev) => {
      // Filter to only handle messages for our session
      if (prev.sessionId !== null && message.sessionId !== prev.sessionId) {
        return prev;
      }

      // Add message to history
      setMessages((prevMessages) => [...prevMessages, message]);

      // Notify registered callbacks
      callbacksRef.current.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error('[useDiscoveryStream] Error in message callback:', error);
        }
      });

      // Update state based on message type
      switch (message.type) {
        case 'complete':
          return {
            ...prev,
            outcome: message.outcome,
            phase: 'complete',
          };

        case 'error':
          return {
            ...prev,
            outcome: {
              error: message.error,
              stack: message.stack,
              type: 'ERROR',
            } as FileDiscoveryOutcome,
            phase: 'error',
          };

        case 'phase_change':
          return {
            ...prev,
            phase: message.phase,
          };

        default:
          return prev;
      }
    });
  }, []);

  /**
   * Subscribe to stream messages on mount.
   */
  useEffect(() => {
    const api = getDiscoveryAPI();
    if (!api) {
      console.warn('[useDiscoveryStream] Discovery API not available');
      return;
    }

    // Subscribe to messages
    unsubscribeRef.current = api.onStreamMessage(handleMessage);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [handleMessage]);

  /**
   * Register a callback for stream messages.
   * Returns an unsubscribe function.
   */
  const handleMessageCallback = useCallback((callback: (message: FileDiscoveryStreamMessage) => void): (() => void) => {
    callbacksRef.current.add(callback);
    return () => {
      callbacksRef.current.delete(callback);
    };
  }, []);

  /**
   * Set the session ID to track.
   */
  const setSessionId = useCallback((sessionId: null | string) => {
    setState((prev) => ({
      ...prev,
      sessionId,
    }));
  }, []);

  /**
   * Reset the stream state.
   */
  const reset = useCallback(() => {
    setState(INITIAL_STREAM_STATE);
    setMessages([]);
  }, []);

  return {
    ...state,
    messages,
    onMessage: handleMessageCallback,
    reset,
    setSessionId,
  };
}
