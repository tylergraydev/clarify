'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Project } from '@/db/schema';

import { agentKeys } from '@/lib/queries/agents';
import { projectKeys } from '@/lib/queries/projects';
import { repositoryKeys } from '@/lib/queries/repositories';
import { workflowKeys } from '@/lib/queries/workflows';

import { useElectronDb } from '../use-electron';
import { useToast } from '../use-toast';

/**
 * Add a repository to a project
 * Invalidates both project detail and repository queries
 */
export function useAddRepositoryToProject(options?: { showToast?: boolean }) {
  const { showToast = true } = options ?? {};
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  const toast = useToast();

  return useMutation({
    mutationFn: ({ projectId, repoData }: { projectId: number; repoData: Parameters<typeof projects.addRepo>[1] }) =>
      projects.addRepo(projectId, repoData),
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to add repository',
          title: 'Add Repository Failed',
        });
      }
    },
    onSuccess: (repository) => {
      void queryClient.invalidateQueries({
        queryKey: projectKeys.detail(repository.projectId).queryKey,
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
      void queryClient.invalidateQueries({ queryKey: repositoryKeys._def });
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.byProject(repository.projectId).queryKey,
      });

      if (showToast) {
        toast.success({
          description: 'Repository added to project',
          title: 'Repository Added',
        });
      }
    },
  });
}

/**
 * Archive a project by setting archivedAt to current timestamp
 */
export function useArchiveProject(options?: { showToast?: boolean }) {
  const { showToast = true } = options ?? {};
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => projects.archive(id),
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to archive project',
          title: 'Archive Failed',
        });
      }
    },
    onSuccess: (project) => {
      if (project) {
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });

        if (showToast) {
          toast.success({
            description: 'Project archived',
            title: 'Project Archived',
          });
        }
      }
    },
  });
}

/**
 * Create a new project
 */
export function useCreateProject(options?: { showToast?: boolean }) {
  const { showToast = true } = options ?? {};
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof projects.create>[0]) => projects.create(data),
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to create project',
          title: 'Create Failed',
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });

      if (showToast) {
        toast.success({
          description: 'Project created successfully',
          title: 'Project Created',
        });
      }
    },
  });
}

/**
 * Delete a project (soft delete / archive)
 */
export function useDeleteProject(options?: { showToast?: boolean }) {
  const { showToast = true } = options ?? {};
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => projects.delete(id),
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to delete project',
          title: 'Delete Failed',
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
      void queryClient.invalidateQueries({ queryKey: repositoryKeys._def });

      if (showToast) {
        toast.success({
          description: 'Project moved to archive',
          title: 'Project Deleted',
        });
      }
    },
  });
}

/**
 * Permanently delete a project and all associated data.
 * This is a hard delete that cascades to repositories, workflows, agents, etc.
 */
export function useDeleteProjectPermanently(options?: { showToast?: boolean }) {
  const { showToast = true } = options ?? {};
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => projects.deleteHard(id),
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to permanently delete project',
          title: 'Delete Failed',
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
      void queryClient.invalidateQueries({ queryKey: repositoryKeys._def });
      void queryClient.invalidateQueries({ queryKey: workflowKeys._def });
      void queryClient.invalidateQueries({ queryKey: agentKeys._def });

      if (showToast) {
        toast.success({
          description: 'Project deleted permanently',
          title: 'Project Deleted',
        });
      }
    },
  });
}

/**
 * Fetch favorite projects
 */
export function useFavoriteProjects() {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    ...projectKeys.favorites,
    enabled: isElectron,
    queryFn: () => projects.listFavorites(),
  });
}

/**
 * Fetch a single project by ID
 */
export function useProject(id: number) {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    ...projectKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => projects.get(id),
  });
}

/**
 * Fetch all projects (including archived)
 */
export function useProjects() {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    ...projectKeys.list({ includeArchived: true }),
    enabled: isElectron,
    queryFn: () => projects.list({ includeArchived: true }),
  });
}

/**
 * Toggle a project's favorite status.
 * Uses optimistic updates for immediate UI feedback.
 */
export function useToggleFavorite(options?: { showToast?: boolean }) {
  const { showToast = true } = options ?? {};
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => projects.toggleFavorite(id),
    onError: (error, id, context) => {
      // Rollback optimistic updates on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(projectKeys.favorites.queryKey, context.previousFavorites);
      }
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(id).queryKey, context.previousProject);
      }

      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to toggle favorite',
          title: 'Toggle Favorite Failed',
        });
      }
    },
    onMutate: async (id: number) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: projectKeys.favorites.queryKey });
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id).queryKey });

      // Snapshot previous values
      const previousFavorites = queryClient.getQueryData<Array<Project>>(projectKeys.favorites.queryKey);
      const previousProject = queryClient.getQueryData<Project>(projectKeys.detail(id).queryKey);

      // Optimistically update the project detail cache if present
      if (previousProject) {
        queryClient.setQueryData(projectKeys.detail(id).queryKey, {
          ...previousProject,
          isFavorite: !previousProject.isFavorite,
        });
      }

      // Optimistically update favorites list
      if (previousFavorites) {
        const isCurrentlyFavorite = previousFavorites.some((p) => p.id === id);
        if (isCurrentlyFavorite) {
          // Remove from favorites
          queryClient.setQueryData(
            projectKeys.favorites.queryKey,
            previousFavorites.filter((p) => p.id !== id)
          );
        }
        // Note: We don't add to favorites optimistically since we don't have full project data
      }

      return { previousFavorites, previousProject };
    },
    onSuccess: (project) => {
      if (project) {
        // Update detail cache with actual server response
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        // Invalidate list queries to refetch with updated favorite status
        void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
        // Invalidate favorites list to refetch
        void queryClient.invalidateQueries({ queryKey: projectKeys.favorites.queryKey });

        if (showToast) {
          toast.success({
            description: project.isFavorite ? 'Project added to favorites' : 'Project removed from favorites',
            title: project.isFavorite ? 'Added to Favorites' : 'Removed from Favorites',
          });
        }
      }
    },
  });
}

/**
 * Unarchive a project by clearing the archivedAt timestamp
 */
export function useUnarchiveProject(options?: { showToast?: boolean }) {
  const { showToast = true } = options ?? {};
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => projects.unarchive(id),
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to unarchive project',
          title: 'Unarchive Failed',
        });
      }
    },
    onSuccess: (project) => {
      if (project) {
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });

        if (showToast) {
          toast.success({
            description: 'Project unarchived',
            title: 'Project Unarchived',
          });
        }
      }
    },
  });
}

/**
 * Update an existing project
 */
export function useUpdateProject(options?: { showToast?: boolean }) {
  const { showToast = true } = options ?? {};
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof projects.update>[1]; id: number }) =>
      projects.update(id, data),
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to update project',
          title: 'Update Failed',
        });
      }
    },
    onSuccess: (project) => {
      if (project) {
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });

        if (showToast) {
          toast.success({
            description: 'Project updated successfully',
            title: 'Project Updated',
          });
        }
      }
    },
  });
}
