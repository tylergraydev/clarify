'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { Calendar, ChevronRight, Clock, FolderOpen, Pause, Play, X } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouteParams } from 'next-typesafe-url/app';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Fragment } from 'react';

import type { badgeVariants } from '@/components/ui/badge';
import type { Workflow } from '@/types/electron';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PipelineView, WorkflowDetailSkeleton } from '@/components/workflows';
import { useProject } from '@/hooks/queries/use-projects';
import {
  useCancelWorkflow,
  usePauseWorkflow,
  useResumeWorkflow,
  useStartWorkflow,
  useWorkflow,
} from '@/hooks/queries/use-workflows';

import { Route } from './route-type';

// ============================================================================
// Types
// ============================================================================

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];

type WorkflowStatus = Workflow['status'];

type WorkflowType = Workflow['type'];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Status arrays for conditional action visibility
 */
const CANCELLABLE_STATUSES: Array<WorkflowStatus> = ['created', 'paused', 'running'];
const PAUSABLE_STATUSES: Array<WorkflowStatus> = ['running'];
const RESUMABLE_STATUSES: Array<WorkflowStatus> = ['paused'];
const STARTABLE_STATUSES: Array<WorkflowStatus> = ['created'];

/**
 * Maps workflow status to badge variant for consistent status styling.
 *
 * Mapping:
 * - created -> default (neutral gray)
 * - running -> planning (purple/blue)
 * - paused -> clarifying (yellow)
 * - editing -> clarifying (yellow)
 * - completed -> completed (green)
 * - failed -> failed (red)
 * - cancelled -> stale (amber)
 */
const getStatusVariant = (status: WorkflowStatus): BadgeVariant => {
  const statusVariantMap: Record<WorkflowStatus, BadgeVariant> = {
    cancelled: 'stale',
    completed: 'completed',
    created: 'default',
    editing: 'clarifying',
    failed: 'failed',
    paused: 'clarifying',
    running: 'planning',
  };

  return statusVariantMap[status] ?? 'default';
};

/**
 * Formats a workflow status string for display by capitalizing the first letter.
 */
