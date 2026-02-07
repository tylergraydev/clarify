'use client';

import type { ReactNode } from 'react';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

/** Pre-delete info about workflows that will be cancelled */
export interface PreDeleteWorkflowInfo {
  totalCount: number;
  workflows: Array<AffectedWorkflow>;
}

/** Summary of a workflow that will be affected by repository deletion */
interface AffectedWorkflow {
  featureName: string;
  id: number;
  status: string;
}

interface ConfirmDeleteRepositoryDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether pre-delete info is still loading */
  isLoadingInfo?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** Pre-delete workflow info (affected non-terminal workflows) */
  preDeleteInfo?: PreDeleteWorkflowInfo;
  /** The repository name to display in the dialog */
  repositoryName: string;
}

/** Max number of workflow feature names to show before truncating */
const MAX_VISIBLE_WORKFLOWS = 5;

/** Human-readable labels for workflow statuses */
const STATUS_LABELS: Record<string, string> = {
  awaiting_input: 'awaiting input',
  created: 'created',
  editing: 'editing',
  paused: 'paused',
  running: 'running',
};

/**
 * Build a status breakdown string like "2 running, 1 paused, 1 created"
 */
function buildStatusBreakdown(workflows: Array<AffectedWorkflow>): string {
  const counts = new Map<string, number>();

  for (const workflow of workflows) {
    const current = counts.get(workflow.status) ?? 0;
    counts.set(workflow.status, current + 1);
  }

  // Sort by count descending for readability
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return sorted.map(([status, count]) => `${count} ${STATUS_LABELS[status] ?? status}`).join(', ');
}

/**
 * Build the rich warning description for affected workflows.
 */
function buildWorkflowWarning(info: PreDeleteWorkflowInfo): ReactNode {
  const { totalCount, workflows } = info;
  const workflowLabel = totalCount === 1 ? 'workflow' : 'workflows';
  const statusBreakdown = buildStatusBreakdown(workflows);

  const visibleWorkflows = workflows.slice(0, MAX_VISIBLE_WORKFLOWS);
  const remainingCount = totalCount - visibleWorkflows.length;

  return (
    <span className={'flex flex-col gap-2'}>
      <span>
        <span className={'font-semibold'}>
          {totalCount} active {workflowLabel}
        </span>
        {' will be cancelled.'}
      </span>
      <span className={'text-xs opacity-80'}>{'Status breakdown: '}{statusBreakdown}</span>
      <span className={'ml-4 flex flex-col gap-0.5 text-xs opacity-80'}>
        {visibleWorkflows.map((w) => (
          <span className={'flex items-baseline gap-1'} key={w.id}>
            <span aria-hidden={'true'}>{'•'}</span>
            <span>
              {w.featureName}
              <span className={'ml-1 opacity-60'}>{'('}{STATUS_LABELS[w.status] ?? w.status}{')'}</span>
            </span>
          </span>
        ))}
        {remainingCount > 0 && (
          <span className={'flex items-baseline gap-1 opacity-60'}>
            <span aria-hidden={'true'}>{'•'}</span>
            <span>{`+${remainingCount} more ${remainingCount === 1 ? 'workflow' : 'workflows'}`}</span>
          </span>
        )}
      </span>
      <span className={'text-xs opacity-80'}>
        {'These workflows will be moved to cancelled status and cannot be resumed.'}
      </span>
    </span>
  );
}

export const ConfirmDeleteRepositoryDialog = ({
  isLoading = false,
  isLoadingInfo = false,
  isOpen,
  onConfirm,
  onOpenChange,
  preDeleteInfo,
  repositoryName,
}: ConfirmDeleteRepositoryDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  const hasAffectedWorkflows = (preDeleteInfo?.totalCount ?? 0) > 0;

  return (
    <ConfirmActionDialog
      alerts={[
        {
          containerClassName: 'dark:border-destructive/30 dark:bg-destructive/20',
          description:
            'This action is permanent and cannot be undone. The repository will be removed from this project.',
          tone: 'destructive' as const,
        },
        ...(hasAffectedWorkflows && preDeleteInfo
          ? [
              {
                description: buildWorkflowWarning(preDeleteInfo),
                tone: 'warning' as const,
              },
            ]
          : []),
      ]}
      confirmAriaDescribedById={'confirm-delete-repository-description'}
      confirmAriaLabel={`Remove ${repositoryName} repository permanently`}
      confirmLabel={'Remove'}
      description={`Are you sure you want to remove "${repositoryName}" from this project?`}
      descriptionId={'confirm-delete-repository-description'}
      isLoading={isLoading || isLoadingInfo}
      isOpen={isOpen}
      loadingLabel={'Removing...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={'Remove Repository'}
      titleId={'confirm-delete-repository-title'}
    />
  );
};
