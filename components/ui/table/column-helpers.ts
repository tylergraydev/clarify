import type { AccessorFnColumnDef, CellContext, ColumnDef, Row } from '@tanstack/react-table';
import type { ReactNode } from 'react';

import type { DataTableColumnDef, DataTableRowAction } from './types';

// =============================================================================
// Column Helper Factory Types
// =============================================================================

/**
 * Options for the actions column helper.
 */
export interface ActionsColumnOptions<TData> {
  /**
   * Array of row actions to display.
   * Can be a static array or a function that receives the row.
   */
  actions?: ((row: Row<TData>) => Array<DataTableRowAction<TData>>) | Array<DataTableRowAction<TData>>;

  /**
   * Custom cell renderer.
   * If provided, overrides the default row actions dropdown.
   */
  cell?: ColumnDef<TData, unknown>['cell'];

  /**
   * Custom header text or renderer.
   * @default '' (empty)
   */
  header?: ColumnDef<TData, unknown>['header'];

  /**
   * The column ID.
   * @default 'actions'
   */
  id?: string;

  /**
   * The column width in pixels.
   * @default 60
   */
  size?: number;
}

/**
 * Options for the date column helper.
 */
export interface DateColumnOptions<TData, TValue> extends Omit<
  DataTableColumnDef<TData, TValue>,
  'accessorFn' | 'accessorKey' | 'sortingFn'
> {
  /**
   * Accessor function to get the date value from the row.
   * Required if accessorKey is not a direct Date field.
   */
  accessor?: (row: TData) => Date | null | string | undefined;

  /**
   * Key to access the date value on the row data.
   */
  accessorKey?: keyof TData & string;

  /**
   * Custom date formatting function.
   * @default Uses toLocaleDateString()
   */
  formatDate?: (date: Date) => ReactNode;
}

// =============================================================================
// Selection Column Types
// =============================================================================

/**
 * Options for the number column helper.
 */
export interface NumberColumnOptions<TData, TValue> extends Omit<
  DataTableColumnDef<TData, TValue>,
  'accessorFn' | 'accessorKey'
> {
  /**
   * Accessor function to get the number value from the row.
   */
  accessor?: (row: TData) => TValue;

  /**
   * Key to access the number value on the row data.
   */
  accessorKey?: keyof TData & string;

  /**
   * Custom number formatting function.
   */
  formatNumber?: (value: number) => ReactNode;

  /**
   * Locale for number formatting.
   * @default 'en-US'
   */
  locale?: string;

  /**
   * Number format options for Intl.NumberFormat.
   */
  numberFormatOptions?: Intl.NumberFormatOptions;
}

// =============================================================================
// Actions Column Types
// =============================================================================

/**
 * Options for the select column helper.
 */
export interface SelectColumnOptions<TData> {
  /**
   * Whether to allow selecting all rows on the current page.
   * @default true
   */
  enableSelectAll?: boolean;

  /**
   * Custom header cell renderer.
   * If not provided, renders a checkbox that selects all rows.
   */
  header?: ColumnDef<TData, unknown>['header'];

  /**
   * The column ID.
   * @default 'select'
   */
  id?: string;

  /**
   * The column width in pixels.
   * @default 40
   */
  size?: number;
}

// =============================================================================
// Date Column Types
// =============================================================================

/**
 * Options for the status column helper.
 */
export interface StatusColumnOptions<TData, TValue> extends Omit<
  DataTableColumnDef<TData, TValue>,
  'accessorFn' | 'accessorKey'
> {
  /**
   * Accessor function to get the status value from the row.
   */
  accessor?: (row: TData) => TValue;

  /**
   * Key to access the status value on the row data.
   */
  accessorKey?: keyof TData & string;

  /**
   * Map of status values to their display configuration.
   * Keys should match possible status values.
   */
  statusConfig?: Record<string, StatusConfig>;
}

// =============================================================================
// Status Column Types
// =============================================================================

/**
 * Status configuration for the status column.
 */
export interface StatusConfig {
  /**
   * Display label for this status.
   * If not provided, the status key is used.
   */
  label?: string;

  /**
   * Badge variant to use for this status.
   */
  variant?: string;
}

/**
 * Options for the text column helper.
 */
