'use client';

import { Activity, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useMemo, useState } from 'react';

import type { Workflow } from '@/types/electron';

import { Button } from '@/components/ui/button';
import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTableSkeleton } from '@/components/ui/table';
import { ViewWorkflowDialog } from '@/components/workflows/view-workflow-dialog';
import { WorkflowTable } from '@/components/workflows/workflow-table';
import {
  ACTIVE_STATUS_FILTER_OPTIONS,
  type ActiveWorkflowStatusFilterValue,
  type ProjectFilterOption,
  WorkflowTableToolbar,
  type WorkflowTypeFilterValue,
} from '@/components/workflows/workflow-table-toolbar';
import { useProjects } from '@/hooks/queries/use-projects';
import {
  useActiveWorkflows,
  useCancelWorkflow,
  usePauseWorkflow,
  useResumeWorkflow,
} from '@/hooks/queries/use-workflows';
import { useToast } from '@/hooks/use-toast';
import { useActiveWorkflowsStore } from '@/lib/stores/active-workflows-store';

type ActiveWorkflowsStatusFilter = 'all' | 'editing' | 'paused' | 'running';

/**
 * Filter active workflows based on status, type, project, and search filter values.
 */
const filterActiveWorkflows = (
  workflows: Array<Workflow>,
  statusFilter: ActiveWorkflowsStatusFilter,
  typeFilter: WorkflowTypeFilterValue,
  projectFilter: string,
  searchFilter: string
): Array<Workflow> => {
  const searchLower = searchFilter.toLowerCase().trim();
  return workflows.filter((workflow) => {
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    const matchesType = typeFilter === 'all' || workflow.type === typeFilter;
    const matchesProject = projectFilter === 'all' || String(workflow.projectId) === projectFilter;
    const matchesSearch = !searchLower || workflow.featureName.toLowerCase().includes(searchLower);
    return matchesStatus && matchesType && matchesProject && matchesSearch;
  });
};

/**
 * Active Workflows page - Displays currently running, paused, and editing workflows.
 *
 * Features:
 * - Real-time data updates via 5-second polling
 * - Filter by status (running, paused, editing), type, and project
 * - Pause, resume, and cancel workflow actions
 * - Cancel confirmation dialog to prevent accidental cancellations
 * - Empty state with action to create new workflow
 */
