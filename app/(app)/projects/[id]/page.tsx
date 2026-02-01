'use client';

import { format } from 'date-fns';
import { Archive, Building2, Calendar, ChevronRight, FolderGit2, Workflow } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouteParams } from 'next-typesafe-url/app';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import type { Project } from '@/types/electron';

import { ProjectDetailSkeleton, ProjectNotFound } from '@/components/projects';
import { RepositoriesTabContent } from '@/components/repositories/repositories-tab-content';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowsTabContent } from '@/components/workflows/workflows-tab-content';
import { useProject } from '@/hooks/queries/use-projects';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { useWorkflowsByProject } from '@/hooks/queries/use-workflows';

import { Route } from './route-type';

type ProjectWithDates = Pick<Project, 'archivedAt' | 'createdAt' | 'updatedAt'>;

/**
 * Formats a date to a readable string (e.g., "Jan 15, 2025")
 */
const formatDate = (date: Date | string): string => {
  return format(new Date(date), 'MMM d, yyyy');
};

/**
 * Formats project dates for display in the metadata card
 */
const formatProjectDates = (
  project: ProjectWithDates
): {
  formattedArchivedDate: null | string;
  formattedCreatedDate: string;
  formattedUpdatedDate: string;
} => {
  return {
    formattedArchivedDate: project.archivedAt ? formatDate(project.archivedAt) : null,
    formattedCreatedDate: formatDate(project.createdAt),
    formattedUpdatedDate: formatDate(project.updatedAt),
  };
};

/**
 * Generates repository count text for display
 */
const getRepositoryCountText = (count: number): string => {
  if (count === 0) {
    return 'No repositories added yet.';
  }
  return count === 1 ? '1 repository configured' : `${count} repositories configured`;
};

/**
 * Project detail page with breadcrumb navigation and tabbed layout.
 *
 * Features:
 * - Breadcrumb navigation: Projects > [Project Name]
 * - Project header with name, description, and action buttons
 * - Tabbed interface for Overview, Repositories, Workflows, and Settings
 * - Archive/Unarchive functionality
 * - Project metadata display (dates, status)
 */
