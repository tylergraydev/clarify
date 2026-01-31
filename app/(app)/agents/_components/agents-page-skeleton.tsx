'use client';

import type { ComponentPropsWithRef } from 'react';

import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type AgentsPageSkeletonProps = ComponentPropsWithRef<'main'>;

// ============================================================================
// Component
// ============================================================================

/**
 * Skeleton loading state for the agents page.
 *
 * Displays placeholder content while agent data is being fetched,
 * matching the structure of the actual agents page for smooth transitions.
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <AgentsPageSkeleton />;
 * }
 * ```
 */
export const AgentsPageSkeleton = ({ className, ref, ...props }: AgentsPageSkeletonProps) => {
  return (
    <main
      aria-busy={'true'}
      aria-label={'Loading agents'}
      className={cn('space-y-6', className)}
      ref={ref}
      role={'status'}
      {...props}
    >
      {/* Header Skeleton */}
      <header className={'flex items-start justify-between gap-4'}>
        <div className={'space-y-1'}>
          <div className={'flex items-center gap-3'}>
            {/* Title skeleton */}
            <div className={'h-8 w-24 animate-pulse rounded-md bg-muted'} />
            {/* Badge skeleton */}
            <div className={'h-5 w-12 animate-pulse rounded-full bg-muted'} />
          </div>
          {/* Description skeleton */}
          <div className={'h-4 w-80 animate-pulse rounded-md bg-muted'} />
        </div>
        {/* Create button skeleton */}
        <div className={'h-10 w-32 animate-pulse rounded-md bg-muted'} />
      </header>

      {/* Toolbar Skeleton */}
      <div className={'flex items-center gap-4'}>
        {/* Search input skeleton */}
        <div className={'h-9 w-64 animate-pulse rounded-md bg-muted'} />
        {/* Filter buttons skeleton */}
        <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />
        <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />
        <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />
      </div>

      {/* Table Skeleton */}
      <section aria-label={'Loading agents list'}>
        <DataTableSkeleton columnCount={7} density={'default'} rowCount={10} showHeader={true} />
      </section>
    </main>
  );
};