export interface TextColumnOptions<TData, TValue> extends Omit<
  DataTableColumnDef<TData, TValue>,
  'accessorFn' | 'accessorKey' | 'sortingFn'
> {
  /**
   * Accessor function to get the text value from the row.
   */
  accessor?: (row: TData) => TValue;

  /**
   * Key to access the text value on the row data.
   */
  accessorKey?: keyof TData & string;

  /**
   * Whether to enable case-insensitive sorting.
   * @default true
   */
  caseInsensitive?: boolean;

  /**
   * Custom text formatting function.
   */
  formatText?: (value: TValue) => ReactNode;

  /**
   * Maximum length to display before truncating.
   * If set, adds text-ellipsis truncation.
   */
  maxLength?: number;
}

// =============================================================================
// Text Column Types
// =============================================================================

/**
 * Options for accessor columns created via the column helper.
 */
type AccessorColumnOptions<TData, TValue> = Omit<
  DataTableColumnDef<TData, TValue>,
  'accessorFn' | 'accessorKey' | 'id'
>;

// =============================================================================
// Number Column Types
// =============================================================================

/**
 * Options for display columns created via the column helper.
 */
type DisplayColumnOptions<TData> = Omit<DataTableColumnDef<TData, unknown>, 'accessorFn' | 'accessorKey'> & {
  id: string;
};

// =============================================================================
// Column Helper Factory
// =============================================================================

/**
 * Creates a row actions column with fixed width and no sorting.
 * Designed for rendering a dropdown menu with row-specific actions.
 *
 * @template TData - The type of data for each row
 * @param options - Optional configuration for the actions column
 * @returns A column definition for row actions
 *
 * @example
 * ```tsx
 * // Basic usage with actions array
 * const columns = [
 *   // ... data columns
 *   actionsColumn<User>({
 *     actions: [
 *       { type: 'button', label: 'Edit', onAction: (row) => handleEdit(row) },
 *       { type: 'separator' },
 *       { type: 'button', label: 'Delete', variant: 'destructive', onAction: (row) => handleDelete(row) },
 *     ],
 *   }),
 * ];
 *
 * // With dynamic actions based on row
 * const columns = [
 *   // ... data columns
 *   actionsColumn<User>({
 *     actions: (row) => [
 *       { type: 'button', label: 'Edit', onAction: () => handleEdit(row) },
 *       ...(row.original.canDelete
 *         ? [{ type: 'button' as const, label: 'Delete', onAction: () => handleDelete(row) }]
 *         : []),
 *     ],
 *   }),
 * ];
 *
 * // With custom cell renderer
 * const columns = [
 *   // ... data columns
 *   actionsColumn<User>({
 *     cell: ({ row }) => <MyCustomActions row={row} />,
 *   }),
 * ];
 * ```
 */
export function actionsColumn<TData>(options: ActionsColumnOptions<TData> = {}): DataTableColumnDef<TData, unknown> {
  const { actions, cell, header = '', id = 'actions', size = 60 } = options;

  return {
    cell:
      cell ??
      (({ row }: CellContext<TData, unknown>) => {
        // Return actions data for rendering by the DataTableRowActions component
        const resolvedActions = typeof actions === 'function' ? actions(row) : (actions ?? []);
        return {
          actions: resolvedActions,
          row,
          type: 'row-actions' as const,
        };
      }),
    enableColumnFilter: false,
    enableHiding: false,
    enableResizing: false,
    enableSorting: false,
    header,
    id,
    meta: {
      cellClassName: 'text-right',
      headerClassName: 'text-right',
    },
    size,
  };
}

// =============================================================================
// Selection Column Helper
// =============================================================================

/**
 * Creates a column helper factory for type-safe column definitions.
 * Matches TanStack Table's createColumnHelper pattern for consistency.
 *
 * @template TData - The type of data for each row
 * @returns A column helper with accessor and display methods
 *
 * @example
 * ```tsx
 * type User = {
 *   id: string;
 *   name: string;
 *   email: string;
 *   createdAt: Date;
 * };
 *
 * const columnHelper = createColumnHelper<User>();
 *
 * const columns = [
 *   columnHelper.accessor('name', {
 *     header: 'Name',
 *     cell: (info) => info.getValue(),
 *   }),
 *   columnHelper.accessor((row) => row.email, {
 *     id: 'email',
 *     header: 'Email',
 *   }),
 *   columnHelper.display({
 *     id: 'actions',
 *     cell: ({ row }) => <button>Edit {row.original.name}</button>,
 *   }),
 * ];
 * ```
 */
