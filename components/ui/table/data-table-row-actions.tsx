'use client';

import type { Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef } from 'react';

import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { MoreHorizontal } from 'lucide-react';
import { Fragment, useCallback } from 'react';

import {
  DropdownMenuItem,
  DropdownMenuItemIcon,
  dropdownMenuItemVariants,
  DropdownMenuPopup,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { DataTableRowAction, DataTableRowActionButton, DataTableRowActionLink } from './types';

// =============================================================================
// CVA Variants
// =============================================================================

export const dataTableRowActionsButtonVariants = cva(
  `
    inline-flex items-center justify-center rounded-md transition-colors
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

interface ActionItemProps<TData> {
  action: DataTableRowActionButton<TData> | DataTableRowActionLink<TData>;
  row: Row<TData>;
  size?: 'default' | 'lg' | 'sm';
}

// =============================================================================
// Helper Components
// =============================================================================

interface DataTableRowActionsProps<TData>
  extends ComponentPropsWithRef<'div'>, VariantProps<typeof dataTableRowActionsButtonVariants> {
  /**
   * Array of actions to display in the dropdown menu.
   * Supports button actions, link actions, and separators.
   */
  actions: Array<DataTableRowAction<TData>>;

  /**
   * The TanStack Table row instance.
   * Used to pass row data to action handlers.
   */
  row: Row<TData>;
}

/**
 * ActionItem renders a single action as a dropdown menu item.
 * Handles both button and link action types with consistent styling.
 */
const ActionItem = <TData,>({ action, row, size = 'default' }: ActionItemProps<TData>) => {
  const isDisabled = typeof action.disabled === 'function' ? action.disabled(row) : (action.disabled ?? false);

  const variant = action.type === 'button' && action.variant === 'destructive' ? 'destructive' : 'default';

  const menuItemSize = size === 'lg' ? 'default' : 'sm';

  const handleActionClick = useCallback(() => {
    if (action.type === 'button' && !isDisabled) {
      action.onAction(row);
    }
  }, [action, isDisabled, row]);

  if (action.type === 'link') {
    const href = action.href(row);

    return (
      <DropdownMenuItem
        className={cn(dropdownMenuItemVariants({ size: menuItemSize, variant }))}
        disabled={isDisabled}
        render={<a href={href} />}
        size={menuItemSize}
      >
        {/* Icon */}
        {action.icon && <DropdownMenuItemIcon>{action.icon}</DropdownMenuItemIcon>}

        {/* Label */}
        <span>{action.label}</span>

        {/* Shortcut */}
        {action.shortcut && <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>}
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem disabled={isDisabled} onClick={handleActionClick} size={menuItemSize} variant={variant}>
      {/* Icon */}
      {action.icon && <DropdownMenuItemIcon>{action.icon}</DropdownMenuItemIcon>}

      {/* Label */}
      <span>{action.label}</span>

      {/* Shortcut */}
      {action.shortcut && <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>}
    </DropdownMenuItem>
  );
};

// =============================================================================
// Component
// =============================================================================

/**
 * DataTableRowActions provides a dropdown menu with row-level actions.
 * Renders a trigger button with a MoreHorizontal icon that opens a menu
 * containing action items customized per row.
 *
 * @example
 * ```tsx
 * // Basic usage with button actions
 * const actions: DataTableRowAction<User>[] = [
 *   {
 *     type: 'button',
 *     label: 'Edit',
 *     icon: <Pencil className="size-4" />,
 *     onAction: (row) => handleEdit(row.original),
 *   },
 *   { type: 'separator' },
 *   {
 *     type: 'button',
 *     label: 'Delete',
 *     icon: <Trash className="size-4" />,
 *     variant: 'destructive',
 *     onAction: (row) => handleDelete(row.original),
 *   },
 * ];
 *
 * <DataTableRowActions row={row} actions={actions} />
 *
 * // With link actions
 * const actions: DataTableRowAction<Project>[] = [
 *   {
 *     type: 'link',
 *     label: 'View Details',
 *     href: (row) => `/projects/${row.original.id}`,
 *     icon: <Eye className="size-4" />,
 *   },
 * ];
 *
 * // With keyboard shortcuts
 * const actions: DataTableRowAction<User>[] = [
 *   {
 *     type: 'button',
 *     label: 'Edit',
 *     shortcut: '⌘E',
 *     onAction: (row) => handleEdit(row.original),
 *   },
 * ];
 *
 * // With conditional disabled state
 * const actions: DataTableRowAction<User>[] = [
 *   {
 *     type: 'button',
 *     label: 'Delete',
 *     disabled: (row) => row.original.isProtected,
 *     onAction: (row) => handleDelete(row.original),
 *   },
 * ];
 * ```
 */
export const DataTableRowActions = <TData,>({
  actions,
  className,
  ref,
  row,
  size,
  ...props
}: DataTableRowActionsProps<TData>) => {
  const isHasActions = actions.length > 0;

  if (!isHasActions) {
    return null;
  }

  return (
    <div className={cn('flex justify-start', className)} onClick={(e) => e.stopPropagation()} ref={ref} {...props}>
      <DropdownMenuRoot>
        <DropdownMenuTrigger>
          <BaseButton
            aria-label={'Open row actions menu'}
            className={cn(dataTableRowActionsButtonVariants({ size }), 'p-2')}
          >
            <MoreHorizontal
              aria-hidden={'true'}
              className={cn(size === 'sm' ? 'size-3.5' : 'size-4', 'text-muted-foreground')}
            />
            <span className={'sr-only'}>Open menu</span>
          </BaseButton>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuPositioner align={'end'}>
            <DropdownMenuPopup className={'min-w-40'} size={size === 'lg' ? 'default' : 'sm'}>
              {actions.map((action, index) => {
                if (action.type === 'separator') {
                  return <DropdownMenuSeparator key={`separator-${index}`} />;
                }

                return (
                  <Fragment key={`${action.type}-${action.label}-${index}`}>
                    <ActionItem action={action} row={row} size={size ?? 'default'} />
                  </Fragment>
                );
              })}
            </DropdownMenuPopup>
          </DropdownMenuPositioner>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  );
};
