'use client';

import { GitBranch, Grid3X3, List, Plus, Search } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { useRouter } from 'next/navigation';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import { useMemo } from 'react';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateWorkflowDialog } from '@/components/workflows/create-workflow-dialog';
import { WorkflowCard } from '@/components/workflows/workflow-card';
import { WorkflowTable } from '@/components/workflows/workflow-table';
import { workflowStatuses } from '@/db/schema/workflows.schema';
import { useProjects } from '@/hooks/queries/use-projects';
import { useCancelWorkflow, useWorkflows } from '@/hooks/queries/use-workflows';
import { cn } from '@/lib/utils';

import { Route } from './route-type';

const VIEW_OPTIONS = ['card', 'table'] as const;
type ViewOption = (typeof VIEW_OPTIONS)[number];

/**
 * Loading skeleton for the workflows grid view
 */
const WorkflowCardSkeleton = () => {
  return (
    <Card className={'animate-pulse'}>
      <CardContent className={'p-6'}>
        <div className={'space-y-3'}>
          <div className={'flex items-start justify-between gap-2'}>
            <div className={'h-5 w-3/4 rounded-sm bg-muted'} />
            <div className={'h-5 w-16 rounded-full bg-muted'} />
          </div>
          <div className={'h-4 w-1/2 rounded-sm bg-muted'} />
        </div>
        <div className={'mt-4 space-y-2'}>
          <div className={'flex items-center gap-2'}>
            <div className={'h-4 w-12 rounded-sm bg-muted'} />
            <div className={'h-5 w-20 rounded-full bg-muted'} />
          </div>
          <div className={'h-2 w-full rounded-full bg-muted'} />
          <div className={'h-4 w-32 rounded-sm bg-muted'} />
        </div>
        <div className={'mt-4 flex gap-2'}>
          <div className={'h-8 w-16 rounded-sm bg-muted'} />
          <div className={'h-8 w-20 rounded-sm bg-muted'} />
        </div>
      </CardContent>
    </Card>
  );
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

/**
 * Workflows page - Main entry point for workflow management.
 *
 * Features:
 * - Card/table view toggle with URL state persistence
 * - Status filter
 * - Search by feature name
 * - Project filter
 * - Create new workflow dialog
 * - Cancel workflow actions
 * - Empty state when no workflows exist
 */
function WorkflowsPageContent() {
  const router = useRouter();

  // URL state management with nuqs
  const [view, setView] = useQueryState('view', parseAsStringLiteral(VIEW_OPTIONS).withDefault('card'));
  const [status, setStatus] = useQueryState('status', parseAsStringLiteral([...workflowStatuses]));
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [projectId, setProjectId] = useQueryState('projectId', parseAsInteger);

  // Data fetching
  const { data: workflows, isLoading: isLoadingWorkflows } = useWorkflows();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();

  // Mutations
  const cancelWorkflowMutation = useCancelWorkflow();

  const isLoading = isLoadingWorkflows || isLoadingProjects;

  // Build project map for WorkflowTable
  const projectMap = useMemo(() => {
    if (!projects) return {};
    return projects.reduce<Record<number, string>>((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {});
  }, [projects]);

  // Build project options for filter
  const projectOptions = useMemo(() => {
    if (!projects) return [];
    return projects
      .filter((project) => project.archivedAt === null)
      .map((project) => ({
        label: project.name,
        value: project.id,
      }));
  }, [projects]);

  // Filter workflows based on status, search, and projectId
  const filteredWorkflows = useMemo(() => {
    if (!workflows) return [];

    return workflows.filter((workflow) => {
      // Filter by status
      if (status && workflow.status !== status) {
        return false;
      }

      // Filter by search term (case-insensitive feature name match)
      if (search && !workflow.featureName.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // Filter by projectId
      if (projectId && workflow.projectId !== projectId) {
        return false;
      }

      return true;
    });
  }, [workflows, status, search, projectId]);

  // Handlers
  const handleViewChange = (newView: ViewOption) => {
    void setView(newView);
  };

  const handleStatusChange = (newStatus: null | string) => {
    if (!newStatus) {
      void setStatus(null);
    } else {
      void setStatus(newStatus as (typeof workflowStatuses)[number]);
    }
  };

  const handleSearchChange = (newSearch: string) => {
    void setSearch(newSearch || null);
  };

  const handleProjectChange = (newProjectId: null | number) => {
    void setProjectId(newProjectId);
  };

  const handleCancel = (workflowId: number) => {
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

  // Derived state
  const hasNoWorkflows = !isLoading && workflows && workflows.length === 0;
  const hasNoFilteredWorkflows = !isLoading && workflows && workflows.length > 0 && filteredWorkflows.length === 0;

  return (
    <div className={'space-y-6'}>
      {/* Page heading */}
      <div className={'flex items-start justify-between gap-4'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Workflows'}</h1>
          <p className={'text-muted-foreground'}>{'Manage and monitor your automated workflows.'}</p>
        </div>
        <CreateWorkflowDialog
          trigger={
            <Button>
              <Plus aria-hidden={'true'} className={'size-4'} />
              {'Create Workflow'}
            </Button>
          }
        />
      </div>

      {/* Filters and view controls */}
      {!hasNoWorkflows && (
        <div className={'flex flex-wrap items-center gap-4'}>
          {/* View toggle */}
          <ButtonGroup>
            <Button
              aria-label={'Card view'}
              aria-pressed={view === 'card'}
              className={cn(view === 'card' && 'bg-muted')}
              onClick={() => handleViewChange('card')}
              size={'sm'}
              variant={'outline'}
            >
              <Grid3X3 aria-hidden={'true'} className={'size-4'} />
              {'Cards'}
            </Button>
            <Button
              aria-label={'Table view'}
              aria-pressed={view === 'table'}
              className={cn(view === 'table' && 'bg-muted')}
              onClick={() => handleViewChange('table')}
              size={'sm'}
              variant={'outline'}
            >
              <List aria-hidden={'true'} className={'size-4'} />
              {'Table'}
            </Button>
          </ButtonGroup>

          {/* Status filter */}
          <SelectRoot onValueChange={(newValue) => handleStatusChange(newValue)} value={status ?? ''}>
            <SelectTrigger aria-label={'Filter by status'} className={'w-40'} size={'sm'}>
              <SelectValue placeholder={'All statuses'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    <SelectItem size={'sm'} value={''}>
                      {'All statuses'}
                    </SelectItem>
                    {workflowStatuses.map((workflowStatus) => {
                      const formattedStatus = workflowStatus.charAt(0).toUpperCase() + workflowStatus.slice(1);
                      return (
                        <SelectItem key={workflowStatus} label={formattedStatus} size={'sm'} value={workflowStatus}>
                          {formattedStatus}
                        </SelectItem>
                      );
                    })}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>

          {/* Project filter */}
          <SelectRoot
            onValueChange={(newValue) => handleProjectChange(newValue ? Number(newValue) : null)}
            value={projectId ? String(projectId) : ''}
          >
            <SelectTrigger aria-label={'Filter by project'} className={'w-48'} size={'sm'}>
              <SelectValue placeholder={'All projects'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    <SelectItem size={'sm'} value={''}>
                      {'All projects'}
                    </SelectItem>
                    {projectOptions.map((option) => (
                      <SelectItem key={option.value} label={option.label} size={'sm'} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>

          {/* Search input */}
          <div className={'relative flex-1 md:max-w-xs'}>
            <Search
              aria-hidden={'true'}
              className={'absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground'}
            />
            <Input
              aria-label={'Search workflows'}
              className={'pl-8'}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={'Search by feature name...'}
              size={'sm'}
              type={'search'}
              value={search}
            />
          </div>
        </div>
      )}

      {/* Workflows content */}
      <QueryErrorBoundary>
        {isLoading ? (
          // Loading skeletons
          view === 'card' ? (
            <div className={'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
              {Array.from({ length: 6 }).map((_, index) => (
                <WorkflowCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <WorkflowTableSkeleton />
          )
        ) : hasNoWorkflows ? (
          // Empty state when no workflows exist
          <EmptyState
            action={
              <CreateWorkflowDialog
                trigger={
                  <Button>
                    <Plus aria-hidden={'true'} className={'size-4'} />
                    {'Create your first workflow'}
                  </Button>
                }
              />
            }
            description={'Get started by creating your first workflow to plan or implement a feature.'}
            icon={<GitBranch aria-hidden={'true'} className={'size-6'} />}
            title={'No workflows yet'}
          />
        ) : hasNoFilteredWorkflows ? (
          // Empty state when filters hide all workflows
          <EmptyState
            action={
              <Button
                onClick={() => {
                  void setStatus(null);
                  void setSearch(null);
                  void setProjectId(null);
                }}
                variant={'outline'}
              >
                {'Clear filters'}
              </Button>
            }
            description={'No workflows match your current filters. Try adjusting your search criteria.'}
            icon={<Search aria-hidden={'true'} className={'size-6'} />}
            title={'No matching workflows'}
          />
        ) : view === 'card' ? (
          // Card view
          <div className={'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                onCancel={handleCancel}
                onViewDetails={handleViewDetails}
                projectName={projectMap[workflow.projectId]}
                workflow={workflow}
              />
            ))}
          </div>
        ) : (
          // Table view
          <WorkflowTable
            onCancel={handleCancel}
            onViewDetails={handleViewDetails}
            projectMap={projectMap}
            workflows={filteredWorkflows}
          />
        )}
      </QueryErrorBoundary>
    </div>
  );
}

export default withParamValidation(WorkflowsPageContent, Route);