export function createColumnHelper<TData>() {
  return {
    /**
     * Creates an accessor column definition.
     * Supports both string accessor keys and accessor functions.
     */
    accessor: <TValue>(
      accessor: ((row: TData) => TValue) | (keyof TData & string),
      options: AccessorColumnOptions<TData, TValue> = {}
    ): DataTableColumnDef<TData, TValue> => {
      if (typeof accessor === 'function') {
        return {
          accessorFn: accessor,
          ...options,
        } as AccessorFnColumnDef<TData, TValue> & DataTableColumnDef<TData, TValue>;
      }

      return {
        accessorKey: accessor,
        ...options,
      } as DataTableColumnDef<TData, TValue>;
    },

    /**
     * Creates a display column definition (non-accessor column).
     * Used for columns that don't map to data fields (e.g., actions, selection).
     */
    display: (options: DisplayColumnOptions<TData>): DataTableColumnDef<TData, unknown> => {
      return options as DataTableColumnDef<TData, unknown>;
    },
  };
}

// =============================================================================
// Actions Column Helper
// =============================================================================

/**
 * Creates a date column with proper datetime sorting.
 * Automatically handles Date objects and string dates.
 *
 * @template TData - The type of data for each row
 * @template TValue - The type of the date value
 * @param options - Configuration for the date column
 * @returns A column definition with datetime sorting
 *
 * @example
 * ```tsx
 * // Using accessor key
 * const columns = [
 *   dateColumn<User, Date>({
 *     accessorKey: 'createdAt',
 *     header: 'Created',
 *   }),
 * ];
 *
 * // Using accessor function
 * const columns = [
 *   dateColumn<User, Date>({
 *     accessor: (row) => row.metadata?.lastLogin,
 *     id: 'lastLogin',
 *     header: 'Last Login',
 *   }),
 * ];
 *
 * // With custom formatting
 * const columns = [
 *   dateColumn<User, Date>({
 *     accessorKey: 'createdAt',
 *     header: 'Created',
 *     formatDate: (date) => format(date, 'MMM d, yyyy'),
 *   }),
 * ];
 * ```
 */
export function dateColumn<TData, TValue = Date | null | string | undefined>(
  options: DateColumnOptions<TData, TValue>
): DataTableColumnDef<TData, TValue> {
  const { accessor, accessorKey, cell, formatDate, ...rest } = options;

  const defaultCell = ({ getValue }: CellContext<TData, TValue>): ReactNode => {
    const value = getValue();
    if (!value) return '-';

    const date = value instanceof Date ? value : new Date(value as string);
    if (isNaN(date.getTime())) return '-';

    if (formatDate) {
      return formatDate(date);
    }

    return date.toLocaleDateString();
  };

  const baseDef: Partial<DataTableColumnDef<TData, TValue>> = {
    cell: cell ?? defaultCell,
    sortingFn: 'datetime',
    ...rest,
  };

  if (accessor) {
    return {
      accessorFn: accessor as (row: TData) => TValue,
      ...baseDef,
    } as DataTableColumnDef<TData, TValue>;
  }

  return {
    accessorKey,
    ...baseDef,
  } as DataTableColumnDef<TData, TValue>;
}

// =============================================================================
// Date Column Helper
// =============================================================================

/**
 * Creates a number column with proper numeric sorting and formatting.
 *
 * @template TData - The type of data for each row
 * @template TValue - The type of the number value
 * @param options - Configuration for the number column
 * @returns A column definition with numeric sorting
 *
 * @example
 * ```tsx
 * // Basic usage
 * const columns = [
 *   numberColumn<Product, number>({
 *     accessorKey: 'price',
 *     header: 'Price',
 *     numberFormatOptions: { style: 'currency', currency: 'USD' },
 *   }),
 * ];
 *
 * // With custom formatting
 * const columns = [
 *   numberColumn<Stats, number>({
 *     accessorKey: 'percentage',
 *     header: 'Completion',
 *     formatNumber: (value) => `${value}%`,
 *   }),
 * ];
 *
 * // With accessor function
 * const columns = [
 *   numberColumn<Order, number>({
 *     accessor: (row) => row.items.reduce((sum, item) => sum + item.quantity, 0),
 *     id: 'totalItems',
 *     header: 'Total Items',
 *   }),
 * ];
 * ```
 */
