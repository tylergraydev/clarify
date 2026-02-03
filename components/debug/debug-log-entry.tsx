'use client';

import type { ComponentPropsWithRef, KeyboardEvent } from 'react';

import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { Fragment, useCallback, useMemo, useState } from 'react';

import type { DebugLogCategory, DebugLogEntry as DebugLogEntryType, DebugLogLevel } from '@/types/debug-log';

import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Mapping of log levels to badge variant styles.
 */
const LEVEL_BADGE_STYLES: Record<DebugLogLevel, string> = {
  debug: 'bg-neutral-200 text-neutral-900 dark:bg-neutral-900/60 dark:text-neutral-100',
  error: 'bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-100',
  info: 'bg-blue-200 text-blue-900 dark:bg-blue-900/60 dark:text-blue-100',
  warn: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/60 dark:text-yellow-100',
};

/**
 * Mapping of categories to badge variant styles.
 */
const CATEGORY_BADGE_STYLES: Record<DebugLogCategory, string> = {
  permission: 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100',
  sdk_event: 'bg-violet-200 text-violet-900 dark:bg-violet-900/60 dark:text-violet-100',
  session: 'bg-cyan-200 text-cyan-900 dark:bg-cyan-900/60 dark:text-cyan-100',
  system: 'bg-slate-200 text-slate-900 dark:bg-slate-900/60 dark:text-slate-100',
  text: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100',
  thinking: 'bg-purple-200 text-purple-900 dark:bg-purple-900/60 dark:text-purple-100',
  tool_result: 'bg-teal-200 text-teal-900 dark:bg-teal-900/60 dark:text-teal-100',
  tool_use: 'bg-indigo-200 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100',
};

/**
 * Props for the DebugLogEntry component.
 */
interface DebugLogEntryProps extends Omit<ComponentPropsWithRef<'div'>, 'onClick'> {
  /** The log entry data to display */
  entry: DebugLogEntryType;
  /** Whether this entry is currently selected */
  isSelected?: boolean;
  /** Callback fired when the entry is clicked */
  onClick?: (entry: DebugLogEntryType) => void;
}

/**
 * Formats a category string for display by replacing underscores with spaces
 * and capitalizing words.
 */
function formatCategory(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Individual log entry display component with expandable metadata section.
 *
 * Features:
 * - Timestamp formatted nicely
 * - Level badge with appropriate colors (info=blue, warn=yellow, error=red, debug=gray)
 * - Category badge
 * - Message text
 * - Expandable metadata section (JSON pretty-printed)
 * - Click to select/expand
 *
 * @example
 * ```tsx
 * <DebugLogEntry
 *   entry={logEntry}
 *   isSelected={selectedId === logEntry.id}
 *   onClick={(entry) => setSelectedId(entry.id)}
 * />
 * ```
 */
export const DebugLogEntry = ({ className, entry, isSelected = false, onClick, ref, ...props }: DebugLogEntryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedTimestamp = useMemo(() => {
    try {
      return format(new Date(entry.timestamp), 'HH:mm:ss.SSS');
    } catch {
      return entry.timestamp;
    }
  }, [entry.timestamp]);

  const formattedDate = useMemo(() => {
    try {
      return format(new Date(entry.timestamp), 'MMM d, yyyy');
    } catch {
      return '';
    }
  }, [entry.timestamp]);

  const formattedMetadata = useMemo(() => {
    if (!entry.metadata || Object.keys(entry.metadata).length === 0) {
      return null;
    }
    try {
      return JSON.stringify(entry.metadata, null, 2);
    } catch {
      return null;
    }
  }, [entry.metadata]);

  const handleEntryClick = useCallback(() => {
    setIsExpanded((prev) => !prev);
    onClick?.(entry);
  }, [entry, onClick]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEntryClick();
      }
    },
    [handleEntryClick]
  );

  const hasMetadata = formattedMetadata !== null;

  return (
    <div
      aria-expanded={isExpanded}
      aria-pressed={isSelected}
      className={cn(
        `
          cursor-pointer rounded-md border border-transparent p-3 transition-colors
          hover:bg-muted/50
          focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none
        `,
        isSelected && 'border-accent/50 bg-muted/50',
        className
      )}
      onClick={handleEntryClick}
      onKeyDown={handleKeyDown}
      ref={ref}
      role={'button'}
      tabIndex={0}
      {...props}
    >
      {/* Header Row */}
      <div className={'flex items-start gap-3'}>
        {/* Expand Indicator */}
        {hasMetadata && (
          <ChevronRight
            aria-hidden={'true'}
            className={cn(
              'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
        )}
        {!hasMetadata && <div className={'w-4'} />}

        {/* Timestamp */}
        <div className={'flex shrink-0 flex-col'}>
          <span className={'font-mono text-xs text-muted-foreground'}>{formattedTimestamp}</span>
          <span className={'font-mono text-xs text-muted-foreground/60'}>{formattedDate}</span>
        </div>

        {/* Level Badge */}
        <Badge className={cn(badgeVariants({ size: 'sm' }), LEVEL_BADGE_STYLES[entry.level], 'shrink-0 uppercase')}>
          {entry.level}
        </Badge>

        {/* Category Badge */}
        <Badge className={cn(badgeVariants({ size: 'sm' }), CATEGORY_BADGE_STYLES[entry.category], 'shrink-0')}>
          {formatCategory(entry.category)}
        </Badge>

        {/* Message */}
        <p className={'min-w-0 flex-1 truncate text-sm text-foreground'}>{entry.message}</p>
      </div>

      {/* Expandable Metadata Section */}
      {isExpanded && hasMetadata && (
        <Fragment>
          <div className={'mt-3 ml-7 border-t border-border pt-3'}>
            {/* Session ID */}
            <div className={'mb-2 flex items-center gap-2'}>
              <span className={'text-xs font-medium text-muted-foreground'}>Session:</span>
              <code className={'rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs'}>{entry.sessionId}</code>
            </div>

            {/* Metadata */}
            <div>
              <span className={'mb-1 block text-xs font-medium text-muted-foreground'}>Metadata:</span>
              <pre
                className={`
                  max-h-60 overflow-auto rounded-md bg-muted p-3 font-mono text-xs
                  text-foreground
                `}
              >
                {formattedMetadata}
              </pre>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
};
