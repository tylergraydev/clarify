'use client';

import type { Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { format } from 'date-fns';
import { Archive, ArchiveRestore, ExternalLink, Trash2 } from 'lucide-react';
import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import type { Project } from '@/db/schema/projects.schema';

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
  /** Whether an archive mutation is in progress */
  isArchiving?: boolean;
  /** Whether a delete mutation is in progress */
  isDeleting?: boolean;
  /** Callback when the user confirms archiving a project */
  onArchive?: (projectId: number) => void;
  /** Callback when the user confirms permanently deleting a project */
  onDelete?: (projectId: number) => void;
  /** Callback when the user confirms unarchiving a project */
  onUnarchive?: (projectId: number) => void;
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
  isArchiving: boolean;
  isDeleting: boolean;
  onArchive?: (projectId: number) => void;
  onDelete?: (projectId: number) => void;
  onUnarchive?: (projectId: number) => void;
  onViewDetails?: (projectId: number) => void;
  row: Row<Project>;
}

/**
 * Memoized actions cell component to prevent recreating action handlers
 * on every table render. Uses dialog for archive/unarchive confirmation.
 */
const ActionsCell = memo(function ActionsCell({
  isArchiving,
  isDeleting,
  onArchive,
  onDelete,
  onUnarchive,
  onViewDetails,
  row,
}: ActionsCellProps) {
  const project = row.original;
  const isArchived = project.archivedAt !== null;
  const isActionDisabled = isArchiving || isDeleting;

  // Dialog state for archive/unarchive confirmation
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  // Dialog state for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleArchiveConfirm = useCallback(() => {
    if (isArchived) {
      onUnarchive?.(project.id);
    } else {
      onArchive?.(project.id);
    }
    setIsArchiveDialogOpen(false);
  }, [isArchived, onArchive, onUnarchive, project.id]);

  const handleDeleteConfirm = useCallback(() => {
    onDelete?.(project.id);
    setIsDeleteDialogOpen(false);
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

  // Archive/Unarchive action - opens dialog
  actions.push({
    disabled: isActionDisabled,
    icon: isArchived ? (
      <ArchiveRestore aria-hidden={'true'} className={'size-4'} />
    ) : (
      <Archive aria-hidden={'true'} className={'size-4'} />
    ),
    label: isArchived ? 'Unarchive' : 'Archive',
    onAction: () => setIsArchiveDialogOpen(true),
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
        isLoading={isArchiving}
        isOpen={isArchiveDialogOpen}
        onConfirm={handleArchiveConfirm}
        onOpenChange={setIsArchiveDialogOpen}
        projectName={project.name}
      />
      <ConfirmDeleteProjectDialog
        isLoading={isDeleting}
        isOpen={isDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setIsDeleteDialogOpen}
        projectName={project.name}
      />
    </Fragment>
  );
});

interface StatusCellProps {
  isArchiving: boolean;
  onArchive?: (projectId: number) => void;
  onUnarchive?: (projectId: number) => void;
  row: Row<Project>;
}

/**
 * Memoized status cell component with interactive toggle switch.
 * Clicking the toggle opens a confirmation dialog before archiving/unarchiving.
 */
const StatusCell = memo(function StatusCell({ isArchiving, onArchive, onUnarchive, row }: StatusCellProps) {
  const project = row.original;
  const isArchived = project.archivedAt !== null;

  // Dialog state for archive/unarchive confirmation
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (isArchived) {
      onUnarchive?.(project.id);
    } else {
      onArchive?.(project.id);
    }
    setIsDialogOpen(false);
  }, [isArchived, onArchive, onUnarchive, project.id]);

  return (
    <Fragment>
      <div
        className={'flex items-center gap-2'}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Switch checked={!isArchived} disabled={isArchiving} onCheckedChange={handleToggle} size={'sm'} />
        <span className={'text-sm text-muted-foreground'}>{isArchived ? 'Archived' : 'Active'}</span>
      </div>
      <ConfirmArchiveDialog
        isArchived={isArchived}
        isLoading={isArchiving}
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
  className,
  isArchiving = false,
  isDeleting = false,
  onArchive,
  onDelete,
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
            isArchiving={isArchiving}
            isDeleting={isDeleting}
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
          <StatusCell isArchiving={isArchiving} onArchive={onArchive} onUnarchive={onUnarchive} row={row} />
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
    [isArchiving, isDeleting, onArchive, onDelete, onUnarchive, onViewDetails]
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
