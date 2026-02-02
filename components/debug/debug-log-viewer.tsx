'use client';

import type { ComponentPropsWithRef } from 'react';

import { useCallback, useMemo } from 'react';

import type { DebugLogEntry, DebugLogFilters as DebugLogFiltersType } from '@/types/debug-log';

import { DebugLogFilters } from '@/components/debug/debug-log-filters';
import { DebugLogList } from '@/components/debug/debug-log-list';
import { DebugLogToolbar } from '@/components/debug/debug-log-toolbar';
import { useClearDebugLogs, useDebugLogs, useDebugLogSessionIds, useOpenDebugLogFile } from '@/hooks/queries/use-debug-logs';
import { useDebugLogStore } from '@/lib/stores/debug-log-store';
import { cn } from '@/lib/utils';

/**
 * Props for the DebugLogViewer component.
 */
interface DebugLogViewerProps extends ComponentPropsWithRef<'div'> {
  /** Initial filters to apply (optional) */
  initialFilters?: Partial<DebugLogFiltersType>;
}

/**
 * Main container component for the debug log viewer interface.
 *
 * Orchestrates:
 * - Data fetching via useDebugLogs hook
 * - State management via useDebugLogStore
 * - Renders toolbar, filters, and log list
 * - Handles auto-refresh logic
 *
 * @example
 * ```tsx
 * <DebugLogViewer className="h-full" />
 * ```
 */
export const DebugLogViewer = ({ className, initialFilters, ref, ...props }: DebugLogViewerProps) => {
  // Store state and actions
  const {
    autoRefreshInterval,
    filters,
    isAutoRefresh,
    selectedLogId,
    setFilters,
    setSelectedLogId,
    toggleAutoRefresh,
  } = useDebugLogStore();

  // Merge initial filters with store filters
  const effectiveFilters = useMemo(() => {
    return { ...initialFilters, ...filters };
  }, [filters, initialFilters]);

  // Data fetching
  const {
    data: logs = [],
    isLoading: isLogsLoading,
    isRefetching: isRefreshing,
    refetch: refetchLogs,
  } = useDebugLogs(effectiveFilters, {
    refetchInterval: isAutoRefresh ? autoRefreshInterval : false,
  });

  const { data: sessionIds = [] } = useDebugLogSessionIds();

  // Mutations
  const clearLogsMutation = useClearDebugLogs();
  const openLogFileMutation = useOpenDebugLogFile();

  // Sort logs in reverse chronological order (newest first)
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [logs]);

  // Handlers
  const handleRefresh = useCallback(() => {
    void refetchLogs();
  }, [refetchLogs]);

  const handleClearLogs = useCallback(() => {
    clearLogsMutation.mutate();
  }, [clearLogsMutation]);

  const handleOpenLogFile = useCallback(() => {
    openLogFileMutation.mutate();
  }, [openLogFileMutation]);

  const handleFiltersChange = useCallback(
    (newFilters: Partial<DebugLogFiltersType>) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  const handleEntryClick = useCallback(
    (entry: DebugLogEntry) => {
      setSelectedLogId(entry.id === selectedLogId ? null : entry.id);
    },
    [selectedLogId, setSelectedLogId]
  );

  const handleAutoRefreshToggle = useCallback(() => {
    toggleAutoRefresh();
  }, [toggleAutoRefresh]);

  return (
    <div className={cn('flex h-full flex-col gap-4 p-4', className)} ref={ref} {...props}>
      {/* Toolbar */}
      <DebugLogToolbar
        autoRefreshInterval={autoRefreshInterval}
        isAutoRefresh={isAutoRefresh}
        isClearPending={clearLogsMutation.isPending}
        isOpenPending={openLogFileMutation.isPending}
        isRefreshPending={isRefreshing}
        onAutoRefreshToggle={handleAutoRefreshToggle}
        onClearLogs={handleClearLogs}
        onOpenLogFile={handleOpenLogFile}
        onRefresh={handleRefresh}
      />

      {/* Main Content Area */}
      <div className={'flex flex-1 gap-4 overflow-hidden'}>
        {/* Filters Panel */}
        <aside className={'w-72 shrink-0 overflow-y-auto'}>
          <DebugLogFilters
            filters={effectiveFilters}
            isDisabled={isLogsLoading}
            onChange={handleFiltersChange}
            sessionIds={sessionIds}
          />
        </aside>

        {/* Log List */}
        <main className={'flex flex-1 flex-col overflow-hidden rounded-md border border-border bg-card'}>
          <DebugLogList
            entries={sortedLogs}
            isLoading={isLogsLoading}
            onEntryClick={handleEntryClick}
            selectedId={selectedLogId}
          />
        </main>
      </div>

      {/* Status Bar */}
      <div className={'flex items-center justify-between text-xs text-muted-foreground'}>
        <span>
          {sortedLogs.length} log{sortedLogs.length !== 1 ? 's' : ''} found
        </span>
        {isAutoRefresh && <span>Auto-refreshing every {autoRefreshInterval / 1000}s</span>}
      </div>
    </div>
  );
};
