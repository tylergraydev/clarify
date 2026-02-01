'use client';

import type { ComponentPropsWithRef } from 'react';

import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type TemplatesPageSkeletonProps = ComponentPropsWithRef<'main'>;

// ============================================================================
// Component
// ============================================================================

/**
 * Skeleton loading state for the templates page.
 *
 * Displays placeholder content while template data is being fetched,
 * matching the structure of the actual templates page for smooth transitions.
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <TemplatesPageSkeleton />;
 * }
 * ```
 */
export const TemplatesPageSkeleton = ({ className, ref, ...props }: TemplatesPageSkeletonProps) => {
  return (
    <main
      aria-busy={'true'}
      aria-label={'Loading templates'}
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
            <div className={'h-8 w-32 animate-pulse rounded-md bg-muted'} />
            {/* Badge skeleton */}
            <div className={'h-5 w-12 animate-pulse rounded-full bg-muted'} />
          </div>
          {/* Description skeleton */}
          <div className={'h-4 w-96 animate-pulse rounded-md bg-muted'} />
        </div>
        {/* Create button skeleton */}
        <div className={'h-10 w-40 animate-pulse rounded-md bg-muted'} />
      </header>

      {/* Toolbar Skeleton */}
      <div className={'flex items-center gap-4'}>
        {/* Filters button skeleton */}
        <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />
      </div>

      {/* Table Skeleton */}
      <section aria-label={'Loading templates list'}>
        <DataTableSkeleton columnCount={6} density={'default'} rowCount={10} showHeader={true} />
      </section>
    </main>
  );
};
