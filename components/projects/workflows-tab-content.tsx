'use client';

import type { ComponentPropsWithRef } from 'react';

import { AlertCircle, GitBranch, Plus } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { WorkflowTable } from '@/components/workflows/workflow-table';
import { useCancelWorkflow, useWorkflowsByProject } from '@/hooks/queries/use-workflows';
import { cn } from '@/lib/utils';

interface WorkflowsTabContentProps extends ComponentPropsWithRef<'div'> {
  /** The ID of the project to display workflows for */
  projectId: number;
  /** The name of the project (for display in WorkflowTable) */
  projectName?: string;
}

export const WorkflowsTabContent = ({ className, projectId, projectName, ref, ...props }: WorkflowsTabContentProps) => {
  const router = useRouter();

  const { data: workflows, error, isLoading } = useWorkflowsByProject(projectId);

  const cancelWorkflowMutation = useCancelWorkflow();

  const handleCancelWorkflow = (workflowId: number) => {
    cancelWorkflowMutation.mutate(workflowId);
  };

  const handleViewDetails = (workflowId: number) => {
    router.push(
      $path({
        route: '/workflows/[id]',
        routeParams: { id: String(workflowId) },
      })
    );
  };

  const handleCreateWorkflow = () => {
    router.push(
      $path({
        route: '/workflows/new',
        searchParams: { projectId },
      })
    );
  };

  // Build project map for WorkflowTable
  const projectMap: Record<number, string> = projectName ? { [projectId]: projectName } : {};

  // Derived state
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
        <WorkflowTableSkeleton />
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
            <Button onClick={handleCreateWorkflow}>
              <Plus aria-hidden={'true'} className={'size-4'} />
              {'Create Workflow'}
            </Button>
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
          <Button onClick={handleCreateWorkflow}>
            <Plus aria-hidden={'true'} className={'size-4'} />
            {'Create Workflow'}
          </Button>
        </div>

        {/* Workflows Table */}
        <WorkflowTable
          onCancel={handleCancelWorkflow}
          onViewDetails={handleViewDetails}
          projectMap={projectMap}
          workflows={workflows}
        />
      </div>
    );
  }

  return null;
};

/**
 * Loading skeleton for the workflows table view
 */
const WorkflowTableSkeleton = () => {
  return (
    <div className={'animate-pulse overflow-x-auto rounded-lg border border-border'}>
      <table className={'w-full border-collapse text-sm'}>
        <thead className={'border-b border-border bg-muted/50'}>
          <tr>
            {['Feature Name', 'Project', 'Type', 'Status', 'Progress', 'Created', 'Actions'].map((header) => (
              <th className={'px-4 py-3 text-left font-medium text-muted-foreground'} key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={'divide-y divide-border'}>
          {Array.from({ length: 3 }).map((_, index) => (
            <tr key={index}>
              <td className={'px-4 py-3'}>
                <div className={'h-4 w-32 rounded-sm bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'h-4 w-24 rounded-sm bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'h-5 w-20 rounded-full bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'h-5 w-16 rounded-full bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'h-4 w-12 rounded-sm bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'h-4 w-24 rounded-sm bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'flex justify-end gap-2'}>
                  <div className={'h-8 w-16 rounded-sm bg-muted'} />
                  <div className={'h-8 w-20 rounded-sm bg-muted'} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Export the skeleton for potential external use
export { WorkflowTableSkeleton };