export function numberColumn<TData, TValue = number>(
  options: NumberColumnOptions<TData, TValue>
): DataTableColumnDef<TData, TValue> {
  const { accessor, accessorKey, cell, formatNumber, locale = 'en-US', numberFormatOptions, ...rest } = options;

  const defaultCell = ({ getValue }: CellContext<TData, TValue>): ReactNode => {
    const value = getValue();
    if (value === null || value === undefined) return '-';

    const numValue = Number(value);
    if (isNaN(numValue)) return '-';

    if (formatNumber) {
      return formatNumber(numValue);
    }

    if (numberFormatOptions) {
      return new Intl.NumberFormat(locale, numberFormatOptions).format(numValue);
    }

    return numValue.toLocaleString(locale);
  };

  const baseDef: Partial<DataTableColumnDef<TData, TValue>> = {
    cell: cell ?? defaultCell,
    meta: {
      cellClassName: 'text-right tabular-nums',
      headerClassName: 'text-right',
      ...rest.meta,
    },
    ...rest,
  };

  if (accessor) {
    return {
      accessorFn: accessor,
      ...baseDef,
    } as DataTableColumnDef<TData, TValue>;
  }

  return {
    accessorKey,
    ...baseDef,
  } as DataTableColumnDef<TData, TValue>;
}

// =============================================================================
// Status Column Helper
// =============================================================================

/**
 * Creates a row selection checkbox column.
 * Automatically handles select all, individual selection, and indeterminate states.
 *
 * @template TData - The type of data for each row
 * @param options - Optional configuration for the selection column
 * @returns A column definition for row selection
 *
 * @example
 * ```tsx
 * // Basic usage
 * const columns = [
 *   selectColumn<User>(),
 *   // ... other columns
 * ];
 *
 * // With custom width
 * const columns = [
 *   selectColumn<User>({ size: 50 }),
 *   // ... other columns
 * ];
 *
 * // With custom ID
 * const columns = [
 *   selectColumn<User>({ id: 'row-select' }),
 *   // ... other columns
 * ];
 * ```
 */
export function selectColumn<TData>(options: SelectColumnOptions<TData> = {}): DataTableColumnDef<TData, unknown> {
  const { enableSelectAll = true, header, id = 'select', size = 40 } = options;

  return {
    cell: ({ row }: CellContext<TData, unknown>) => {
      // Uses the Checkbox component from @/components/ui/checkbox
      // Render via cell renderer to avoid direct component import
      return {
        checked: row.getIsSelected(),
        disabled: !row.getCanSelect(),
        indeterminate: row.getIsSomeSelected(),
        onCheckedChange: (checked: boolean) => row.toggleSelected(checked),
        type: 'checkbox' as const,
      };
    },
    enableColumnFilter: false,
    enableHiding: false,
    enableResizing: false,
    enableSorting: false,
    header:
      header ??
      (({ table }) => {
        if (!enableSelectAll) {
          return null;
        }

        return {
          checked: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
          onCheckedChange: (checked: boolean) => table.toggleAllPageRowsSelected(checked),
          type: 'checkbox' as const,
        };
      }),
    id,
    size,
  };
}

// =============================================================================
// Text Column Helper
// =============================================================================

