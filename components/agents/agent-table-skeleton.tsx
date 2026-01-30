'use client';

import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AgentTableSkeletonProps extends ComponentPropsWithRef<'div'> {
  /** Number of skeleton rows to display */
  count?: number;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Individual skeleton row for the table view.
 * Mimics the structure of AgentTable rows with animated placeholders.
 */
const AgentTableSkeletonRow = () => {
  return (
    <tr>
      {/* Name Cell */}
      <td className={'px-4 py-3'}>
        <div className={'flex items-center gap-2'}>
          {/* Color Indicator */}
          <div className={'size-3 shrink-0 animate-pulse rounded-full bg-muted'} />
          {/* Agent Name */}
          <div className={'h-4 w-28 animate-pulse rounded-sm bg-muted'} />
          {/* Optional Badge */}
          <div className={'h-5 w-14 animate-pulse rounded-full bg-muted'} />
        </div>
      </td>

      {/* Type Cell */}
      <td className={'px-4 py-3'}>
        <div className={'h-5 w-16 animate-pulse rounded-full bg-muted'} />
      </td>

      {/* Status Cell */}
      <td className={'px-4 py-3'}>
        <div className={'flex items-center gap-2'}>
          <div className={'h-3 w-12 animate-pulse rounded-sm bg-muted'} />
          <div className={'h-5 w-9 animate-pulse rounded-full bg-muted'} />
        </div>
      </td>

      {/* Scope Cell */}
      <td className={'px-4 py-3'}>
        <div className={'h-5 w-14 animate-pulse rounded-full bg-muted'} />
      </td>

      {/* Actions Cell */}
      <td className={'px-4 py-3'}>
        <div className={'flex items-center justify-end gap-1'}>
          <div className={'h-8 w-14 animate-pulse rounded-md bg-muted'} />
          <div className={'size-8 animate-pulse rounded-md bg-muted'} />
          <div className={'size-8 animate-pulse rounded-md bg-muted'} />
        </div>
      </td>
    </tr>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Loading skeleton for the agent table view.
 * Displays an animated table structure that mimics the AgentTable layout,
 * including headers and placeholder rows.
 *
 * @example
 * ```tsx
 * <AgentTableSkeleton count={6} />
 * ```
 */
export const AgentTableSkeleton = ({ className, count = 6, ref, ...props }: AgentTableSkeletonProps) => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading agents table'}
      className={cn('overflow-x-auto rounded-lg border border-border', className)}
      ref={ref}
      role={'status'}
      {...props}
    >
      <table className={'w-full border-collapse text-sm'}>
        {/* Table Header */}
        <thead className={'border-b border-border bg-muted/50'}>
          <tr>
            <th className={'px-4 py-3 text-left font-medium text-muted-foreground'} scope={'col'}>
              {'Name'}
            </th>
            <th className={'px-4 py-3 text-left font-medium text-muted-foreground'} scope={'col'}>
              {'Type'}
            </th>
            <th className={'px-4 py-3 text-left font-medium text-muted-foreground'} scope={'col'}>
              {'Status'}
            </th>
            <th className={'px-4 py-3 text-left font-medium text-muted-foreground'} scope={'col'}>
              {'Scope'}
            </th>
            <th className={'px-4 py-3 text-right font-medium text-muted-foreground'} scope={'col'}>
              {'Actions'}
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className={'divide-y divide-border'}>
          {Array.from({ length: count }).map((_, index) => (
            <AgentTableSkeletonRow key={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
