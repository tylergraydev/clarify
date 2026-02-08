'use client';

import type { ComponentPropsWithRef } from 'react';

import { AlertCircle, GitBranch, Plus } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import type { Workflow } from '@/db/schema/workflows.schema';
import type { CreateWorkflowFormValues } from '@/lib/validations/workflow';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTableSkeleton } from '@/components/ui/table';
import { CreateWorkflowDialog } from '@/components/workflows/create-workflow-dialog';
import { EditWorkflowDialog } from '@/components/workflows/edit-workflow-dialog';
import { ViewWorkflowDialog } from '@/components/workflows/view-workflow-dialog';
import { WorkflowTable } from '@/components/workflows/workflow-table';
import {
  type WorkflowStatusFilterValue,
  WorkflowTableToolbar,
  type WorkflowTypeFilterValue,
} from '@/components/workflows/workflow-table-toolbar';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { useCancelWorkflow, useWorkflowsByProject } from '@/hooks/queries/use-workflows';
import { useElectronDb } from '@/hooks/use-electron';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WorkflowsTabContentProps extends ComponentPropsWithRef<'div'> {
  /** The ID of the project to display workflows for */
  projectId: number;
  /** The name of the project (for display in WorkflowTable) */
  projectName?: string;
}

const DEFAULT_STATUS_FILTER: WorkflowStatusFilterValue = 'all';
const DEFAULT_TYPE_FILTER: WorkflowTypeFilterValue = 'all';

