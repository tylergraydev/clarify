'use client';

import type { Header, Table } from '@tanstack/react-table';
import type { ComponentPropsWithRef, DragEvent } from 'react';

import { flexRender } from '@tanstack/react-table';
import { cva, type VariantProps } from 'class-variance-authority';
import { useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

// =============================================================================
// CVA Variants
// =============================================================================

export const dataTableDraggableHeaderVariants = cva(
  `
    relative transition-opacity duration-150
  `,
  {
    defaultVariants: {
      isDragging: false,
      isDragOver: false,
    },
    variants: {
      isDragging: {
        false: '',
        true: 'opacity-50',
      },
      isDragOver: {
        false: '',
        true: '',
      },
    },
  }
);

export const dataTableDropIndicatorVariants = cva(
  `
    pointer-events-none absolute top-0 h-full w-0.5 bg-accent
  `,
  {
    defaultVariants: {
      position: 'left',
    },
    variants: {
      position: {
        left: 'left-0',
        right: 'right-0',
      },
    },
  }
);

// =============================================================================
// Component Types
// =============================================================================

interface DataTableDraggableHeaderProps<TData>
  extends Omit<ComponentPropsWithRef<'div'>, 'onDrag' | 'onDragEnd' | 'onDragOver' | 'onDragStart' | 'onDrop'>,
    VariantProps<typeof dataTableDraggableHeaderVariants> {
  /**
   * The TanStack Table header instance.
   * Used to access column information and render the header content.
   */
  header: Header<TData, unknown>;

  /**
   * Whether column reordering is enabled.
   * When false, the header renders without drag functionality.
   * @default false
   */
  isReorderEnabled?: boolean;

  /**
   * The TanStack Table instance.
   * Used to access and update column order state.
   */
  table: Table<TData>;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DataTableDraggableHeader wraps header cell content with native HTML5 drag-and-drop
 * functionality for column reordering. Provides visual feedback during drag operations
 * with opacity changes and drop position indicators.
 *
 * @example
 * ```tsx
 * // Usage in table header
 * <th key={header.id}>
 *   <DataTableDraggableHeader
 *     header={header}
 *     table={table}
 *     isReorderEnabled={isColumnReorderEnabled}
 *   />
 * </th>
 * ```
 *
 * @example
 * ```tsx
 * // Full implementation with resize handle
 * <th key={header.id} className="group relative">
 *   <DataTableDraggableHeader
 *     header={header}
 *     table={table}
 *     isReorderEnabled={true}
 *   />
 *   {header.column.getCanResize() && (
 *     <DataTableResizeHandle header={header} table={table} />
 *   )}
 * </th>
 * ```
 */
export const DataTableDraggableHeader = <TData,>({
  className,
  header,
  isReorderEnabled = false,
  ref,
  table,
  ...props
}: DataTableDraggableHeaderProps<TData>) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropPosition, setDropPosition] = useState<'left' | 'right'>('left');

  const columnId = header.column.id;

  // Determine if this column can be dragged
  // Selection and actions columns should not be draggable
  const isCanDrag = isReorderEnabled && !['actions', 'select'].includes(columnId);

  // Handle drag start - store the column ID being dragged
  const handleDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!isCanDrag) {
        event.preventDefault();
        return;
      }

      setIsDragging(true);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', columnId);

      // Create a subtle drag image
      const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.8';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-9999px';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 0, 0);

      // Clean up the drag image after drag starts
      requestAnimationFrame(() => {
        document.body.removeChild(dragImage);
      });
    },
    [columnId, isCanDrag]
  );

  // Handle drag end - reset dragging state
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIsDragOver(false);
  }, []);

  // Handle drag over - determine drop position based on cursor location
  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!isCanDrag) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      const rect = event.currentTarget.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;
      const newPosition = event.clientX < midpoint ? 'left' : 'right';

      setDropPosition(newPosition);
      setIsDragOver(true);
    },
    [isCanDrag]
  );

  // Handle drag leave - reset drag over state
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  // Handle drop - reorder columns
  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!isCanDrag) return;

      event.preventDefault();
      setIsDragOver(false);

      const draggedColumnId = event.dataTransfer.getData('text/plain');
      if (!draggedColumnId || draggedColumnId === columnId) return;

      // Get current column order
      const currentOrder = table.getState().columnOrder;
      const allColumnIds = table.getAllLeafColumns().map((col) => col.id);

      // Use current order if set, otherwise use default order from columns
      const workingOrder = currentOrder.length > 0 ? [...currentOrder] : [...allColumnIds];

      // Find indices
      const draggedIndex = workingOrder.indexOf(draggedColumnId);
      const targetIndex = workingOrder.indexOf(columnId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Remove dragged column from its current position
      workingOrder.splice(draggedIndex, 1);

      // Calculate new index based on drop position
      let newIndex = workingOrder.indexOf(columnId);
      if (dropPosition === 'right') {
        newIndex += 1;
      }

      // Insert at new position
      workingOrder.splice(newIndex, 0, draggedColumnId);

      // Update column order
      table.setColumnOrder(workingOrder);
    },
    [columnId, dropPosition, isCanDrag, table]
  );

  // Render header content without drag wrapper if not enabled
  if (!isReorderEnabled) {
    return (
      <div
        className={cn('flex items-center', className)}
        ref={ref}
        {...props}
      >
        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
      </div>
    );
  }

  return (
    <div
      className={cn(
        dataTableDraggableHeaderVariants({ isDragging, isDragOver }),
        isCanDrag && 'cursor-grab active:cursor-grabbing',
        className
      )}
      draggable={isCanDrag}
      onDragEnd={handleDragEnd}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      ref={ref}
      {...props}
    >
      {/* Drop Indicator */}
      {isDragOver && !isDragging && (
        <div
          aria-hidden={'true'}
          className={cn(dataTableDropIndicatorVariants({ position: dropPosition }))}
        />
      )}

      {/* Header Content */}
      <div className={'flex items-center'}>
        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
      </div>
    </div>
  );
};
