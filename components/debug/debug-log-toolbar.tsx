'use client';

import type { ComponentPropsWithRef } from 'react';

import { FileText, RefreshCw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * Props for the DebugLogToolbar component.
 */
interface DebugLogToolbarProps extends ComponentPropsWithRef<'div'> {
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval: number;
  /** Whether auto-refresh is enabled */
  isAutoRefresh: boolean;
  /** Whether clear logs operation is pending */
  isClearPending?: boolean;
  /** Whether open log file operation is pending */
  isOpenPending?: boolean;
  /** Whether refresh operation is pending */
  isRefreshPending?: boolean;
  /** Callback fired when auto-refresh toggle changes */
  onAutoRefreshToggle: () => void;
  /** Callback fired when clear logs button is clicked */
  onClearLogs: () => void;
  /** Callback fired when open log file button is clicked */
  onOpenLogFile: () => void;
  /** Callback fired when refresh button is clicked */
  onRefresh: () => void;
}

/**
 * Formats milliseconds into a human-readable interval string.
 */
function formatInterval(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  return `${seconds}s`;
}

/**
 * Toolbar component for debug log viewer with action buttons and auto-refresh toggle.
 *
 * Actions:
 * - Refresh button (manual refresh)
 * - Clear logs button
 * - Open log file button
 * - Auto-refresh toggle with interval display
 *
 * @example
 * ```tsx
 * <DebugLogToolbar
 *   isAutoRefresh={isAutoRefresh}
 *   autoRefreshInterval={2000}
 *   onAutoRefreshToggle={toggleAutoRefresh}
 *   onRefresh={handleRefresh}
 *   onClearLogs={handleClear}
 *   onOpenLogFile={handleOpenFile}
 *   isRefreshPending={isRefreshing}
 * />
 * ```
 */
export const DebugLogToolbar = ({
  autoRefreshInterval,
  className,
  isAutoRefresh,
  isClearPending = false,
  isOpenPending = false,
  isRefreshPending = false,
  onAutoRefreshToggle,
  onClearLogs,
  onOpenLogFile,
  onRefresh,
  ref,
  ...props
}: DebugLogToolbarProps) => {
  return (
    <div
      className={cn('flex items-center justify-between gap-4 rounded-md border border-border bg-card p-3', className)}
      ref={ref}
      {...props}
    >
      {/* Left Actions */}
      <div className={'flex items-center gap-2'}>
        {/* Refresh Button */}
        <Button
          aria-label={'Refresh logs'}
          disabled={isRefreshPending}
          onClick={onRefresh}
          size={'sm'}
          variant={'outline'}
        >
          <RefreshCw aria-hidden={'true'} className={cn('size-4', isRefreshPending && 'animate-spin')} />
          <span>Refresh</span>
        </Button>

        {/* Clear Logs Button */}
        <Button
          aria-label={'Clear all logs'}
          disabled={isClearPending}
          onClick={onClearLogs}
          size={'sm'}
          variant={'outline'}
        >
          <Trash2 aria-hidden={'true'} className={'size-4'} />
          <span>Clear</span>
        </Button>

        {/* Open Log File Button */}
        <Button
          aria-label={'Open log file in system application'}
          disabled={isOpenPending}
          onClick={onOpenLogFile}
          size={'sm'}
          variant={'outline'}
        >
          <FileText aria-hidden={'true'} className={'size-4'} />
          <span>Open File</span>
        </Button>
      </div>

      {/* Right: Auto-Refresh Toggle */}
      <div className={'flex items-center gap-3'}>
        <div className={'flex items-center gap-2'}>
          <Switch
            aria-label={'Toggle auto-refresh'}
            checked={isAutoRefresh}
            onCheckedChange={onAutoRefreshToggle}
            size={'sm'}
          />
          <span className={'text-sm text-foreground'}>Auto-refresh</span>
        </div>
        {isAutoRefresh && (
          <span className={'rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground'}>
            {formatInterval(autoRefreshInterval)}
          </span>
        )}
      </div>
    </div>
  );
};