const formatStatusLabel = (status: WorkflowStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Formats a workflow type string for display by capitalizing the first letter.
 */
const formatTypeLabel = (type: WorkflowType): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Formats a date string to a relative time string (e.g., "2 hours ago", "3 days ago").
 * Returns a fallback string if the date is null or invalid.
 *
 * SQLite CURRENT_TIMESTAMP returns UTC time in format 'YYYY-MM-DD HH:MM:SS' without
 * timezone indicator. We normalize this to ISO 8601 with 'Z' suffix so date-fns
 * correctly interprets it as UTC rather than local time.
 */
const formatRelativeTime = (dateString: null | string | undefined): string => {
  if (!dateString) {
    return 'Unknown';
  }

  try {
    // Normalize SQLite timestamp to ISO 8601 UTC format
    const normalizedDate = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
    const date = parseISO(normalizedDate);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

// ============================================================================
// Component
// ============================================================================

/**
 * Workflow detail page with breadcrumb navigation.
 *
 * Features:
 * - Breadcrumb navigation: Projects > [Project Name] > Workflows > [Workflow Name]
 * - Placeholder heading displaying workflow name
 * - Handles loading and error states
 */
const WorkflowDetailPage = () => {
  // Type-safe route params validation
  const routeParams = useRouteParams(Route.routeParams);

  // Get validated workflow ID (safe to access after loading/error checks)
  const workflowId = routeParams.data?.id;

  // Fetch workflow data (only when we have a valid ID)
  const { data: workflow, isError: isWorkflowError, isLoading: isWorkflowLoading } = useWorkflow(workflowId ?? 0);

  // Fetch project data for breadcrumb (only when workflow has a projectId)
  const projectId = workflow?.projectId ?? 0;
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);

  // Workflow action mutations
  const startWorkflow = useStartWorkflow();
  const pauseWorkflow = usePauseWorkflow();
  const resumeWorkflow = useResumeWorkflow();
  const cancelWorkflow = useCancelWorkflow();

  // Handle route params loading state
  if (routeParams.isLoading) {
    return (
      <div aria-busy={'true'} aria-label={'Loading workflow details'} role={'status'}>
        <WorkflowDetailSkeleton />
      </div>
    );
  }

  // Redirect if ID is invalid (Zod validation failed)
  if (routeParams.isError || !workflowId) {
    redirect($path({ route: '/workflows/active' }));
  }

  // Loading state for workflow data
  if (isWorkflowLoading) {
    return (
      <div aria-busy={'true'} aria-label={'Loading workflow details'} role={'status'}>
        <WorkflowDetailSkeleton />
      </div>
    );
  }

  // Error or not found state - redirect to active workflows
  if (isWorkflowError || !workflow) {
    redirect($path({ route: '/workflows/active' }));
  }

  // Derived state
  const hasProject = workflow.projectId !== null && project !== null && project !== undefined;
  const isProjectDataLoading = workflow.projectId !== null && isProjectLoading;
  const isStarting = startWorkflow.isPending;
  const isStartable = STARTABLE_STATUSES.includes(workflow.status);
  const isPausing = pauseWorkflow.isPending;
  const isResuming = resumeWorkflow.isPending;
  const isCancelling = cancelWorkflow.isPending;

  // Event handlers
  const handleStartWorkflow = () => {
    startWorkflow.mutate(workflowId);
  };

  const handlePauseWorkflow = () => {
    pauseWorkflow.mutate(workflowId);
  };

  const handleResumeWorkflow = () => {
    resumeWorkflow.mutate(workflowId);
  };

  const handleCancelWorkflow = () => {
    cancelWorkflow.mutate(workflowId);
  };

  return (
    <QueryErrorBoundary>
      <main aria-label={'Workflow detail'} className={'space-y-6'}>
        {/* Skip link for keyboard navigation */}
        <a
          className={
            'sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-2 focus:text-foreground'
          }
          href={'#workflow-content'}
        >
          Skip to workflow content
        </a>

        {/* Breadcrumb navigation */}
        <nav aria-label={'Breadcrumb'} className={'flex items-center gap-2'}>
          <Link
            className={'text-sm text-muted-foreground transition-colors hover:text-foreground'}
            href={$path({ route: '/projects' })}
          >
            Projects
          </Link>
          <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />

          {/* Project name link (conditional on project existing) */}
          {hasProject ? (
            <Link
              className={'text-sm text-muted-foreground transition-colors hover:text-foreground'}
              href={$path({ route: '/projects/[id]', routeParams: { id: workflow.projectId } })}
            >
              {project.name}
            </Link>
          ) : isProjectDataLoading ? (
            <span className={'h-4 w-24 animate-pulse rounded-sm bg-muted'} />
          ) : (
            <span className={'text-sm text-muted-foreground'}>No Project</span>
          )}
          <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />

          {/* Static "Workflows" text (no link) */}
          <span className={'text-sm text-muted-foreground'}>{'Workflows'}</span>
          <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />

          {/* Current workflow name (no link) */}
          <span className={'text-sm text-foreground'}>{workflow.featureName}</span>
        </nav>

        {/* Page header */}
        <section aria-label={'Workflow header'} aria-live={'polite'} id={'workflow-content'}>
          <div className={'flex items-center gap-3'}>
            <h1 className={'text-3xl font-bold'}>{workflow.featureName}</h1>
            <Badge variant={getStatusVariant(workflow.status)}>{formatStatusLabel(workflow.status)}</Badge>
            <Badge variant={'default'}>{formatTypeLabel(workflow.type)}</Badge>
          </div>

          {/* Metadata */}
          <div className={'mt-2 flex items-center gap-3 text-sm text-muted-foreground'}>
            {hasProject ? (
              <Link
                className={'flex items-center gap-1 transition-colors hover:text-foreground'}
                href={$path({ route: '/projects/[id]', routeParams: { id: workflow.projectId as number } })}
              >
                <FolderOpen className={'size-4'} />
                {project.name}
              </Link>
            ) : isProjectDataLoading ? (
              <span className={'flex items-center gap-1'}>
                <FolderOpen className={'size-4'} />
                <span className={'h-4 w-20 animate-pulse rounded-sm bg-muted'} />
              </span>
            ) : (
              <span className={'flex items-center gap-1'}>
                <FolderOpen className={'size-4'} />
                No Project
              </span>
            )}
            <span aria-hidden={'true'}>·</span>
            <span className={'flex items-center gap-1'}>
              <Calendar className={'size-4'} />
              {'Created '}
              {formatRelativeTime(workflow.createdAt)}
            </span>
            {workflow.startedAt && (
              <Fragment>
                <span aria-hidden={'true'}>·</span>
                <span className={'flex items-center gap-1'}>
                  <Clock className={'size-4'} />
                  {'Started '}
                  {formatRelativeTime(workflow.startedAt)}
                </span>
              </Fragment>
            )}
          </div>

          {/* Action Bar */}
          <div className={'mt-4 flex items-center gap-2'}>
            {isStartable && (
              <Button
                aria-label={isStarting ? 'Starting workflow' : 'Start workflow'}
                disabled={isStarting}
                onClick={handleStartWorkflow}
              >
                <Play className={'mr-2 size-4'} />
                {isStarting ? 'Starting...' : 'Start'}
              </Button>
            )}
            {PAUSABLE_STATUSES.includes(workflow.status) && (
              <Button
                aria-label={isPausing ? 'Pausing workflow' : 'Pause workflow'}
                disabled={isPausing}
                onClick={handlePauseWorkflow}
                variant={'outline'}
              >
                <Pause className={'mr-2 size-4'} />
                {isPausing ? 'Pausing...' : 'Pause'}
              </Button>
            )}
            {RESUMABLE_STATUSES.includes(workflow.status) && (
              <Button
                aria-label={isResuming ? 'Resuming workflow' : 'Resume workflow'}
                disabled={isResuming}
                onClick={handleResumeWorkflow}
                variant={'outline'}
              >
                <Play className={'mr-2 size-4'} />
                {isResuming ? 'Resuming...' : 'Resume'}
              </Button>
            )}
            {CANCELLABLE_STATUSES.includes(workflow.status) && (
              <Button
                aria-label={isCancelling ? 'Cancelling workflow' : 'Cancel workflow'}
                disabled={isCancelling}
                onClick={handleCancelWorkflow}
                variant={'destructive'}
              >
                <X className={'mr-2 size-4'} />
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}
          </div>
        </section>

        {/* Pipeline Section */}
        <section aria-label={'Workflow pipeline'}>
          <PipelineView workflowId={workflowId} />
        </section>
      </main>
    </QueryErrorBoundary>
  );
};

// ============================================================================
// Export
// ============================================================================

export default WorkflowDetailPage;
