'use client';

import type { Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';

import { ExternalLink, Pencil, Star, Trash2 } from 'lucide-react';
import { Fragment, memo, useCallback, useMemo } from 'react';

import type { Project } from '@/types/electron';

import { ConfirmArchiveDialog } from '@/components/projects/confirm-archive-dialog';
import { ConfirmDeleteProjectDialog } from '@/components/projects/confirm-delete-project-dialog';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
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
import { useDialogItem } from '@/hooks/use-dialog-item';
import { cn, formatDate } from '@/lib/utils';

interface ProjectTableProps extends ComponentPropsWithRef<'div'> {
  /** Set of project IDs currently being archived/unarchived */
  archivingIds?: Set<number>;
  /** Set of project IDs currently being deleted */
  deletingIds?: Set<number>;
  /** Callback when the user confirms archiving a project. Returns a promise that resolves when the mutation completes. */
  onArchive?: (projectId: number) => Promise<void>;
  /** Callback when the user confirms permanently deleting a project. Returns a promise that resolves when the mutation completes. */
  onDelete?: (projectId: number) => Promise<void>;
  /** Callback fired when global filter (search) changes */
  onGlobalFilterChange?: (value: string) => void;
  /** Callback when the user toggles a project's favorite status */
  onToggleFavorite?: (projectId: number) => void;
  /** Callback when the user confirms unarchiving a project. Returns a promise that resolves when the mutation completes. */
  onUnarchive?: (projectId: number) => Promise<void>;
  /** Callback when the user clicks view details on a project */
  onViewDetails?: (projectId: number) => void;
  /** Array of projects to display */
  projects: Array<Project>;
  /** Set of project IDs currently toggling favorite status */
  togglingFavoriteIds?: Set<number>;
  /** Custom toolbar content (e.g., filters) */
  toolbarContent?: ReactNode;
}

const columnHelper = createColumnHelper<Project>();

interface ActionsCellProps {
  isArchiving: boolean;
  isDeleting: boolean;
  onOpenDeleteDialog: (project: Project) => void;
  onOpenEditDialog: (project: Project) => void;
  onViewDetails?: (projectId: number) => void;
  row: Row<Project>;
}

/**
 * Memoized actions cell component to prevent recreating action handlers
 * on every table render. Uses parent-level dialogs for delete confirmation.
 */
const ActionsCell = memo(function ActionsCell({
  isArchiving,
  isDeleting,
  onOpenDeleteDialog,
  onOpenEditDialog,
  onViewDetails,
  row,
}: ActionsCellProps) {
  const isActionDisabled = isArchiving || isDeleting;

  const actions: Array<DataTableRowAction<Project>> = [];

  // View action
  actions.push({
    disabled: isActionDisabled,
    icon: <ExternalLink aria-hidden={'true'} className={'size-4'} />,
    label: 'View',
    onAction: (r) => onViewDetails?.(r.original.id),
    type: 'button',
  });

  // Edit action
  actions.push({
    disabled: isActionDisabled,
    icon: <Pencil aria-hidden={'true'} className={'size-4'} />,
    label: 'Edit',
    onAction: (r) => onOpenEditDialog(r.original),
    type: 'button',
  });

  // Separator before destructive actions
  actions.push({ type: 'separator' });

  // Delete action - opens dialog
  actions.push({
    disabled: isActionDisabled,
    icon: <Trash2 aria-hidden={'true'} className={'size-4 text-destructive'} />,
    label: 'Delete',
    onAction: (r) => onOpenDeleteDialog(r.original),
    type: 'button',
    variant: 'destructive',
  });

  return <DataTableRowActions actions={actions} row={row} size={'sm'} />;
});

interface StatusCellProps {
  isArchiving: boolean;
  onOpenArchiveDialog: (project: Project) => void;
  row: Row<Project>;
}

/**
 * Memoized status cell component with interactive toggle switch.
 * Clicking the toggle opens a confirmation dialog before archiving/unarchiving.
 */
const StatusCell = memo(function StatusCell({ isArchiving, onOpenArchiveDialog, row }: StatusCellProps) {
  const project = row.original;
  const isArchived = project.archivedAt !== null;

  const handleToggle = useCallback(() => {
    onOpenArchiveDialog(project);
  }, [onOpenArchiveDialog, project]);

  return (
    <div className={'flex items-center gap-2'} onClick={(e) => e.stopPropagation()}>
      <Switch checked={!isArchived} disabled={isArchiving} onCheckedChange={handleToggle} size={'sm'} />
      <span className={'text-sm text-muted-foreground'}>{isArchived ? 'Archived' : 'Active'}</span>
    </div>
  );
});

interface FavoriteCellProps {
  isToggling: boolean;
  onToggleFavorite?: (projectId: number) => void;
  row: Row<Project>;
}

/**
 * Memoized favorite cell component with star icon button.
 * Shows filled yellow star when favorite, outline star when not.
 */
const FavoriteCell = memo(function FavoriteCell({ isToggling, onToggleFavorite, row }: FavoriteCellProps) {
  const project = row.original;
  const isFavorite = project.isFavorite;

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite?.(project.id);
    },
    [onToggleFavorite, project.id]
  );

  return (
    <button
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorite}
      className={cn(
        'inline-flex items-center justify-center rounded-sm p-1',
        'transition-colors hover:bg-muted',
        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none',
        'data-disabled:pointer-events-none data-disabled:opacity-50'
      )}
      data-disabled={isToggling || undefined}
      disabled={isToggling}
      onClick={handleClick}
      type={'button'}
    >
      <Star
        aria-hidden={'true'}
        className={cn(
          'size-4 transition-colors',
          isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-foreground'
        )}
      />
    </button>
  );
});

