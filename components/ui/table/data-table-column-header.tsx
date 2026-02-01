'use client';

import type { Column } from '@tanstack/react-table';
import type { ComponentPropsWithRef } from 'react';

import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Fragment } from 'react';

import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const dataTableColumnHeaderVariants = cva(
  `
    -ml-3 inline-flex h-8 items-center justify-start gap-1.5 rounded-md px-3
    text-sm font-medium text-muted-foreground transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
  `,
  {
    defaultVariants: {
      isSortable: true,
    },
    variants: {
      isSortable: {
        false: 'cursor-default',
        true: 'cursor-pointer hover:bg-muted hover:text-foreground',
      },
    },
  }
);

interface DataTableColumnHeaderProps<TData, TValue>
  extends ComponentPropsWithRef<'div'>, VariantProps<typeof dataTableColumnHeaderVariants> {
  /**
   * The TanStack Table column instance.
   * Used to access sorting state and handlers.
   */
  column: Column<TData, TValue>;

  /**
   * Whether to show a tooltip with the full title when hovering.
   * Useful for columns with long titles that may be truncated.
   * @default false
   */
  showTooltip?: boolean;

  /**
   * The display title for the column header.
   */
  title: string;
}

interface SortIconProps {
  isSorted: 'asc' | 'desc' | false;
  sortIndex: number;
}

/**
 * SortIcon displays the current sort direction indicator.
 * Shows ArrowUpDown when unsorted, ArrowUp for ascending, ArrowDown for descending.
 */
const SortIcon = ({ isSorted, sortIndex }: SortIconProps) => {
  const isMultiSort = sortIndex > 0;

  if (!isSorted) {
    return <ArrowUpDown aria-hidden={'true'} className={'size-4 opacity-50'} />;
  }

  const Icon = isSorted === 'asc' ? ArrowUp : ArrowDown;

  return (
    <span className={'inline-flex items-center gap-0.5'}>
      <Icon aria-hidden={'true'} className={'size-4'} />
      {/* Multi-sort Priority Indicator */}
      {isMultiSort && (
        <span aria-label={`Sort priority ${sortIndex + 1}`} className={'text-xs font-normal text-muted-foreground'}>
          {sortIndex + 1}
        </span>
      )}
    </span>
  );
};

/**
 * DataTableColumnHeader provides a sortable column header for TanStack Table.
 * Displays sort direction indicators and supports multi-sort with priority numbers.
 *
 * @example
 * ```tsx
 * // Basic usage in column definition
 * const columns = [
 *   {
 *     accessorKey: 'name',
 *     header: ({ column }) => (
 *       <DataTableColumnHeader column={column} title="Name" />
 *     ),
 *   },
 * ];
 *
 * // With tooltip for long titles
 * const columns = [
 *   {
 *     accessorKey: 'description',
 *     header: ({ column }) => (
 *       <DataTableColumnHeader
 *         column={column}
 *         showTooltip={true}
 *         title="Very Long Column Description"
 *       />
 *     ),
 *   },
 * ];
 * ```
 */
export const DataTableColumnHeader = <TData, TValue>({
  className,
  column,
  ref,
  showTooltip = false,
  title,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) => {
  const isCanSort = column.getCanSort();
  const isSorted = column.getIsSorted();
  const sortIndex = column.getSortIndex();

  // Determine aria-sort value for accessibility
  const getAriaSort = (): 'ascending' | 'descending' | 'none' | undefined => {
    if (!isCanSort) return undefined;
    if (isSorted === 'asc') return 'ascending';
    if (isSorted === 'desc') return 'descending';
    return 'none';
  };

  const headerContent = <span className={'truncate'}>{title}</span>;

  // Non-sortable header - render as simple div
  if (!isCanSort) {
    return (
      <div
        aria-sort={getAriaSort()}
        className={cn(dataTableColumnHeaderVariants({ isSortable: false }), className)}
        ref={ref}
        {...props}
      >
        {showTooltip ? <Tooltip content={title}>{headerContent}</Tooltip> : headerContent}
      </div>
    );
  }

  // Sortable header - render as interactive button
  const buttonContent = (
    <Fragment>
      {showTooltip ? <Tooltip content={title}>{headerContent}</Tooltip> : headerContent}
      <SortIcon isSorted={isSorted} sortIndex={sortIndex} />
    </Fragment>
  );

  return (
    <div aria-sort={getAriaSort()} className={className} ref={ref} {...props}>
      <BaseButton
        aria-label={
          isSorted === 'asc'
            ? `${title}, sorted ascending, click to sort descending`
            : isSorted === 'desc'
              ? `${title}, sorted descending, click to remove sort`
              : `${title}, click to sort ascending`
        }
        className={cn(dataTableColumnHeaderVariants({ isSortable: true }))}
        onClick={column.getToggleSortingHandler()}
      >
        {buttonContent}
      </BaseButton>
    </div>
  );
};
