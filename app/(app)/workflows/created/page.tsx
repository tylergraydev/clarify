'use client';

import { AlertCircle, Clock, Plus, RefreshCw } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useMemo, useState } from 'react';

import type { Workflow } from '@/types/electron';

import { Button } from '@/components/ui/button';
import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTableSkeleton } from '@/components/ui/table';
import { EditWorkflowDialog } from '@/components/workflows/edit-workflow-dialog';
import { ViewWorkflowDialog } from '@/components/workflows/view-workflow-dialog';
import { WorkflowTable } from '@/components/workflows/workflow-table';
import {
  type ProjectFilterOption,
  type WorkflowStatusFilterOption,
  type WorkflowStatusFilterValue,
  WorkflowTableToolbar,
  type WorkflowTypeFilterValue,
} from '@/components/workflows/workflow-table-toolbar';
import { useProjects } from '@/hooks/queries/use-projects';
import { useCancelWorkflow, useCreatedWorkflows } from '@/hooks/queries/use-workflows';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Filter created workflows based on type, project, and search filter values.
 */
const filterCreatedWorkflows = (
  workflows: Array<Workflow>,
  typeFilter: WorkflowTypeFilterValue,
  projectFilter: string,
  searchFilter: string
): Array<Workflow> => {
  const searchLower = searchFilter.toLowerCase().trim();
  return workflows.filter((workflow) => {
    const matchesType = typeFilter === 'all' || workflow.type === typeFilter;
    const matchesProject = projectFilter === 'all' || String(workflow.projectId) === projectFilter;
    const matchesSearch = !searchLower || workflow.featureName.toLowerCase().includes(searchLower);
    return matchesType && matchesProject && matchesSearch;
  });
};

const CREATED_STATUS_OPTIONS: Array<WorkflowStatusFilterOption> = [{ label: 'Created', value: 'created' }];

// ============================================================================
// Main Component
// ============================================================================

/**
 * Created Workflows page - Displays workflows that have been created but not yet started.
 *
 * Features:
 * - Real-time data updates via 5-second polling
 * - Filter by type and project
 * - Edit and cancel created workflows
 * - Cancel confirmation dialog to prevent accidental cancellations
 * - Empty state with action to create new workflow
 */
export default function CreatedWorkflowsPage() {
  const router = useRouter();
  const toast = useToast();

  // Local state for project filter, search filter, and action tracking
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<WorkflowTypeFilterValue>('all');
  const [cancellingIds, setCancellingIds] = useState<Set<number>>(new Set());
  const [workflowToCancel, setWorkflowToCancel] = useState<null | Workflow>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<null | Workflow>(null);
  const [viewingWorkflow, setViewingWorkflow] = useState<null | Workflow>(null);
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilterValue>('created');

  // Data fetching with 5-second polling
  const {
    data: workflows = [],
    error: workflowsError,
    isLoading: isWorkflowsLoading,
    refetch: refetchWorkflows,
  } = useCreatedWorkflows();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  // Mutations
  const cancelMutation = useCancelWorkflow();

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
    return filterCreatedWorkflows(workflows, typeFilter, projectFilter, searchFilter);
  }, [workflows, typeFilter, projectFilter, searchFilter]);

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

  const handleTypeFilterChange = useCallback((value: WorkflowTypeFilterValue) => {
    setTypeFilter(value);
  }, []);

  const handleProjectFilterChange = useCallback((value: string) => {
    setProjectFilter(value);
  }, []);

  const handleResetFilters = useCallback(() => {
    setStatusFilter('created');
    setTypeFilter('all');
    setProjectFilter('all');
    setSearchFilter('');
  }, []);

  const handleRefresh = useCallback(() => {
    void refetchWorkflows();
  }, [refetchWorkflows]);

  const handleNavigateToProjects = useCallback(() => {
    router.push($path({ route: '/projects' }));
  }, [router]);

  const handleEditWorkflow = useCallback((workflow: Workflow) => {
    setEditingWorkflow(workflow);
  }, []);

  const handleEditDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setEditingWorkflow(null);
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

  const handleStatusFilterChange = useCallback(() => {
    setStatusFilter('created');
  }, []);

  // Derived state
  const isLoading = isWorkflowsLoading || isProjectsLoading;
  const hasError = !isLoading && workflowsError;
  const isWorkflowsEmpty = !isLoading && !hasError && workflows.length === 0;
  const hasWorkflows = !isLoading && !hasError && workflows.length > 0;

  // Loading State
  if (isLoading) {
    return (
      <main aria-label={'Created Workflows'} className={'space-y-6'}>
        {/* Page Header */}
        <div className={'flex items-center justify-between'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>Created Workflows</h1>
        </div>

        {/* Table Skeleton */}
        <DataTableSkeleton columnCount={8} density={'default'} rowCount={5} />
      </main>
    );
  }

  // Error State
  if (hasError) {
    return (
      <main aria-label={'Created Workflows'} className={'space-y-6'}>
        {/* Page Header */}
        <div className={'flex items-center justify-between'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>Created Workflows</h1>
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
          description={'Failed to load created workflows. Please try again.'}
          icon={<AlertCircle className={'size-6'} />}
          title={'Error Loading Workflows'}
        />
      </main>
    );
  }

  // Empty State
  if (isWorkflowsEmpty) {
    return (
      <main aria-label={'Created Workflows'} className={'space-y-6'}>
        {/* Page Header */}
        <div className={'flex items-center justify-between'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>Created Workflows</h1>
        </div>

        {/* Empty State with Action */}
        <EmptyState
          action={
            <Button onClick={handleNavigateToProjects}>
              <Plus aria-hidden={'true'} className={'size-4'} />
              Browse Projects
            </Button>
          }
          description={'Created workflows will appear here once you create a workflow from a project.'}
          icon={<Clock className={'size-6'} />}
          title={'No Created Workflows'}
        />
      </main>
    );
  }

  // Content State
  if (hasWorkflows) {
    return (
      <Fragment>
        <main aria-label={'Created Workflows'} className={'space-y-6'}>
          {/* Page Header */}
          <div className={'flex items-center justify-between'}>
            <h1 className={'text-2xl font-semibold tracking-tight'}>Created Workflows</h1>
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
            onEdit={handleEditWorkflow}
            onGlobalFilterChange={setSearchFilter}
            onViewDetails={handleViewDetails}
            onViewInfo={handleViewInfo}
            projectMap={projectMap}
            toolbarContent={
              <WorkflowTableToolbar
                defaultStatusFilter={'created'}
                onProjectFilterChange={handleProjectFilterChange}
                onResetFilters={handleResetFilters}
                onStatusFilterChange={handleStatusFilterChange}
                onTypeFilterChange={handleTypeFilterChange}
                projectFilter={projectFilter}
                projects={projectFilterOptions}
                showProjectFilter={true}
                statusFilter={statusFilter}
                statusOptions={CREATED_STATUS_OPTIONS}
                typeFilter={typeFilter}
              />
            }
            workflows={filteredWorkflows}
          />
        </main>

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

        {/* Edit Workflow Dialog */}
        {editingWorkflow && (
          <EditWorkflowDialog
            onOpenChange={handleEditDialogOpenChange}
            open={!!editingWorkflow}
            workflow={editingWorkflow}
          />
        )}

        {/* View Workflow Dialog */}
        <ViewWorkflowDialog
          isOpen={viewingWorkflow !== null}
          onOpenChange={handleViewInfoDialogOpenChange}
          workflow={viewingWorkflow}
        />
      </Fragment>
    );
  }

  return null;
}
