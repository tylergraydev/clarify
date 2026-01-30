'use client';

import type { Table } from '@tanstack/react-table';
import type { ComponentPropsWithRef } from 'react';

import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { Fragment, useCallback, useMemo } from 'react';

import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// =============================================================================
// Constants
// =============================================================================

/**
 * Default page size options for the pagination selector.
 */
const DEFAULT_PAGE_SIZE_OPTIONS: Array<number> = [10, 25, 50, 100];

// =============================================================================
// CVA Variants
// =============================================================================

export const dataTablePaginationVariants = cva(
  `
    flex items-center justify-between gap-4 px-2
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'py-4',
        lg: 'py-6',
        sm: 'py-2',
      },
    },
  }
);

export const dataTablePaginationButtonVariants = cva(
  `
    inline-flex items-center justify-center rounded-md border border-border
    bg-transparent text-foreground transition-colors
    hover:bg-muted hover:text-foreground focus-visible:ring-2
    focus-visible:ring-accent
    focus-visible:ring-offset-0 focus-visible:outline-none
    data-disabled:pointer-events-none data-disabled:opacity-50
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'size-8',
        lg: 'size-9',
        sm: 'size-7',
      },
    },
  }
);

// =============================================================================
// Component Types
// =============================================================================

interface DataTablePaginationProps<TData>
  extends ComponentPropsWithRef<'nav'>, VariantProps<typeof dataTablePaginationVariants> {
  /**
   * Whether to show the page size selector.
   * @default true
   */
  isPageSizeSelectorVisible?: boolean;

  /**
   * Whether to show the row count information.
   * @default true
   */
  isRowCountVisible?: boolean;

  /**
   * Callback fired when page index changes.
   * Useful for tracking or analytics purposes.
   */
  onPageChange?: (pageIndex: number) => void;

  /**
   * Callback fired when page size changes.
   * Useful for tracking or analytics purposes.
   */
  onPageSizeChange?: (pageSize: number) => void;

  /**
   * Available page size options for the selector.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: Array<number>;

  /**
   * The TanStack Table instance.
   * Used to access pagination state and control methods.
   */
  table: Table<TData>;
}

// =============================================================================
// Helper Components
// =============================================================================

interface PageSizeSelectorProps {
  onPageSizeChange?: (pageSize: number) => void;
  pageSize: number;
  pageSizeOptions: Array<number>;
  setPageSize: (size: number) => void;
  size?: 'default' | 'lg' | 'sm';
}

/**
 * PageSizeSelector provides a dropdown to change the number of rows per page.
 */
const PageSizeSelector = ({
  onPageSizeChange,
  pageSize,
  pageSizeOptions,
  setPageSize,
  size = 'default',
}: PageSizeSelectorProps) => {
  const handleValueChange = useCallback(
    (value: null | number) => {
      if (value !== null) {
        setPageSize(value);
        onPageSizeChange?.(value);
      }
    },
    [onPageSizeChange, setPageSize]
  );

  return (
    <div className={'flex items-center gap-2'}>
      <span className={'text-sm text-muted-foreground'}>Rows per page</span>
      <SelectRoot onValueChange={handleValueChange} value={pageSize}>
        <SelectTrigger className={'w-[70px]'} size={size === 'lg' ? 'default' : 'sm'}>
          <SelectValue placeholder={'Select'} />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup size={size === 'lg' ? 'default' : 'sm'}>
              <SelectList>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} size={size === 'lg' ? 'default' : 'sm'} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>
    </div>
  );
};

interface RowCountDisplayProps {
  endItem: number;
  startItem: number;
  totalItems: number;
}

/**
 * RowCountDisplay shows the current range of visible rows.
 */
const RowCountDisplay = ({ endItem, startItem, totalItems }: RowCountDisplayProps) => {
  const isHasNoItems = totalItems === 0;

  return (
    <p className={'text-sm text-muted-foreground'}>
      {isHasNoItems ? (
        'No rows'
      ) : (
        <Fragment>
          Showing <span className={'font-medium text-foreground'}>{startItem}</span>
          {' - '}
          <span className={'font-medium text-foreground'}>{endItem}</span>
          {' of '}
          <span className={'font-medium text-foreground'}>{totalItems}</span>
          {' rows'}
        </Fragment>
      )}
    </p>
  );
};

interface NavigationControlsProps {
  isCanGoToFirstPage: boolean;
  isCanGoToLastPage: boolean;
  isCanGoToNextPage: boolean;
  isCanGoToPreviousPage: boolean;
  onFirstPage: () => void;
  onLastPage: () => void;
  onNextPage: () => void;
  onPageChange?: (pageIndex: number) => void;
  onPreviousPage: () => void;
  pageCount: number;
  pageIndex: number;
  size?: 'default' | 'lg' | 'sm';
}

/**
 * NavigationControls provides first/previous/next/last page navigation buttons.
 */
