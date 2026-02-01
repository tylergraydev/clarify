'use client';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  OnChangeFn,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';

import {
  filterFns,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { cva, type VariantProps } from 'class-variance-authority';
import { Fragment, memo, useCallback, useMemo, useRef } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { useTablePersistence, type UseTablePersistenceOptions } from '@/hooks/use-table-persistence';
import { cn } from '@/lib/utils';

import type {
  DataTableColumnDef,
  DataTableDensity,
  DataTableEmptyStateConfig,
  DataTableLoadingProps,
  DataTablePersistenceConfig,
  DataTableRowAction,
  DataTableRowStyleCallback,
} from './types';

import { DataTableDraggableHeader } from './data-table-draggable-header';
import { DataTablePagination } from './data-table-pagination';
import { DataTableResizeHandle } from './data-table-resize-handle';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableToolbar } from './data-table-toolbar';

// =============================================================================
// CVA Variants
// =============================================================================

export const dataTableContainerVariants = cva(
  `
    w-full
  `,
  {
    defaultVariants: {
      density: 'default',
    },
    variants: {
      density: {
        comfortable: '',
        compact: '',
        default: '',
      },
    },
  }
);

export const dataTableVariants = cva(
  `
    table-fixed border-collapse
  `,
  {
    defaultVariants: {
      density: 'default',
    },
    variants: {
      density: {
        comfortable: '',
        compact: '',
        default: '',
      },
    },
  }
);

export const dataTableHeaderCellVariants = cva(
  `
    group relative border-b border-border bg-muted/50 text-left text-sm
    font-medium text-muted-foreground
  `,
  {
    defaultVariants: {
      density: 'default',
    },
    variants: {
      density: {
        comfortable: 'h-12 px-4',
        compact: 'h-9 px-3',
        default: 'h-10 px-4',
      },
    },
  }
);

export const dataTableCellVariants = cva(
  `
    border-b border-border text-sm
  `,
  {
    defaultVariants: {
      density: 'default',
    },
    variants: {
      density: {
        comfortable: 'h-14 p-4',
        compact: 'h-10 px-3 py-2',
        default: 'h-12 px-4 py-3',
      },
    },
  }
);

export const dataTableRowVariants = cva(
  `
    transition-colors
  `,
  {
    defaultVariants: {
      isClickable: false,
      isSelected: false,
    },
    variants: {
      isClickable: {
        false: '',
        true: 'cursor-pointer',
      },
      isSelected: {
        false: 'hover:bg-muted/50',
        true: 'bg-muted',
      },
    },
  }
);

// =============================================================================
// Component Types
// =============================================================================

interface DataTableBodyProps<TData> {
  density: DataTableDensity;
  isClickable: boolean;
  onRowClick?: (row: Row<TData>) => void;
  rows: Array<Row<TData>>;
  rowStyleCallback?: DataTableRowStyleCallback<TData>;
}

// =============================================================================
// Helper Functions
// =============================================================================

