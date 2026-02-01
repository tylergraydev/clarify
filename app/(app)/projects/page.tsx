'use client';

import { FolderOpen, Plus } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { useRouter } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { type ArchiveFilterValue, CreateProjectDialog, ProjectTable, ProjectTableToolbar } from '@/components/projects';
import { ProjectsPageHeader } from '@/components/projects/projects-page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTableSkeleton } from '@/components/ui/table';
import {
  useArchiveProject,
  useDeleteProjectPermanently,
  useProjects,
  useToggleFavorite,
  useUnarchiveProject,
} from '@/hooks/queries/use-projects';
import { DEFAULT_PROJECT_ARCHIVE_FILTER } from '@/lib/layout/constants';

import { Route } from './route-type';

// ============================================================================
// Constants
// ============================================================================

const ARCHIVE_FILTER_VALUES = ['all', 'active', 'archived'] as const;

// ============================================================================
// Component
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
const ProjectsPage = () => {
  const router = useRouter();

  // URL state management with nuqs
  const [archiveFilter, setArchiveFilter] = useQueryState(
    'status',
    parseAsStringLiteral(ARCHIVE_FILTER_VALUES).withDefault(DEFAULT_PROJECT_ARCHIVE_FILTER)
  );

  // Data fetching
  const { data: projects, isLoading } = useProjects();

  // Mutations
  const archiveProjectMutation = useArchiveProject();
  const unarchiveProjectMutation = useUnarchiveProject();
  const deleteProjectMutation = useDeleteProjectPermanently();
  const toggleFavoriteMutation = useToggleFavorite();

  // Search filter state
  const [searchFilter, setSearchFilter] = useState('');

  // Per-row loading state tracking
  const [archivingIds, setArchivingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [togglingFavoriteIds, setTogglingFavoriteIds] = useState<Set<number>>(new Set());

  // Filter projects based on archiveFilter and searchFilter state
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    let result = projects;

    // Apply archive filter
    if (archiveFilter === 'archived') {
      result = result.filter((project) => project.archivedAt !== null);
    } else if (archiveFilter !== 'all') {
      result = result.filter((project) => project.archivedAt === null);
    }

    // Apply search filter
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      result = result.filter((project) => {
        const nameMatch = project.name.toLowerCase().includes(searchLower);
        const descMatch = project.description?.toLowerCase().includes(searchLower) ?? false;
        return nameMatch || descMatch;
      });
    }

    return result;
  }, [projects, archiveFilter, searchFilter]);

  // Calculate counts for header badge
  const totalCount = projects?.length ?? 0;
  const filteredCount = filteredProjects.length;
  const isFiltered = archiveFilter !== 'all' || searchFilter !== '';

  // Handlers
  const handleArchiveFilterChange = (value: ArchiveFilterValue) => {
    void setArchiveFilter(value);
  };

  const handleResetFilters = () => {
    void setArchiveFilter(DEFAULT_PROJECT_ARCHIVE_FILTER);
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

  const handleToggleFavorite = async (projectId: number) => {
    setTogglingFavoriteIds((prev) => new Set(prev).add(projectId));
    try {
      await toggleFavoriteMutation.mutateAsync(projectId);
    } finally {
      setTogglingFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  // Check if there are no projects at all (not just filtered)
  const hasNoProjects = projects && projects.length === 0;

  // Loading state - early return
  if (isLoading) {
    return (
      <div aria-busy={'true'} aria-label={'Loading projects'} role={'status'}>
        <DataTableSkeleton columnCount={6} rowCount={3} />
      </div>
    );
  }

  return (
    <QueryErrorBoundary>
      <main aria-label={'Project management'} className={'space-y-6'}>
        {/* Skip link for keyboard navigation */}
        <a
          className={
            'sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-2 focus:text-foreground'
          }
          href={'#project-content'}
        >
          {'Skip to project content'}
        </a>

        {/* Page heading with count badge */}
        <ProjectsPageHeader filteredCount={filteredCount} isFiltered={isFiltered} totalCount={totalCount} />

        {/* Projects content */}
        <section aria-label={'Projects list'} aria-live={'polite'} id={'project-content'}>
          {hasNoProjects ? (
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
          ) : (
            <ProjectTable
              archivingIds={archivingIds}
              deletingIds={deletingIds}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onGlobalFilterChange={setSearchFilter}
              onToggleFavorite={handleToggleFavorite}
              onUnarchive={handleUnarchive}
              onViewDetails={handleViewDetails}
              projects={filteredProjects}
              togglingFavoriteIds={togglingFavoriteIds}
              toolbarContent={
                <ProjectTableToolbar
                  archiveFilter={archiveFilter}
                  onArchiveFilterChange={handleArchiveFilterChange}
                  onResetFilters={handleResetFilters}
                />
              }
            />
          )}
        </section>
      </main>
    </QueryErrorBoundary>
  );
};

export default withParamValidation(ProjectsPage, Route);
