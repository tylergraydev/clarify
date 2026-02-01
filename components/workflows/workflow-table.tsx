'use client';

import type { Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { format } from 'date-fns';
import { Eye, Pencil, X } from 'lucide-react';
import { Fragment, memo, useCallback, useMemo } from 'react';

import type { Workflow } from '@/types/electron';

import { Badge, type badgeVariants } from '@/components/ui/badge';
import {
  createColumnHelper,
  DataTable,
  DataTableColumnHeader,
  type DataTableRowAction,
  DataTableRowActions,
  type DataTableRowStyleCallback,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];

type WorkflowStatus = Workflow['status'];

interface WorkflowTableProps extends ComponentPropsWithRef<'div'> {
  /** Set of workflow IDs currently being cancelled */
  cancellingIds?: Set<number>;
  /** Callback when the user clicks cancel on a workflow */
  onCancel?: (workflowId: number) => void;
  /** Callback when the user clicks edit on a workflow (only for 'created' status) */
  onEdit?: (workflow: Workflow) => void;
  /** Callback fired when global filter (search) changes */
  onGlobalFilterChange?: (value: string) => void;
  /** Callback when the user clicks view details on a workflow */
  onViewDetails?: (workflowId: number) => void;
  /** Map of project IDs to project names for display */
  projectMap: Record<number, string>;
  /** Custom toolbar content (e.g., filters) */
  toolbarContent?: ReactNode;
  /** Array of workflows to display */
  workflows: Array<Workflow>;
}

type WorkflowType = Workflow['type'];

// ============================================================================
// Helper Functions
// ============================================================================

const CANCELLABLE_STATUSES: Array<WorkflowStatus> = ['created', 'running', 'paused'];

const getStatusVariant = (status: WorkflowStatus): BadgeVariant => {
  const statusVariantMap: Record<WorkflowStatus, BadgeVariant> = {
    cancelled: 'stale',
    completed: 'completed',
    created: 'default',
    editing: 'clarifying',
    failed: 'failed',
    paused: 'draft',
    running: 'planning',
  };

  return statusVariantMap[status] ?? 'default';
};

const formatStatusLabel = (status: WorkflowStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatTypeLabel = (type: WorkflowType): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

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

const columnHelper = createColumnHelper<Workflow>();

// ============================================================================
// Memoized Cell Components
// ============================================================================

interface ActionsCellProps {
  isCancelling: boolean;
  onCancel?: (workflowId: number) => void;
  onEdit?: (workflow: Workflow) => void;
  onViewDetails?: (workflowId: number) => void;
  row: Row<Workflow>;
}

/**
 * Memoized actions cell component to prevent recreating action handlers
 * on every table render.
 */
const ActionsCell = memo(function ActionsCell({
  isCancelling,
  onCancel,
  onEdit,
  onViewDetails,
  row,
}: ActionsCellProps) {
  const workflow = row.original;
  const isCancellable = CANCELLABLE_STATUSES.includes(workflow.status as WorkflowStatus);
  const isEditable = workflow.status === 'created';

  const actions: Array<DataTableRowAction<Workflow>> = [];

  // -------------------------------------------------------------------------
  // Primary Actions - Always available for all workflows
  // -------------------------------------------------------------------------

  // View action
  actions.push({
    disabled: isCancelling,
    icon: <Eye aria-hidden={'true'} className={'size-4'} />,
    label: 'View',
    onAction: (r) => onViewDetails?.(r.original.id),
    type: 'button',
  });

  // -------------------------------------------------------------------------
  // Conditional Actions - Based on workflow state
  // -------------------------------------------------------------------------

  // Edit action (only for 'created' status)
  if (isEditable) {
    actions.push({
      disabled: isCancelling,
      icon: <Pencil aria-hidden={'true'} className={'size-4'} />,
      label: 'Edit',
      onAction: (r) => onEdit?.(r.original),
      type: 'button',
    });
  }

  // Cancel action (only for cancellable statuses)
  if (isCancellable) {
    actions.push({
      disabled: isCancelling,
      icon: <X aria-hidden={'true'} className={'size-4'} />,
      label: 'Cancel',
      onAction: (r) => onCancel?.(r.original.id),
      type: 'button',
    });
  }

  return <DataTableRowActions actions={actions} row={row} size={'sm'} />;
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * Table view component for displaying workflows using the DataTable component.
 *
 * Features:
 * - Table layout with sortable columns
 * - Row click handler for navigation to workflow details
 * - Action dropdown with View and Cancel options
 * - Reduced opacity styling for cancelled/failed workflows
 * - Column persistence via tableId
 * - Global search functionality
 * - Custom toolbar content support for filters
 */
export const WorkflowTable = ({
  cancellingIds = new Set(),
  className,
  onCancel,
  onEdit,
  onGlobalFilterChange,
  onViewDetails,
  projectMap,
  ref,
  toolbarContent,
  workflows,
  ...props
}: WorkflowTableProps) => {
  const handleRowClick = useCallback(
    (row: Row<Workflow>) => {
      onViewDetails?.(row.original.id);
    },
    [onViewDetails]
  );

  // Row style callback for cancelled/failed workflows
  const rowStyleCallback: DataTableRowStyleCallback<Workflow> = useCallback((row) => {
    const isCancelledOrFailed = row.original.status === 'cancelled' || row.original.status === 'failed';
    return isCancelledOrFailed ? 'opacity-60' : undefined;
  }, []);

  // Define columns using the column helper
  // Dependencies are minimized by extracting dynamic cell content
  // into memoized components (ActionsCell)
  const columns = useMemo(
    () => [
      // Actions column (first for easy access)
      // Uses memoized ActionsCell to avoid recreating action handlers
      columnHelper.display({
        cell: ({ row }) => (
          <ActionsCell
            isCancelling={cancellingIds.has(row.original.id)}
            onCancel={onCancel}
            onEdit={onEdit}
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

      // Feature Name column
      columnHelper.accessor('featureName', {
        cell: ({ row }) => {
          const workflow = row.original;
          return (
            <button
              className={cn(
                'cursor-pointer text-left font-medium text-foreground hover:text-accent',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
                'focus-visible:outline-none'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(workflow.id);
              }}
              type={'button'}
            >
              {workflow.featureName}
            </button>
          );
        },
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Feature Name'} />,
        size: 400,
      }),

      // Project column
      columnHelper.display({
        cell: ({ row }) => {
          const projectName = projectMap[row.original.projectId] ?? 'Unknown';
          return <span className={'text-muted-foreground'}>{projectName}</span>;
        },
        enableSorting: false,
        header: 'Project',
        id: 'project',
        size: 200,
      }),

      // Type column
      columnHelper.accessor('type', {
        cell: ({ row }) => (
          <Badge size={'sm'} variant={'default'}>
            {formatTypeLabel(row.original.type as WorkflowType)}
          </Badge>
        ),
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Type'} />,
        size: 120,
      }),

      // Status column
      columnHelper.accessor('status', {
        cell: ({ row }) => (
          <Badge size={'sm'} variant={getStatusVariant(row.original.status as WorkflowStatus)}>
            {formatStatusLabel(row.original.status as WorkflowStatus)}
          </Badge>
        ),
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Status'} />,
        size: 120,
      }),

      // Progress column
      columnHelper.display({
        cell: ({ row }) => {
          const workflow = row.original;
          const progressDisplay = `${workflow.currentStepNumber ?? 0}/${workflow.totalSteps ?? '?'}`;
          return <span className={'whitespace-nowrap text-muted-foreground'}>{progressDisplay}</span>;
        },
        enableSorting: false,
        header: 'Progress',
        id: 'progress',
        size: 100,
      }),

      // Created column
      columnHelper.accessor('createdAt', {
        cell: ({ row }) => (
          <span className={'text-sm whitespace-nowrap text-muted-foreground'}>
            {formatDate(row.original.createdAt)}
          </span>
        ),
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Created'} />,
        size: 110,
      }),

      // Updated column - filler column to take remaining space
      columnHelper.accessor('updatedAt', {
        cell: ({ row }) => (
          <span className={'text-sm whitespace-nowrap text-muted-foreground'}>
            {formatDate(row.original.updatedAt)}
          </span>
        ),
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Updated'} />,
        meta: {
          isFillerColumn: true,
        },
        size: 110,
      }),
    ],
    [cancellingIds, onCancel, onEdit, onViewDetails, projectMap]
  );

  return (
    <Fragment>
      <DataTable
        className={className}
        columns={columns}
        data={workflows}
        density={'default'}
        emptyState={{
          noData: {
            description: 'Create a workflow to plan or implement features.',
            title: 'No workflows found',
          },
          noResults: {
            description: 'Try adjusting your search or filters.',
            title: 'No matching workflows',
          },
        }}
        getRowId={(workflow) => String(workflow.id)}
        isPaginationEnabled={false}
        isToolbarVisible={true}
        onGlobalFilterChange={onGlobalFilterChange}
        onRowClick={handleRowClick}
        persistence={{
          persistedKeys: ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting'],
          tableId: 'project-workflows-table',
        }}
        ref={ref}
        rowStyleCallback={rowStyleCallback}
        searchPlaceholder={'Search workflows...'}
        toolbarContent={toolbarContent}
        {...props}
      />
    </Fragment>
  );
};
