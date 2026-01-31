'use client';

import type { Header, Table } from '@tanstack/react-table';
import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// =============================================================================
// CVA Variants
// =============================================================================

export const dataTableResizeHandleVariants = cva(
  `
    absolute top-0 -right-px z-10 h-full w-2 cursor-col-resize touch-none
    transition-colors select-none
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
  `,
  {
    defaultVariants: {
      isResizing: false,
    },
    variants: {
      isResizing: {
        false: 'bg-border/40 hover:bg-accent/70',
        true: 'bg-accent',
      },
    },
  }
);

// =============================================================================
// Component Types
// =============================================================================

interface DataTableResizeHandleProps<TData>
  extends
    Omit<ComponentPropsWithRef<'div'>, 'onMouseDown' | 'onTouchStart'>,
    VariantProps<typeof dataTableResizeHandleVariants> {
  /**
   * The TanStack Table header instance.
   * Used to access resize handler and resizing state.
   */
  header: Header<TData, unknown>;

  /**
   * The TanStack Table instance.
   * Used to access columnSizingInfo for the resize indicator offset.
   */
  table: Table<TData>;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DataTableResizeHandle provides a draggable handle for column width adjustment.
 * Positioned at the right edge of header cells, it becomes visible on hover
 * and shows a visual indicator during active resize operations.
 *
 * @example
 * ```tsx
 * // Usage in table header cell
 * <th className="group relative">
 *   <DataTableColumnHeader column={header.column} title="Name" />
 *   {header.column.getCanResize() && (
 *     <DataTableResizeHandle header={header} table={table} />
 *   )}
 * </th>
 * ```
 *
 * @example
 * ```tsx
 * // Full header row implementation
 * {table.getHeaderGroups().map((headerGroup) => (
 *   <tr key={headerGroup.id}>
 *     {headerGroup.headers.map((header) => (
 *       <th
 *         key={header.id}
 *         className="group relative"
 *         style={{ width: header.getSize() }}
 *       >
 *         {flexRender(header.column.columnDef.header, header.getContext())}
 *         {header.column.getCanResize() && (
 *           <DataTableResizeHandle header={header} table={table} />
 *         )}
 *       </th>
 *     ))}
 *   </tr>
 * ))}
 * ```
 */
export const DataTableResizeHandle = <TData,>({
  className,
  header,
  ref,
  table,
  ...props
}: DataTableResizeHandleProps<TData>) => {
  const isResizing = header.column.getIsResizing();
  const { deltaOffset } = table.getState().columnSizingInfo;

  // Calculate transform for resize indicator during active resize
  const getTransformStyle = (): string => {
    if (!isResizing) return '';
    return `translateX(${deltaOffset ?? 0}px)`;
  };

  return (
    <div
      aria-label={'Resize column'}
      className={cn(dataTableResizeHandleVariants({ isResizing }), className)}
      onDoubleClick={() => header.column.resetSize()}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      ref={ref}
      role={'separator'}
      style={{
        transform: getTransformStyle(),
      }}
      tabIndex={0}
      {...props}
    />
  );
};
