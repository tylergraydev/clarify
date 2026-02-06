'use client';

import { $path } from 'next-typesafe-url';
import { useRouteParams } from 'next-typesafe-url/app';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { redirect } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useState } from 'react';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import {
  WorkflowDetailSkeleton,
  WorkflowPreStartForm,
  WorkflowStepAccordion,
  WorkflowStreamingPanel,
  WorkflowTopBar,
} from '@/components/workflows/detail';

import { Route, workflowStepValues } from './route-type';

// ============================================================================
// Types
// ============================================================================

type WorkflowStatus = 'cancelled' | 'completed' | 'created' | 'failed' | 'paused' | 'running';

// ============================================================================
// Page Content
// ============================================================================

/**
 * Workflow detail page with three-zone layout for active workflows.
 *
 * Features:
 * - Pre-start form when workflow status is 'created'
 * - Sticky top bar with workflow name, status, and action buttons
 * - Scrollable step accordion for workflow pipeline phases
 * - Resizable streaming panel for real-time agent logs
 * - Type-safe step query param via nuqs
 */
const WorkflowDetailContent = () => {
  const [workflowStatus] = useState<WorkflowStatus>('running');

  const routeParams = useRouteParams(Route.routeParams);

  // URL state management for active pipeline step (will be used when wiring real data)
  const [_step, _setStep] = useQueryState(
    'step',
    parseAsStringLiteral(workflowStepValues)
  );

  const workflowId = routeParams.data?.id;

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

  const isPreStart = workflowStatus === 'created';

  // Pre-start: show the workflow settings form centered on page
  if (isPreStart) {
    return (
      <QueryErrorBoundary>
        <main
          aria-label={'Workflow setup'}
          className={'flex h-full flex-col items-center justify-center py-12'}
        >
          <WorkflowPreStartForm />
        </main>
      </QueryErrorBoundary>
    );
  }

  // Active workflow: three-zone layout
  return (
    <QueryErrorBoundary>
      <main aria-label={'Workflow detail'} className={'flex h-full flex-col'}>
        {/* Top Bar */}
        <WorkflowTopBar />

        {/* Step Accordion */}
        <div className={'flex-1 overflow-auto'}>
          <WorkflowStepAccordion />
        </div>

        {/* Streaming Panel */}
        <WorkflowStreamingPanel />
      </main>
    </QueryErrorBoundary>
  );
};

// ============================================================================
// Export
// ============================================================================

export default withParamValidation(WorkflowDetailContent, Route);
