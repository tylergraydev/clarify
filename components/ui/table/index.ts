// =============================================================================
// Table Components - Barrel Export
// =============================================================================

/**
 * This file provides a clean public API for all table-related components,
 * types, utilities, and hooks. Consumers can import from '@/components/ui/table'.
 *
 * @example
 * ```tsx
 * import {
 *   DataTable,
 *   DataTableColumnHeader,
 *   DataTablePagination,
 *   createColumnHelper,
 *   textColumn,
 *   type DataTableColumnDef,
 * } from '@/components/ui/table';
 * ```
 */

// =============================================================================
// Column Helpers
// =============================================================================

export {
  actionsColumn,
  createColumnHelper,
  dateColumn,
  numberColumn,
  selectColumn,
  statusColumn,
  textColumn,
} from './column-helpers';

export type {
  ActionsColumnOptions,
  DateColumnOptions,
  NumberColumnOptions,
  SelectColumnOptions,
  StatusColumnOptions,
  StatusConfig,
  TextColumnOptions,
} from './column-helpers';

// =============================================================================
// Main DataTable Component
// =============================================================================

export {
  DataTable,
  dataTableCellVariants,
  dataTableContainerVariants,
  dataTableHeaderCellVariants,
  dataTableRowVariants,
  dataTableVariants,
} from './data-table';

// Default export for convenience
export { DataTable as default } from './data-table';

// =============================================================================
// Sub-Components
// =============================================================================

export { DataTableColumnHeader, dataTableColumnHeaderVariants } from './data-table-column-header';

export {
  DataTableDraggableHeader,
  dataTableDraggableHeaderVariants,
  dataTableDropIndicatorVariants,
} from './data-table-draggable-header';

export {
  DataTablePagination,
  dataTablePaginationButtonVariants,
  dataTablePaginationVariants,
} from './data-table-pagination';

export { DataTableResizeHandle, dataTableResizeHandleVariants } from './data-table-resize-handle';

export { DataTableRowActions, dataTableRowActionsButtonVariants } from './data-table-row-actions';

export {
  DataTableSkeleton,
  dataTableSkeletonCellVariants,
  dataTableSkeletonHeaderVariants,
  dataTableSkeletonRowVariants,
} from './data-table-skeleton';

export { DataTableToolbar, dataTableToolbarButtonVariants, dataTableToolbarVariants } from './data-table-toolbar';

// =============================================================================
// Types
// =============================================================================

export type {
  DataTableColumnDef,
  DataTableDensity,
  DataTableEmptyStateConfig,
  DataTableEmptyStateProps,
  DataTableLoadingProps,
  DataTablePersistenceConfig,
  DataTableRowAction,
  DataTableRowActionButton,
  DataTableRowActionLink,
  DataTableRowActionSeparator,
  DataTableRowStyleCallback,
  DataTableState,
  ExtractRowType,
  PartialDataTableState,
  PersistableStateKey,
} from './types';

// =============================================================================
// Hooks
// =============================================================================

export { getDefaultPersistedKeys, isPersistableStateKey, useTablePersistence } from '@/hooks/use-table-persistence';

export type { UseTablePersistenceOptions, UseTablePersistenceReturn } from '@/hooks/use-table-persistence';
