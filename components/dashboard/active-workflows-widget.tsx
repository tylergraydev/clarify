'use client';

import { differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import { Activity, Clock, Eye, GitBranch, Pause, Play, X } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { Fragment, type KeyboardEvent, type MouseEvent, useMemo, useState } from 'react';

import type { Project, Workflow } from '@/types/electron';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjects } from '@/hooks/queries/use-projects';
import { useCancelWorkflow, usePauseWorkflow, useResumeWorkflow, useWorkflows } from '@/hooks/queries/use-workflows';
import { useWorktreeByWorkflowId } from '@/hooks/queries/use-worktrees';
import { cn } from '@/lib/utils';

type ActiveWorkflowsWidgetProps = ClassName;

type WorkflowCardProps = ClassName<{
  isCancelPending?: boolean;
  isPausePending?: boolean;
  isResumePending?: boolean;
  onCancel?: () => void;
  onClick: () => void;
  onPause?: () => void;
  onResume?: () => void;
  projectName: string;
  workflow: Workflow;
}>;

type WorkflowStatus = Workflow['status'];

const CANCELLABLE_STATUSES: Array<WorkflowStatus> = ['created', 'paused', 'running'];
const PAUSABLE_STATUSES: Array<WorkflowStatus> = ['running'];
const RESUMABLE_STATUSES: Array<WorkflowStatus> = ['paused'];

/**
 * Formats elapsed time from a start date to now in a human-readable format
 */
const formatElapsedTime = (startedAt: null | string): string => {
  if (!startedAt) {
    return 'Not started';
  }

  const startDate = parseISO(startedAt);
  const now = new Date();
  const hours = differenceInHours(now, startDate);
  const minutes = differenceInMinutes(now, startDate) % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

/**
 * Calculates progress percentage from current step and total steps
 */
const calculateProgress = (currentStep: null | number | undefined, totalSteps: null | number | undefined): number => {
  if (!currentStep || !totalSteps || totalSteps === 0) {
    return 0;
  }

  return Math.round((currentStep / totalSteps) * 100);
};

/**
 * Maps workflow status to badge variant
 */
const getStatusVariant = (status: string): 'clarifying' | 'completed' | 'default' | 'failed' | 'planning' => {
  switch (status) {
    case 'cancelled':
    case 'failed':
      return 'failed';
    case 'completed':
      return 'completed';
    case 'editing':
    case 'paused':
      return 'clarifying';
    case 'running':
      return 'planning';
    default:
      return 'default';
  }
};

/**
 * Gets the progress bar color class based on workflow status
 */
const getProgressBarColor = (status: WorkflowStatus): string => {
  switch (status) {
    case 'completed':
      return 'bg-success-indicator';
    case 'failed':
      return 'bg-destructive';
    case 'paused':
      return 'bg-warning-text';
    case 'running':
    default:
      return 'bg-accent';
  }
};

/**
 * Formats status for display
 */
const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const WorkflowCardSkeleton = () => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading workflow'}
      className={`
        animate-pulse rounded-lg border border-card-border bg-card p-4
      `}
      role={'article'}
    >
      {/* Header - matches h4 (font-medium ~20px) + p (text-sm 14px) + gap */}
      <div className={'flex items-start justify-between gap-2'}>
        <div className={'min-w-0 flex-1 space-y-1'}>
          <div className={'h-5 w-32 rounded-sm bg-muted'} />
          <div className={'h-4 w-24 rounded-sm bg-muted'} />
        </div>
        <div className={'h-5 w-16 rounded-full bg-muted'} />
      </div>

      {/* Progress Bar - matches exact h-2 bar + mt-1 text */}
      <div className={'mt-4'}>
        <div className={'h-2 w-full rounded-full bg-muted'} />
        <div className={'mt-1 flex items-center justify-between'}>
          <div className={'h-3 w-20 rounded-sm bg-muted'} />
          <div className={'h-3 w-8 rounded-sm bg-muted'} />
        </div>
      </div>

      {/* Footer - matches mt-3 text-xs layout */}
      <div className={'mt-3 flex items-center justify-between'}>
        <div className={'flex items-center gap-1'}>
          <div className={'size-3 rounded-sm bg-muted'} />
          <div className={'h-3 w-12 rounded-sm bg-muted'} />
        </div>
        <div className={'h-3 w-16 rounded-sm bg-muted'} />
      </div>
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading active workflows'}
      aria-live={'polite'}
      className={'space-y-3'}
      role={'status'}
    >
      <WorkflowCardSkeleton />
      <WorkflowCardSkeleton />
      <WorkflowCardSkeleton />
    </div>
  );
};