interface DataTableProps<TData, TValue>
  extends ComponentPropsWithRef<'div'>, VariantProps<typeof dataTableContainerVariants> {
  /**
   * Array of actions to display for each row.
   * Renders a dropdown menu in the actions column when provided.
   */
  actions?: Array<DataTableRowAction<TData>>;

  /**
   * Column definitions for the table.
   * Extended with additional metadata for filtering and hiding.
   */
  columns: Array<DataTableColumnDef<TData, TValue>>;

  /**
   * Data array to display in the table.
   */
  data: Array<TData>;

  /**
   * Density variant controlling row height and cell padding.
   * @default 'default'
   */
  density?: DataTableDensity;

  /**
   * Configuration for empty state display.
   * Separate configs for no data vs no results from filters.
   */
  emptyState?: DataTableEmptyStateConfig;

  /**
   * Function to derive a unique row ID from row data.
   * Used for stable row selection state management.
   * If not provided, row index is used as the ID.
   */
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;

  /**
   * Whether column reordering via drag-and-drop is enabled.
   * When true, users can drag column headers to reorder columns.
   * Column order persists via useTablePersistence when persistence is configured.
   * @default false
   */
  isColumnReorderEnabled?: boolean;

  /**
   * Whether column resizing is enabled.
   * @default true
   */
  isColumnResizingEnabled?: boolean;

  /**
   * Whether the table is currently loading data.
   * Shows skeleton when true.
   * @default false
   */
  isLoading?: boolean;

  /**
   * Whether pagination is enabled.
   * @default true
   */
  isPaginationEnabled?: boolean;

  /**
   * Whether row selection is enabled.
   * Adds a checkbox column when true.
   * @default false
   */
  isRowSelectionEnabled?: boolean;

  /**
   * Whether sorting is enabled.
   * @default true
   */
  isSortingEnabled?: boolean;

  /**
   * Whether the toolbar (search, column visibility) is visible.
   * @default true
   */
  isToolbarVisible?: boolean;

  /**
   * Loading skeleton configuration.
   */
  loadingProps?: DataTableLoadingProps;

  /**
   * Callback fired when column filters change.
   */
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;

  /**
   * Callback fired when column order changes.
   */
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>;

  /**
   * Callback fired when column sizing changes.
   */
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;

  /**
   * Callback fired when column visibility changes.
   */
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;

  /**
   * Callback fired when global filter changes.
   */
  onGlobalFilterChange?: (value: string) => void;

  /**
   * Callback fired when pagination state changes.
   */
  onPaginationChange?: OnChangeFn<PaginationState>;

  /**
   * Callback fired when a row is clicked.
   */
  onRowClick?: (row: Row<TData>) => void;

  /**
   * Callback fired when row selection changes.
   */
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;

  /**
   * Callback fired when sorting state changes.
   */
  onSortingChange?: OnChangeFn<SortingState>;

  /**
   * Total number of pages when using server-side pagination.
   * When provided, enables manual/server-side pagination mode.
   * Must be used together with controlled pagination state and onPaginationChange.
   */
  pageCount?: number;

  /**
   * Available page size options for pagination.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: Array<number>;

  /**
   * Configuration for table state persistence.
   * When provided, table state is saved to electron-store.
   */
  persistence?: DataTablePersistenceConfig;

  /**
   * Total number of rows when using server-side pagination.
   * Used by the pagination component to display "Showing X-Y of Z rows".
   * If not provided in server-side mode, falls back to pageCount * pageSize.
   */
  rowCount?: number;

  /**
   * Function to determine row styling based on row data.
   * Returns CSS class names to apply to the row.
   */
  rowStyleCallback?: DataTableRowStyleCallback<TData>;

  /**
   * Placeholder text for the search input.
   * @default "Search..."
   */
  searchPlaceholder?: string;

  /**
   * Controlled column filters state.
   */
  state?: {
    columnFilters?: ColumnFiltersState;
    columnOrder?: ColumnOrderState;
    columnSizing?: ColumnSizingState;
    columnVisibility?: VisibilityState;
    globalFilter?: string;
    pagination?: PaginationState;
    rowSelection?: RowSelectionState;
    sorting?: SortingState;
  };

  /**
   * Additional elements to render in the toolbar.
   * Positioned after the search input, before column visibility toggle.
   */
  toolbarContent?: ReactNode;
}

// =============================================================================
// Table Body Component (for memoization during resize)
// =============================================================================

/**
 * Creates a selection column definition for row selection checkboxes.
 */
function createSelectionColumn<TData>(): DataTableColumnDef<TData, unknown> {
  return {
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          aria-label={'Select row'}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        />
      </div>
    ),
    enableColumnFilter: false,
    enableHiding: false,
    enableResizing: false,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        aria-label={'Select all rows'}
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
      />
    ),
    id: 'select',
    maxSize: 48,
    meta: {
      cellClassName: 'px-2',
      headerClassName: 'px-2',
    },
    minSize: 36,
    size: 36,
  };
}

/**
 * Internal component for rendering table body rows.
 * Extracted to enable memoization during column resize operations for 60fps performance.
 * @see https://tanstack.com/table/latest/docs/framework/react/examples/column-resizing-performant
 */
