'use client';

import { Play } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { Fragment, useMemo, useState } from 'react';

import type { Project, Workflow } from '@/types/electron';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjects } from '@/hooks/queries/use-projects';
import {
  useActiveWorkflows,
  useCancelWorkflow,
  usePauseWorkflow,
  useResumeWorkflow,
} from '@/hooks/queries/use-workflows';

import { ActiveWorkflowCard } from './_components/active-workflow-card';
import { ActiveWorkflowCardSkeleton } from './_components/active-workflow-card-skeleton';
import { ConfirmCancelDialog } from './_components/confirm-cancel-dialog';

// ============================================================================
// Types
// ============================================================================

const SKELETON_COUNT = 6;

// ============================================================================
// Loading Skeleton
// ============================================================================

const LoadingSkeleton = () => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading active workflows'}
      aria-live={'polite'}
      className={'grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}
      role={'status'}
    >
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <ActiveWorkflowCardSkeleton key={index} />
      ))}
    </div>
  );
};

// ============================================================================
// Page Content
// ============================================================================

const ActiveWorkflowsContent = () => {
  const [workflowPendingCancel, setWorkflowPendingCancel] = useState<null | Workflow>(null);

  const router = useRouter();

  const { data: workflows = [], isLoading: isWorkflowsLoading } = useActiveWorkflows();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  const pauseMutation = usePauseWorkflow();
  const resumeMutation = useResumeWorkflow();
  const cancelMutation = useCancelWorkflow();

  const isLoading = isWorkflowsLoading || isProjectsLoading;
  const isCancelDialogOpen = workflowPendingCancel !== null;

  // Create a map of project IDs to project names
  const projectMap = useMemo(() => {
    return projects.reduce<Record<number, Project>>((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {});
  }, [projects]);

  const handleViewWorkflow = (workflowId: number) => {
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

  const handleCancelWorkflow = (workflowId: number) => {
    const workflow = workflows.find((w) => w.id === workflowId);
    if (workflow) {
      setWorkflowPendingCancel(workflow);
    }
  };

  const handleCancelDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setWorkflowPendingCancel(null);
    }
  };

  const handleConfirmCancel = () => {
    if (workflowPendingCancel) {
      cancelMutation.mutate(workflowPendingCancel.id, {
        onSettled: () => {
          setWorkflowPendingCancel(null);
        },
      });
    }
  };

  const hasActiveWorkflows = workflows.length > 0;

  // Loading State
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Empty State
  if (!hasActiveWorkflows) {
    return (
      <EmptyState
        description={
          'Start a new workflow to see it here. Active workflows include running, paused, and editing states.'
        }
        icon={<Play aria-hidden={'true'} className={'size-6'} />}
        title={'No active workflows'}
      />
    );
  }

  // Workflows Grid
  return (
    <Fragment>
      {/* Screen Reader Announcements */}
      <div aria-atomic={'true'} aria-live={'polite'} className={'sr-only'} role={'status'}>
        {`${workflows.length} active workflow${workflows.length !== 1 ? 's' : ''}`}
      </div>

      {/* Workflows Grid */}
      <div className={'grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}>
        {workflows.map((workflow) => {
          const isCancelPending =
            (cancelMutation.isPending && cancelMutation.variables === workflow.id) ||
            workflowPendingCancel?.id === workflow.id;

          return (
            <ActiveWorkflowCard
              isCancelPending={isCancelPending}
              isPausePending={pauseMutation.isPending && pauseMutation.variables === workflow.id}
              isResumePending={resumeMutation.isPending && resumeMutation.variables === workflow.id}
              key={workflow.id}
              onCancelWorkflow={handleCancelWorkflow}
              onPauseWorkflow={handlePauseWorkflow}
              onResumeWorkflow={handleResumeWorkflow}
              onViewWorkflow={handleViewWorkflow}
              projectName={projectMap[workflow.projectId]?.name ?? 'Unknown Project'}
              workflow={workflow}
            />
          );
        })}
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmCancelDialog
        isLoading={cancelMutation.isPending}
        isOpen={isCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        onOpenChange={handleCancelDialogOpenChange}
        workflowName={workflowPendingCancel?.featureName ?? ''}
      />
    </Fragment>
  );
};

// ============================================================================
// Page Export
// ============================================================================

export default function ActiveWorkflowsPage() {
  return (
    <div className={'space-y-6'}>
      {/* Page Header */}
      <div className={'space-y-1'}>
        <h1 className={'text-2xl font-semibold tracking-tight'}>Active Workflows</h1>
        <p className={'text-muted-foreground'}>View and manage currently running, paused, or editing workflows.</p>
      </div>

      {/* Page Content */}
      <QueryErrorBoundary>
        <ActiveWorkflowsContent />
      </QueryErrorBoundary>
    </div>
  );
}
