'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, ChevronRight, Clock, Settings, Trash2 } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouteParams } from 'next-typesafe-url/app';
import Link from 'next/link';
import { redirect, useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';

import type { Workflow } from '@/types/electron';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDeleteWorkflowDialog } from '@/components/workflows/confirm-delete-workflow-dialog';
import { workflowStatuses } from '@/db/schema/workflows.schema';
import { useProject } from '@/hooks/queries/use-projects';
import { useStepsByWorkflow } from '@/hooks/queries/use-steps';
import {
  useCancelWorkflow,
  useDeleteWorkflow,
  usePauseWorkflow,
  useResumeWorkflow,
  useWorkflow,
} from '@/hooks/queries/use-workflows';

import { PipelineView, WorkflowControlBar, WorkflowDetailSkeleton, WorkflowNotFound } from './_components';
import { Route } from './route-type';

// ============================================================================
// Types
// ============================================================================

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];

type WorkflowStatus = (typeof workflowStatuses)[number];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Maps workflow status to badge variant for visual styling
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
 * Formats a workflow status string for display
 */
const formatStatusLabel = (status: WorkflowStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Formats a workflow type string for display
 */
const formatTypeLabel = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Calculates workflow duration from started time to completed/current time
 */
const calculateDuration = (workflow: Workflow): null | string => {
  if (!workflow.startedAt) {
    return null;
  }

  const startDate = new Date(workflow.startedAt);

  return formatDistanceToNow(startDate, { addSuffix: false });
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Workflow detail page with pipeline view and control bar.
 *
 * Features:
 * - Breadcrumb navigation: Workflows > [Feature Name]
 * - Workflow header with name, status badge, type badge, and progress
 * - Control bar with pause/resume/cancel actions
 * - Pipeline view showing all workflow steps
 * - Workflow metadata section (dates, duration, pause behavior)
 * - QueryErrorBoundary for error handling
 */
export default function WorkflowDetailPage() {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Type-safe route params validation
  const routeParams = useRouteParams(Route.routeParams);

  // Parse workflow ID from route params
  const workflowId = routeParams.data?.id ? parseInt(routeParams.data.id, 10) : 0;

  // Fetch workflow data
  const { data: workflow, isError: isWorkflowError, isLoading: isWorkflowLoading } = useWorkflow(workflowId);

  // Fetch steps data
  const { data: steps, isLoading: isStepsLoading } = useStepsByWorkflow(workflowId);

  // Conditionally fetch project data if workflow has a projectId
  const { data: project } = useProject(workflow?.projectId ?? 0);

  // Mutations
  const pauseWorkflowMutation = usePauseWorkflow();
  const resumeWorkflowMutation = useResumeWorkflow();
  const cancelWorkflowMutation = useCancelWorkflow();
  const deleteWorkflowMutation = useDeleteWorkflow();

  // Handle route params loading state
  if (routeParams.isLoading) {
    return <WorkflowDetailSkeleton />;
  }

  // Redirect if ID is invalid (Zod validation failed or NaN)
  if (routeParams.isError || !workflowId || isNaN(workflowId)) {
    redirect('/workflows');
  }

  // Loading state for workflow data
  if (isWorkflowLoading) {
    return <WorkflowDetailSkeleton />;
  }

  // Error or not found state
  if (isWorkflowError || !workflow) {
    return <WorkflowNotFound />;
  }

  // Derived data
  const completedSteps = steps?.filter((step) => step.status === 'completed').length ?? 0;
  const totalSteps = steps?.length ?? workflow.totalSteps ?? 0;
  const progressText = `${completedSteps}/${totalSteps} steps`;
  const duration = calculateDuration(workflow);
  const formattedCreatedDate = format(new Date(workflow.createdAt), "MMM d, yyyy 'at' h:mm a");
  const formattedStartedDate = workflow.startedAt
    ? format(new Date(workflow.startedAt), "MMM d, yyyy 'at' h:mm a")
    : null;

  // Handlers
  const handlePause = () => {
    pauseWorkflowMutation.mutate(workflowId);
  };

  const handleResume = () => {
    resumeWorkflowMutation.mutate(workflowId);
  };

  const handleCancel = () => {
    cancelWorkflowMutation.mutate(workflowId);
  };

  const handleDelete = () => {
    deleteWorkflowMutation.mutate(workflowId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        router.push($path({ route: '/workflows' }));
      },
    });
  };

  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb navigation */}
      <nav aria-label={'Breadcrumb'} className={'flex items-center gap-2'}>
        <Link className={'text-sm text-muted-foreground transition-colors hover:text-foreground'} href={'/workflows'}>
          {'Workflows'}
        </Link>
        <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
        <span className={'text-sm text-foreground'}>{workflow.featureName}</span>
      </nav>

      {/* Page header */}
      <div className={'flex items-start justify-between gap-4'}>
        {/* Title and badges */}
        <div className={'space-y-2'}>
          <div className={'flex items-center gap-3'}>
            <h1 className={'text-2xl font-semibold tracking-tight'}>{workflow.featureName}</h1>
            <Badge variant={getStatusVariant(workflow.status as WorkflowStatus)}>
              {formatStatusLabel(workflow.status as WorkflowStatus)}
            </Badge>
            <Badge variant={'default'}>{formatTypeLabel(workflow.type)}</Badge>
          </div>
          {/* Progress indicator and project name */}
          <div className={'flex items-center gap-4 text-sm text-muted-foreground'}>
            <span>{progressText}</span>
            {project && (
              <Fragment>
                <span aria-hidden={'true'}>{'•'}</span>
                <span>{project.name}</span>
              </Fragment>
            )}
          </div>
        </div>

        {/* Control bar */}
        <div className={'flex items-center gap-2'}>
          <WorkflowControlBar
            isCancelPending={cancelWorkflowMutation.isPending}
            isPausePending={pauseWorkflowMutation.isPending}
            isResumePending={resumeWorkflowMutation.isPending}
            onCancel={handleCancel}
            onPause={handlePause}
            onResume={handleResume}
            status={workflow.status as WorkflowStatus}
          />
          <Button onClick={() => setIsDeleteDialogOpen(true)} size={'icon'} variant={'ghost'}>
            <Trash2 aria-hidden={'true'} className={'size-4'} />
            <span className={'sr-only'}>{'Delete workflow'}</span>
          </Button>
        </div>
      </div>

      {/* Pipeline view with steps */}
      <QueryErrorBoundary>
        <PipelineView isLoading={isStepsLoading} steps={steps ?? []} />
      </QueryErrorBoundary>

      {/* Workflow metadata section */}
      <Card>
        <CardHeader>
          <CardTitle className={'flex items-center gap-2 text-base'}>
            <Settings aria-hidden={'true'} className={'size-4'} />
            {'Workflow Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'}>
            {/* Created date */}
            <div className={'space-y-1'}>
              <div className={'flex items-center gap-2 text-sm text-muted-foreground'}>
                <Calendar aria-hidden={'true'} className={'size-4'} />
                <span>{'Created'}</span>
              </div>
              <p className={'text-sm font-medium'}>{formattedCreatedDate}</p>
            </div>

            {/* Started date */}
            <div className={'space-y-1'}>
              <div className={'flex items-center gap-2 text-sm text-muted-foreground'}>
                <Calendar aria-hidden={'true'} className={'size-4'} />
                <span>{'Started'}</span>
              </div>
              <p className={'text-sm font-medium'}>{formattedStartedDate ?? 'Not started yet'}</p>
            </div>

            {/* Duration */}
            <div className={'space-y-1'}>
              <div className={'flex items-center gap-2 text-sm text-muted-foreground'}>
                <Clock aria-hidden={'true'} className={'size-4'} />
                <span>{'Duration'}</span>
              </div>
              <p className={'text-sm font-medium'}>{duration ?? 'N/A'}</p>
            </div>

            {/* Pause behavior */}
            <div className={'space-y-1'}>
              <div className={'flex items-center gap-2 text-sm text-muted-foreground'}>
                <Settings aria-hidden={'true'} className={'size-4'} />
                <span>{'Pause Behavior'}</span>
              </div>
              <p className={'text-sm font-medium'}>
                {workflow.pauseBehavior === 'auto_pause' ? 'Auto-pause' : 'Continuous'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <ConfirmDeleteWorkflowDialog
        isLoading={deleteWorkflowMutation.isPending}
        isOpen={isDeleteDialogOpen}
        onConfirm={handleDelete}
        onOpenChange={setIsDeleteDialogOpen}
        status={workflow.status}
        workflowName={workflow.featureName}
      />
    </div>
  );
}
