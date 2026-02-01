'use client';

import { format } from 'date-fns';
import {
  Archive,
  ArchiveRestore,
  Building2,
  Calendar,
  ChevronRight,
  FolderGit2,
  Pencil,
  Settings,
  Workflow,
} from 'lucide-react';
import { useRouteParams } from 'next-typesafe-url/app';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useState } from 'react';

import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { RepositoriesTabContent } from '@/components/projects/repositories-tab-content';
import { SettingsTabContent } from '@/components/projects/settings-tab-content';
import { WorkflowsTabContent } from '@/components/projects/workflows-tab-content';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTrigger } from '@/components/ui/tabs';
import { useArchiveProject, useProject, useUnarchiveProject } from '@/hooks/queries/use-projects';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { useWorkflowsByProject } from '@/hooks/queries/use-workflows';

import { Route } from './route-type';

/**
 * Loading skeleton for the project detail page
 */
const ProjectDetailSkeleton = () => {
  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb skeleton */}
      <div className={'flex items-center gap-2'}>
        <div className={'h-4 w-16 animate-pulse rounded-sm bg-muted'} />
        <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
      </div>

      {/* Header skeleton */}
      <div className={'flex items-start justify-between gap-4'}>
        <div className={'space-y-2'}>
          <div className={'h-7 w-48 animate-pulse rounded-sm bg-muted'} />
          <div className={'h-5 w-80 animate-pulse rounded-sm bg-muted'} />
        </div>
        <div className={'flex gap-2'}>
          <div className={'h-9 w-20 animate-pulse rounded-md bg-muted'} />
          <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className={'space-y-4'}>
        <div className={'flex gap-4 border-b border-border pb-2'}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div className={'h-8 w-24 animate-pulse rounded-sm bg-muted'} key={index} />
          ))}
        </div>
        <div className={'h-48 animate-pulse rounded-lg bg-muted'} />
      </div>
    </div>
  );
};

/**
 * Error state for when a project is not found
 */
