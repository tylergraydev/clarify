'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewProject, NewRepository } from '@/types/electron';

import { agentKeys } from '@/lib/queries/agents';
import { projectKeys } from '@/lib/queries/projects';
import { repositoryKeys } from '@/lib/queries/repositories';
import { workflowKeys } from '@/lib/queries/workflows';

import { useElectron } from '../use-electron';
import { useToast } from '../use-toast';

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Add a repository to a project
 * Invalidates both project detail and repository queries
 */
export function useAddRepositoryToProject(options?: { showToast?: boolean }) {
  const { showToast = true } = options ?? {};
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ projectId, repoData }: { projectId: number; repoData: NewRepository }) =>
      api!.project.addRepo(projectId, repoData),
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to add repository',
          title: 'Add Repository Failed',
        });
      }
    },
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
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => api!.project.archive(id),
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
        // Update detail cache directly
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        // Invalidate list queries
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
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: NewProject) => {
      if (!api) {
        throw new Error('Electron API not available. Please run in Electron.');
      }
      return api.project.create(data);
    },
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to create project',
          title: 'Create Failed',
        });
      }
    },
    onSuccess: () => {
      // Invalidate list queries to show the new project
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
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => api!.project.delete(id),
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to delete project',
          title: 'Delete Failed',
        });
      }
    },
    onSuccess: () => {
      // Invalidate all project queries (removes deleted item from cache)
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
      // Also invalidate repository queries as repositories may have been deleted
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
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => api!.project.deleteHard(id),
    onError: (error) => {
      if (showToast) {
        toast.error({
          description: error instanceof Error ? error.message : 'Failed to permanently delete project',
          title: 'Delete Failed',
        });
      }
    },
    onSuccess: () => {
      // Invalidate all project queries
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
      // Invalidate related queries that may have been cascade deleted
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

// ============================================================================
// Query Hooks
// ============================================================================

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
 * Fetch all projects (including archived)
 */
export function useProjects() {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...projectKeys.list({ includeArchived: true }),
    enabled: isElectron,
    queryFn: () => api!.project.list({ includeArchived: true }),
  });
}

// ============================================================================
// Mutation Hooks (continued)
// ============================================================================

/**
 * Unarchive a project by clearing the archivedAt timestamp
 */
export function useUnarchiveProject(options?: { showToast?: boolean }) {
  const { showToast = true } = options ?? {};
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => api!.project.unarchive(id),
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
        // Update detail cache directly
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        // Invalidate list queries
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
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ data, id }: { data: Partial<NewProject>; id: number }) => api!.project.update(id, data),
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
        // Update detail cache directly
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        // Invalidate list queries
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