const ProjectDetailPage = () => {
  // Type-safe route params validation
  const routeParams = useRouteParams(Route.routeParams);

  // Get validated project ID (safe to access after loading/error checks)
  const projectId = routeParams.data?.id;

  // Fetch project data (only when we have a valid ID)
  const { data: project, isError, isLoading } = useProject(projectId ?? 0);

  // Fetch repositories and workflows for counts
  const { data: repositories } = useRepositoriesByProject(projectId ?? 0);
  const { data: workflows } = useWorkflowsByProject(projectId ?? 0);

  // Handle route params loading state
  if (routeParams.isLoading) {
    return <ProjectDetailSkeleton />;
  }

  // Redirect if ID is invalid (Zod validation failed)
  if (routeParams.isError || !projectId) {
    redirect($path({ route: '/projects' }));
  }

  // Loading state for project data
  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  // Error or not found state
  if (isError || !project) {
    return <ProjectNotFound />;
  }

  // Derived state
  const isArchived = project.archivedAt !== null;
  const { formattedArchivedDate, formattedCreatedDate, formattedUpdatedDate } = formatProjectDates(project);

  // Derived counts for overview cards
  const repositoryCount = repositories?.length ?? 0;
  const workflowCount = workflows?.length ?? 0;
  const recentWorkflows = workflows?.slice(0, 3) ?? [];
  const hasNoRepositories = repositoryCount === 0;
  const hasNoWorkflows = workflowCount === 0;
  const hasMoreWorkflows = workflowCount > 3;

  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb navigation */}
      <nav aria-label={'Breadcrumb'} className={'flex items-center gap-2'}>
        <Link
          className={'text-sm text-muted-foreground transition-colors hover:text-foreground'}
          href={$path({ route: '/projects' })}
        >
          {'Projects'}
        </Link>
        <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
        <span className={'text-sm text-foreground'}>{project.name}</span>
      </nav>

      {/* Page header */}
      <div className={'space-y-1'}>
        <div className={'flex items-center gap-3'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{project.name}</h1>
          {isArchived && <Badge variant={'stale'}>{'Archived'}</Badge>}
        </div>
        {project.description && <p className={'text-muted-foreground'}>{project.description}</p>}
      </div>

      {/* Tabbed content */}
      <TabsRoot defaultValue={'overview'}>
        <TabsList>
          <TabsTrigger value={'overview'}>
            <Building2 aria-hidden={'true'} className={'mr-2 size-4'} />
            {'Overview'}
          </TabsTrigger>
          <TabsTrigger value={'repositories'}>
            <FolderGit2 aria-hidden={'true'} className={'mr-2 size-4'} />
            {'Repositories'}
          </TabsTrigger>
          <TabsTrigger value={'workflows'}>
            <Workflow aria-hidden={'true'} className={'mr-2 size-4'} />
            {'Workflows'}
          </TabsTrigger>
          <TabsIndicator />
        </TabsList>

        {/* Overview Tab */}
        <TabsPanel value={'overview'}>
          <div className={'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
            {/* Project metadata card */}
            <Card>
              <CardHeader>
                <CardTitle className={'text-base'}>{'Project Details'}</CardTitle>
              </CardHeader>
              <CardContent className={'space-y-3'}>
                <div className={'flex items-center gap-2 text-sm'}>
                  <Calendar aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
                  <span className={'text-muted-foreground'}>{'Created:'}</span>
                  <span>{formattedCreatedDate}</span>
                </div>
                <div className={'flex items-center gap-2 text-sm'}>
                  <Calendar aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
                  <span className={'text-muted-foreground'}>{'Updated:'}</span>
                  <span>{formattedUpdatedDate}</span>
                </div>
                {formattedArchivedDate && (
                  <div className={'flex items-center gap-2 text-sm'}>
                    <Archive aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
                    <span className={'text-muted-foreground'}>{'Archived:'}</span>
                    <span>{formattedArchivedDate}</span>
                  </div>
                )}
                <div className={'flex items-center gap-2 text-sm'}>
                  <span className={'text-muted-foreground'}>{'Status:'}</span>
                  <Badge variant={isArchived ? 'stale' : 'completed'}>{isArchived ? 'Archived' : 'Active'}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Repositories summary card */}
            <Card>
              <CardHeader>
                <CardTitle className={'text-base'}>{'Repositories'}</CardTitle>
              </CardHeader>
              <CardContent className={'space-y-3'}>
                <div className={'flex items-center gap-2 text-sm'}>
                  <FolderGit2 aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
                  <span className={'text-muted-foreground'}>{'Total:'}</span>
                  <span className={'font-medium'}>{repositoryCount}</span>
                </div>
                <p className={'text-sm text-muted-foreground'}>
                  {hasNoRepositories ? 'No repositories added yet.' : getRepositoryCountText(repositoryCount)}
                </p>
              </CardContent>
            </Card>

            {/* Recent Workflows summary card */}
            <Card>
              <CardHeader>
                <CardTitle className={'text-base'}>{'Recent Workflows'}</CardTitle>
              </CardHeader>
              <CardContent className={'space-y-3'}>
                <div className={'flex items-center gap-2 text-sm'}>
                  <Workflow aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
                  <span className={'text-muted-foreground'}>{'Total:'}</span>
                  <span className={'font-medium'}>{workflowCount}</span>
                </div>
                {hasNoWorkflows ? (
                  <p className={'text-sm text-muted-foreground'}>{'No workflows created yet.'}</p>
                ) : (
                  <div className={'space-y-1'}>
                    {recentWorkflows.map((workflow) => (
                      <p
                        className={'truncate text-sm text-muted-foreground'}
                        key={workflow.id}
                        title={workflow.featureName}
                      >
                        {workflow.featureName}
                      </p>
                    ))}
                    {hasMoreWorkflows && (
                      <p className={'text-sm text-muted-foreground'}>{`+${workflowCount - 3} more`}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsPanel>

        {/* Repositories Tab */}
        <TabsPanel value={'repositories'}>
          <RepositoriesTabContent projectId={projectId} />
        </TabsPanel>

        {/* Workflows Tab */}
        <TabsPanel value={'workflows'}>
          <WorkflowsTabContent projectId={projectId} projectName={project.name} />
        </TabsPanel>
      </TabsRoot>
    </div>
  );
};

export default ProjectDetailPage;
