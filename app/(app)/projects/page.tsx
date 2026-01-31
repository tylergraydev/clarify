'use client';

import { FolderOpen, Plus } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { useRouter } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectTable } from '@/components/projects/project-table';
import { type ArchiveFilterValue, ProjectTableToolbar } from '@/components/projects/project-table-toolbar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTableSkeleton } from '@/components/ui/table';
import {
  useArchiveProject,
  useDeleteProjectPermanently,
  useProjects,
  useUnarchiveProject,
} from '@/hooks/queries/use-projects';

import { ProjectsPageHeader } from './_components/projects-page-header';
import { Route } from './route-type';

// ============================================================================
// Constants
// ============================================================================

const ARCHIVE_FILTER_VALUES = ['all', 'active', 'archived'] as const;
const DEFAULT_ARCHIVE_FILTER: ArchiveFilterValue = 'active';

// ============================================================================
// Page Component
// ============================================================================

/**
 * Projects page - Main entry point for project management.
 *
 * Features:
 * - Table view displaying all projects
 * - Filters popover with archive status filter
 * - Project count badge in header
 * - Create new project dialog
 * - Archive/unarchive project actions via Status column toggle
 * - Empty state when no projects exist
 */
function ProjectsPageContent() {
  const router = useRouter();

  // URL state management with nuqs
  const [archiveFilter, setArchiveFilter] = useQueryState(
    'status',
    parseAsStringLiteral(ARCHIVE_FILTER_VALUES).withDefault(DEFAULT_ARCHIVE_FILTER)
  );

  // Data fetching
  const { data: projects, isLoading } = useProjects();

  // Mutations
  const archiveProjectMutation = useArchiveProject();
  const unarchiveProjectMutation = useUnarchiveProject();
  const deleteProjectMutation = useDeleteProjectPermanently();

  // Per-row loading state tracking
  const [archivingIds, setArchivingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Filter projects based on archiveFilter state
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (archiveFilter === 'all') return projects;
    if (archiveFilter === 'archived') return projects.filter((project) => project.archivedAt !== null);
    return projects.filter((project) => project.archivedAt === null);
  }, [projects, archiveFilter]);

  // Calculate counts for header badge
  const totalCount = projects?.length ?? 0;
  const filteredCount = filteredProjects.length;
  const isFiltered = archiveFilter !== 'all';

  // Handlers
  const handleArchiveFilterChange = (value: ArchiveFilterValue) => {
    void setArchiveFilter(value);
  };

  const handleResetFilters = () => {
    void setArchiveFilter(DEFAULT_ARCHIVE_FILTER);
  };

  const handleArchive = async (projectId: number) => {
    setArchivingIds((prev) => new Set(prev).add(projectId));
    try {
      await archiveProjectMutation.mutateAsync(projectId);
    } finally {
      setArchivingIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  const handleUnarchive = async (projectId: number) => {
    setArchivingIds((prev) => new Set(prev).add(projectId));
    try {
      await unarchiveProjectMutation.mutateAsync(projectId);
    } finally {
      setArchivingIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  const handleDelete = async (projectId: number) => {
    setDeletingIds((prev) => new Set(prev).add(projectId));
    try {
      await deleteProjectMutation.mutateAsync(projectId);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  const handleViewDetails = (projectId: number) => {
    router.push($path({ route: '/projects/[id]', routeParams: { id: projectId } }));
  };

  // Check if there are no projects at all (not just filtered)
  const hasNoProjects = !isLoading && projects && projects.length === 0;

  return (
    <div className={'space-y-6'} id={'project-content'}>
      {/* Page heading with count badge */}
      <ProjectsPageHeader filteredCount={filteredCount} isFiltered={isFiltered} totalCount={totalCount} />

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
              <Button onClick={() => handleArchiveFilterChange('all')} variant={'outline'}>
                {'Show all projects'}
              </Button>
            }
            description={'No projects match your current filter. Try adjusting the status filter.'}
            icon={<FolderOpen aria-hidden={'true'} className={'size-6'} />}
            title={'No matching projects'}
          />
        ) : (
          <ProjectTable
            archivingIds={archivingIds}
            deletingIds={deletingIds}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onUnarchive={handleUnarchive}
            onViewDetails={handleViewDetails}
            projects={filteredProjects}
            toolbarContent={
              <ProjectTableToolbar
                archiveFilter={archiveFilter}
                onArchiveFilterChange={handleArchiveFilterChange}
                onResetFilters={handleResetFilters}
              />
            }
          />
        )}
      </QueryErrorBoundary>
    </div>
  );
}

export default withParamValidation(ProjectsPageContent, Route);