/**
 * Creates a status column with Badge rendering.
 * Maps status values to badge variants and labels.
 *
 * @template TData - The type of data for each row
 * @template TValue - The type of the status value
 * @param options - Configuration for the status column
 * @returns A column definition with Badge rendering
 *
 * @example
 * ```tsx
 * // Basic usage
 * const columns = [
 *   statusColumn<User, string>({
 *     accessorKey: 'status',
 *     header: 'Status',
 *     statusConfig: {
 *       active: { variant: 'completed', label: 'Active' },
 *       inactive: { variant: 'default', label: 'Inactive' },
 *       pending: { variant: 'pending', label: 'Pending' },
 *     },
 *   }),
 * ];
 *
 * // With accessor function
 * const columns = [
 *   statusColumn<Workflow, WorkflowStatus>({
 *     accessor: (row) => row.currentStatus,
 *     id: 'workflowStatus',
 *     header: 'Workflow Status',
 *     statusConfig: {
 *       running: { variant: 'specialist', label: 'Running' },
 *       completed: { variant: 'completed', label: 'Completed' },
 *       failed: { variant: 'failed', label: 'Failed' },
 *     },
 *   }),
 * ];
 * ```
 */
export function statusColumn<TData, TValue = string>(
  options: StatusColumnOptions<TData, TValue>
): DataTableColumnDef<TData, TValue> {
  const { accessor, accessorKey, cell, statusConfig = {}, ...rest } = options;

  const defaultCell = ({ getValue }: CellContext<TData, TValue>): { label: string; type: 'badge'; variant: string } => {
    const value = getValue();
    const stringValue = String(value ?? '');
    const config = statusConfig[stringValue];

    return {
      label: config?.label ?? stringValue,
      type: 'badge' as const,
      variant: config?.variant ?? 'default',
    };
  };

  const baseDef: Partial<DataTableColumnDef<TData, TValue>> = {
    cell: cell ?? defaultCell,
    ...rest,
  };

  if (accessor) {
    return {
      accessorFn: accessor,
      ...baseDef,
    } as DataTableColumnDef<TData, TValue>;
  }

  return {
    accessorKey,
    ...baseDef,
  } as DataTableColumnDef<TData, TValue>;
}

// =============================================================================
// Number Column Helper
// =============================================================================

/**
 * Creates a text column with proper text sorting function.
 * Supports case-insensitive sorting and optional truncation.
 *
 * @template TData - The type of data for each row
 * @template TValue - The type of the text value
 * @param options - Configuration for the text column
 * @returns A column definition with text sorting
 *
 * @example
 * ```tsx
 * // Basic usage
 * const columns = [
 *   textColumn<User, string>({
 *     accessorKey: 'name',
 *     header: 'Name',
 *   }),
 * ];
 *
 * // With truncation
 * const columns = [
 *   textColumn<User, string>({
 *     accessorKey: 'description',
 *     header: 'Description',
 *     maxLength: 50,
 *   }),
 * ];
 *
 * // With custom formatting
 * const columns = [
 *   textColumn<User, string>({
 *     accessorKey: 'email',
 *     header: 'Email',
 *     formatText: (email) => (
 *       <a href={`mailto:${email}`} className="text-accent hover:underline">
 *         {email}
 *       </a>
 *     ),
 *   }),
 * ];
 *
 * // Case-sensitive sorting
 * const columns = [
 *   textColumn<User, string>({
 *     accessorKey: 'code',
 *     header: 'Code',
 *     caseInsensitive: false,
 *   }),
 * ];
 * ```
 */
export function textColumn<TData, TValue = string>(
  options: TextColumnOptions<TData, TValue>
): DataTableColumnDef<TData, TValue> {
  const { accessor, accessorKey, caseInsensitive = true, cell, formatText, maxLength, ...rest } = options;

  const defaultCell = ({ getValue }: CellContext<TData, TValue>): ReactNode => {
    const value = getValue();
    if (value === null || value === undefined) return '-';

    if (formatText) {
      return formatText(value);
    }

    const stringValue = String(value);

    if (maxLength && stringValue.length > maxLength) {
      // Return truncated text with ellipsis
      // For tooltip support, use the Tooltip component in formatText
      return `${stringValue.slice(0, maxLength)}...`;
    }

    return stringValue;
  };

  const baseDef: Partial<DataTableColumnDef<TData, TValue>> = {
    cell: cell ?? defaultCell,
    sortingFn: caseInsensitive ? 'alphanumericCaseSensitive' : 'alphanumeric',
    ...rest,
  };

  if (accessor) {
    return {
      accessorFn: accessor,
      ...baseDef,
    } as DataTableColumnDef<TData, TValue>;
  }

  return {
    accessorKey,
    ...baseDef,
  } as DataTableColumnDef<TData, TValue>;
}
