'use client';

import { differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import { Activity, Clock, Play, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type KeyboardEvent, useMemo } from 'react';

import type { Project, Workflow } from '@/types/electron';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjects } from '@/hooks/queries/use-projects';
import { useWorkflows } from '@/hooks/queries/use-workflows';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type ActiveWorkflowsWidgetProps = ClassName;

type WorkflowCardProps = ClassName<{
  onClick: () => void;
  projectName: string;
  workflow: Workflow;
}>;

// ============================================================================
// Utility Functions
// ============================================================================

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
const calculateProgress = (
  currentStep: null | number | undefined,
  totalSteps: null | number | undefined
): number => {
  if (!currentStep || !totalSteps || totalSteps === 0) {
    return 0;
  }

  return Math.round((currentStep / totalSteps) * 100);
};

/**
 * Maps workflow status to badge variant
 */
const getStatusVariant = (
  status: string
): 'clarifying' | 'completed' | 'default' | 'failed' | 'planning' => {
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
 * Formats status for display
 */
const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// ============================================================================
// Skeleton Components
// ============================================================================

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

// ============================================================================
// Workflow Card Component
// ============================================================================

const WorkflowCard = ({
  className,
  onClick,
  projectName,
  workflow,
}: WorkflowCardProps) => {
  const progress = calculateProgress(
    workflow.currentStepNumber,
    workflow.totalSteps
  );
  const elapsedTime = formatElapsedTime(workflow.startedAt);
  const statusVariant = getStatusVariant(workflow.status);
  const formattedStatus = formatStatus(workflow.status);

  const handleClick = () => {
    onClick();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
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
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={'button'}
      tabIndex={0}
    >
      {/* Header */}
      <div className={'flex items-start justify-between gap-2'}>
        <div className={'min-w-0 flex-1'}>
          <h4 className={'truncate font-medium'}>{workflow.featureName}</h4>
          <p className={'text-sm text-muted-foreground'}>{projectName}</p>
        </div>
        <Badge size={'sm'} variant={statusVariant}>
          {formattedStatus}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className={'mt-4'}>
        <div className={'h-2 w-full overflow-hidden rounded-full bg-muted'}>
          <div
            className={cn(
              'h-full rounded-full transition-all',
              workflow.status === 'running' && 'bg-accent',
              workflow.status === 'paused' && 'bg-yellow-500',
              workflow.status === 'completed' && 'bg-green-500',
              workflow.status === 'failed' && 'bg-destructive',
              !['completed', 'failed', 'paused', 'running'].includes(
                workflow.status
              ) && 'bg-accent'
            )}
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

      {/* Footer */}
      <div className={'mt-3 flex items-center justify-between text-xs text-muted-foreground'}>
        <span className={'flex items-center gap-1'}>
          <Clock aria-hidden={'true'} className={'size-3'} />
          {elapsedTime}
        </span>
        <span className={'capitalize'}>{workflow.type}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Main Widget Content
// ============================================================================

const ActiveWorkflowsContent = () => {
  const router = useRouter();
  const { data: workflows = [], isLoading: isWorkflowsLoading } = useWorkflows();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  const isLoading = isWorkflowsLoading || isProjectsLoading;

  // Filter for active workflows (running or paused)
  const activeWorkflows = useMemo(() => {
    return workflows.filter(
      (workflow) =>
        workflow.status === 'running' ||
        workflow.status === 'paused' ||
        workflow.status === 'editing'
    );
  }, [workflows]);

  // Create a map of project IDs to project names
  const projectMap = useMemo(() => {
    return projects.reduce<Record<number, Project>>((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {});
  }, [projects]);

  /**
   * Navigate to workflow detail page
   * Note: Requires /workflows/[id] route to be implemented
   */
  const handleWorkflowClick = (workflowId: number) => {
    router.push(`/workflows/${workflowId}`);
  };

  const hasActiveWorkflows = activeWorkflows.length > 0;

  // Loading State
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Empty State
  if (!hasActiveWorkflows) {
    return (
      <EmptyState
        action={
          <Link
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
            href={'/workflows/new'}
          >
            <Plus aria-hidden={'true'} className={'size-4'} />
            Start Workflow
          </Link>
        }
        description={'Start a new workflow to see it here.'}
        icon={<Play aria-hidden={'true'} className={'size-6'} />}
        title={'No active workflows'}
      />
    );
  }

  // Workflows List
  return (
    <div aria-live={'polite'} className={'space-y-3'}>
      {activeWorkflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          onClick={() => handleWorkflowClick(workflow.id)}
          projectName={projectMap[workflow.projectId]?.name ?? 'Unknown Project'}
          workflow={workflow}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Main Export
// ============================================================================

export const ActiveWorkflowsWidget = ({ className }: ActiveWorkflowsWidgetProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className={'flex items-center gap-2'}>
          <Activity aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
          <CardTitle>Active Workflows</CardTitle>
        </div>
        <CardDescription>
          Currently running or paused workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QueryErrorBoundary>
          <ActiveWorkflowsContent />
        </QueryErrorBoundary>
      </CardContent>
    </Card>
  );
};