const NavigationControls = ({
  isCanGoToFirstPage,
  isCanGoToLastPage,
  isCanGoToNextPage,
  isCanGoToPreviousPage,
  onFirstPage,
  onLastPage,
  onNextPage,
  onPageChange,
  onPreviousPage,
  pageCount,
  pageIndex,
  size = 'default',
}: NavigationControlsProps) => {
  const handleFirstPageClick = useCallback(() => {
    onFirstPage();
    onPageChange?.(0);
  }, [onFirstPage, onPageChange]);

  const handlePreviousPageClick = useCallback(() => {
    onPreviousPage();
    onPageChange?.(pageIndex - 1);
  }, [onPageChange, onPreviousPage, pageIndex]);

  const handleNextPageClick = useCallback(() => {
    onNextPage();
    onPageChange?.(pageIndex + 1);
  }, [onNextPage, onPageChange, pageIndex]);

  const handleLastPageClick = useCallback(() => {
    onLastPage();
    onPageChange?.(pageCount - 1);
  }, [onLastPage, onPageChange, pageCount]);

  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4';

  return (
    <div className={'flex items-center gap-1'}>
      {/* First Page Button */}
      <BaseButton
        aria-label={'Go to first page'}
        className={cn(dataTablePaginationButtonVariants({ size }))}
        disabled={!isCanGoToFirstPage}
        onClick={handleFirstPageClick}
      >
        <ChevronFirst aria-hidden={'true'} className={iconSize} />
      </BaseButton>

      {/* Previous Page Button */}
      <BaseButton
        aria-label={'Go to previous page'}
        className={cn(dataTablePaginationButtonVariants({ size }))}
        disabled={!isCanGoToPreviousPage}
        onClick={handlePreviousPageClick}
      >
        <ChevronLeft aria-hidden={'true'} className={iconSize} />
      </BaseButton>

      {/* Page Indicator */}
      <span className={'mx-2 text-sm text-muted-foreground'}>
        Page <span className={'font-medium text-foreground'}>{pageIndex + 1}</span>
        {' of '}
        <span className={'font-medium text-foreground'}>{pageCount || 1}</span>
      </span>

      {/* Next Page Button */}
      <BaseButton
        aria-label={'Go to next page'}
        className={cn(dataTablePaginationButtonVariants({ size }))}
        disabled={!isCanGoToNextPage}
        onClick={handleNextPageClick}
      >
        <ChevronRight aria-hidden={'true'} className={iconSize} />
      </BaseButton>

      {/* Last Page Button */}
      <BaseButton
        aria-label={'Go to last page'}
        className={cn(dataTablePaginationButtonVariants({ size }))}
        disabled={!isCanGoToLastPage}
        onClick={handleLastPageClick}
      >
        <ChevronLast aria-hidden={'true'} className={iconSize} />
      </BaseButton>
    </div>
  );
};

// =============================================================================
// Component
// =============================================================================

/**
 * DataTablePagination provides table-specific pagination controls with page size selection.
 * Integrates directly with TanStack Table's pagination API for seamless state management.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DataTablePagination table={table} />
 *
 * // With custom page size options
 * <DataTablePagination
 *   table={table}
 *   pageSizeOptions={[5, 10, 20, 50]}
 * />
 *
 * // Hide page size selector
 * <DataTablePagination
 *   table={table}
 *   isPageSizeSelectorVisible={false}
 * />
 *
 * // With change callbacks
 * <DataTablePagination
 *   table={table}
 *   onPageChange={(page) => console.log('Page:', page)}
 *   onPageSizeChange={(size) => console.log('Size:', size)}
 * />
 * ```
 */
export const DataTablePagination = <TData,>({
  className,
  isPageSizeSelectorVisible = true,
  isRowCountVisible = true,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  ref,
  size,
  table,
  ...props
}: DataTablePaginationProps<TData>) => {
  // Extract pagination state from table
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const totalItems = table.getFilteredRowModel().rows.length;

  // Calculate row range
  const paginationRange = useMemo(() => {
    const startItem = totalItems === 0 ? 0 : pageIndex * pageSize + 1;
    const endItem = Math.min((pageIndex + 1) * pageSize, totalItems);
    return { endItem, startItem };
  }, [pageIndex, pageSize, totalItems]);

  // Navigation capabilities
  const isCanGoToPreviousPage = table.getCanPreviousPage();
  const isCanGoToNextPage = table.getCanNextPage();
  const isCanGoToFirstPage = pageIndex > 0;
  const isCanGoToLastPage = pageIndex < pageCount - 1;

  return (
    <nav
      aria-label={'Table pagination'}
      className={cn(dataTablePaginationVariants({ size }), className)}
      ref={ref}
      {...props}
    >
      {/* Left Section: Page Size Selector */}
      <div className={'flex items-center gap-6'}>
        {isPageSizeSelectorVisible && (
          <PageSizeSelector
            onPageSizeChange={onPageSizeChange}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            setPageSize={table.setPageSize}
            size={size ?? 'default'}
          />
        )}

        {/* Row Count Display */}
        {isRowCountVisible && (
          <RowCountDisplay
            endItem={paginationRange.endItem}
            startItem={paginationRange.startItem}
            totalItems={totalItems}
          />
        )}
      </div>

      {/* Right Section: Navigation Controls */}
      <NavigationControls
        isCanGoToFirstPage={isCanGoToFirstPage}
        isCanGoToLastPage={isCanGoToLastPage}
        isCanGoToNextPage={isCanGoToNextPage}
        isCanGoToPreviousPage={isCanGoToPreviousPage}
        onFirstPage={table.firstPage}
        onLastPage={table.lastPage}
        onNextPage={table.nextPage}
        onPageChange={onPageChange}
        onPreviousPage={table.previousPage}
        pageCount={pageCount}
        pageIndex={pageIndex}
        size={size ?? 'default'}
      />
    </nav>
  );
};
