'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { DebugLogAPI, DebugLogFilters } from '@/types/debug-log';

import { debugLogKeys } from '@/lib/queries/debug-logs';

// ============================================================================
// API Detection Hook
// ============================================================================

/**
 * Options for useDebugLogs hook
 */
export interface UseDebugLogsOptions {
  /**
   * Whether the query is enabled. Defaults to true when API is available.
   */
  enabled?: boolean;
  /**
   * Polling interval in milliseconds for auto-refresh. Set to false to disable.
   */
  refetchInterval?: false | number;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Mutation to clear all debug log entries.
 */
export function useClearDebugLogs() {
  const queryClient = useQueryClient();
  const { api } = useDebugLogApi();

  return useMutation({
    mutationFn: async () => {
      if (!api) {
        throw new Error('Debug log API not available');
      }
      return api.clearLogs();
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate all debug log queries to refetch fresh data
        void queryClient.invalidateQueries({ queryKey: debugLogKeys._def });
      }
    },
  });
}

/**
 * Fetch the current log file path.
 */
export function useDebugLogPath() {
  const { api, isAvailable } = useDebugLogApi();

  return useQuery({
    ...debugLogKeys.logPath,
    enabled: isAvailable,
    queryFn: async () => {
      if (!api) return '';
      return api.getLogPath();
    },
  });
}

/**
 * Fetch debug log entries with optional filters and auto-refresh.
 *
 * @param filters - Optional filters for log entries
 * @param options - Optional configuration for polling and enabled state
 */
export function useDebugLogs(filters?: DebugLogFilters, options: UseDebugLogsOptions = {}) {
  const { api, isAvailable } = useDebugLogApi();
  const { enabled = true, refetchInterval } = options;

  return useQuery({
    ...debugLogKeys.list(filters),
    enabled: isAvailable && enabled,
    queryFn: async () => {
      if (!api) return [];
      return api.getLogs(filters);
    },
    refetchInterval: refetchInterval ?? false,
  });
}

/**
 * Fetch unique session IDs from debug logs.
 */
export function useDebugLogSessionIds() {
  const { api, isAvailable } = useDebugLogApi();

  return useQuery({
    ...debugLogKeys.sessionIds,
    enabled: isAvailable,
    queryFn: async () => {
      if (!api) return [];
      return api.getSessionIds();
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Mutation to open the log file in the system's default application.
 */
export function useOpenDebugLogFile() {
  const { api } = useDebugLogApi();

  return useMutation({
    mutationFn: async () => {
      if (!api) {
        throw new Error('Debug log API not available');
      }
      return api.openLogFile();
    },
  });
}

/**
 * Hook to detect and provide the appropriate debug log API.
 * The debug window uses `window.debugLogAPI` while the main window uses
 * `window.electronAPI?.debugLog`.
 */
function useDebugLogApi() {
  const api = useMemo((): DebugLogAPI | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    // Check for debug window API first (higher priority)
    if ('debugLogAPI' in window && window.debugLogAPI) {
      return window.debugLogAPI;
    }

    // Fall back to main window API
    if (window.electronAPI?.debugLog) {
      return window.electronAPI.debugLog;
    }

    return null;
  }, []);

  const isAvailable = api !== null;

  return { api, isAvailable };
}