export const WorkflowsTabContent = ({ className, projectId, projectName, ref, ...props }: WorkflowsTabContentProps) => {
  const router = useRouter();

  // Data fetching
  const { data: workflows, error, isLoading } = useWorkflowsByProject(projectId);
  const { data: repositories = [] } = useRepositoriesByProject(projectId);
  const cancelWorkflowMutation = useCancelWorkflow();
  const { workflowRepositories } = useElectronDb();
  const toast = useToast();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilterValue>(DEFAULT_STATUS_FILTER);
  const [typeFilter, setTypeFilter] = useState<WorkflowTypeFilterValue>(DEFAULT_TYPE_FILTER);
  const [searchFilter, setSearchFilter] = useState('');
  const [cancellingIds, setCancellingIds] = useState<Set<number>>(new Set());

  // Edit workflow state
  const [editingWorkflow, setEditingWorkflow] = useState<null | Workflow>(null);

  // Copy workflow state
  const [copyInitialValues, setCopyInitialValues] = useState<null | Partial<CreateWorkflowFormValues>>(null);

  // View workflow info state
  const [viewingWorkflow, setViewingWorkflow] = useState<null | Workflow>(null);

  // Filtered workflows
  const filteredWorkflows = useMemo(() => {
    if (!workflows) return [];
    return workflows.filter((w) => {
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      const matchesType = typeFilter === 'all' || w.type === typeFilter;
      const matchesSearch = !searchFilter || w.featureName.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [workflows, statusFilter, typeFilter, searchFilter]);

  // Build project map for WorkflowTable
  const projectMap: Record<number, string> = projectName ? { [projectId]: projectName } : {};

  const handleCancelWorkflow = useCallback(
    async (workflowId: number) => {
      setCancellingIds((prev) => new Set(prev).add(workflowId));
      try {
        await cancelWorkflowMutation.mutateAsync(workflowId);
      } finally {
        setCancellingIds((prev) => {
          const next = new Set(prev);
          next.delete(workflowId);
          return next;
        });
      }
    },
    [cancelWorkflowMutation]
  );

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

  const handleResetFilters = useCallback(() => {
    setStatusFilter(DEFAULT_STATUS_FILTER);
    setTypeFilter(DEFAULT_TYPE_FILTER);
    setSearchFilter('');
  }, []);

  const handleEditWorkflow = useCallback((workflow: Workflow) => {
    setEditingWorkflow(workflow);
  }, []);

  const handleEditDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setEditingWorkflow(null);
    }
  }, []);

  const handleCopyWorkflow = useCallback(
    async (workflow: Workflow) => {
      try {
        // Fetch repository IDs for the source workflow
        const workflowRepos = await workflowRepositories.list(workflow.id);
        const repositoryIds = workflowRepos.map((wr) => wr.repositoryId);

        setCopyInitialValues({
          clarificationAgentId: workflow.clarificationAgentId ? String(workflow.clarificationAgentId) : '',
          featureName: `${workflow.featureName} (Copy)`,
          featureRequest: workflow.featureRequest,
          pauseBehavior: workflow.pauseBehavior as 'auto_pause' | 'continuous',
          repositoryIds,
          skipClarification: workflow.skipClarification,
          type: workflow.type as 'implementation' | 'planning',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to copy workflow.';
        toast.error({
          description: message,
          title: 'Error',
        });
      }
    },
    [workflowRepositories, toast]
  );

  const handleCopyDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setCopyInitialValues(null);
    }
  }, []);

  const handleCreateWorkflowSuccess = useCallback(
    (workflow: Workflow) => {
      if (workflow.status === 'running') {
        router.push(
          $path({
            route: '/workflows/[id]',
            routeParams: { id: workflow.id },
          })
        );
      }
    },
    [router]
  );

  const handleViewInfo = useCallback((workflow: Workflow) => {
    setViewingWorkflow(workflow);
  }, []);

  const handleViewInfoDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setViewingWorkflow(null);
    }
  }, []);

  const isWorkflowsEmpty = !isLoading && !error && workflows?.length === 0;
  const hasWorkflows = !isLoading && !error && workflows && workflows.length > 0;
  const hasError = !isLoading && error;
  const hasNoRepositories = repositories.length === 0;

  // Loading State
  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
        {/* Header Skeleton */}
        <div className={'flex items-center justify-end'}>
          <div className={'h-9 w-32 animate-pulse rounded-md bg-muted'} />
        </div>

        {/* Table Skeleton */}
        <DataTableSkeleton columnCount={8} density={'default'} rowCount={5} />
      </div>
    );
  }

  // Error State
  if (hasError) {
    return (
      <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
        <EmptyState
          description={'Failed to load workflows. Please try again.'}
          icon={<AlertCircle className={'size-6'} />}
          title={'Error Loading Workflows'}
        />
      </div>
    );
  }

  // Empty State
  if (isWorkflowsEmpty) {
    return (
      <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
        <EmptyState
          action={
            <CreateWorkflowDialog
              disabled={hasNoRepositories}
              projectId={projectId}
              trigger={
                <Button disabled={hasNoRepositories}>
                  <Plus aria-hidden={'true'} className={'size-4'} />
                  Create Workflow
                </Button>
              }
            />
          }
          description={'Create a workflow to plan or implement features for this project.'}
          icon={<GitBranch className={'size-6'} />}
          title={'No Workflows'}
        />
      </div>
    );
  }

  // Content State
  if (hasWorkflows) {
    return (
      <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
        {/* Header with Create Button */}
        <div className={'flex items-center justify-end'}>
          <CreateWorkflowDialog
            disabled={hasNoRepositories}
            onSuccess={handleCreateWorkflowSuccess}
            projectId={projectId}
            trigger={
              <Button disabled={hasNoRepositories}>
                <Plus aria-hidden={'true'} className={'size-4'} />
                Create Workflow
              </Button>
            }
          />
        </div>

        {/* Workflows Table */}
        <WorkflowTable
          cancellingIds={cancellingIds}
          onCancel={handleCancelWorkflow}
          onCopy={handleCopyWorkflow}
          onEdit={handleEditWorkflow}
          onGlobalFilterChange={setSearchFilter}
          onViewDetails={handleViewDetails}
          onViewInfo={handleViewInfo}
          projectMap={projectMap}
          toolbarContent={
            <WorkflowTableToolbar
              onResetFilters={handleResetFilters}
              onStatusFilterChange={setStatusFilter}
              onTypeFilterChange={setTypeFilter}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
            />
          }
          workflows={filteredWorkflows}
        />

        {/* Edit Workflow Dialog */}
        {editingWorkflow && (
          <EditWorkflowDialog
            onOpenChange={handleEditDialogOpenChange}
            open={!!editingWorkflow}
            workflow={editingWorkflow}
          />
        )}

        {/* Copy Workflow Dialog */}
        {copyInitialValues && (
          <CreateWorkflowDialog
            initialValues={copyInitialValues}
            onOpenChange={handleCopyDialogOpenChange}
            onSuccess={handleCreateWorkflowSuccess}
            open={!!copyInitialValues}
            projectId={projectId}
          />
        )}

        {/* View Workflow Info Dialog */}
        <ViewWorkflowDialog
          isOpen={viewingWorkflow !== null}
          onOpenChange={handleViewInfoDialogOpenChange}
          workflow={viewingWorkflow}
        />
      </div>
    );
  }

  return null;
};
