'use client';

import type { ComponentPropsWithRef } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useRef } from 'react';

import type { DebugLogEntry as DebugLogEntryType } from '@/types/debug-log';

import { DebugLogEntry } from '@/components/debug/debug-log-entry';
import { cn } from '@/lib/utils';

/**
 * Props for the DebugLogList component.
 */
interface DebugLogListProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Array of log entries to display */
  entries: Array<DebugLogEntryType>;
  /** Whether the list is in a loading state */
  isLoading?: boolean;
  /** Callback fired when a log entry is clicked */
  onEntryClick?: (entry: DebugLogEntryType) => void;
  /** ID of the currently selected log entry */
  selectedId?: null | string;
}

/**
 * Estimated height of each log entry row in pixels.
 * Used for virtualization calculations.
 */
const ESTIMATED_ROW_HEIGHT = 80;

/**
 * Virtualized list component for displaying debug log entries.
 *
 * Uses @tanstack/react-virtual for performance with large numbers of logs.
 * Entries are displayed in reverse chronological order (newest first).
 *
 * @example
 * ```tsx
 * <DebugLogList
 *   entries={logs}
 *   selectedId={selectedLogId}
 *   onEntryClick={(entry) => setSelectedLogId(entry.id)}
 *   isLoading={isLogsLoading}
 * />
 * ```
 */
export const DebugLogList = ({
  className,
  entries,
  isLoading = false,
  onEntryClick,
  ref,
  selectedId,
  ...props
}: DebugLogListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: entries.length,
    estimateSize: useCallback(() => ESTIMATED_ROW_HEIGHT, []),
    getScrollElement: () => parentRef.current,
    overscan: 5,
  });

  const handleEntryClick = useCallback(
    (entry: DebugLogEntryType) => {
      onEntryClick?.(entry);
    },
    [onEntryClick]
  );

  const isEmpty = entries.length === 0;
  const isShowingEmptyState = isEmpty && !isLoading;
  const isShowingLoadingState = isEmpty && isLoading;

  return (
    <div className={cn('flex flex-1 flex-col', className)} ref={ref} {...props}>
      {/* Loading State */}
      {isShowingLoadingState && (
        <div className={'flex flex-1 items-center justify-center'}>
          <p className={'text-sm text-muted-foreground'}>Loading logs...</p>
        </div>
      )}

      {/* Empty State */}
      {isShowingEmptyState && (
        <div className={'flex flex-1 items-center justify-center'}>
          <div className={'text-center'}>
            <p className={'text-sm text-muted-foreground'}>No log entries found</p>
            <p className={'mt-1 text-xs text-muted-foreground/70'}>Try adjusting your filters or wait for new logs</p>
          </div>
        </div>
      )}

      {/* Virtualized List */}
      {!isEmpty && (
        <div className={'flex-1 overflow-auto'} ref={parentRef}>
          <div
            className={'relative w-full'}
            style={{
              height: `${virtualizer.getTotalSize()}px`,
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const entry = entries[virtualRow.index];

              // Guard against undefined entries (should not happen but TypeScript requires it)
              if (!entry) {
                return null;
              }

              const isSelected = entry.id === selectedId;

              return (
                <div
                  className={'absolute top-0 left-0 w-full px-2'}
                  data-index={virtualRow.index}
                  key={entry.id}
                  ref={virtualizer.measureElement}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <DebugLogEntry entry={entry} isSelected={isSelected} onClick={handleEntryClick} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