/**
 * Table view component for displaying projects using the DataTable component.
 *
 * Features:
 * - Table layout with sortable columns: Name, Description, Created, Status, Updated
 * - Row click handler for navigation to project details
 * - Action dropdown with View and Archive/Unarchive options
 * - Confirmation dialog for archive/unarchive actions
 * - Reduced opacity styling for archived projects
 * - Column persistence via tableId
 */
export const ProjectTable = ({
  archivingIds = new Set(),
  className,
  deletingIds = new Set(),
  onArchive,
  onDelete,
  onGlobalFilterChange,
  onToggleFavorite,
  onUnarchive,
  onViewDetails,
  projects,
  ref,
  togglingFavoriteIds = new Set(),
  toolbarContent,
  ...props
}: ProjectTableProps) => {
  const archiveDialog = useDialogItem<Project>();
  const deleteDialog = useDialogItem<Project>();
  const editDialog = useDialogItem<Project>();

  const handleArchiveConfirm = useCallback(async () => {
    if (!archiveDialog.item) return;
    try {
      if (archiveDialog.item.archivedAt !== null) {
        await onUnarchive?.(archiveDialog.item.id);
      } else {
        await onArchive?.(archiveDialog.item.id);
      }
      archiveDialog.handleOpenChange(false);
    } catch {
      // Error is handled by the mutation's onError callback (toast)
      // Dialog remains open so user can retry or cancel
    }
  }, [archiveDialog, onArchive, onUnarchive]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.item) return;
    try {
      await onDelete?.(deleteDialog.item.id);
      deleteDialog.handleOpenChange(false);
    } catch {
      // Error is handled by the mutation's onError callback (toast)
      // Dialog remains open so user can retry or cancel
    }
  }, [deleteDialog, onDelete]);

  const handleRowClick = useCallback(
    (row: Row<Project>) => {
      onViewDetails?.(row.original.id);
    },
    [onViewDetails]
  );

  // Row style callback for archived projects
  const rowStyleCallback: DataTableRowStyleCallback<Project> = useCallback((row) => {
    const isArchived = row.original.archivedAt !== null;
    return isArchived ? 'opacity-60' : undefined;
  }, []);

  // Define columns using the column helper
  const columns = useMemo(
    () => [
      // Favorite column (first for visual priority)
      columnHelper.accessor('isFavorite', {
        cell: ({ row }) => (
          <FavoriteCell
            isToggling={togglingFavoriteIds.has(row.original.id)}
            onToggleFavorite={onToggleFavorite}
            row={row}
          />
        ),
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        header: '',
        meta: {
          cellClassName: 'text-center',
          headerClassName: 'text-center',
        },
        size: 40,
      }),

      // Actions column
      columnHelper.display({
        cell: ({ row }) => (
          <ActionsCell
            isArchiving={archivingIds.has(row.original.id)}
            isDeleting={deletingIds.has(row.original.id)}
            onOpenDeleteDialog={deleteDialog.open}
            onOpenEditDialog={editDialog.open}
            onViewDetails={onViewDetails}
            row={row}
          />
        ),
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        header: '',
        id: 'actions',
        meta: {
          cellClassName: 'text-left',
          headerClassName: 'text-left',
        },
        size: 30,
      }),

      // Name column
      columnHelper.accessor('name', {
        cell: ({ row }) => {
          const project = row.original;
          return <TableNameButton onClick={() => onViewDetails?.(project.id)}>{project.name}</TableNameButton>;
        },
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Name'} />,
        size: 200,
      }),

      // Description column
      columnHelper.accessor('description', {
        cell: ({ row }) => {
          const description = row.original.description;
          return <span className={'text-muted-foreground'}>{description || '-'}</span>;
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Description'} />,
        size: 450,
      }),

      // Status column with interactive toggle
      columnHelper.display({
        cell: ({ row }) => (
          <StatusCell
            isArchiving={archivingIds.has(row.original.id)}
            onOpenArchiveDialog={archiveDialog.open}
            row={row}
          />
        ),
        enableSorting: false,
        header: 'Status',
        id: 'status',
        size: 120,
      }),

      // Created At column
      columnHelper.accessor('createdAt', {
        cell: ({ row }) => {
          return <span className={'text-sm text-muted-foreground'}>{formatDate(row.original.createdAt)}</span>;
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Created'} />,
        size: 110,
      }),

      // Updated At column - filler column to take remaining space
      columnHelper.accessor('updatedAt', {
        cell: ({ row }) => {
          return <span className={'text-sm text-muted-foreground'}>{formatDate(row.original.updatedAt)}</span>;
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Updated'} />,
        meta: {
          isFillerColumn: true,
        },
        size: 110,
      }),
    ],
    [
      archivingIds,
      deletingIds,
      archiveDialog.open,
      deleteDialog.open,
      editDialog.open,
      onToggleFavorite,
      onViewDetails,
      togglingFavoriteIds,
    ]
  );

  // Default sorting: favorites first, then by name
  const defaultSorting = useMemo(
    () => [
      { desc: true, id: 'isFavorite' },
      { desc: false, id: 'name' },
    ],
    []
  );

  return (
    <Fragment>
      {/* Data Table */}
      <DataTable
        className={className}
        columns={columns}
        data={projects}
        density={'default'}
        emptyState={{
          noData: {
            description: 'Create a project to get started.',
            title: 'No projects found',
          },
          noResults: {
            description: 'Try adjusting your search or filters.',
            title: 'No matching projects',
          },
        }}
        getRowId={(project) => String(project.id)}
        isPaginationEnabled={false}
        isToolbarVisible={true}
        onGlobalFilterChange={onGlobalFilterChange}
        onRowClick={handleRowClick}
        persistence={{
          persistedKeys: ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting'],
          tableId: 'projects-table',
        }}
        ref={ref}
        rowStyleCallback={rowStyleCallback}
        searchPlaceholder={'Search projects...'}
        state={{ sorting: defaultSorting }}
        toolbarContent={toolbarContent}
        {...props}
      />

      {/* Archive/Unarchive Dialog */}
      {archiveDialog.item && (
        <ConfirmArchiveDialog
          isArchived={archiveDialog.item.archivedAt !== null}
          isLoading={archivingIds.has(archiveDialog.item.id)}
          isOpen={archiveDialog.isOpen}
          onConfirm={handleArchiveConfirm}
          onOpenChange={archiveDialog.handleOpenChange}
          projectName={archiveDialog.item.name}
        />
      )}

      {/* Delete Dialog */}
      {deleteDialog.item && (
        <ConfirmDeleteProjectDialog
          isLoading={deletingIds.has(deleteDialog.item.id)}
          isOpen={deleteDialog.isOpen}
          onConfirm={handleDeleteConfirm}
          onOpenChange={deleteDialog.handleOpenChange}
          projectName={deleteDialog.item.name}
        />
      )}

      {/* Edit Dialog */}
      {editDialog.item && (
        <EditProjectDialog
          isOpen={editDialog.isOpen}
          onOpenChange={editDialog.handleOpenChange}
          project={editDialog.item}
        />
      )}
    </Fragment>
  );
};
