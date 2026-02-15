'use client';

import { ChevronRight } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouteParams } from 'next-typesafe-url/app';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { ClarificationStreamProvider, PlanningStreamProvider, WorkflowDetailSkeleton } from '@/components/workflows/detail';
import { useProject, useWorkflow } from '@/hooks/queries';

import { Route } from './route-type';

// ============================================================================
// Page Content
// ============================================================================

/**
 * Workflow detail page - blank-slate placeholder.
 *
 * Features:
 * - Fetches real workflow data by ID using useWorkflow hook
 * - Breadcrumb navigation chain (Home > Project > Workflows > Feature Name)
 * - ClarificationStreamProvider wrapper for stream deduplication
 * - Placeholder content for upcoming workflow detail UI
 */
const WorkflowDetailContent = () => {
  const routeParams = useRouteParams(Route.routeParams);

  const workflowId = routeParams.data?.id ?? 0;

  const { data: workflow, isError: isWorkflowError, isLoading: isWorkflowLoading } = useWorkflow(workflowId);
  const { data: project } = useProject(workflow?.projectId ?? 0);

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
    redirect($path({ route: '/workflows/history' }));
  }

  // Handle workflow data loading state
  if (isWorkflowLoading) {
    return (
      <div aria-busy={'true'} aria-label={'Loading workflow details'} role={'status'}>
        <WorkflowDetailSkeleton />
      </div>
    );
  }

  // Handle workflow not found or fetch error
  if (isWorkflowError || !workflow) {
    redirect($path({ route: '/workflows/history' }));
  }

  const isClarificationEnabled = workflow.status === 'running' && !workflow.skipClarification;
  const isPlanningEnabled = workflow.status === 'running';

  return (
    <QueryErrorBoundary>
      {/* Breadcrumb Navigation */}
      <div className={'px-6 pt-4'}>
        <nav aria-label={'Breadcrumb'} className={'flex items-center gap-2'}>
          <Link
            className={'text-sm text-muted-foreground transition-colors hover:text-foreground'}
            href={$path({ route: '/dashboard' })}
          >
            Home
          </Link>
          <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
          <Link
            className={'text-sm text-muted-foreground transition-colors hover:text-foreground'}
            href={$path({ route: '/projects/[id]', routeParams: { id: workflow.projectId } })}
          >
            {project?.name ?? 'Project'}
          </Link>
          <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
          <Link
            className={'text-sm text-muted-foreground transition-colors hover:text-foreground'}
            href={$path({
              route: '/projects/[id]',
              routeParams: { id: workflow.projectId },
              searchParams: { tab: 'workflows' },
            })}
          >
            Workflows
          </Link>
          <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
          <span className={'text-sm text-foreground'}>{workflow.featureName}</span>
        </nav>
      </div>

      {/* Workflow Content */}
      <ClarificationStreamProvider isEnabled={isClarificationEnabled} workflowId={workflowId}>
        <PlanningStreamProvider isEnabled={isPlanningEnabled} workflowId={workflowId}>
          <main aria-label={'Workflow detail'} className={'flex flex-1 items-center justify-center'}>
            <p className={'text-muted-foreground'}>Workflow detail view coming soon</p>
          </main>
        </PlanningStreamProvider>
      </ClarificationStreamProvider>
    </QueryErrorBoundary>
  );
};

// ============================================================================
// Export
// ============================================================================

export default withParamValidation(WorkflowDetailContent, Route);
