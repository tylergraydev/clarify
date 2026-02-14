'use client';

import { Building2, ChevronRight, FolderGit2, MessageCircle, Workflow } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouteParams } from 'next-typesafe-url/app';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { ChatTabContent } from '@/components/chat/chat-tab-content';
import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { ProjectDetailSkeleton, ProjectNotFound } from '@/components/projects';
import { ProjectOverviewTab } from '@/components/projects/overview/project-overview-tab';
import { RepositoriesTabContent } from '@/components/repositories/repositories-tab-content';
import { Badge } from '@/components/ui/badge';
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowsTabContent } from '@/components/workflows/workflows-tab-content';
import { useProject } from '@/hooks/queries/use-projects';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { useWorkflowsByProject } from '@/hooks/queries/use-workflows';

import { type ProjectTabValue, projectTabValues, Route } from './route-type';

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

  // URL state management for active tab
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(projectTabValues).withDefault('overview')
  );

  // Handle route params loading state
  if (routeParams.isLoading) {
    return (
      <div aria-busy={'true'} aria-label={'Loading project details'} role={'status'}>
        <ProjectDetailSkeleton />
      </div>
    );
  }

  // Redirect if ID is invalid (Zod validation failed)
  if (routeParams.isError || !projectId) {
    redirect($path({ route: '/projects' }));
  }

  // Loading state for project data
  if (isLoading) {
    return (
      <div aria-busy={'true'} aria-label={'Loading project details'} role={'status'}>
        <ProjectDetailSkeleton />
      </div>
    );
  }

  // Error or not found state
  if (isError || !project) {
    return <ProjectNotFound />;
  }

  // Derived state
  const isArchived = project.archivedAt !== null;

  return (
    <QueryErrorBoundary>
      <main aria-label={'Project detail'} className={'space-y-6'}>
        {/* Skip link for keyboard navigation */}
        <a
          className={
            'sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-2 focus:text-foreground'
          }
          href={'#project-content'}
        >
          {'Skip to project content'}
        </a>

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
        <section aria-label={'Project header'}>
          <div className={'space-y-1'}>
            <div className={'flex items-center gap-3'}>
              <h1 className={'text-2xl font-semibold tracking-tight'}>{project.name}</h1>
              {isArchived && <Badge variant={'stale'}>{'Archived'}</Badge>}
            </div>
            {project.description && <p className={'text-muted-foreground'}>{project.description}</p>}
          </div>
        </section>

        {/* Tabbed content */}
        <section aria-label={'Project content'} aria-live={'polite'} id={'project-content'}>
          <TabsRoot onValueChange={(value) => setActiveTab(value as ProjectTabValue)} value={activeTab}>
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
              <TabsTrigger value={'chat'}>
                <MessageCircle aria-hidden={'true'} className={'mr-2 size-4'} />
                {'Chat'}
              </TabsTrigger>
              <TabsIndicator />
            </TabsList>

            {/* Overview Tab */}
            <TabsPanel value={'overview'}>
              <ProjectOverviewTab
                isArchived={isArchived}
                onTabChange={(tab) => setActiveTab(tab as ProjectTabValue)}
                project={project}
                repositories={repositories ?? []}
                workflows={workflows ?? []}
              />
            </TabsPanel>

            {/* Repositories Tab */}
            <TabsPanel value={'repositories'}>
              <RepositoriesTabContent projectId={projectId} />
            </TabsPanel>

            {/* Workflows Tab */}
            <TabsPanel value={'workflows'}>
              <WorkflowsTabContent projectId={projectId} projectName={project.name} />
            </TabsPanel>

            {/* Chat Tab */}
            <TabsPanel value={'chat'}>
              <ChatTabContent projectId={projectId} />
            </TabsPanel>
          </TabsRoot>
        </section>
      </main>
    </QueryErrorBoundary>
  );
};
export default ProjectDetailPage;
