'use client';

import type { OnChangeFn, PaginationState, Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Eye } from 'lucide-react';
import { Fragment, memo, useCallback, useMemo } from 'react';

import type { Workflow } from '@/db/schema';

import { Badge } from '@/components/ui/badge';
import {
  createColumnHelper,
  DataTable,
  DataTableColumnHeader,
  type DataTableRowAction,
  DataTableRowActions,
  type DataTableRowStyleCallback,
  TableNameButton,
} from '@/components/ui/table';
import { capitalizeFirstLetter, formatDateTime, formatDuration, getWorkflowStatusLabel, getWorkflowStatusVariant } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface WorkflowHistoryTableProps extends ComponentPropsWithRef<'div'> {
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback fired when global filter (search) changes */
  onGlobalFilterChange?: (value: string) => void;
  /** Callback fired when pagination changes (for server-side pagination) */
  onPaginationChange?: OnChangeFn<PaginationState>;
  /** Callback when the user clicks view details on a workflow */
  onViewDetails?: (workflowId: number) => void;
  /** Callback when the user clicks view info on a workflow */
  onViewInfo?: (workflow: Workflow) => void;
  /** Total number of pages (for server-side pagination) */
  pageCount?: number;
  /** Current pagination state (for server-side pagination) */
  pagination?: PaginationState;
  /** Map of project IDs to project names for display */
  projectMap: Record<number, string>;
  /** Total number of workflow rows (for server-side pagination display) */
  rowCount?: number;
  /** Custom toolbar content (e.g., filters) */
  toolbarContent?: ReactNode;
  /** Array of workflows to display */
  workflows: Array<Workflow>;
}

// ============================================================================
// Helper Functions
// ============================================================================

// ============================================================================
// Column Helper
// ============================================================================

const columnHelper = createColumnHelper<Workflow>();

// ============================================================================
// Memoized Cell Components
// ============================================================================

interface ActionsCellProps {
  onViewInfo?: (workflow: Workflow) => void;
  row: Row<Workflow>;
}

/**
 * Memoized actions cell component for the history table.
 * Only shows View Details action since historical workflows cannot be modified.
 */
const ActionsCell = memo(function ActionsCell({ onViewInfo, row }: ActionsCellProps) {
  const actions: Array<DataTableRowAction<Workflow>> = [
    {
      icon: <Eye aria-hidden={'true'} className={'size-4'} />,
      label: 'View',
      onAction: (r) => onViewInfo?.(r.original),
      type: 'button',
    },
  ];

  return <DataTableRowActions actions={actions} row={row} size={'sm'} />;
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * Table view component for displaying historical (completed/failed/cancelled) workflows.
 *
 * Features:
 * - Server-side pagination support via onPaginationChange and pagination props
 * - Duration column showing formatted time (e.g., "2h 30m")
 * - Completed At column for terminal workflow date
 * - View Details action only (no edit/pause/resume for historical workflows)
 * - Reduced opacity styling for failed/cancelled workflows
 * - Column persistence via tableId
 * - Custom toolbar content support for filters
 */
export const WorkflowHistoryTable = ({
  className,
  isLoading = false,
  onGlobalFilterChange,
  onPaginationChange,
  onViewDetails,
  onViewInfo,
  pageCount,
  pagination,
  projectMap,
  ref,
  rowCount,
  toolbarContent,
  workflows,
  ...props
}: WorkflowHistoryTableProps) => {
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
  const columns = useMemo(
    () => [
      // Actions column (first for easy access)
      columnHelper.display({
        cell: ({ row }) => <ActionsCell onViewInfo={onViewInfo} row={row} />,
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
          return <TableNameButton onClick={() => onViewDetails?.(workflow.id)}>{workflow.featureName}</TableNameButton>;
        },
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Feature Name'} />,
        size: 350,
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
        size: 180,
      }),

      // Type column
      columnHelper.accessor('type', {
        cell: ({ row }) => (
          <Badge size={'sm'} variant={'default'}>
            {capitalizeFirstLetter(row.original.type)}
          </Badge>
        ),
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Type'} />,
        size: 120,
      }),

      // Status column
      columnHelper.accessor('status', {
        cell: ({ row }) => (
          <Badge size={'sm'} variant={getWorkflowStatusVariant(row.original.status)}>
            {getWorkflowStatusLabel(row.original.status)}
          </Badge>
        ),
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Status'} />,
        size: 120,
      }),

      // Steps Completed column (progress)
      columnHelper.display({
        cell: ({ row }) => {
          const workflow = row.original;
          const progressDisplay = `${workflow.currentStepNumber ?? 0}/${workflow.totalSteps ?? '?'}`;
          return <span className={'whitespace-nowrap text-muted-foreground'}>{progressDisplay}</span>;
        },
        enableSorting: false,
        header: 'Steps',
        id: 'stepsCompleted',
        size: 80,
      }),

      // Duration column
      columnHelper.accessor('durationMs', {
        cell: ({ row }) => (
          <span className={'text-sm whitespace-nowrap text-muted-foreground'}>
            {formatDuration(row.original.durationMs)}
          </span>
        ),
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Duration'} />,
        size: 100,
      }),

      // Completed At column - filler column to take remaining space
      columnHelper.accessor('completedAt', {
        cell: ({ row }) => (
          <span className={'text-sm whitespace-nowrap text-muted-foreground'}>
            {formatDateTime(row.original.completedAt)}
          </span>
        ),
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Completed'} />,
        meta: {
          isFillerColumn: true,
        },
        size: 160,
      }),
    ],
    [onViewDetails, onViewInfo, projectMap]
  );

  // Build controlled pagination state if provided
  const controlledState = useMemo(() => {
    if (pagination) {
      return { pagination };
    }
    return undefined;
  }, [pagination]);

  return (
    <Fragment>
      <DataTable
        className={className}
        columns={columns}
        data={workflows}
        density={'default'}
        emptyState={{
          noData: {
            description: 'Completed, failed, and cancelled workflows will appear here.',
            title: 'No workflow history',
          },
          noResults: {
            description: 'Try adjusting your search or filters.',
            title: 'No matching workflows',
          },
        }}
        getRowId={(workflow) => String(workflow.id)}
        isLoading={isLoading}
        isPaginationEnabled={!!onPaginationChange}
        isToolbarVisible={true}
        onGlobalFilterChange={onGlobalFilterChange}
        onPaginationChange={onPaginationChange}
        onRowClick={handleRowClick}
        persistence={{
          persistedKeys: ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting'],
          tableId: 'workflow-history-table',
        }}
        ref={ref}
        rowStyleCallback={rowStyleCallback}
        searchPlaceholder={'Search history...'}
        state={controlledState}
        toolbarContent={toolbarContent}
        {...(pageCount !== undefined && { pageCount })}
        {...(rowCount !== undefined && { rowCount })}
        {...props}
      />
    </Fragment>
  );
};
