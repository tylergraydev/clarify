'use client';

import type { ComponentPropsWithRef } from 'react';

import { AlertCircle, FolderGit2, Plus } from 'lucide-react';
import { useState } from 'react';

import type { Repository } from '@/db/schema';

import { AddRepositoryDialog } from '@/components/repositories/add-repository-dialog';
import { ConfirmDeleteRepositoryDialog } from '@/components/repositories/confirm-delete-repository-dialog';
import { EditRepositoryDialog } from '@/components/repositories/edit-repository-dialog';
import { RepositoryCard } from '@/components/repositories/repository-card';
import { RepositoryCardSkeleton } from '@/components/repositories/repository-card-skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  useClearDefaultRepository,
  useDeleteRepository,
  useRepositoriesByProject,
  useSetDefaultRepository,
} from '@/hooks/queries/use-repositories';
import { cn } from '@/lib/utils';

interface RepositoriesTabContentProps extends ComponentPropsWithRef<'div'> {
  /** The ID of the project to display repositories for */
  projectId: number;
}

/**
 * Repositories tab content for project detail page.
 * Displays project repositories with add, edit, and delete functionality.
 */
export const RepositoriesTabContent = ({ className, projectId, ref, ...props }: RepositoriesTabContentProps) => {
  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState<null | Repository>(null);

  // Data fetching
  const { data: repositories, error, isLoading } = useRepositoriesByProject(projectId);

  // Mutations
  const clearDefaultRepositoryMutation = useClearDefaultRepository();
  const deleteRepositoryMutation = useDeleteRepository();
  const setDefaultRepositoryMutation = useSetDefaultRepository();

  // Handlers
  const handleClearDefault = (repositoryId: number) => {
    clearDefaultRepositoryMutation.mutate(repositoryId);
  };

  const handleDeleteClick = (repositoryId: number) => {
    const repo = repositories?.find((r) => r.id === repositoryId);
    if (repo) {
      setSelectedRepository(repo);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedRepository) {
      deleteRepositoryMutation.mutate(selectedRepository.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedRepository(null);
        },
      });
    }
  };

  const handleEdit = (repository: Repository) => {
    setSelectedRepository(repository);
    setEditDialogOpen(true);
  };

  const handleSetDefault = (repositoryId: number) => {
    setDefaultRepositoryMutation.mutate(repositoryId);
  };

  // Derived state
  const isRepositoriesEmpty = !isLoading && !error && repositories?.length === 0;
  const hasRepositories = !isLoading && !error && repositories && repositories.length > 0;
  const hasError = !isLoading && error;

  // Loading State
  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
        {/* Add Repository Button Skeleton */}
        <div className={'flex justify-end'}>
          <div className={'h-9 w-36 animate-pulse rounded-md bg-muted'} />
        </div>

        {/* Repository Cards Skeleton Grid */}
        <div className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
          {Array.from({ length: 3 }).map((_, index) => (
            <RepositoryCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (hasError) {
    return (
      <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
        <EmptyState
          description={'Failed to load repositories. Please try again.'}
          icon={<AlertCircle aria-hidden={'true'} className={'size-6'} />}
          title={'Error Loading Repositories'}
        />
      </div>
    );
  }

  // Empty State
  if (isRepositoriesEmpty) {
    return (
      <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
        <EmptyState
          action={
            <AddRepositoryDialog
              projectId={projectId}
              trigger={
                <Button>
                  <Plus aria-hidden={'true'} className={'size-4'} />
                  {'Add Repository'}
                </Button>
              }
            />
          }
          description={'Add a repository to this project to start managing workflows.'}
          icon={<FolderGit2 aria-hidden={'true'} className={'size-6'} />}
          title={'No Repositories'}
        />
      </div>
    );
  }

  // Content State
  if (hasRepositories) {
    return (
      <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
        {/* Header with Add Button */}
        <div className={'flex justify-end'}>
          <AddRepositoryDialog
            projectId={projectId}
            trigger={
              <Button>
                <Plus aria-hidden={'true'} className={'size-4'} />
                {'Add Repository'}
              </Button>
            }
          />
        </div>

        {/* Repository Cards Grid */}
        <div className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
          {repositories.map((repository) => {
            const isDefault = repository.setAsDefaultAt !== null;

            return (
              <RepositoryCard
                isDefault={isDefault}
                key={repository.id}
                onClearDefault={handleClearDefault}
                onDelete={handleDeleteClick}
                onEdit={handleEdit}
                onSetDefault={handleSetDefault}
                repository={repository}
              />
            );
          })}
        </div>

        {/* Edit Repository Dialog */}
        {selectedRepository && (
          <EditRepositoryDialog
            isOpen={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={() => setSelectedRepository(null)}
            repository={selectedRepository}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {selectedRepository && (
          <ConfirmDeleteRepositoryDialog
            isLoading={deleteRepositoryMutation.isPending}
            isOpen={deleteDialogOpen}
            onConfirm={handleDeleteConfirm}
            onOpenChange={setDeleteDialogOpen}
            repositoryName={selectedRepository.name}
          />
        )}
      </div>
    );
  }

  return null;
};