export default function ActiveWorkflowsPage() {
  const router = useRouter();
  const toast = useToast();

  // Store state for UI preferences
  const { setStatusFilter, setTypeFilter, statusFilter: storeStatusFilter, typeFilter } = useActiveWorkflowsStore();

  // Map store status filter to toolbar compatible type (add 'editing' support)
  const statusFilter = storeStatusFilter as ActiveWorkflowsStatusFilter;

  // Local state for project filter, search filter, and action tracking
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [cancellingIds, setCancellingIds] = useState<Set<number>>(new Set());
  const [pausingIds, setPausingIds] = useState<Set<number>>(new Set());
  const [resumingIds, setResumingIds] = useState<Set<number>>(new Set());
  const [viewingWorkflow, setViewingWorkflow] = useState<null | Workflow>(null);
  const [workflowToCancel, setWorkflowToCancel] = useState<null | Workflow>(null);

  // Data fetching with 5-second polling
  const {
    data: workflows = [],
    error: workflowsError,
    isLoading: isWorkflowsLoading,
    refetch: refetchWorkflows,
  } = useActiveWorkflows();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  // Mutations
  const cancelMutation = useCancelWorkflow();
  const pauseMutation = usePauseWorkflow();
  const resumeMutation = useResumeWorkflow();

  // Build project map for WorkflowTable
  const projectMap = useMemo(() => {
    return projects.reduce<Record<number, string>>((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {});
  }, [projects]);

  // Build project filter options
  const projectFilterOptions = useMemo<Array<ProjectFilterOption>>(() => {
    return projects.map((project) => ({
      label: project.name,
      value: String(project.id),
    }));
  }, [projects]);

  // Filter workflows based on current filter state
  const filteredWorkflows = useMemo(() => {
    return filterActiveWorkflows(workflows, statusFilter, typeFilter, projectFilter, searchFilter);
  }, [workflows, statusFilter, typeFilter, projectFilter, searchFilter]);

  // Event handlers
  const handleViewDetails = useCallback(
    (workflowId: number) => {
      router.push(
        $path({
          route: '/workflows/[id]',
          routeParams: { id: workflowId },
        })
      );
    },
    [router]
  );

  const handleCancelRequest = useCallback((workflow: Workflow) => {
    setWorkflowToCancel(workflow);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!workflowToCancel) return;

    const workflowId = workflowToCancel.id;
    const workflowName = workflowToCancel.featureName;
    setWorkflowToCancel(null);

    setCancellingIds((prev) => new Set(prev).add(workflowId));
    try {
      await cancelMutation.mutateAsync(workflowId);
      toast.success({
        description: `${workflowName} has been cancelled.`,
        title: 'Workflow Cancelled',
      });
    } catch (error) {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to cancel workflow',
        title: 'Cancel Failed',
      });
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(workflowId);
        return next;
      });
    }
  }, [workflowToCancel, cancelMutation, toast]);

  const handleCancelDialogClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setWorkflowToCancel(null);
    }
  }, []);

  const handleViewInfo = useCallback((workflow: Workflow) => {
    setViewingWorkflow(workflow);
  }, []);

  const handleViewInfoDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setViewingWorkflow(null);
    }
  }, []);

  const handlePauseWorkflow = useCallback(
    async (workflowId: number) => {
      const workflow = workflows.find((w) => w.id === workflowId);
      const workflowName = workflow?.featureName ?? 'Workflow';

      setPausingIds((prev) => new Set(prev).add(workflowId));
      try {
        await pauseMutation.mutateAsync(workflowId);
        toast.success({
          description: `${workflowName} has been paused.`,
          title: 'Workflow Paused',
        });
      } catch (error) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to pause workflow',
          title: 'Pause Failed',
        });
      } finally {
        setPausingIds((prev) => {
          const next = new Set(prev);
          next.delete(workflowId);
          return next;
        });
      }
    },
    [workflows, pauseMutation, toast]
  );

  const handleResumeWorkflow = useCallback(
    async (workflowId: number) => {
      const workflow = workflows.find((w) => w.id === workflowId);
      const workflowName = workflow?.featureName ?? 'Workflow';

      setResumingIds((prev) => new Set(prev).add(workflowId));
      try {
        await resumeMutation.mutateAsync(workflowId);
        toast.success({
          description: `${workflowName} has been resumed.`,
          title: 'Workflow Resumed',
        });
      } catch (error) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to resume workflow',
          title: 'Resume Failed',
        });
      } finally {
        setResumingIds((prev) => {
          const next = new Set(prev);
          next.delete(workflowId);
          return next;
        });
      }
    },
    [workflows, resumeMutation, toast]
  );

  const handleStatusFilterChange = useCallback(
    (value: ActiveWorkflowStatusFilterValue | string) => {
      // Map toolbar type to store type (store doesn't have 'editing')
      const storeValue = value === 'editing' ? 'all' : (value as 'all' | 'paused' | 'running');
      setStatusFilter(storeValue);
    },
    [setStatusFilter]
  );

  const handleTypeFilterChange = useCallback(
    (value: WorkflowTypeFilterValue) => {
      setTypeFilter(value);
    },
    [setTypeFilter]
  );

  const handleProjectFilterChange = useCallback((value: string) => {
    setProjectFilter(value);
  }, []);

  const handleResetFilters = useCallback(() => {
    setStatusFilter('all');
    setTypeFilter('all');
    setProjectFilter('all');
    setSearchFilter('');
  }, [setStatusFilter, setTypeFilter]);

  const handleRefresh = useCallback(() => {
    void refetchWorkflows();
  }, [refetchWorkflows]);

  const handleNavigateToProjects = useCallback(() => {
    router.push($path({ route: '/projects' }));
  }, [router]);

  // Derived state
  const isLoading = isWorkflowsLoading || isProjectsLoading;
  const hasError = !isLoading && workflowsError;
  const isWorkflowsEmpty = !isLoading && !hasError && workflows.length === 0;
  const hasWorkflows = !isLoading && !hasError && workflows.length > 0;

  // Loading State
  if (isLoading) {
    return (
      <main aria-label={'Active Workflows'} className={'space-y-6'}>
        {/* Page Header */}
        <div className={'flex items-center justify-between'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>Active Workflows</h1>
        </div>

        {/* Table Skeleton */}
        <DataTableSkeleton columnCount={8} density={'default'} rowCount={5} />
      </main>
    );
  }

  // Error State
  if (hasError) {
    return (
      <main aria-label={'Active Workflows'} className={'space-y-6'}>
        {/* Page Header */}
        <div className={'flex items-center justify-between'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>Active Workflows</h1>
          <Button onClick={handleRefresh} size={'sm'} variant={'outline'}>
            <RefreshCw aria-hidden={'true'} className={'size-4'} />
            Retry
          </Button>
        </div>

        {/* Error Message */}
        <EmptyState
          action={
            <Button onClick={handleRefresh} variant={'outline'}>
              <RefreshCw aria-hidden={'true'} className={'size-4'} />
              Try Again
            </Button>
          }
          description={'Failed to load active workflows. Please try again.'}
          icon={<AlertCircle className={'size-6'} />}
          title={'Error Loading Workflows'}
        />
      </main>
    );
  }

  // Empty State
  if (isWorkflowsEmpty) {
    return (
      <main aria-label={'Active Workflows'} className={'space-y-6'}>
        {/* Page Header */}
        <div className={'flex items-center justify-between'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>Active Workflows</h1>
        </div>

        {/* Empty State with Action */}
        <EmptyState
          action={
            <Button onClick={handleNavigateToProjects}>
              <Plus aria-hidden={'true'} className={'size-4'} />
              Browse Projects
            </Button>
          }
          description={'Start a new workflow from a project to see it here.'}
          icon={<Activity className={'size-6'} />}
          title={'No Active Workflows'}
        />
      </main>
    );
  }

  // Content State
  if (hasWorkflows) {
    return (
      <Fragment>
        <main aria-label={'Active Workflows'} className={'space-y-6'}>
          {/* Page Header */}
          <div className={'flex items-center justify-between'}>
            <h1 className={'text-2xl font-semibold tracking-tight'}>Active Workflows</h1>
            <div className={'flex items-center gap-2'}>
              <Button onClick={handleRefresh} size={'sm'} variant={'ghost'}>
                <RefreshCw aria-hidden={'true'} className={'size-4'} />
                Refresh
              </Button>
              <Button onClick={handleNavigateToProjects} size={'sm'}>
                <Plus aria-hidden={'true'} className={'size-4'} />
                New Workflow
              </Button>
            </div>
          </div>

          {/* Workflows Table */}
          <WorkflowTable
            cancellingIds={cancellingIds}
            onCancel={(workflowId) => {
              const workflow = workflows.find((w) => w.id === workflowId);
              if (workflow) {
                handleCancelRequest(workflow);
              }
            }}
            onGlobalFilterChange={setSearchFilter}
            onPause={handlePauseWorkflow}
            onResume={handleResumeWorkflow}
            onViewDetails={handleViewDetails}
            onViewInfo={handleViewInfo}
            pausingIds={pausingIds}
            projectMap={projectMap}
            resumingIds={resumingIds}
            toolbarContent={
              <WorkflowTableToolbar
                onProjectFilterChange={handleProjectFilterChange}
                onResetFilters={handleResetFilters}
                onStatusFilterChange={handleStatusFilterChange}
                onTypeFilterChange={handleTypeFilterChange}
                projectFilter={projectFilter}
                projects={projectFilterOptions}
                showProjectFilter={true}
                statusFilter={statusFilter}
                statusOptions={ACTIVE_STATUS_FILTER_OPTIONS}
                typeFilter={typeFilter}
              />
            }
            workflows={filteredWorkflows}
          />
        </main>

        {/* View Workflow Info Dialog */}
        <ViewWorkflowDialog
          isOpen={viewingWorkflow !== null}
          onOpenChange={handleViewInfoDialogOpenChange}
          workflow={viewingWorkflow}
        />

        {/* Cancel Confirmation Dialog */}
        <ConfirmActionDialog
          cancelLabel={'Keep Running'}
          confirmLabel={'Cancel Workflow'}
          confirmVariant={'destructive'}
          description={
            <Fragment>
              Are you sure you want to cancel{' '}
              <span className={'font-medium text-foreground'}>{workflowToCancel?.featureName}</span>? This action cannot
              be undone.
            </Fragment>
          }
          isOpen={workflowToCancel !== null}
          onConfirm={handleConfirmCancel}
          onOpenChange={handleCancelDialogClose}
          size={'sm'}
          title={'Cancel Workflow'}
        />
      </Fragment>
    );
  }

  return null;
}
