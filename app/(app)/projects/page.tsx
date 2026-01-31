'use client';

import { FolderOpen, Plus } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { useRouter } from 'next/navigation';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { useMemo } from 'react';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectTable } from '@/components/projects/project-table';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Switch } from '@/components/ui/switch';
import { DataTableSkeleton } from '@/components/ui/table';
import { useArchiveProject, useProjects, useUnarchiveProject } from '@/hooks/queries/use-projects';

import { Route } from './route-type';

/**
 * Projects page - Main entry point for project management.
 *
 * Features:
 * - Table view displaying all projects
 * - Show/hide archived projects filter
 * - Create new project dialog
 * - Archive/unarchive project actions
 * - Empty state when no projects exist
 */
function ProjectsPageContent() {
  const router = useRouter();

  // URL state management with nuqs
  const [showArchived, setShowArchived] = useQueryState('showArchived', parseAsBoolean.withDefault(false));

  // Data fetching
  const { data: projects, isLoading } = useProjects();

  // Mutations
  const archiveProjectMutation = useArchiveProject();
  const unarchiveProjectMutation = useUnarchiveProject();

  const isArchiving = archiveProjectMutation.isPending || unarchiveProjectMutation.isPending;

  // Filter projects based on showArchived state
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (showArchived) return projects;
    return projects.filter((project) => project.archivedAt === null);
  }, [projects, showArchived]);

  // Handlers
  const handleShowArchivedChange = (checked: boolean) => {
    void setShowArchived(checked);
  };

  const handleArchive = (projectId: number) => {
    archiveProjectMutation.mutate(projectId);
  };

  const handleUnarchive = (projectId: number) => {
    unarchiveProjectMutation.mutate(projectId);
  };

  const handleViewDetails = (projectId: number) => {
    router.push($path({ route: '/projects/[id]', routeParams: { id: projectId } }));
  };

  // Check if there are no projects at all (not just filtered)
  const hasNoProjects = !isLoading && projects && projects.length === 0;

  return (
    <div className={'space-y-6'}>
      {/* Page heading */}
      <div className={'flex items-start justify-between gap-4'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>Projects</h1>
          <p className={'text-muted-foreground'}>Manage your projects and repositories.</p>
        </div>
        <CreateProjectDialog
          trigger={
            <Button>
              <Plus aria-hidden={'true'} className={'size-4'} />
              {'Create Project'}
            </Button>
          }
        />
      </div>

      {/* Filters */}
      {!hasNoProjects && (
        <div className={'flex flex-wrap items-center justify-end gap-4'}>
          {/* Show archived toggle */}
          <div className={'flex items-center gap-2'}>
            <label className={'text-sm text-muted-foreground'} htmlFor={'show-archived'}>
              {'Show archived'}
            </label>
            <Switch
              checked={showArchived}
              id={'show-archived'}
              onCheckedChange={handleShowArchivedChange}
              size={'sm'}
            />
          </div>
        </div>
      )}

      {/* Projects content */}
      <QueryErrorBoundary>
        {isLoading ? (
          <DataTableSkeleton columnCount={6} rowCount={3} />
        ) : hasNoProjects ? (
          // Empty state when no projects exist
          <EmptyState
            action={
              <CreateProjectDialog
                trigger={
                  <Button>
                    <Plus aria-hidden={'true'} className={'size-4'} />
                    {'Create your first project'}
                  </Button>
                }
              />
            }
            description={'Get started by creating your first project to organize your workflows and repositories.'}
            icon={<FolderOpen aria-hidden={'true'} className={'size-6'} />}
            title={'No projects yet'}
          />
        ) : filteredProjects.length === 0 ? (
          // Empty state when filters hide all projects
          <EmptyState
            action={
              <Button onClick={() => handleShowArchivedChange(true)} variant={'outline'}>
                {'Show archived projects'}
              </Button>
            }
            description={'All your projects are archived. Toggle the filter to see them.'}
            icon={<FolderOpen aria-hidden={'true'} className={'size-6'} />}
            title={'No active projects'}
          />
        ) : (
          <ProjectTable
            isArchiving={isArchiving}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onViewDetails={handleViewDetails}
            projects={filteredProjects}
          />
        )}
      </QueryErrorBoundary>
    </div>
  );
}

export default withParamValidation(ProjectsPageContent, Route);
