import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

// =============================================================================
// Column Definition Types
// =============================================================================

/**
 * Extended column definition with additional metadata for the DataTable system.
 * Extends TanStack Table's ColumnDef with custom properties for filtering and hiding.
 *
 * @template TData - The type of data for each row
 * @template TValue - The type of value for this column (defaults to unknown)
 */
export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<
  TData,
  TValue
> & {
  /**
   * Whether this column can be filtered using the column filter.
   * When true, the column will appear in filter options.
   * @default true
   */
  enableColumnFilter?: boolean;

  /**
   * Whether this column can be hidden via the column visibility toggle.
   * When false, the column will always be visible and not appear in the visibility menu.
   * @default true
   */
  enableHiding?: boolean;
};

// =============================================================================
// Table State Types
// =============================================================================

/**
 * Table density variants controlling row height and cell padding.
 *
 * - `default`: Standard padding, suitable for most use cases
 * - `compact`: Reduced padding for data-dense views
 * - `comfortable`: Increased padding for better readability
 */
export type DataTableDensity = "comfortable" | "compact" | "default";

/**
 * Extended empty state props for filtered results.
 * Includes separate configuration for when filters produce no results.
 */
export interface DataTableEmptyStateConfig {
  /**
   * Empty state shown when the data array is empty (no filters applied).
   */
  noData: DataTableEmptyStateProps;

  /**
   * Empty state shown when filters produce no matching results.
   * If not provided, falls back to noData configuration.
   */
  noResults?: DataTableEmptyStateProps;
}

// =============================================================================
// Persistence Types
// =============================================================================

/**
 * Props for configuring the table empty state display.
 * Shown when the table has no data or no results match filters.
 */
export interface DataTableEmptyStateProps {
  /**
   * Optional action element (e.g., a button to add the first item).
   */
  action?: ReactNode;

  /**
   * Description text shown below the title.
   */
  description?: string;

  /**
   * Icon component to display above the title.
   */
  icon?: ReactNode;

  /**
   * Primary message to display.
   */
  title: string;
}

/**
 * Props for configuring the table loading skeleton.
 */
export interface DataTableLoadingProps {
  /**
   * Number of skeleton columns to display.
   * If not provided, uses the actual column count.
   */
  columnCount?: number;

  /**
   * Number of skeleton rows to display.
   * @default 5
   */
  rowCount?: number;

  /**
   * Whether to show the header skeleton.
   * @default true
   */
  showHeader?: boolean;
}

// =============================================================================
// Density & Styling Types
// =============================================================================

/**
 * Configuration for table state persistence via electron-store.
 */
export interface DataTablePersistenceConfig {
  /**
   * Enable or disable persistence entirely.
   * @default true when tableId is provided
   */
  enabled?: boolean;

  /**
   * Array of state keys to persist.
   * Only these keys will be saved to and restored from storage.
   * @default ['columnOrder', 'columnVisibility', 'columnSizing']
   */
  persistedKeys?: Array<PersistableStateKey>;

  /**
   * Unique identifier for this table instance.
   * Used as the storage key in electron-store.
   * Required for persistence to work.
   */
  tableId: string;
}

/** Union of all row action types */
export type DataTableRowAction<TData> =
  | DataTableRowActionButton<TData>
  | DataTableRowActionLink<TData>
  | DataTableRowActionSeparator;

// =============================================================================
// Empty State Types
// =============================================================================

/** Button action that triggers a callback */
export interface DataTableRowActionButton<TData>
  extends DataTableRowActionBase<TData> {
  /** Label text for the action */
  label: string;

  /** Callback when action is triggered */
  onAction: (row: Row<TData>) => void;

  /** Action type identifier */
  type: "button";

  /** Visual variant for the action */
  variant?: "default" | "destructive";
}

/** Link action that navigates to a URL */
export interface DataTableRowActionLink<TData>
  extends DataTableRowActionBase<TData> {
  /** Function to generate the href from row data */
  href: (row: Row<TData>) => string;

  /** Label text for the action */
  label: string;

  /** Action type identifier */
  type: "link";
}

// =============================================================================
// Loading State Types
// =============================================================================

/** Separator between action groups */
export interface DataTableRowActionSeparator {
  /** Action type identifier */
  type: "separator";
}

// =============================================================================
// Row Action Types
// =============================================================================

/**
 * Callback function for conditional row styling.
 * Returns CSS class names to apply to a table row based on its data.
 *
 * @template TData - The type of data for each row
 * @param row - The TanStack Table row object
 * @returns CSS class string or undefined for no additional styling
 *
 * @example
 * ```tsx
 * const rowStyleCallback: DataTableRowStyleCallback<User> = (row) => {
 *   if (row.original.status === 'inactive') {
 *     return 'opacity-50';
 *   }
 *   return undefined;
 * };
 * ```
 */
export type DataTableRowStyleCallback<TData> = (
  row: Row<TData>
) => string | undefined;

/**
 * Represents the complete state of a DataTable.
 * Combines all TanStack Table state slices into a single interface.
 */
export interface DataTableState {
  /** Column filter state - per-column filter values */
  columnFilters: ColumnFiltersState;

  /** Column order state - array of column IDs in display order */
  columnOrder: ColumnOrderState;

  /** Column sizing state - map of column IDs to pixel widths */
  columnSizing: ColumnSizingState;

  /** Column visibility state - map of column IDs to visibility boolean */
  columnVisibility: VisibilityState;

  /** Global filter value - applies to all filterable columns */
  globalFilter: string;

  /** Pagination state - current page index and page size */
  pagination: PaginationState;

  /** Row selection state - map of row IDs to selection boolean */
  rowSelection: RowSelectionState;

  /** Sorting state - array of column sort descriptors */
  sorting: SortingState;
}

/**
 * Partial table state for controlled updates.
 * All fields are optional for selective state management.
 */
export type PartialDataTableState = Partial<DataTableState>;

/** Keys that can be persisted to electron-store */
export type PersistableStateKey =
  | "columnFilters"
  | "columnOrder"
  | "columnSizing"
  | "columnVisibility"
  | "globalFilter"
  | "pagination"
  | "sorting";

/** Base action type for row actions */
interface DataTableRowActionBase<TData> {
  /** Whether the action is currently disabled */
  disabled?: ((row: Row<TData>) => boolean) | boolean;

  /** Icon component to display */
  icon?: ReactNode;

  /** Keyboard shortcut hint (e.g., "⌘E") */
  shortcut?: string;
}

// =============================================================================
// Column Meta Extension
// =============================================================================

/**
 * Module augmentation to extend TanStack Table's ColumnMeta interface.
 * This adds custom metadata fields that can be accessed on any column.
 */
declare module "@tanstack/react-table" {
  // These generics are required by TanStack Table's interface signature
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** CSS class name to apply to cell elements */
    cellClassName?: string;

    /** CSS class name to apply to header elements */
    headerClassName?: string;
  }
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Extract the row data type from a column definition array.
 *
 * @example
 * ```tsx
 * const columns: DataTableColumnDef<User>[] = [...];
 * type RowType = ExtractRowType<typeof columns>; // User
 * ```
 */
export type ExtractRowType<T> =
  T extends Array<DataTableColumnDef<infer TData, unknown>> ? TData : never;
