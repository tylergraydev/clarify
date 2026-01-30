'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import type { DataTableDensity, DataTableLoadingProps } from './types';

// =============================================================================
// Cell Width Patterns for Visual Interest
// =============================================================================

/**
 * Predefined width patterns for skeleton cells to create visual variety.
 * Each pattern is a percentage width that creates an organic, non-uniform look.
 */
const SKELETON_CELL_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-4/5', 'w-3/5', 'w-1/3'] as const;

/**
 * Get a deterministic skeleton cell width based on row and column indices.
 * This ensures consistent widths across re-renders while maintaining visual variety.
 */
const getSkeletonCellWidth = (rowIndex: number, columnIndex: number): string => {
  const index = (rowIndex + columnIndex) % SKELETON_CELL_WIDTHS.length;
  // Non-null assertion is safe because modulo guarantees index is within bounds
  return SKELETON_CELL_WIDTHS[index]!;
};

// =============================================================================
// CVA Variants
// =============================================================================

export const dataTableSkeletonRowVariants = cva(
  `
    border-b border-border last:border-b-0
  `,
  {
    defaultVariants: {
      density: 'default',
    },
    variants: {
      density: {
        comfortable: 'h-14',
        compact: 'h-10',
        default: 'h-12',
      },
    },
  }
);

export const dataTableSkeletonHeaderVariants = cva(
  `
    border-b border-border bg-muted/50
  `,
  {
    defaultVariants: {
      density: 'default',
    },
    variants: {
      density: {
        comfortable: 'h-12',
        compact: 'h-9',
        default: 'h-10',
      },
    },
  }
);

export const dataTableSkeletonCellVariants = cva(
  `
    px-4
  `,
  {
    defaultVariants: {
      density: 'default',
    },
    variants: {
      density: {
        comfortable: 'py-4',
        compact: 'py-2',
        default: 'py-3',
      },
    },
  }
);

// =============================================================================
// Component Types
// =============================================================================

interface DataTableSkeletonProps
  extends ComponentPropsWithRef<'div'>,
    DataTableLoadingProps,
    VariantProps<typeof dataTableSkeletonRowVariants> {
  /**
   * Density variant controlling row height and cell padding.
   * @default 'default'
   */
  density?: DataTableDensity;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DataTableSkeleton displays animated placeholder rows during data loading.
 * Provides visual feedback while async data is being fetched.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DataTableSkeleton columnCount={5} rowCount={10} />
 *
 * // With density variant
 * <DataTableSkeleton columnCount={5} rowCount={10} density="compact" />
 *
 * // Without header
 * <DataTableSkeleton columnCount={5} rowCount={10} showHeader={false} />
 * ```
 */
export const DataTableSkeleton = ({
  className,
  columnCount = 5,
  density = 'default',
  ref,
  rowCount = 5,
  showHeader = true,
  ...props
}: DataTableSkeletonProps) => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading table data'}
      className={cn('w-full overflow-hidden rounded-md border border-border', className)}
      ref={ref}
      role={'status'}
      {...props}
    >
      {/* Header Skeleton */}
      {showHeader && (
        <div className={cn(dataTableSkeletonHeaderVariants({ density }))}>
          <div className={'flex h-full items-center'}>
            {Array.from({ length: columnCount }).map((_, columnIndex) => (
              <div
                className={cn(dataTableSkeletonCellVariants({ density }), 'flex-1')}
                key={`header-${columnIndex}`}
              >
                <div
                  className={cn(
                    'h-4 animate-pulse rounded-sm bg-muted',
                    getSkeletonCellWidth(0, columnIndex)
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row Skeletons */}
      <div>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div
            className={cn(dataTableSkeletonRowVariants({ density }))}
            key={`row-${rowIndex}`}
          >
            <div className={'flex h-full items-center'}>
              {Array.from({ length: columnCount }).map((_, columnIndex) => (
                <div
                  className={cn(dataTableSkeletonCellVariants({ density }), 'flex-1')}
                  key={`cell-${rowIndex}-${columnIndex}`}
                >
                  <div
                    className={cn(
                      'h-4 animate-pulse rounded-sm bg-muted',
                      getSkeletonCellWidth(rowIndex + 1, columnIndex)
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
