'use client';

import type { ComponentPropsWithRef } from 'react';

import { format } from 'date-fns';
import { Eye, X } from 'lucide-react';

import type { Workflow } from '@/types/electron';

import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BadgeVariant = NonNullable<
  Parameters<typeof badgeVariants>[0]
>['variant'];

type WorkflowStatus = Workflow['status'];
type WorkflowType = Workflow['type'];

const CANCELLABLE_STATUSES: Array<WorkflowStatus> = [
  'created',
  'running',
  'paused',
];

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

interface WorkflowTableProps extends ComponentPropsWithRef<'div'> {
  /** Callback when the user clicks cancel on a workflow */
  onCancel?: (workflowId: number) => void;
  /** Callback when the user clicks view details on a workflow */
  onViewDetails?: (workflowId: number) => void;
  /** Map of project IDs to project names for display */
  projectMap: Record<number, string>;
  /** Array of workflows to display */
  workflows: Array<Workflow>;
}

export const WorkflowTable = ({
  className,
  onCancel,
  onViewDetails,
  projectMap,
  ref,
  workflows,
  ...props
}: WorkflowTableProps) => {
  const handleCancelClick = (workflowId: number) => {
    onCancel?.(workflowId);
  };

  const handleViewDetailsClick = (workflowId: number) => {
    onViewDetails?.(workflowId);
  };

  const handleRowClick = (workflowId: number) => {
    onViewDetails?.(workflowId);
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
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Feature Name'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Project'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Type'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Status'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Progress'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Created'}
            </th>
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
            const isCancellable = CANCELLABLE_STATUSES.includes(
              workflow.status as WorkflowStatus
            );
            const isCancelledOrFailed =
              workflow.status === 'cancelled' || workflow.status === 'failed';
            const formattedDate = format(new Date(workflow.createdAt), 'MMM d, yyyy');
            const projectName = projectMap[workflow.projectId] ?? 'Unknown';
            const progressDisplay = `${workflow.currentStepNumber ?? 0}/${workflow.totalSteps ?? '?'}`;

            return (
              <tr
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/30',
                  isCancelledOrFailed && 'opacity-60'
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

                {/* Project Cell */}
                <td className={'max-w-xs truncate px-4 py-3 text-muted-foreground'}>
                  {projectName}
                </td>

                {/* Type Cell */}
                <td className={'px-4 py-3'}>
                  <Badge size={'sm'} variant={'default'}>
                    {formatTypeLabel(workflow.type as WorkflowType)}
                  </Badge>
                </td>

                {/* Status Cell */}
                <td className={'px-4 py-3'}>
                  <Badge variant={getStatusVariant(workflow.status as WorkflowStatus)}>
                    {formatStatusLabel(workflow.status as WorkflowStatus)}
                  </Badge>
                </td>

                {/* Progress Cell */}
                <td className={'px-4 py-3 whitespace-nowrap text-muted-foreground'}>
                  {progressDisplay}
                </td>

                {/* Created Cell */}
                <td className={'px-4 py-3 whitespace-nowrap text-muted-foreground'}>
                  {formattedDate}
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

                    {/* Cancel */}
                    {isCancellable && (
                      <Button
                        aria-label={`Cancel ${workflow.featureName}`}
                        onClick={() => handleCancelClick(workflow.id)}
                        size={'sm'}
                        variant={'ghost'}
                      >
                        <X aria-hidden={'true'} className={'size-4'} />
                        {'Cancel'}
                      </Button>
                    )}
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