const DataTableBody = <TData,>({
  density,
  isClickable,
  onRowClick,
  rows,
  rowStyleCallback,
}: DataTableBodyProps<TData>) => {
  return (
    <Fragment>
      {rows.map((row) => {
        const isSelected = row.getIsSelected();
        const customRowStyle = rowStyleCallback?.(row);

        return (
          <tr
            aria-selected={isSelected}
            className={cn(dataTableRowVariants({ isClickable, isSelected }), customRowStyle)}
            data-state={isSelected ? 'selected' : undefined}
            key={row.id}
            onClick={isClickable ? () => onRowClick?.(row) : undefined}
          >
            {row.getVisibleCells().map((cell) => {
              const cellClassName = cell.column.columnDef.meta?.cellClassName;
              const isFillerColumn = cell.column.columnDef.meta?.isFillerColumn === true;

              return (
                <td
                  className={cn(dataTableCellVariants({ density }), cellClassName)}
                  key={cell.id}
                  style={
                    // Filler columns don't get fixed width - they expand to fill remaining space
                    isFillerColumn ? undefined : { width: `calc(var(--col-${cell.column.id}-size) * 1px)` }
                  }
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        );
      })}
    </Fragment>
  );
};

/**
 * Memoized version of DataTableBody that only re-renders when rows reference changes.
 * Used during column resize operations to prevent unnecessary re-renders and achieve 60fps resizing.
 */
const MemoizedDataTableBody = memo(DataTableBody, (prev, next) => prev.rows === next.rows) as typeof DataTableBody;

// =============================================================================
// Component
// =============================================================================

/**
 * DataTable is a feature-rich, accessible data table component built on TanStack Table.
 * Provides sorting, filtering, pagination, row selection, column resizing, and state persistence.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DataTable columns={columns} data={users} />
 *
 * // With row selection
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   isRowSelectionEnabled={true}
 *   onRowSelectionChange={(selection) => console.log(selection)}
 * />
 *
 * // With persistence
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   persistence={{ tableId: 'users-table' }}
 * />
 *
 * // With row click handler
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   onRowClick={(row) => router.push(`/users/${row.original.id}`)}
 * />
 *
 * // With custom empty states
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   emptyState={{
 *     noData: {
 *       title: 'No users yet',
 *       description: 'Add your first user to get started.',
 *       action: <Button onClick={handleCreate}>Add User</Button>,
 *     },
 *     noResults: {
 *       title: 'No results found',
 *       description: 'Try adjusting your search or filters.',
 *     },
 *   }}
 * />
 *
 * // With loading state
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   isLoading={isLoading}
 *   loadingProps={{ rowCount: 10 }}
 * />
 *
 * // With column reordering enabled
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   isColumnReorderEnabled={true}
 *   persistence={{ tableId: 'users-table' }}
 * />
 * ```
 */
export const DataTable = <TData, TValue>({
  actions,
  className,
  columns: columnsProp,
  data,
  density = 'default',
  emptyState,
  getRowId,
  isColumnReorderEnabled = false,
  isColumnResizingEnabled = true,
  isLoading = false,
  isPaginationEnabled = true,
  isRowSelectionEnabled = false,
  isSortingEnabled = true,
  isToolbarVisible = true,
  loadingProps,
  onColumnFiltersChange,
  onColumnOrderChange,
  onColumnSizingChange,
  onColumnVisibilityChange,
  onGlobalFilterChange,
  onPaginationChange,
  onRowClick,
  onRowSelectionChange,
  onSortingChange,
  pageCount,
  pageSizeOptions,
  persistence,
  ref,
  rowCount,
  rowStyleCallback,
  searchPlaceholder,
  state: controlledState,
  toolbarContent,
  ...props
}: DataTableProps<TData, TValue>) => {
  // Ref to track if we're in controlled mode
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Determine if persistence is enabled
  const isPersistenceEnabled = persistence?.enabled !== false && !!persistence?.tableId;

  // Set up persistence hook if enabled
  const persistenceOptions: null | UseTablePersistenceOptions = isPersistenceEnabled
    ? {
        initialState: {
          columnOrder: controlledState?.columnOrder ?? [],
          columnSizing: controlledState?.columnSizing ?? {},
          columnVisibility: controlledState?.columnVisibility ?? {},
          sorting: controlledState?.sorting ?? [],
        },
        persistedKeys: persistence?.persistedKeys ?? ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting'],
        tableId: persistence!.tableId,
      }
    : null;

  const {
    isLoaded: isPersistenceLoaded,
    setState: setPersistenceState,
    state: persistedState,
  } = useTablePersistence(
    persistenceOptions ?? {
      initialState: {},
      tableId: '__disabled__',
    }
  );

  // Merge columns with selection column if enabled
  const columns = useMemo(() => {
    if (isRowSelectionEnabled) {
      return [createSelectionColumn<TData>(), ...columnsProp];
    }
    return columnsProp;
  }, [columnsProp, isRowSelectionEnabled]);

  // Handle state changes with persistence
  const handleColumnSizingChange = useCallback<OnChangeFn<ColumnSizingState>>(
    (updaterOrValue) => {
      if (isPersistenceEnabled) {
        const newValue =
          typeof updaterOrValue === 'function' ? updaterOrValue(persistedState.columnSizing ?? {}) : updaterOrValue;
        setPersistenceState({ columnSizing: newValue });
      }
      onColumnSizingChange?.(updaterOrValue);
    },
    [isPersistenceEnabled, onColumnSizingChange, persistedState.columnSizing, setPersistenceState]
  );

  const handleColumnVisibilityChange = useCallback<OnChangeFn<VisibilityState>>(
    (updaterOrValue) => {
      if (isPersistenceEnabled) {
        const newValue =
          typeof updaterOrValue === 'function' ? updaterOrValue(persistedState.columnVisibility ?? {}) : updaterOrValue;
        setPersistenceState({ columnVisibility: newValue });
      }
      onColumnVisibilityChange?.(updaterOrValue);
    },
    [isPersistenceEnabled, onColumnVisibilityChange, persistedState.columnVisibility, setPersistenceState]
  );

  const handleColumnOrderChange = useCallback<OnChangeFn<ColumnOrderState>>(
    (updaterOrValue) => {
      if (isPersistenceEnabled) {
        const newValue =
          typeof updaterOrValue === 'function' ? updaterOrValue(persistedState.columnOrder ?? []) : updaterOrValue;
        setPersistenceState({ columnOrder: newValue });
      }
      onColumnOrderChange?.(updaterOrValue);
    },
    [isPersistenceEnabled, onColumnOrderChange, persistedState.columnOrder, setPersistenceState]
  );

  const handleSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updaterOrValue) => {
      if (isPersistenceEnabled) {
        const newValue =
          typeof updaterOrValue === 'function' ? updaterOrValue(persistedState.sorting ?? []) : updaterOrValue;
        setPersistenceState({ sorting: newValue });
      }
      onSortingChange?.(updaterOrValue);
    },
    [isPersistenceEnabled, onSortingChange, persistedState.sorting, setPersistenceState]
  );

  // Initialize TanStack Table
  const resolvedColumnOrder =
    isPersistenceEnabled && persistedState.columnOrder ? persistedState.columnOrder : controlledState?.columnOrder;
  const resolvedColumnSizing =
    isPersistenceEnabled && persistedState.columnSizing ? persistedState.columnSizing : controlledState?.columnSizing;
  const resolvedColumnVisibility =
    isPersistenceEnabled && persistedState.columnVisibility
      ? persistedState.columnVisibility
      : controlledState?.columnVisibility;
  const resolvedSorting =
    isPersistenceEnabled && persistedState.sorting ? persistedState.sorting : controlledState?.sorting;

  const tableState: {
    columnFilters?: ColumnFiltersState;
    columnOrder?: ColumnOrderState;
    columnSizing?: ColumnSizingState;
    columnVisibility?: VisibilityState;
    globalFilter?: string;
    pagination?: PaginationState;
    rowSelection?: RowSelectionState;
    sorting?: SortingState;
  } = {
    ...(controlledState?.columnFilters !== undefined && {
      columnFilters: controlledState.columnFilters,
    }),
    ...(controlledState?.globalFilter !== undefined && {
      globalFilter: controlledState.globalFilter,
    }),
    ...(controlledState?.pagination !== undefined && {
      pagination: controlledState.pagination,
    }),
    ...(resolvedSorting !== undefined && {
      sorting: resolvedSorting,
    }),
    ...(controlledState?.rowSelection !== undefined && {
      rowSelection: controlledState.rowSelection,
    }),
    ...(resolvedColumnOrder !== undefined && {
      columnOrder: resolvedColumnOrder,
    }),
    ...(resolvedColumnSizing !== undefined && {
      columnSizing: resolvedColumnSizing,
    }),
    ...(resolvedColumnVisibility !== undefined && {
      columnVisibility: resolvedColumnVisibility,
    }),
  };

  // Server-side pagination is enabled when pageCount is provided
  // This enables manualPagination mode and passes pageCount to the table
  const isServerSidePagination = pageCount !== undefined;

  const table = useReactTable({
    columnResizeMode: 'onChange',
    columns,
    data,
    enableColumnResizing: isColumnResizingEnabled,
    enableRowSelection: isRowSelectionEnabled,
    enableSorting: isSortingEnabled,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Only use client-side pagination row model when NOT in server-side mode
    getPaginationRowModel: isPaginationEnabled && !isServerSidePagination ? getPaginationRowModel() : undefined,
    getRowId,
    getSortedRowModel: isSortingEnabled ? getSortedRowModel() : undefined,
    globalFilterFn: filterFns.includesString,
    // Server-side pagination requires manualPagination: true
    // Client-side pagination with isPaginationEnabled uses manualPagination: false
    // When pagination is disabled entirely, manualPagination is true (no pagination row model)
    manualPagination: isServerSidePagination || !isPaginationEnabled,
    onColumnFiltersChange,
    onColumnOrderChange: handleColumnOrderChange,
    onColumnSizingChange: handleColumnSizingChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onGlobalFilterChange: onGlobalFilterChange as OnChangeFn<string>,
    onPaginationChange,
    onRowSelectionChange,
    onSortingChange: handleSortingChange,
    // pageCount is required for server-side pagination to calculate page boundaries
    ...(isServerSidePagination && { pageCount }),
    state: tableState,
  });

  // Get rows for display
  const rows = table.getRowModel().rows ?? [];
  const isHasRows = rows.length > 0;
  const isHasData = data.length > 0;
  const isShowNoResults = !isLoading && isHasData && !isHasRows;
  const isShowNoData = !isLoading && !isHasData;
  const isShowTable = !isLoading && isHasRows;

  // Calculate column count for skeleton
  const columnCount = columns.length + (actions ? 1 : 0);

  // Show loading skeleton while persistence is loading
  const isShowSkeleton = isLoading || (isPersistenceEnabled && !isPersistenceLoaded);

  // Derived state for empty states
  const isShowNoResultsEmptyState = isShowNoResults && !!emptyState?.noResults;
  const isShowNoDataEmptyState = isShowNoData && !!emptyState?.noData;
  const isShowDefaultEmptyState = (isShowNoResults || isShowNoData) && !emptyState;

  // Handle row click
  const handleRowClick = useCallback(
    (row: Row<TData>) => {
      onRowClick?.(row);
    },
    [onRowClick]
  );

  // Track whether a column is being resized for memoization
  const isResizing = !!table.getState().columnSizingInfo.isResizingColumn;

  // Detect if any visible column is marked as a filler column
  const hasFillerColumn = useMemo(() => {
    return table.getVisibleLeafColumns().some((column) => column.columnDef.meta?.isFillerColumn === true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, table.getState().columnVisibility]);

  // Get table style with CSS variables for column widths
  // Using CSS variables enables performant 60fps column resizing without re-rendering cells
  // See: https://tanstack.com/table/latest/docs/guide/column-sizing#advanced-column-resizing-performance
  const tableStyle = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: Record<string, number | string> = {
      '--table-width': `${table.getTotalSize()}px`,
    };
    for (const header of headers) {
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes as CSSProperties;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnSizingInfo, table.getState().columnSizing, table.getState().columnVisibility]);

  return (
    <div className={cn(dataTableContainerVariants({ density }), className)} ref={ref} {...props}>
      {/* Toolbar */}
      {isToolbarVisible && (
        <DataTableToolbar
          onGlobalFilterChange={onGlobalFilterChange}
          searchPlaceholder={searchPlaceholder}
          size={density === 'compact' ? 'sm' : density === 'comfortable' ? 'lg' : 'default'}
          table={table}
        >
          {toolbarContent}
        </DataTableToolbar>
      )}

      {/* Loading Skeleton */}
      {isShowSkeleton && (
        <DataTableSkeleton
          columnCount={loadingProps?.columnCount ?? columnCount}
          density={density}
          rowCount={loadingProps?.rowCount ?? 5}
          showHeader={loadingProps?.showHeader ?? true}
        />
      )}

      {/* Table Container */}
      {!isShowSkeleton && (
        <div className={'overflow-auto rounded-md border border-border'} ref={tableContainerRef}>
          <table
            className={cn(dataTableVariants({ density }))}
            style={{
              ...tableStyle,
              // When a filler column exists, use 100% width so the filler can expand
              // minWidth ensures horizontal scroll when columns exceed container
              minWidth: 'var(--table-width)',
              width: hasFillerColumn ? '100%' : 'var(--table-width)',
            }}
          >
            {/* Table Header */}
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const headerClassName = header.column.columnDef.meta?.headerClassName;
                    const isFillerColumn = header.column.columnDef.meta?.isFillerColumn === true;

                    return (
                      <th
                        className={cn(dataTableHeaderCellVariants({ density }), headerClassName)}
                        colSpan={header.colSpan}
                        key={header.id}
                        style={
                          // Filler columns don't get fixed width - they expand to fill remaining space
                          isFillerColumn ? undefined : { width: `calc(var(--col-${header.column.id}-size) * 1px)` }
                        }
                      >
                        {/* Draggable Header Content */}
                        <DataTableDraggableHeader
                          header={header}
                          isReorderEnabled={isColumnReorderEnabled}
                          table={table}
                        />

                        {/* Resize Handle - not shown for filler columns */}
                        {header.column.getCanResize() && !isFillerColumn && <DataTableResizeHandle header={header} />}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Table Body - Uses memoized version during resize for 60fps performance */}
            <tbody>
              {isShowTable &&
                (isResizing ? (
                  <MemoizedDataTableBody
                    density={density}
                    isClickable={!!onRowClick}
                    onRowClick={handleRowClick}
                    rows={rows}
                    rowStyleCallback={rowStyleCallback}
                  />
                ) : (
                  <DataTableBody
                    density={density}
                    isClickable={!!onRowClick}
                    onRowClick={handleRowClick}
                    rows={rows}
                    rowStyleCallback={rowStyleCallback}
                  />
                ))}
            </tbody>
          </table>

          {/* No Results Empty State */}
          {isShowNoResultsEmptyState && (
            <div className={'py-8'}>
              <EmptyState
                action={emptyState!.noResults!.action}
                description={emptyState!.noResults!.description}
                icon={emptyState!.noResults!.icon}
                title={emptyState!.noResults!.title}
              />
            </div>
          )}

          {/* No Data Empty State */}
          {isShowNoDataEmptyState && (
            <div className={'py-8'}>
              <EmptyState
                action={emptyState!.noData.action}
                description={emptyState!.noData.description}
                icon={emptyState!.noData.icon}
                title={emptyState!.noData.title}
              />
            </div>
          )}

          {/* Default Empty State */}
          {isShowDefaultEmptyState && (
            <div className={'py-8'}>
              <EmptyState
                description={isShowNoResults ? 'Try adjusting your search or filters.' : undefined}
                title={isShowNoResults ? 'No results found' : 'No data'}
              />
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {isPaginationEnabled && !isShowSkeleton && (
        <DataTablePagination
          pageSizeOptions={pageSizeOptions}
          rowCount={rowCount}
          size={density === 'compact' ? 'sm' : density === 'comfortable' ? 'lg' : 'default'}
          table={table}
        />
      )}
    </div>
  );
};
