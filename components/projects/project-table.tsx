'use client';

import type { Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { format } from 'date-fns';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import type { Project } from '@/types/electron';

import { ConfirmArchiveDialog } from '@/components/projects/confirm-archive-dialog';
import { ConfirmDeleteProjectDialog } from '@/components/projects/confirm-delete-project-dialog';
import { Switch } from '@/components/ui/switch';
import {
  createColumnHelper,
  DataTable,
  type DataTableRowAction,
  DataTableRowActions,
  type DataTableRowStyleCallback,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateString: null | string | undefined): string => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return '-';
  }
};

// ============================================================================
// Column Helper
// ============================================================================

const columnHelper = createColumnHelper<Project>();

// ============================================================================
// Memoized Cell Components
// ============================================================================

interface ActionsCellProps {
  archivingIds: Set<number>;
  deletingIds: Set<number>;
  onArchive?: (projectId: number) => Promise<void>;
  onDelete?: (projectId: number) => Promise<void>;
  onUnarchive?: (projectId: number) => Promise<void>;
  onViewDetails?: (projectId: number) => void;
  row: Row<Project>;
}

/**
 * Memoized actions cell component to prevent recreating action handlers
 * on every table render. Uses dialog for archive/unarchive confirmation.
 */
const ActionsCell = memo(function ActionsCell({
  archivingIds,
  deletingIds,
  onArchive,
  onDelete,
  onUnarchive,
  onViewDetails,
  row,
}: ActionsCellProps) {
  const project = row.original;
  const isArchived = project.archivedAt !== null;
  const isThisRowArchiving = archivingIds.has(project.id);
  const isThisRowDeleting = deletingIds.has(project.id);
  const isActionDisabled = isThisRowArchiving || isThisRowDeleting;

  // Dialog state for archive/unarchive confirmation
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  // Dialog state for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleArchiveConfirm = useCallback(async () => {
    try {
      if (isArchived) {
        await onUnarchive?.(project.id);
      } else {
        await onArchive?.(project.id);
      }
      setIsArchiveDialogOpen(false);
    } catch {
      // Error is handled by the mutation's onError callback (toast)
      // Dialog remains open so user can retry or cancel
    }
  }, [isArchived, onArchive, onUnarchive, project.id]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await onDelete?.(project.id);
      setIsDeleteDialogOpen(false);
    } catch {
      // Error is handled by the mutation's onError callback (toast)
      // Dialog remains open so user can retry or cancel
    }
  }, [onDelete, project.id]);

  const actions: Array<DataTableRowAction<Project>> = [];

  // View action
  actions.push({
    disabled: isActionDisabled,
    icon: <ExternalLink aria-hidden={'true'} className={'size-4'} />,
    label: 'View',
    onAction: (r) => onViewDetails?.(r.original.id),
    type: 'button',
  });

  // Separator before destructive actions
  actions.push({ type: 'separator' });

  // Delete action - opens dialog
  actions.push({
    disabled: isActionDisabled,
    icon: <Trash2 aria-hidden={'true'} className={'size-4 text-destructive'} />,
    label: 'Delete',
    onAction: () => setIsDeleteDialogOpen(true),
    type: 'button',
    variant: 'destructive',
  });

  return (
    <Fragment>
      <DataTableRowActions actions={actions} row={row} size={'sm'} />
      <ConfirmArchiveDialog
        isArchived={isArchived}
        isLoading={isThisRowArchiving}
        isOpen={isArchiveDialogOpen}
        onConfirm={handleArchiveConfirm}
        onOpenChange={setIsArchiveDialogOpen}
        projectName={project.name}
      />
      <ConfirmDeleteProjectDialog
        isLoading={isThisRowDeleting}
        isOpen={isDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setIsDeleteDialogOpen}
        projectName={project.name}
      />
    </Fragment>
  );
});

interface StatusCellProps {
  archivingIds: Set<number>;
  onArchive?: (projectId: number) => Promise<void>;
  onUnarchive?: (projectId: number) => Promise<void>;
  row: Row<Project>;
}

/**
 * Memoized status cell component with interactive toggle switch.
 * Clicking the toggle opens a confirmation dialog before archiving/unarchiving.
 */
const StatusCell = memo(function StatusCell({ archivingIds, onArchive, onUnarchive, row }: StatusCellProps) {
  const project = row.original;
  const isArchived = project.archivedAt !== null;
  const isThisRowArchiving = archivingIds.has(project.id);

  // Dialog state for archive/unarchive confirmation
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      if (isArchived) {
        await onUnarchive?.(project.id);
      } else {
        await onArchive?.(project.id);
      }
      setIsDialogOpen(false);
    } catch {
      // Error is handled by the mutation's onError callback (toast)
      // Dialog remains open so user can retry or cancel
    }
  }, [isArchived, onArchive, onUnarchive, project.id]);

  return (
    <Fragment>
      <div
        className={'flex items-center gap-2'}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Switch checked={!isArchived} disabled={isThisRowArchiving} onCheckedChange={handleToggle} size={'sm'} />
        <span className={'text-sm text-muted-foreground'}>{isArchived ? 'Archived' : 'Active'}</span>
      </div>
      <ConfirmArchiveDialog
        isArchived={isArchived}
        isLoading={isThisRowArchiving}
        isOpen={isDialogOpen}
        onConfirm={handleConfirm}
        onOpenChange={setIsDialogOpen}
        projectName={project.name}
      />
    </Fragment>
  );
});

// ============================================================================
// Main Component
// ============================================================================

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
            archivingIds={archivingIds}
            deletingIds={deletingIds}
            onArchive={onArchive}
            onDelete={onDelete}
            onUnarchive={onUnarchive}
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
        size: 280,
      }),

      // Created At column
      columnHelper.accessor('createdAt', {
        cell: ({ row }) => {
          return <span className={'text-sm text-muted-foreground'}>{formatDate(row.original.createdAt)}</span>;
        },
        header: 'Created',
        size: 110,
      }),

      // Status column with interactive toggle
      columnHelper.display({
        cell: ({ row }) => (
          <StatusCell archivingIds={archivingIds} onArchive={onArchive} onUnarchive={onUnarchive} row={row} />
        ),
        enableSorting: false,
        header: 'Status',
        id: 'status',
        size: 120,
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
    [archivingIds, deletingIds, onArchive, onDelete, onUnarchive, onViewDetails]
  );

  return (
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
        persistedKeys: ['columnOrder', 'columnVisibility', 'columnSizing'],
        tableId: 'projects-table',
      }}
      ref={ref}
      rowStyleCallback={rowStyleCallback}
      searchPlaceholder={'Search projects...'}
      toolbarContent={toolbarContent}
      {...props}
    />
  );
};
