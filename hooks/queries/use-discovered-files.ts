'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  FileDiscoveryOutcome,
  FileDiscoveryRediscoverInput,
  FileDiscoveryServicePhase,
  FileDiscoveryStartInput,
  FileDiscoveryStreamMessage,
  NewDiscoveredFile,
} from '@/types/electron';

import { discoveredFileKeys } from '@/lib/queries/discovered-files';
import { stepKeys } from '@/lib/queries/steps';

import { useElectronDb } from '../use-electron';

// ============================================================================
// Query Hooks
// ============================================================================

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

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Add a new discovered file to a workflow step
 */
export function useAddDiscoveredFile() {
  const queryClient = useQueryClient();
  const { discovery } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, stepId }: { data: NewDiscoveredFile; stepId: number }) => discovery.add(stepId, data),
    onSuccess: (file) => {
      // Invalidate step-specific queries
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId).queryKey,
      });
      // Invalidate included files query
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.included(file.workflowStepId).queryKey,
      });
      // Invalidate general list queries
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.list._def,
      });
    },
  });
}

/**
 * Cancel an active file discovery session.
 */
export function useCancelDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { sessionId: string; stepId: number }) => {
      const api = getDiscoveryAPI();
      if (!api) {
        throw new Error('Discovery API not available');
      }
      return api.cancel(input.sessionId);
    },
    onSuccess: (_outcome, input) => {
      // Invalidate discovered files for the step
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.byWorkflowStep(input.stepId).queryKey,
      });
      // Invalidate step queries to update step status
      void queryClient.invalidateQueries({
        queryKey: stepKeys._def,
      });
    },
  });
}

/**
 * Delete a discovered file from a workflow step
 */
export function useDeleteDiscoveredFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const api = getDiscoveryAPI();
      if (!api) {
        throw new Error('Discovery API not available');
      }
      return api.delete(id);
    },
    onSuccess: () => {
      // Invalidate all discovery queries since we don't have the stepId
      void queryClient.invalidateQueries({ queryKey: discoveredFileKeys._def });
    },
  });
}

/**
 * Fetch all discovered files for a workflow step
 */
export function useDiscoveredFiles(stepId: number) {
  const { discovery, isElectron } = useElectronDb();

  return useQuery({
    ...discoveredFileKeys.byWorkflowStep(stepId),
    enabled: isElectron && stepId > 0,
    queryFn: () => discovery.list(stepId),
  });
}

/**
 * Exclude a discovered file from the workflow
 */
export function useExcludeFile() {
  const queryClient = useQueryClient();
  const { discovery } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => discovery.exclude(id),
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(discoveredFileKeys.detail(file.id).queryKey, file);
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId).queryKey,
        });
        // Invalidate included files query
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.included(file.workflowStepId).queryKey,
        });
      }
    },
  });
}

/**
 * Fetch only included files for a workflow step
 * Filters client-side from the full list
 */
export function useIncludedFiles(stepId: number) {
  const { discovery, isElectron } = useElectronDb();

  return useQuery({
    ...discoveredFileKeys.included(stepId),
    enabled: isElectron && stepId > 0,
    queryFn: async () => {
      const files = await discovery.list(stepId);
      return files.filter((file) => file.includedAt !== null);
    },
  });
}

// ============================================================================
// Discovery Operation Mutation Hooks
// ============================================================================

/**
 * Include a discovered file in the workflow
 */
export function useIncludeFile() {
  const queryClient = useQueryClient();
  const { discovery } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => discovery.include(id),
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(discoveredFileKeys.detail(file.id).queryKey, file);
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId).queryKey,
        });
        // Invalidate included files query
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.included(file.workflowStepId).queryKey,
        });
      }
    },
  });
}

/**
 * Re-run file discovery with a specified mode.
 * - 'additive': Add newly discovered files to existing list
 * - 'replace': Clear existing files and replace with new discoveries
 */
export function useRediscover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FileDiscoveryRediscoverInput) => {
      const api = getDiscoveryAPI();
      if (!api) {
        throw new Error('Discovery API not available');
      }
      return api.rediscover(input);
    },
    onSuccess: (_outcome, input) => {
      // Invalidate discovered files for the step
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.byWorkflowStep(input.stepId).queryKey,
      });
      // Invalidate included files query
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.included(input.stepId).queryKey,
      });
      // Invalidate step queries to update step status
      void queryClient.invalidateQueries({
        queryKey: stepKeys._def,
      });
    },
  });
}

/**
 * Start a file discovery session.
 * Returns the discovery outcome with pause information.
 */
export function useStartDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FileDiscoveryStartInput) => {
      const api = getDiscoveryAPI();
      if (!api) {
        throw new Error('Discovery API not available');
      }
      return api.start(input);
    },
    onSuccess: (_outcome, input) => {
      // Invalidate discovered files for the step
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.byWorkflowStep(input.stepId).queryKey,
      });
      // Invalidate included files query
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.included(input.stepId).queryKey,
      });
      // Invalidate step queries to update step status
      void queryClient.invalidateQueries({
        queryKey: stepKeys._def,
      });
    },
  });
}

// ============================================================================
// Discovery Stream Hook
// ============================================================================

/**
 * Toggle file inclusion (include if excluded, exclude if included)
 */
export function useToggleDiscoveredFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const api = getDiscoveryAPI();
      if (!api) {
        throw new Error('Discovery API not available');
      }
      return api.toggle(id);
    },
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(discoveredFileKeys.detail(file.id).queryKey, file);
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId).queryKey,
        });
        // Invalidate included files query
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.included(file.workflowStepId).queryKey,
        });
      }
    },
  });
}

/**
 * Update discovered files (batch operation)
 */
export function useUpdateDiscoveredFile() {
  const queryClient = useQueryClient();
  const { discovery } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Partial<NewDiscoveredFile>; id: number }) => discovery.update(id, data),
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(discoveredFileKeys.detail(file.id).queryKey, file);
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId).queryKey,
        });
        // Invalidate included files query
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.included(file.workflowStepId).queryKey,
        });
        // Invalidate general list queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.list._def,
        });
      }
    },
  });
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the discovery API from window.electronAPI.
 * Returns undefined if not available (e.g., in browser environment).
 */
function getDiscoveryAPI() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.electronAPI?.discovery;
}
