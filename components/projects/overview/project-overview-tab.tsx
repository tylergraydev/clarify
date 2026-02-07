'use client';

import { useCallback, useState } from 'react';

import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { ProjectActivityCard } from '@/components/projects/overview/project-activity-card';
import { ProjectQuickActionsCard } from '@/components/projects/overview/project-quick-actions-card';
import { ProjectRepositoriesCard } from '@/components/projects/overview/project-repositories-card';
import { ProjectStatsRow } from '@/components/projects/overview/project-stats-row';
import { useArchiveProject, useUnarchiveProject } from '@/hooks/queries/use-projects';

type ProjectOverviewTabProps = {
  isArchived: boolean;
  onTabChange: (tab: string) => void;
  project: {
    archivedAt: null | string;
    createdAt: string;
    description: null | string;
    id: number;
    isFavorite: boolean;
    name: string;
    updatedAt: string;
  };
  repositories: Array<{
    defaultBranch: string;
    id: number;
    name: string;
    path: string;
    remoteUrl: null | string;
    setAsDefaultAt: null | string;
  }>;
  workflows: Array<{
    completedAt: null | string;
    createdAt: string;
    durationMs: null | number;
    featureName: string;
    id: number;
    startedAt: null | string;
    status: string;
    type: string;
    updatedAt: string;
  }>;
};

/** Orchestrates the Overview tab layout for the project detail page, composing stats, activity, quick actions, and repositories. */
export const ProjectOverviewTab = ({
  isArchived,
  onTabChange,
  project,
  repositories,
  workflows,
}: ProjectOverviewTabProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const archiveProject = useArchiveProject();
  const unarchiveProject = useUnarchiveProject();

  const handleViewAllWorkflowsClick = useCallback(() => {
    onTabChange('workflows');
  }, [onTabChange]);

  const handleCreateWorkflowClick = useCallback(() => {
    onTabChange('workflows');
  }, [onTabChange]);

  const handleAddRepositoryClick = useCallback(() => {
    onTabChange('repositories');
  }, [onTabChange]);

  const handleEditProjectClick = useCallback(() => {
    setIsEditDialogOpen(true);
  }, []);

  const handleArchiveToggleClick = useCallback(() => {
    if (isArchived) {
      unarchiveProject.mutate(project.id);
    } else {
      archiveProject.mutate(project.id);
    }
  }, [archiveProject, isArchived, project.id, unarchiveProject]);

  const handleManageRepositoriesClick = useCallback(() => {
    onTabChange('repositories');
  }, [onTabChange]);

  const handleEditDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsEditDialogOpen(isOpen);
  }, []);

  return (
    <div className={'space-y-6'}>
      {/* Stats Row */}
      <ProjectStatsRow repositories={repositories} workflows={workflows} />

      {/* Main Content */}
      <div className={'grid gap-6 lg:grid-cols-3'}>
        {/* Left Column - Activity */}
        <div className={'lg:col-span-2'}>
          <ProjectActivityCard onViewAllClick={handleViewAllWorkflowsClick} workflows={workflows} />
        </div>

        {/* Right Column - Actions & Repositories */}
        <div className={'space-y-6'}>
          <ProjectQuickActionsCard
            isArchived={isArchived}
            onAddRepository={handleAddRepositoryClick}
            onArchiveToggle={handleArchiveToggleClick}
            onCreateWorkflow={handleCreateWorkflowClick}
            onEditProject={handleEditProjectClick}
          />
          <ProjectRepositoriesCard onManageClick={handleManageRepositoriesClick} repositories={repositories} />
        </div>
      </div>

      {/* Edit Project Dialog */}
      <EditProjectDialog isOpen={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange} project={project} />
    </div>
  );
};
