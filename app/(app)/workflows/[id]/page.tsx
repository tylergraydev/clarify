'use client';

import { ChevronRight } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouteParams } from 'next-typesafe-url/app';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { WorkflowDetailSkeleton } from '@/components/workflows';
import { useProject } from '@/hooks/queries/use-projects';
import { useWorkflow } from '@/hooks/queries/use-workflows';

import { Route } from './route-type';

// ============================================================================
// Helpers
// ============================================================================

// None needed for placeholder page

// ============================================================================
// Page Content
// ============================================================================

/**
 * Workflow detail page with breadcrumb navigation.
 *
 * Features:
 * - Breadcrumb navigation: Projects > [Project Name] > Workflows > [Workflow Name]
 * - Placeholder heading displaying workflow name
 * - Handles loading and error states
 */
function WorkflowDetailContent() {
  // Type-safe route params validation
  const routeParams = useRouteParams(Route.routeParams);

  // Get validated workflow ID (safe to access after loading/error checks)
  const workflowId = routeParams.data?.id;

  // Fetch workflow data (only when we have a valid ID)
  const { data: workflow, isError: isWorkflowError, isLoading: isWorkflowLoading } = useWorkflow(workflowId ?? 0);

  // Fetch project data for breadcrumb (only when workflow has a projectId)
  const projectId = workflow?.projectId ?? 0;
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);

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

  return (
    <QueryErrorBoundary>
      <main aria-label={'Workflow detail'} className={'space-y-6'}>
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
              href={$path({ route: '/projects/[id]', routeParams: { id: workflow.projectId as number } })}
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
          <span className={'text-sm text-muted-foreground'}>Workflows</span>
          <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />

          {/* Current workflow name (no link) */}
          <span className={'text-sm text-foreground'}>{workflow.featureName}</span>
        </nav>

        {/* Page header */}
        <section aria-label={'Workflow header'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>
            Workflow: {workflow.featureName}
          </h1>
        </section>
      </main>
    </QueryErrorBoundary>
  );
}

// ============================================================================
// Export
// ============================================================================

export default withParamValidation(WorkflowDetailContent, Route);
