'use client';

import type { ComponentPropsWithRef } from 'react';

import { format, formatDuration, intervalToDuration } from 'date-fns';
import { ChevronDown, ChevronUp, Download, Eye } from 'lucide-react';

import type {
  Workflow,
  WorkflowHistorySortField,
  WorkflowHistorySortOrder,
} from '@/types/electron';

import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];

type WorkflowStatus = Workflow['status'];
type WorkflowType = Workflow['type'];

/**
 * Get the appropriate badge variant for a terminal workflow status
 */
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

/**
 * Format a status string for display (capitalize first letter)
 */
const formatStatusLabel = (status: WorkflowStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Format a workflow type string for display (capitalize first letter)
 */
const formatTypeLabel = (type: WorkflowType): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Format duration from milliseconds to human-readable format
 * Examples: "1h 23m", "45m", "2m 30s", "< 1m"
 */
const formatDurationMs = (durationMs: null | number | undefined): string => {
  if (durationMs === null || durationMs === undefined) {
    return '-';
  }

  if (durationMs === 0) {
    return '< 1m';
  }

  if (durationMs < 60000) {
    // Less than 1 minute
    const seconds = Math.round(durationMs / 1000);
    if (seconds === 0) {
      return '< 1s';
    }
    return `${seconds}s`;
  }

  const duration = intervalToDuration({ end: durationMs, start: 0 });

  // Format based on the magnitude
  if (duration.hours && duration.hours > 0) {
    return formatDuration(duration, {
      format: ['hours', 'minutes'],
      zero: false,
    })
      .replace(' hours', 'h')
      .replace(' hour', 'h')
      .replace(' minutes', 'm')
      .replace(' minute', 'm');
  }

  if (duration.minutes && duration.minutes > 0) {
    return formatDuration(duration, {
      format: ['minutes', 'seconds'],
      zero: false,
    })
      .replace(' minutes', 'm')
      .replace(' minute', 'm')
      .replace(' seconds', 's')
      .replace(' second', 's');
  }

  return '< 1m';
};

/**
 * Sortable column configuration
 */
interface SortableColumn {
  field: WorkflowHistorySortField;
  label: string;
}

const COLUMN_FEATURE_NAME: SortableColumn = { field: 'featureName', label: 'Feature Name' };
const COLUMN_STATUS: SortableColumn = { field: 'status', label: 'Final Status' };
const COLUMN_DURATION: SortableColumn = { field: 'durationMs', label: 'Duration' };
const COLUMN_COMPLETED_AT: SortableColumn = { field: 'completedAt', label: 'Completed' };

interface WorkflowHistoryTableProps extends ComponentPropsWithRef<'div'> {
  /** Callback when the user clicks export audit log for a workflow */
  onExportAuditLog?: (workflowId: number) => void;
  /** Callback when the user changes the sort field or order */
  onSortChange?: (field: WorkflowHistorySortField, order: WorkflowHistorySortOrder) => void;
  /** Callback when the user clicks view details on a workflow */
  onViewDetails?: (workflowId: number) => void;
  /**
   * Map of project IDs to project names for display
   * Reserved for future use when project column is added
   */
  projectMap?: Record<number, string>;
  /** Current sort field */
  sortBy?: WorkflowHistorySortField;
  /** Current sort order */
  sortOrder?: WorkflowHistorySortOrder;
  /** Array of completed/failed/cancelled workflows to display */
  workflows: Array<Workflow>;
}

export const WorkflowHistoryTable = ({
  className,
  onExportAuditLog,
  onSortChange,
  onViewDetails,
  projectMap: _projectMap,
  ref,
  sortBy = 'completedAt',
  sortOrder = 'desc',
  workflows,
  ...props
}: WorkflowHistoryTableProps) => {
  // _projectMap is reserved for future use when project column is added
  void _projectMap;
  const handleExportAuditLogClick = (workflowId: number) => {
    onExportAuditLog?.(workflowId);
  };

  const handleViewDetailsClick = (workflowId: number) => {
    onViewDetails?.(workflowId);
  };

  const handleRowClick = (workflowId: number) => {
    onViewDetails?.(workflowId);
  };

  const handleSortClick = (field: WorkflowHistorySortField) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      onSortChange?.(field, newOrder);
    } else {
      // Default to descending for new field
      onSortChange?.(field, 'desc');
    }
  };

  const renderSortIndicator = (field: WorkflowHistorySortField) => {
    if (sortBy !== field) {
      return null;
    }

    return sortOrder === 'asc' ? (
      <ChevronUp aria-hidden={'true'} className={'ml-1 inline size-4'} />
    ) : (
      <ChevronDown aria-hidden={'true'} className={'ml-1 inline size-4'} />
    );
  };

  const renderSortableHeader = (column: SortableColumn) => {
    const isActive = sortBy === column.field;

    return (
      <th
        className={'px-4 py-3 text-left font-medium text-muted-foreground'}
        key={column.field}
        scope={'col'}
      >
        <button
          aria-label={`Sort by ${column.label}`}
          className={cn(
            'inline-flex items-center transition-colors',
            'hover:text-foreground',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
            'focus-visible:outline-none',
            isActive && 'text-foreground'
          )}
          onClick={() => handleSortClick(column.field)}
          type={'button'}
        >
          {column.label}
          {renderSortIndicator(column.field)}
        </button>
      </th>
    );
  };

  return (
    <div
      className={cn('overflow-x-auto rounded-lg border border-border', className)}
      ref={ref}
      {...props}
    >
      <table className={'w-full border-collapse text-sm'}>
        {/* Table Header */}
        <thead className={'border-b border-border bg-muted/50'}>
          <tr>
            {/* Feature Name - Sortable */}
            {renderSortableHeader(COLUMN_FEATURE_NAME)}

            {/* Workflow Type - Not sortable */}
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Workflow Type'}
            </th>

            {/* Final Status - Sortable */}
            {renderSortableHeader(COLUMN_STATUS)}

            {/* Duration - Sortable */}
            {renderSortableHeader(COLUMN_DURATION)}

            {/* Completed Date - Sortable */}
            {renderSortableHeader(COLUMN_COMPLETED_AT)}

            {/* Actions - Not sortable */}
            <th
              className={'px-4 py-3 text-right font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Actions'}
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className={'divide-y divide-border'}>
          {workflows.map((workflow) => {
            const isFailed = workflow.status === 'failed';
            const formattedCompletedDate = workflow.completedAt
              ? format(new Date(workflow.completedAt), 'MMM d, yyyy')
              : '-';
            const formattedDuration = formatDurationMs(workflow.durationMs);

            return (
              <tr
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/30',
                  isFailed && 'opacity-75'
                )}
                key={workflow.id}
                onClick={() => handleRowClick(workflow.id)}
              >
                {/* Feature Name Cell */}
                <td className={'px-4 py-3'}>
                  <button
                    className={cn(
                      'text-left font-medium text-foreground hover:text-accent',
                      'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
                      'focus-visible:outline-none'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetailsClick(workflow.id);
                    }}
                    type={'button'}
                  >
                    {workflow.featureName}
                  </button>
                </td>

                {/* Workflow Type Cell */}
                <td className={'px-4 py-3'}>
                  <Badge size={'sm'} variant={'default'}>
                    {formatTypeLabel(workflow.type as WorkflowType)}
                  </Badge>
                </td>

                {/* Final Status Cell */}
                <td className={'px-4 py-3'}>
                  <Badge variant={getStatusVariant(workflow.status as WorkflowStatus)}>
                    {formatStatusLabel(workflow.status as WorkflowStatus)}
                  </Badge>
                </td>

                {/* Duration Cell */}
                <td className={'px-4 py-3 whitespace-nowrap text-muted-foreground'}>
                  {formattedDuration}
                </td>

                {/* Completed Date Cell */}
                <td className={'px-4 py-3 whitespace-nowrap text-muted-foreground'}>
                  {formattedCompletedDate}
                </td>

                {/* Actions Cell */}
                <td className={'px-4 py-3'}>
                  <div
                    className={'flex items-center justify-end gap-2'}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* View Details */}
                    <Button
                      aria-label={`View details for ${workflow.featureName}`}
                      onClick={() => handleViewDetailsClick(workflow.id)}
                      size={'sm'}
                      variant={'ghost'}
                    >
                      <Eye aria-hidden={'true'} className={'size-4'} />
                      {'View'}
                    </Button>

                    {/* Export Audit Log */}
                    <Button
                      aria-label={`Export audit log for ${workflow.featureName}`}
                      onClick={() => handleExportAuditLogClick(workflow.id)}
                      size={'sm'}
                      variant={'ghost'}
                    >
                      <Download aria-hidden={'true'} className={'size-4'} />
                      {'Export'}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
