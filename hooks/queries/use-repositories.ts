"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NewRepository } from "@/types/electron";

import { projectKeys } from "@/lib/queries/projects";
import { repositoryKeys } from "@/lib/queries/repositories";

import { useElectron } from "../use-electron";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Create a new repository
 */
export function useCreateRepository() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (data: NewRepository) => api!.repository.create(data),
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
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.repository.delete(id),
    onSuccess: () => {
      // Invalidate all repository queries
      void queryClient.invalidateQueries({ queryKey: repositoryKeys._def });
      // Invalidate project queries (project may need to update)
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
    },
  });
}

/**
 * Fetch all repositories
 */
export function useRepositories() {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...repositoryKeys.list(),
    enabled: isElectron,
    queryFn: () => api!.repository.list(),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Fetch repositories filtered by project ID
 */
export function useRepositoriesByProject(projectId: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...repositoryKeys.byProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: () => api!.repository.findByProject(projectId),
  });
}

/**
 * Fetch a single repository by ID
 */
export function useRepository(id: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...repositoryKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => api!.repository.get(id),
  });
}

/**
 * Set a repository as the default for its project
 */
export function useSetDefaultRepository() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.repository.setDefault(id),
    onSuccess: (repository) => {
      if (repository) {
        // Update detail cache directly
        queryClient.setQueryData(
          repositoryKeys.detail(repository.id).queryKey,
          repository
        );
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
  const { api } = useElectron();

  return useMutation({
    mutationFn: ({ data, id }: { data: Partial<NewRepository>; id: number }) =>
      api!.repository.update(id, data),
    onSuccess: (repository) => {
      if (repository) {
        // Update detail cache directly
        queryClient.setQueryData(
          repositoryKeys.detail(repository.id).queryKey,
          repository
        );
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
