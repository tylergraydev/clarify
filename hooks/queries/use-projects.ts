'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewProject, NewRepository } from '@/types/electron';

import { projectKeys } from '@/lib/queries/projects';
import { repositoryKeys } from '@/lib/queries/repositories';

import { useElectron } from '../use-electron';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Add a repository to a project
 * Invalidates both project detail and repository queries
 */
export function useAddRepositoryToProject() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: ({ projectId, repoData }: { projectId: number; repoData: NewRepository }) =>
      api!.project.addRepo(projectId, repoData),
    onSuccess: (repository) => {
      // Invalidate project detail cache (project may have updated repository count)
      void queryClient.invalidateQueries({
        queryKey: projectKeys.detail(repository.projectId).queryKey,
      });
      // Invalidate project list queries
      void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
      // Invalidate all repository queries
      void queryClient.invalidateQueries({ queryKey: repositoryKeys._def });
      // Specifically invalidate byProject queries for this project
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.byProject(repository.projectId).queryKey,
      });
    },
  });
}

/**
 * Archive a project by setting archivedAt to current timestamp
 */
export function useArchiveProject() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.project.update(id, { archivedAt: new Date().toISOString() }),
    onSuccess: (project) => {
      if (project) {
        // Update detail cache directly
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        // Invalidate list queries
        void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
      }
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: async (data: NewProject) => {
      if (!api) {
        throw new Error('Electron API not available. Please run in Electron.');
      }
      return api.project.create(data);
    },
    onSuccess: () => {
      // Invalidate list queries to show the new project
      void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.project.delete(id),
    onSuccess: () => {
      // Invalidate all project queries (removes deleted item from cache)
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
      // Also invalidate repository queries as repositories may have been deleted
      void queryClient.invalidateQueries({ queryKey: repositoryKeys._def });
    },
  });
}

/**
 * Fetch a single project by ID
 */
export function useProject(id: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...projectKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => api!.project.get(id),
  });
}

/**
 * Fetch all projects
 */
export function useProjects() {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...projectKeys.list(),
    enabled: isElectron,
    queryFn: () => api!.project.list(),
  });
}

/**
 * Unarchive a project by clearing the archivedAt timestamp
 */
export function useUnarchiveProject() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.project.update(id, { archivedAt: null }),
    onSuccess: (project) => {
      if (project) {
        // Update detail cache directly
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        // Invalidate list queries
        void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
      }
    },
  });
}

/**
 * Update an existing project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: ({ data, id }: { data: Partial<NewProject>; id: number }) => api!.project.update(id, data),
    onSuccess: (project) => {
      if (project) {
        // Update detail cache directly
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        // Invalidate list queries
        void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
      }
    },
  });
}
