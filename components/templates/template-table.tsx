'use client';

import type { Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Copy, Eye, Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import { Fragment, memo, useCallback, useMemo } from 'react';

import type { Template } from '@/db/schema';
import type { TemplateCategory } from '@/db/schema/templates.schema';

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  createColumnHelper,
  DataTable,
  DataTableColumnHeader,
  type DataTableRowAction,
  DataTableRowActions,
  type DataTableRowStyleCallback,
  TableNameButton,
} from '@/components/ui/table';
import { Tooltip } from '@/components/ui/tooltip';
import { useDialogItem } from '@/hooks/use-dialog-item';
import { capitalizeFirstLetter, formatDate } from '@/lib/utils';

import { TemplateEditorDialog } from './template-editor-dialog';

// ============================================================================
// Types
// ============================================================================

interface TemplateTableProps extends ComponentPropsWithRef<'div'> {
  /** Whether the deactivation mutation is in progress */
  isDeactivating?: boolean;
  /** Whether the delete mutation is in progress */
  isDeleting?: boolean;
  /** Whether the duplicate mutation is in progress */
  isDuplicating?: boolean;
  /** Whether the table is loading */
  isLoading?: boolean;
  /** Whether the activation mutation is in progress */
  isToggling?: boolean;
  /** Callback when a template is deleted */
  onDelete?: (templateId: number) => void;
  /** Callback when a template is duplicated */
  onDuplicate?: (template: Template) => void;
  /** Callback fired when global filter (search) changes */
  onGlobalFilterChange?: (value: string) => void;
  /** Callback when a template's active status is toggled */
  onToggleActive?: (templateId: number, isActive: boolean) => void;
  /** The templates to display */
  templates: Array<Template>;
  /** Additional toolbar content to render in the DataTable toolbar */
  toolbarContent?: ReactNode;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getCategoryVariant = (category: TemplateCategory): BadgeVariant => {
  const categoryVariantMap: Record<TemplateCategory, BadgeVariant> = {
    backend: 'backend',
    data: 'data',
    electron: 'electron',
    security: 'security',
    ui: 'ui',
  };

  return categoryVariantMap[category] ?? 'default';
};

const getStatusLabel = (template: Template): string => {
  return template.deactivatedAt === null ? 'Active' : 'Inactive';
};

// ============================================================================
// Column Helper
// ============================================================================

const columnHelper = createColumnHelper<Template>();

// ============================================================================
// Memoized Cell Components
// ============================================================================

interface ActionsCellProps {
  isActionDisabled: boolean;
  onDelete?: (templateId: number) => void;
  onDuplicate?: (template: Template) => void;
  onEditClick: (template: Template) => void;
  onToggleActive?: (templateId: number, isActive: boolean) => void;
  row: Row<Template>;
}

/**
 * Memoized actions cell component to prevent recreating action handlers
 * on every table render.
 */
const ActionsCell = memo(function ActionsCell({
  isActionDisabled,
  onDelete,
  onDuplicate,
  onEditClick,
  onToggleActive,
  row,
}: ActionsCellProps) {
  const template = row.original;
  const isBuiltIn = template.builtInAt !== null;
  const isActive = template.deactivatedAt === null;

  const actions: Array<DataTableRowAction<Template>> = [];

  // -------------------------------------------------------------------------
  // Primary Actions - Always available for all templates
  // -------------------------------------------------------------------------

  // View/Edit action
  actions.push({
    disabled: isActionDisabled,
    icon: isBuiltIn ? (
      <Eye aria-hidden={'true'} className={'size-4'} />
    ) : (
      <Pencil aria-hidden={'true'} className={'size-4'} />
    ),
    label: isBuiltIn ? 'View' : 'Edit',
    onAction: (r) => onEditClick(r.original),
    type: 'button',
  });

  // Duplicate action
  actions.push({
    disabled: isActionDisabled,
    icon: <Copy aria-hidden={'true'} className={'size-4'} />,
    label: 'Duplicate',
    onAction: (r) => onDuplicate?.(r.original),
    type: 'button',
  });

  // -------------------------------------------------------------------------
  // Status Actions - Activate/Deactivate
  // -------------------------------------------------------------------------

  actions.push({
    disabled: isActionDisabled,
    icon: isActive ? (
      <PowerOff aria-hidden={'true'} className={'size-4'} />
    ) : (
      <Power aria-hidden={'true'} className={'size-4'} />
    ),
    label: isActive ? 'Deactivate' : 'Activate',
    onAction: (r) => onToggleActive?.(r.original.id, !isActive),
    type: 'button',
  });

  // -------------------------------------------------------------------------
  // Destructive Actions - Delete (only for custom templates)
  // -------------------------------------------------------------------------

  if (!isBuiltIn) {
    actions.push({ type: 'separator' });
    actions.push({
      disabled: isActionDisabled,
      icon: <Trash2 aria-hidden={'true'} className={'size-4 text-destructive'} />,
      label: 'Delete',
      onAction: (r) => onDelete?.(r.original.id),
      type: 'button',
      variant: 'destructive',
    });
  }

  return <DataTableRowActions actions={actions} row={row} size={'sm'} />;
});

interface StatusCellProps {
  isToggling: boolean;
  onToggleActive?: (templateId: number, isActive: boolean) => void;
  template: Template;
}

/**
 * Memoized status cell component with stable toggle handler
 * to prevent recreating the handler on every render.
 */
const StatusCell = memo(function StatusCell({ isToggling, onToggleActive, template }: StatusCellProps) {
  const isActive = template.deactivatedAt === null;

  const handleToggleChange = useCallback(
    (checked: boolean) => {
      onToggleActive?.(template.id, checked);
    },
    [template.id, onToggleActive]
  );

  return (
    <div className={'flex items-center gap-2'} onClick={(e) => e.stopPropagation()}>
      <span className={'text-xs text-muted-foreground'}>{getStatusLabel(template)}</span>
      <Switch
        aria-label={isActive ? 'Deactivate template' : 'Activate template'}
        checked={isActive}
        disabled={isToggling}
        onCheckedChange={handleToggleChange}
        size={'sm'}
      />
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * Table view component for displaying templates in a structured grid with column headers.
 * Uses the DataTable component for a consistent table experience with sorting, filtering,
 * and persistence capabilities.
 *
 * Features:
 * - Table layout with sortable columns: Actions, Name (with badges), Category, Description, Usage Count, Status, Created, Updated
 * - Row click handler for view/edit functionality
 * - Status toggle for activation/deactivation
 * - Action buttons for edit, duplicate, activate/deactivate, and delete
 * - Integrated edit dialog using controlled state pattern
 * - Column preferences persistence via tableId
 * - Subtle styling for built-in templates and deactivated templates
 */
export const TemplateTable = ({
  className,
  isDeactivating = false,
  isDeleting = false,
  isDuplicating = false,
  isLoading = false,
  isToggling = false,
  onDelete,
  onDuplicate,
  onGlobalFilterChange,
  onToggleActive,
  ref,
  templates,
  toolbarContent,
  ...props
}: TemplateTableProps) => {
  const editDialog = useDialogItem<Template>();

  const isActionDisabled = useMemo(
    () => isDeactivating || isDeleting || isDuplicating || isToggling,
    [isDeactivating, isDeleting, isDuplicating, isToggling]
  );

  const handleRowClick = useCallback(
    (row: Row<Template>) => {
      editDialog.open(row.original);
    },
    [editDialog]
  );

  const rowStyleCallback: DataTableRowStyleCallback<Template> = useCallback((row) => {
    const isActive = row.original.deactivatedAt === null;
    const isBuiltIn = row.original.builtInAt !== null;

    if (!isActive) {
      return isBuiltIn ? 'bg-muted/30 opacity-60' : 'opacity-60';
    }

    return isBuiltIn ? 'bg-muted/30' : undefined;
  }, []);

  // Define columns using the column helper
  // Dependencies are minimized by extracting dynamic cell content
  // into memoized components (ActionsCell, StatusCell)
  const columns = useMemo(
    () => [
      // Actions column (first for easy access)
      // Uses memoized ActionsCell to avoid recreating action handlers
      columnHelper.display({
        cell: ({ row }) => (
          <ActionsCell
            isActionDisabled={isActionDisabled}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onEditClick={editDialog.open}
            onToggleActive={onToggleActive}
            row={row}
          />
        ),
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        header: '',
        id: 'actions',
        meta: {
          cellClassName: 'px-2',
          headerClassName: 'px-2',
        },
        size: 48,
      }),

      // Name column with badges for built-in/custom
      columnHelper.accessor('name', {
        cell: ({ row }) => {
          const template = row.original;
          const isBuiltIn = template.builtInAt !== null;

          return (
            <div className={'flex items-center gap-2'}>
              {/* Template Name */}
              {template.description ? (
                <Tooltip content={template.description} side={'bottom'}>
                  <TableNameButton onClick={() => editDialog.open(template)}>{template.name}</TableNameButton>
                </Tooltip>
              ) : (
                <TableNameButton onClick={() => editDialog.open(template)}>{template.name}</TableNameButton>
              )}

              {/* Origin Badges */}
              <div className={'flex items-center gap-1'}>
                {isBuiltIn && (
                  <Badge size={'sm'} variant={'category-builtin'}>
                    {'Built-in'}
                  </Badge>
                )}
                {!isBuiltIn && (
                  <Badge size={'sm'} variant={'custom'}>
                    {'Custom'}
                  </Badge>
                )}
              </div>
            </div>
          );
        },
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Name'} />,
        size: 280,
      }),

      // Category column with badge variants
      columnHelper.accessor('category', {
        cell: ({ row }) => {
          const template = row.original;
          return (
            <Badge size={'sm'} variant={getCategoryVariant(template.category)}>
              {capitalizeFirstLetter(template.category)}
            </Badge>
          );
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Category'} />,
        size: 120,
      }),

      // Description column
      columnHelper.accessor('description', {
        cell: ({ row }) => {
          const template = row.original;
          const description = template.description;
          if (!description) return <span className={'text-muted-foreground'}>-</span>;

          // Truncate long descriptions
          const maxLength = 50;
          const truncated = description.length > maxLength ? `${description.slice(0, maxLength)}...` : description;

          return description.length > maxLength ? (
            <Tooltip content={description} side={'bottom'}>
              <span className={'text-sm text-muted-foreground'}>{truncated}</span>
            </Tooltip>
          ) : (
            <span className={'text-sm text-muted-foreground'}>{description}</span>
          );
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Description'} />,
        size: 200,
      }),

      // Usage count column
      columnHelper.accessor('usageCount', {
        cell: ({ row }) => {
          const template = row.original;
          return <span className={'text-muted-foreground'}>{template.usageCount}</span>;
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Usage'} />,
        size: 80,
      }),

      // Status column
      // Uses memoized StatusCell with stable toggle handler
      columnHelper.display({
        cell: ({ row }) => (
          <StatusCell isToggling={isToggling} onToggleActive={onToggleActive} template={row.original} />
        ),
        enableSorting: false,
        header: 'Status',
        id: 'status',
        size: 110,
      }),

      // Created At column
      columnHelper.accessor('createdAt', {
        cell: ({ row }) => {
          const template = row.original;
          return <span className={'text-sm text-muted-foreground'}>{formatDate(template.createdAt)}</span>;
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Created'} />,
        size: 110,
      }),

      // Updated At column - filler column to take remaining space
      columnHelper.accessor('updatedAt', {
        cell: ({ row }) => {
          const template = row.original;
          return <span className={'text-sm text-muted-foreground'}>{formatDate(template.updatedAt)}</span>;
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Updated'} />,
        meta: {
          isFillerColumn: true,
        },
        size: 110,
      }),
    ],
    [editDialog, isActionDisabled, isToggling, onDelete, onDuplicate, onToggleActive]
  );

  // Determine editor mode based on template type
  const editorMode = editDialog.item?.builtInAt !== null ? 'view' : 'edit';

  return (
    <Fragment>
      {/* Data Table */}
      <DataTable
        className={className}
        columns={columns}
        data={templates}
        density={'default'}
        emptyState={{
          noData: {
            description: 'Create a custom template to get started.',
            title: 'No templates found',
          },
          noResults: {
            description: 'Try adjusting your search or filters.',
            title: 'No matching templates',
          },
        }}
        getRowId={(template) => String(template.id)}
        isLoading={isLoading}
        isPaginationEnabled={false}
        isToolbarVisible={true}
        onGlobalFilterChange={onGlobalFilterChange}
        onRowClick={handleRowClick}
        persistence={{
          persistedKeys: ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting'],
          tableId: 'templates-table',
        }}
        ref={ref}
        rowStyleCallback={rowStyleCallback}
        searchPlaceholder={'Search templates...'}
        toolbarContent={toolbarContent}
        {...props}
      />

      {/* Edit Dialog */}
      {editDialog.item && (
        <TemplateEditorDialog
          isOpen={editDialog.isOpen}
          mode={editorMode}
          onOpenChange={editDialog.handleOpenChange}
          template={editDialog.item}
        />
      )}
    </Fragment>
  );
};