/**
 * Fetches and displays the branch name for a workflow
 * Only renders for workflows with a worktreeId
 */
const WorkflowBranchName = ({ workflowId }: { workflowId: number }) => {
  const { data: worktree } = useWorktreeByWorkflowId(workflowId);

  if (!worktree?.branchName) {
    return null;
  }

  return (
    <span className={'flex items-center gap-1 text-xs text-muted-foreground'}>
      <GitBranch aria-hidden={'true'} className={'size-3'} />
      <span className={'truncate'}>{worktree.branchName}</span>
    </span>
  );
};

const WorkflowCard = ({
  className,
  isCancelPending,
  isPausePending,
  isResumePending,
  onCancel,
  onClick,
  onPause,
  onResume,
  projectName,
  workflow,
}: WorkflowCardProps) => {
  const progress = calculateProgress(workflow.currentStepNumber, workflow.totalSteps);
  const elapsedTime = formatElapsedTime(workflow.startedAt);
  const statusVariant = getStatusVariant(workflow.status);
  const formattedStatus = formatStatus(workflow.status);

  const isPausable = PAUSABLE_STATUSES.includes(workflow.status);
  const isResumable = RESUMABLE_STATUSES.includes(workflow.status);
  const isCancellable = CANCELLABLE_STATUSES.includes(workflow.status);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const handleViewClick = (event: MouseEvent) => {
    event.stopPropagation();
    onClick();
  };

  const handlePauseClick = (event: MouseEvent) => {
    event.stopPropagation();
    onPause?.();
  };

  const handleResumeClick = (event: MouseEvent) => {
    event.stopPropagation();
    onResume?.();
  };

  const handleCancelClick = (event: MouseEvent) => {
    event.stopPropagation();
    onCancel?.();
  };

  return (
    <div
      aria-label={`View workflow: ${workflow.featureName}`}
      className={cn(
        `
          cursor-pointer rounded-lg border border-card-border bg-card p-4
          transition-all duration-150 hover:border-accent hover:bg-card/80 hover:shadow-sm
          focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset
          active:scale-[0.99]
        `,
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={'button'}
      tabIndex={0}
    >
      {/* Header */}
      <div className={'flex items-start justify-between gap-2'}>
        <div className={'min-w-0 flex-1'}>
          <h4 className={'truncate font-medium'}>{workflow.featureName}</h4>
          <p className={'text-sm text-muted-foreground'}>{projectName}</p>
          {/* Branch name for implementation workflows */}
          {workflow.worktreeId && <WorkflowBranchName workflowId={workflow.id} />}
        </div>
        <Badge size={'sm'} variant={statusVariant}>
          {formattedStatus}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className={'mt-4'}>
        <div className={'h-2 w-full overflow-hidden rounded-full bg-muted'}>
          <div
            className={cn('h-full rounded-full transition-all', getProgressBarColor(workflow.status))}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={'mt-1 flex items-center justify-between text-xs text-muted-foreground'}>
          <span>
            Step {workflow.currentStepNumber ?? 0} of {workflow.totalSteps ?? 0}
          </span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Footer with Info and Actions */}
      <div className={'mt-3 flex items-center justify-between'}>
        <div className={'flex items-center gap-3 text-xs text-muted-foreground'}>
          <span className={'flex items-center gap-1'}>
            <Clock aria-hidden={'true'} className={'size-3'} />
            {elapsedTime}
          </span>
          <span className={'capitalize'}>{workflow.type}</span>
        </div>

        {/* Action Buttons - Icons Only */}
        <div className={'flex items-center gap-1'}>
          <Button aria-label={'View workflow'} onClick={handleViewClick} size={'icon-sm'} variant={'ghost'}>
            <Eye aria-hidden={'true'} className={'size-4'} />
          </Button>

          {isPausable && (
            <Button
              aria-label={'Pause workflow'}
              disabled={isPausePending}
              onClick={handlePauseClick}
              size={'icon-sm'}
              variant={'ghost'}
            >
              <Pause aria-hidden={'true'} className={'size-4'} />
            </Button>
          )}

          {isResumable && (
            <Button
              aria-label={'Resume workflow'}
              disabled={isResumePending}
              onClick={handleResumeClick}
              size={'icon-sm'}
              variant={'ghost'}
            >
              <Play aria-hidden={'true'} className={'size-4'} />
            </Button>
          )}

          {isCancellable && (
            <Button
              aria-label={'Cancel workflow'}
              className={'hover:bg-destructive/10 hover:text-destructive'}
              disabled={isCancelPending}
              onClick={handleCancelClick}
              size={'icon-sm'}
              variant={'ghost'}
            >
              <X aria-hidden={'true'} className={'size-4'} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const ActiveWorkflowsContent = () => {
  const [workflowToCancel, setWorkflowToCancel] = useState<null | Workflow>(null);

  const router = useRouter();
  const { data: workflows = [], isLoading: isWorkflowsLoading } = useWorkflows();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const pauseMutation = usePauseWorkflow();
  const resumeMutation = useResumeWorkflow();
  const cancelMutation = useCancelWorkflow();

  const activeWorkflows = useMemo(() => {
    return workflows.filter(
      (workflow) => workflow.status === 'running' || workflow.status === 'paused' || workflow.status === 'editing'
    );
  }, [workflows]);

  const projectMap = useMemo(() => {
    return projects.reduce<Record<number, Project>>((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {});
  }, [projects]);

  const handleWorkflowClick = (workflowId: number) => {
    router.push(
      $path({
        route: '/workflows/[id]',
        routeParams: { id: String(workflowId) },
      })
    );
  };

  const handlePauseWorkflow = (workflowId: number) => {
    pauseMutation.mutate(workflowId);
  };

  const handleResumeWorkflow = (workflowId: number) => {
    resumeMutation.mutate(workflowId);
  };

  const handleCancelRequest = (workflow: Workflow) => {
    setWorkflowToCancel(workflow);
  };

  const handleConfirmCancel = () => {
    if (workflowToCancel) {
      cancelMutation.mutate(workflowToCancel.id);
      setWorkflowToCancel(null);
    }
  };

  const isLoading = isWorkflowsLoading || isProjectsLoading;
  const isActiveWorkflowsEmpty = activeWorkflows.length === 0;

  // Loading State
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Empty State
  if (isActiveWorkflowsEmpty) {
    return (
      <EmptyState
        description={'Start a new workflow from a project to see it here.'}
        icon={<Play aria-hidden={'true'} className={'size-6'} />}
        title={'No active workflows'}
      />
    );
  }

  // Workflows List
  return (
    <Fragment>
      {/* Active Workflow Cards */}
      <div aria-live={'polite'} className={'space-y-3'}>
        {activeWorkflows.map((workflow) => (
          <WorkflowCard
            isCancelPending={cancelMutation.isPending && cancelMutation.variables === workflow.id}
            isPausePending={pauseMutation.isPending && pauseMutation.variables === workflow.id}
            isResumePending={resumeMutation.isPending && resumeMutation.variables === workflow.id}
            key={workflow.id}
            onCancel={() => handleCancelRequest(workflow)}
            onClick={() => handleWorkflowClick(workflow.id)}
            onPause={() => handlePauseWorkflow(workflow.id)}
            onResume={() => handleResumeWorkflow(workflow.id)}
            projectName={projectMap[workflow.projectId]?.name ?? 'Unknown Project'}
            workflow={workflow}
          />
        ))}
      </div>

      {/* Cancel Confirmation Dialog */}
      <DialogRoot onOpenChange={(open: boolean) => !open && setWorkflowToCancel(null)} open={workflowToCancel !== null}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup size={'sm'}>
            <DialogTitle>Cancel Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel{' '}
              <span className={'font-medium text-foreground'}>{workflowToCancel?.featureName}</span>? This action cannot
              be undone.
            </DialogDescription>
            <div className={'mt-6 flex justify-end gap-3'}>
              <DialogClose render={<Button variant={'outline'} />}>Keep Running</DialogClose>
              <Button onClick={handleConfirmCancel} variant={'destructive'}>
                Cancel Workflow
              </Button>
            </div>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
    </Fragment>
  );
};

export const ActiveWorkflowsWidget = ({ className }: ActiveWorkflowsWidgetProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className={'flex items-center gap-2'}>
          <Activity aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
          <CardTitle>Active Workflows</CardTitle>
        </div>
        <CardDescription>Currently running or paused workflows</CardDescription>
      </CardHeader>
      <CardContent>
        <QueryErrorBoundary>
          <ActiveWorkflowsContent />
        </QueryErrorBoundary>
      </CardContent>
    </Card>
  );
};
