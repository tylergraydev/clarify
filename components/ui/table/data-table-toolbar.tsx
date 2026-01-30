'use client';

import type { Table } from '@tanstack/react-table';
import type { ChangeEvent, ComponentPropsWithRef, ReactNode } from 'react';

import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { RotateCcw, Search, Settings2, X } from 'lucide-react';
import { Fragment, useCallback, useMemo, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';

// =============================================================================
// Constants
// =============================================================================

/**
 * Default debounce delay for global filter updates in milliseconds.
 */
const DEFAULT_FILTER_DEBOUNCE_DELAY = 300;

// =============================================================================
// CVA Variants
// =============================================================================

export const dataTableToolbarVariants = cva(
  `
    flex items-center justify-between gap-4
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

export const dataTableToolbarButtonVariants = cva(
  `
    inline-flex items-center justify-center gap-2 rounded-md border border-border
    bg-transparent text-sm font-medium text-foreground transition-colors
    hover:bg-muted hover:text-foreground
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
    data-disabled:pointer-events-none data-disabled:opacity-50
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'h-9 px-3',
        lg: 'h-10 px-4',
        sm: 'h-8 px-2 text-xs',
      },
    },
  }
);

// =============================================================================
// Component Types
// =============================================================================

interface DataTableToolbarProps<TData>
  extends ComponentPropsWithRef<'div'>,
    VariantProps<typeof dataTableToolbarVariants> {
  /**
   * Additional actions to render in the toolbar.
   * Useful for bulk actions, export buttons, etc.
   */
  children?: ReactNode;

  /**
   * Debounce delay for global filter updates in milliseconds.
   * @default 300
   */
  filterDebounceDelay?: number;

  /**
   * Whether column visibility controls are enabled.
   * @default true
   */
  isColumnVisibilityEnabled?: boolean;

  /**
   * Whether global filter/search is enabled.
   * @default true
   */
  isGlobalFilterEnabled?: boolean;

  /**
   * Callback fired when global filter changes.
   */
  onGlobalFilterChange?: (value: string) => void;

  /**
   * Placeholder text for the search input.
   * @default "Search..."
   */
  searchPlaceholder?: string;

  /**
   * The TanStack Table instance.
   * Used to access column visibility and global filter APIs.
   */
  table: Table<TData>;
}

// =============================================================================
// Helper Components
// =============================================================================

interface GlobalFilterInputProps {
  filterDebounceDelay: number;
  globalFilter: string;
  onGlobalFilterChange?: (value: string) => void;
  searchPlaceholder: string;
  setGlobalFilter: (value: string) => void;
  size?: 'default' | 'lg' | 'sm';
}

/**
 * GlobalFilterInput provides a debounced search input for table-wide filtering.
 */
const GlobalFilterInput = ({
  filterDebounceDelay,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder,
  setGlobalFilter,
  size = 'default',
}: GlobalFilterInputProps) => {
  const [inputValue, setInputValue] = useState(globalFilter);

  const { debounced: debouncedSetFilter } = useDebouncedCallback(
    (value: string) => {
      setGlobalFilter(value);
      onGlobalFilterChange?.(value);
    },
    { delay: filterDebounceDelay }
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInputValue(value);
      debouncedSetFilter(value);
    },
    [debouncedSetFilter]
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    debouncedSetFilter('');
  }, [debouncedSetFilter]);

  return (
    <div className={'relative'}>
      <Search
        aria-hidden={'true'}
        className={cn(
          'absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground',
          size === 'sm' ? 'size-3.5' : 'size-4'
        )}
      />
      <Input
        aria-label={'Search table'}
        className={cn(
          'pl-9',
          inputValue ? 'pr-8' : '',
          size === 'sm' ? 'w-[180px]' : 'w-[240px]'
        )}
        onChange={handleInputChange}
        placeholder={searchPlaceholder}
        size={size}
        type={'text'}
        value={inputValue}
      />
      {inputValue && (
        <IconButton
          aria-label={'Clear search'}
          className={cn(
            'absolute top-1/2 right-1 -translate-y-1/2',
            size === 'sm' ? 'size-6' : 'size-7'
          )}
          onClick={handleClear}
        >
          <X
            aria-hidden={'true'}
            className={size === 'sm' ? 'size-3' : 'size-3.5'}
          />
        </IconButton>
      )}
    </div>
  );
};

interface ColumnVisibilityDropdownProps<TData> {
  size?: 'default' | 'lg' | 'sm';
  table: Table<TData>;
}

/**
 * ColumnVisibilityDropdown provides a dropdown menu to toggle column visibility.
 */