const ProjectNotFound = () => {
  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb */}
      <nav aria-label={'Breadcrumb'} className={'flex items-center gap-2'}>
        <Link className={'text-sm text-muted-foreground transition-colors hover:text-foreground'} href={'/projects'}>
          {'Projects'}
        </Link>
        <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
        <span className={'text-sm text-foreground'}>{'Not Found'}</span>
      </nav>

      {/* Error content */}
      <div
        className={'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center'}
      >
        <div className={'flex size-12 items-center justify-center rounded-full bg-muted'}>
          <FolderGit2 aria-hidden={'true'} className={'size-6 text-muted-foreground'} />
        </div>
        <div className={'space-y-1'}>
          <h2 className={'text-lg font-semibold'}>{'Project not found'}</h2>
          <p className={'text-sm text-muted-foreground'}>
            {"The project you're looking for doesn't exist or may have been deleted."}
          </p>
        </div>
        <Link className={buttonVariants({ variant: 'outline' })} href={'/projects'}>
          {'Back to Projects'}
        </Link>
      </div>
    </div>
  );
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
export default function ProjectDetailPage() {
  // Type-safe route params validation
  const routeParams = useRouteParams(Route.routeParams);

  // Get validated project ID (safe to access after loading/error checks)
  const projectId = routeParams.data?.id;

  // Fetch project data (only when we have a valid ID)
  const { data: project, isError, isLoading } = useProject(projectId ?? 0);

  // Fetch repositories and workflows for counts
  const { data: repositories } = useRepositoriesByProject(projectId ?? 0);
  const { data: workflows } = useWorkflowsByProject(projectId ?? 0);

  // Mutations
  const archiveProjectMutation = useArchiveProject();
  const unarchiveProjectMutation = useUnarchiveProject();

  // Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Handle route params loading state
  if (routeParams.isLoading) {
    return <ProjectDetailSkeleton />;
  }

  // Redirect if ID is invalid (Zod validation failed)
  if (routeParams.isError || !projectId) {
    redirect('/projects');
  }

  // Loading state for project data
  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  // Error or not found state
  if (isError || !project) {
    return <ProjectNotFound />;
  }

  const isArchived = project.archivedAt !== null;
  const formattedCreatedDate = format(new Date(project.createdAt), 'MMM d, yyyy');
  const formattedUpdatedDate = format(new Date(project.updatedAt), 'MMM d, yyyy');
  const formattedArchivedDate = project.archivedAt ? format(new Date(project.archivedAt), 'MMM d, yyyy') : null;

  // Derived counts for overview cards
  const repositoryCount = repositories?.length ?? 0;
  const workflowCount = workflows?.length ?? 0;
  const recentWorkflows = workflows?.slice(0, 3) ?? [];

  const handleArchive = () => {
    archiveProjectMutation.mutate(projectId);
  };

  const handleUnarchive = () => {
    unarchiveProjectMutation.mutate(projectId);
  };

  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb navigation */}
      <nav aria-label={'Breadcrumb'} className={'flex items-center gap-2'}>
        <Link className={'text-sm text-muted-foreground transition-colors hover:text-foreground'} href={'/projects'}>
          {'Projects'}
        </Link>
        <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
        <span className={'text-sm text-foreground'}>{project.name}</span>
      </nav>

      {/* Page header */}
      <div className={'flex items-start justify-between gap-4'}>
        <div className={'space-y-1'}>
          <div className={'flex items-center gap-3'}>
            <h1 className={'text-2xl font-semibold tracking-tight'}>{project.name}</h1>
            {isArchived && <Badge variant={'stale'}>{'Archived'}</Badge>}
          </div>
          {project.description && <p className={'text-muted-foreground'}>{project.description}</p>}
        </div>

        {/* Action buttons */}
        <div className={'flex gap-2'}>
          <Button onClick={() => setIsEditDialogOpen(true)} size={'sm'} variant={'outline'}>
            <Pencil aria-hidden={'true'} className={'size-4'} />
            {'Edit'}
          </Button>
          <EditProjectDialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} project={project} />
          {isArchived ? (
            <Button
              disabled={unarchiveProjectMutation.isPending}
              onClick={handleUnarchive}
              size={'sm'}
              variant={'outline'}
            >
              <ArchiveRestore aria-hidden={'true'} className={'size-4'} />
              {unarchiveProjectMutation.isPending ? 'Unarchiving...' : 'Unarchive'}
            </Button>
          ) : (
            <Button disabled={archiveProjectMutation.isPending} onClick={handleArchive} size={'sm'} variant={'outline'}>
              <Archive aria-hidden={'true'} className={'size-4'} />
              {archiveProjectMutation.isPending ? 'Archiving...' : 'Archive'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabbed content */}
      <TabsRoot defaultValue={'overview'}>
        <TabsList>
          <TabsTrigger value={'overview'}>
            <Building2 aria-hidden={'true'} className={'size-4'} />
            {'Overview'}
          </TabsTrigger>
          <TabsTrigger value={'repositories'}>
            <FolderGit2 aria-hidden={'true'} className={'size-4'} />
            {'Repositories'}
          </TabsTrigger>
          <TabsTrigger value={'workflows'}>
            <Workflow aria-hidden={'true'} className={'size-4'} />
            {'Workflows'}
          </TabsTrigger>
          <TabsTrigger value={'settings'}>
            <Settings aria-hidden={'true'} className={'size-4'} />
            {'Settings'}
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
                {repositoryCount === 0 ? (
                  <p className={'text-sm text-muted-foreground'}>{'No repositories added yet.'}</p>
                ) : (
                  <p className={'text-sm text-muted-foreground'}>
                    {repositoryCount === 1 ? '1 repository configured' : `${repositoryCount} repositories configured`}
                  </p>
                )}
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
                {workflowCount === 0 ? (
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
                    {workflowCount > 3 && (
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

        {/* Settings Tab */}
        <TabsPanel value={'settings'}>
          <SettingsTabContent projectId={projectId} />
        </TabsPanel>
      </TabsRoot>
    </div>
  );
}
