'use client';

import { ChevronRight } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouteParams } from 'next-typesafe-url/app';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import {
  ClarificationStreamProvider,
  PlanningStreamProvider,
  WorkflowDetailSkeleton,
  WorkflowPreStartSummary,
  WorkflowStepAccordion,
  WorkflowStreamingPanel,
  WorkflowTopBar,
} from '@/components/workflows/detail';
import { useProject, useWorkflow } from '@/hooks/queries';

import { Route, workflowStepValues } from './route-type';

// ============================================================================
// Page Content
// ============================================================================

/**
 * Workflow detail page with three-zone layout for active workflows.
 *
 * Features:
 * - Fetches real workflow data by ID using useWorkflow hook
 * - Pre-start form when workflow status is 'created'
 * - Sticky top bar with workflow name, status, and action buttons
 * - Scrollable step accordion for workflow pipeline phases
 * - Resizable streaming panel for real-time agent logs
 * - Type-safe step query param via nuqs
 * - ClarificationStreamProvider wraps the active layout to deduplicate
 *   stream subscriptions between the step content and streaming panel
 */
const WorkflowDetailContent = () => {
  const routeParams = useRouteParams(Route.routeParams);

  // URL state management for active pipeline step
  const [_step, _setStep] = useQueryState('step', parseAsStringLiteral(workflowStepValues));

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

  const workflowStatus = workflow.status;
  const isPreStart = workflowStatus === 'created';
  const isClarificationEnabled = workflowStatus === 'running' && !workflow.skipClarification;
  const isPlanningEnabled = workflowStatus === 'running';

  const breadcrumb = (
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
  );

  // Pre-start: show the workflow settings form centered on page
  if (isPreStart) {
    return (
      <QueryErrorBoundary>
        {breadcrumb}
        <main
          aria-label={'Workflow setup'}
          className={'relative isolate flex h-full flex-col items-center overflow-hidden px-6 py-10'}
        >
          <div
            aria-hidden={'true'}
            className={`
              pointer-events-none absolute inset-x-0 top-0 -z-10 h-56
            `}
          />
          <WorkflowPreStartSummary workflowId={workflowId} />
        </main>
      </QueryErrorBoundary>
    );
  }

  // Active workflow: three-zone layout wrapped with stream provider
  return (
    <QueryErrorBoundary>
      {breadcrumb}
      <ClarificationStreamProvider isEnabled={isClarificationEnabled} workflowId={workflowId}>
        <PlanningStreamProvider isEnabled={isPlanningEnabled} workflowId={workflowId}>
          <main aria-label={'Workflow detail'} className={'flex h-(--workflow-content-height) flex-col'}>
            {/* Top Bar */}
            <WorkflowTopBar workflowId={workflowId} />

            {/* Step Accordion */}
            <div className={'flex-1 overflow-auto'}>
              <WorkflowStepAccordion workflowId={workflowId} />
            </div>

            {/* Streaming Panel */}
            <WorkflowStreamingPanel workflowId={workflowId} />
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
