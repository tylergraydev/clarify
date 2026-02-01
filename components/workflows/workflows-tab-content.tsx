'use client';

import type { ComponentPropsWithRef } from 'react';

import { AlertCircle, GitBranch, Plus } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTableSkeleton } from '@/components/ui/table';
import { CreateWorkflowDialog } from '@/components/workflows/create-workflow-dialog';
import { WorkflowTable } from '@/components/workflows/workflow-table';
import {
  type WorkflowStatusFilterValue,
  WorkflowTableToolbar,
  type WorkflowTypeFilterValue,
} from '@/components/workflows/workflow-table-toolbar';
import { useCancelWorkflow, useWorkflowsByProject } from '@/hooks/queries/use-workflows';
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
  const cancelWorkflowMutation = useCancelWorkflow();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilterValue>(DEFAULT_STATUS_FILTER);
  const [typeFilter, setTypeFilter] = useState<WorkflowTypeFilterValue>(DEFAULT_TYPE_FILTER);
  const [searchFilter, setSearchFilter] = useState('');
  const [cancellingIds, setCancellingIds] = useState<Set<number>>(new Set());

  // Filtered workflows
  const filteredWorkflows = useMemo(() => {
    if (!workflows) return [];
    return workflows.filter((w) => {
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      const matchesType = typeFilter === 'all' || w.type === typeFilter;
      const matchesSearch =
        !searchFilter || w.featureName.toLowerCase().includes(searchFilter.toLowerCase());
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
          routeParams: { id: String(workflowId) },
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

  const isWorkflowsEmpty = !isLoading && !error && workflows?.length === 0;
  const hasWorkflows = !isLoading && !error && workflows && workflows.length > 0;
  const hasError = !isLoading && error;

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
              projectId={projectId}
              trigger={
                <Button>
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
            projectId={projectId}
            trigger={
              <Button>
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
          onGlobalFilterChange={setSearchFilter}
          onViewDetails={handleViewDetails}
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
      </div>
    );
  }

  return null;
};