const ColumnVisibilityDropdown = <TData,>({
  size = 'default',
  table,
}: ColumnVisibilityDropdownProps<TData>) => {
  // Get columns that can be hidden
  const hideableColumns = useMemo(() => {
    return table
      .getAllColumns()
      .filter((column) => column.getCanHide());
  }, [table]);

  const handleResetColumnsClick = useCallback(() => {
    table.resetColumnVisibility();
  }, [table]);

  const isHasHiddenColumns = useMemo(() => {
    return hideableColumns.some((column) => !column.getIsVisible());
  }, [hideableColumns]);

  // Don't render if no columns can be hidden
  if (hideableColumns.length === 0) {
    return null;
  }

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <BaseButton
          aria-label={'Toggle column visibility'}
          className={cn(dataTableToolbarButtonVariants({ size }))}
        >
          <Settings2
            aria-hidden={'true'}
            className={size === 'sm' ? 'size-3.5' : 'size-4'}
          />
          <span>Columns</span>
        </BaseButton>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuPositioner align={'end'}>
          <DropdownMenuPopup className={'min-w-[180px]'} size={size === 'lg' ? 'default' : 'sm'}>
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel size={size === 'lg' ? 'default' : 'sm'}>
                Toggle columns
              </DropdownMenuGroupLabel>
              {hideableColumns.map((column) => {
                const isColumnVisible = column.getIsVisible();
                const columnId = column.id;
                // Try to get a display name from column definition
                const columnHeader =
                  typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : columnId;

                return (
                  <DropdownMenuItem
                    closeOnClick={false}
                    key={columnId}
                    onClick={() => column.toggleVisibility(!isColumnVisible)}
                    size={size === 'lg' ? 'default' : 'sm'}
                  >
                    <Checkbox
                      aria-hidden={'true'}
                      checked={isColumnVisible}
                      className={'pointer-events-none'}
                      size={size === 'lg' ? 'default' : 'sm'}
                      tabIndex={-1}
                    />
                    <span className={'capitalize'}>{columnHeader}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            {/* Reset Action */}
            {isHasHiddenColumns && (
              <Fragment>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleResetColumnsClick}
                  size={size === 'lg' ? 'default' : 'sm'}
                >
                  <RotateCcw
                    aria-hidden={'true'}
                    className={size === 'lg' ? 'size-4' : 'size-3.5'}
                  />
                  <span>Reset columns</span>
                </DropdownMenuItem>
              </Fragment>
            )}
          </DropdownMenuPopup>
        </DropdownMenuPositioner>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  );
};

// =============================================================================
// Component
// =============================================================================

/**
 * DataTableToolbar provides common table controls including global search and column visibility.
 * Integrates directly with TanStack Table's APIs for seamless state management.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DataTableToolbar table={table} />
 *
 * // With custom search placeholder
 * <DataTableToolbar
 *   table={table}
 *   searchPlaceholder="Filter records..."
 * />
 *
 * // With custom actions
 * <DataTableToolbar table={table}>
 *   <Button onClick={handleExport}>Export</Button>
 *   <Button onClick={handleBulkDelete} variant="destructive">
 *     Delete Selected
 *   </Button>
 * </DataTableToolbar>
 *
 * // Disable features
 * <DataTableToolbar
 *   table={table}
 *   isGlobalFilterEnabled={false}
 *   isColumnVisibilityEnabled={false}
 * />
 *
 * // With filter change callback
 * <DataTableToolbar
 *   table={table}
 *   onGlobalFilterChange={(value) => console.log('Filter:', value)}
 * />
 * ```
 */
export const DataTableToolbar = <TData,>({
  children,
  className,
  filterDebounceDelay = DEFAULT_FILTER_DEBOUNCE_DELAY,
  isColumnVisibilityEnabled = true,
  isGlobalFilterEnabled = true,
  onGlobalFilterChange,
  ref,
  searchPlaceholder = 'Search...',
  size,
  table,
  ...props
}: DataTableToolbarProps<TData>) => {
  const globalFilter = table.getState().globalFilter ?? '';

  const isHasLeftControls = isGlobalFilterEnabled;
  const isHasRightControls = isColumnVisibilityEnabled || children;

  return (
    <div
      className={cn(dataTableToolbarVariants({ size }), className)}
      ref={ref}
      {...props}
    >
      {/* Left Section: Global Filter */}
      <div className={'flex flex-1 items-center gap-2'}>
        {isGlobalFilterEnabled && (
          <GlobalFilterInput
            filterDebounceDelay={filterDebounceDelay}
            globalFilter={globalFilter}
            onGlobalFilterChange={onGlobalFilterChange}
            searchPlaceholder={searchPlaceholder}
            setGlobalFilter={table.setGlobalFilter}
            size={size ?? 'default'}
          />
        )}
        {!isHasLeftControls && <div className={'flex-1'} />}
      </div>

      {/* Right Section: Column Visibility & Custom Actions */}
      {isHasRightControls && (
        <div className={'flex items-center gap-2'}>
          {children}
          {isColumnVisibilityEnabled && (
            <ColumnVisibilityDropdown size={size ?? 'default'} table={table} />
          )}
        </div>
      )}
    </div>
  );
};
