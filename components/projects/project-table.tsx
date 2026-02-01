'use client';

import type { Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { format } from 'date-fns';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import type { Project } from '@/types/electron';

import { ConfirmArchiveDialog } from '@/components/projects/confirm-archive-dialog';
import { ConfirmDeleteProjectDialog } from '@/components/projects/confirm-delete-project-dialog';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { Switch } from '@/components/ui/switch';
import {
  createColumnHelper,
  DataTable,
  type DataTableRowAction,
  DataTableRowActions,
  type DataTableRowStyleCallback,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
  /** Callback when the user confirms unarchiving a project. Returns a promise that resolves when the mutation completes. */
  onUnarchive?: (projectId: number) => Promise<void>;
  /** Callback when the user clicks view details on a project */
  onViewDetails?: (projectId: number) => void;
  /** Array of projects to display */
  projects: Array<Project>;
  /** Custom toolbar content (e.g., filters) */
  toolbarContent?: ReactNode;
}

const formatDate = (dateString: null | string | undefined): string => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return '-';
  }
};

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
  onUnarchive,
  onViewDetails,
  projects,
  ref,
  toolbarContent,
  ...props
}: ProjectTableProps) => {
  // State for archive dialog
  const [archiveProject, setArchiveProject] = useState<null | Project>(null);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  // State for delete dialog
  const [deleteProject, setDeleteProject] = useState<null | Project>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // State for edit dialog
  const [editProject, setEditProject] = useState<null | Project>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleOpenArchiveDialog = useCallback((project: Project) => {
    setArchiveProject(project);
    setIsArchiveDialogOpen(true);
  }, []);

  const handleArchiveDialogChange = useCallback((isOpen: boolean) => {
    setIsArchiveDialogOpen(isOpen);
    if (!isOpen) {
      setArchiveProject(null);
    }
  }, []);

  const handleArchiveConfirm = useCallback(async () => {
    if (!archiveProject) return;
    try {
      if (archiveProject.archivedAt !== null) {
        await onUnarchive?.(archiveProject.id);
      } else {
        await onArchive?.(archiveProject.id);
      }
      setIsArchiveDialogOpen(false);
    } catch {
      // Error is handled by the mutation's onError callback (toast)
      // Dialog remains open so user can retry or cancel
    }
  }, [archiveProject, onArchive, onUnarchive]);

  const handleOpenDeleteDialog = useCallback((project: Project) => {
    setDeleteProject(project);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteDialogChange = useCallback((isOpen: boolean) => {
    setIsDeleteDialogOpen(isOpen);
    if (!isOpen) {
      setDeleteProject(null);
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteProject) return;
    try {
      await onDelete?.(deleteProject.id);
      setIsDeleteDialogOpen(false);
    } catch {
      // Error is handled by the mutation's onError callback (toast)
      // Dialog remains open so user can retry or cancel
    }
  }, [deleteProject, onDelete]);

  const handleOpenEditDialog = useCallback((project: Project) => {
    setEditProject(project);
    setIsEditDialogOpen(true);
  }, []);

  const handleEditDialogChange = useCallback((isOpen: boolean) => {
    setIsEditDialogOpen(isOpen);
    if (!isOpen) {
      setEditProject(null);
    }
  }, []);

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
      // Actions column (first for easy access)
      columnHelper.display({
        cell: ({ row }) => (
          <ActionsCell
            isArchiving={archivingIds.has(row.original.id)}
            isDeleting={deletingIds.has(row.original.id)}
            onOpenDeleteDialog={handleOpenDeleteDialog}
            onOpenEditDialog={handleOpenEditDialog}
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
          return (
            <button
              className={cn(
                'cursor-pointer text-left font-medium text-foreground hover:text-accent',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
                'focus-visible:outline-none'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(project.id);
              }}
              type={'button'}
            >
              {project.name}
            </button>
          );
        },
        enableHiding: false,
        header: 'Name',
        size: 200,
      }),

      // Description column
      columnHelper.accessor('description', {
        cell: ({ row }) => {
          const description = row.original.description;
          return <span className={'text-muted-foreground'}>{description || '-'}</span>;
        },
        header: 'Description',
        size: 450,
      }),

      // Status column with interactive toggle
      columnHelper.display({
        cell: ({ row }) => (
          <StatusCell
            isArchiving={archivingIds.has(row.original.id)}
            onOpenArchiveDialog={handleOpenArchiveDialog}
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
        header: 'Created',
        size: 110,
      }),

      // Updated At column - filler column to take remaining space
      columnHelper.accessor('updatedAt', {
        cell: ({ row }) => {
          return <span className={'text-sm text-muted-foreground'}>{formatDate(row.original.updatedAt)}</span>;
        },
        header: 'Updated',
        meta: {
          isFillerColumn: true,
        },
        size: 110,
      }),
    ],
    [archivingIds, deletingIds, handleOpenArchiveDialog, handleOpenDeleteDialog, handleOpenEditDialog, onViewDetails]
    // Note: handleOpenArchiveDialog is used by StatusCell within the Status column
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
        toolbarContent={toolbarContent}
        {...props}
      />

      {/* Archive/Unarchive Dialog */}
      {archiveProject && (
        <ConfirmArchiveDialog
          isArchived={archiveProject.archivedAt !== null}
          isLoading={archivingIds.has(archiveProject.id)}
          isOpen={isArchiveDialogOpen}
          onConfirm={handleArchiveConfirm}
          onOpenChange={handleArchiveDialogChange}
          projectName={archiveProject.name}
        />
      )}

      {/* Delete Dialog */}
      {deleteProject && (
        <ConfirmDeleteProjectDialog
          isLoading={deletingIds.has(deleteProject.id)}
          isOpen={isDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          onOpenChange={handleDeleteDialogChange}
          projectName={deleteProject.name}
        />
      )}

      {/* Edit Dialog */}
      {editProject && (
        <EditProjectDialog isOpen={isEditDialogOpen} onOpenChange={handleEditDialogChange} project={editProject} />
      )}
    </Fragment>
  );
};
