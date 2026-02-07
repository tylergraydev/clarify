'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { projectKeys } from '@/lib/queries/projects';
import { repositoryKeys } from '@/lib/queries/repositories';
import { workflowKeys } from '@/lib/queries/workflows';

import { useElectronDb } from '../use-electron';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Clear the default status from a repository
 */
export function useClearDefaultRepository() {
  const queryClient = useQueryClient();
  const { repositories } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => repositories.clearDefault(id),
    onSuccess: (repository) => {
      if (repository) {
        // Update detail cache directly
        queryClient.setQueryData(repositoryKeys.detail(repository.id).queryKey, repository);
        // Invalidate list queries
        void queryClient.invalidateQueries({
          queryKey: repositoryKeys.list._def,
        });
        // Invalidate project-specific queries
        void queryClient.invalidateQueries({
          queryKey: repositoryKeys.byProject(repository.projectId).queryKey,
        });
        // Invalidate default repository query for the project
        void queryClient.invalidateQueries({
          queryKey: repositoryKeys.default(repository.projectId).queryKey,
        });
        // Invalidate project detail
        void queryClient.invalidateQueries({
          queryKey: projectKeys.detail(repository.projectId).queryKey,
        });
      }
    },
  });
}

/**
 * Create a new repository
 */
export function useCreateRepository() {
  const queryClient = useQueryClient();
  const { repositories } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof repositories.create>[0]) => repositories.create(data),
    onSuccess: (repository) => {
      // Invalidate list queries
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.list._def,
      });
      // Invalidate project-specific repository queries
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.byProject(repository.projectId).queryKey,
      });
      // Invalidate project detail (may affect project metadata)
      void queryClient.invalidateQueries({
        queryKey: projectKeys.detail(repository.projectId).queryKey,
      });
    },
  });
}

/**
 * Delete a repository
 */
export function useDeleteRepository() {
  const queryClient = useQueryClient();
  const { repositories } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => repositories.delete(id),
    onSuccess: () => {
      // Invalidate all repository queries
      void queryClient.invalidateQueries({ queryKey: repositoryKeys._def });
      // Invalidate project queries (project may need to update)
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
    },
  });
}

/**
 * Delete a repository and cancel all non-terminal workflows for its project.
 * Use this instead of useDeleteRepository when the project has active workflows.
 */
export function useDeleteRepositoryWithCleanup() {
  const queryClient = useQueryClient();
  const { repositories } = useElectronDb();

  return useMutation({
    mutationFn: (repositoryId: number) => repositories.deleteWithCleanup(repositoryId),
    onSuccess: () => {
      // Invalidate all repository queries
      void queryClient.invalidateQueries({ queryKey: repositoryKeys._def });
      // Invalidate project queries (project may need to update)
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
      // Invalidate workflow queries since workflows were cancelled
      void queryClient.invalidateQueries({ queryKey: workflowKeys._def });
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Fetch pre-delete info for a repository.
 * Returns affected non-terminal workflows that will be cancelled on deletion.
 * Only enabled when a valid repositoryId is provided and the query is explicitly enabled.
 */
export function usePreDeleteInfo(repositoryId: number, options?: { enabled?: boolean }) {
  const { isElectron, repositories } = useElectronDb();
  const enabled = options?.enabled ?? false;

  return useQuery({
    ...repositoryKeys.preDeleteInfo(repositoryId),
    enabled: isElectron && repositoryId > 0 && enabled,
    queryFn: () => repositories.preDeleteInfo(repositoryId),
  });
}

/**
 * Fetch all repositories
 */
export function useRepositories() {
  const { isElectron, repositories } = useElectronDb();

  return useQuery({
    ...repositoryKeys.list(),
    enabled: isElectron,
    queryFn: () => repositories.list(),
  });
}

/**
 * Fetch repositories filtered by project ID
 */
export function useRepositoriesByProject(projectId: number) {
  const { isElectron, repositories } = useElectronDb();

  return useQuery({
    ...repositoryKeys.byProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: () => repositories.findByProject(projectId),
  });
}

/**
 * Fetch a single repository by ID
 */
export function useRepository(id: number) {
  const { isElectron, repositories } = useElectronDb();

  return useQuery({
    ...repositoryKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => repositories.get(id),
  });
}

/**
 * Set a repository as the default for its project
 */
export function useSetDefaultRepository() {
  const queryClient = useQueryClient();
  const { repositories } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => repositories.setDefault(id),
    onSuccess: (repository) => {
      if (repository) {
        // Update detail cache directly
        queryClient.setQueryData(repositoryKeys.detail(repository.id).queryKey, repository);
        // Invalidate list queries
        void queryClient.invalidateQueries({
          queryKey: repositoryKeys.list._def,
        });
        // Invalidate project-specific queries (other repos in project may have changed)
        void queryClient.invalidateQueries({
          queryKey: repositoryKeys.byProject(repository.projectId).queryKey,
        });
        // Invalidate default repository query for the project
        void queryClient.invalidateQueries({
          queryKey: repositoryKeys.default(repository.projectId).queryKey,
        });
        // Invalidate project detail
        void queryClient.invalidateQueries({
          queryKey: projectKeys.detail(repository.projectId).queryKey,
        });
      }
    },
  });
}

/**
 * Update an existing repository
 */
export function useUpdateRepository() {
  const queryClient = useQueryClient();
  const { repositories } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof repositories.update>[1]; id: number }) =>
      repositories.update(id, data),
    onSuccess: (repository) => {
      if (repository) {
        // Update detail cache directly
        queryClient.setQueryData(repositoryKeys.detail(repository.id).queryKey, repository);
        // Invalidate list queries
        void queryClient.invalidateQueries({
          queryKey: repositoryKeys.list._def,
        });
        // Invalidate project-specific queries
        void queryClient.invalidateQueries({
          queryKey: repositoryKeys.byProject(repository.projectId).queryKey,
        });
      }
    },
  });
}
