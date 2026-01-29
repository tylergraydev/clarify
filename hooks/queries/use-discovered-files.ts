"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NewDiscoveredFile } from "@/types/electron";

import { discoveredFileKeys } from "@/lib/queries/discovered-files";

import { useElectron } from "../use-electron";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Add a new discovered file to a workflow step
 */
export function useAddDiscoveredFile() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: ({
      data,
      stepId,
    }: {
      data: NewDiscoveredFile;
      stepId: number;
    }) => api!.discovery.add(stepId, data),
    onSuccess: (file) => {
      // Invalidate step-specific queries
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId)
          .queryKey,
      });
      // Invalidate included files query
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.included(file.workflowStepId).queryKey,
      });
      // Invalidate general list queries
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.list._def,
      });
    },
  });
}

/**
 * Fetch all discovered files for a workflow step
 */
export function useDiscoveredFiles(stepId: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...discoveredFileKeys.byWorkflowStep(stepId),
    enabled: isElectron && stepId > 0,
    queryFn: () => api!.discovery.list(stepId),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Exclude a discovered file from the workflow
 */
export function useExcludeFile() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.discovery.exclude(id),
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(
          discoveredFileKeys.detail(file.id).queryKey,
          file
        );
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId)
            .queryKey,
        });
        // Invalidate included files query
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.included(file.workflowStepId).queryKey,
        });
      }
    },
  });
}

/**
 * Fetch only included files for a workflow step
 * Filters client-side from the full list
 */
export function useIncludedFiles(stepId: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...discoveredFileKeys.included(stepId),
    enabled: isElectron && stepId > 0,
    queryFn: async () => {
      const files = await api!.discovery.list(stepId);
      return files.filter((file) => file.includedAt !== null);
    },
  });
}

/**
 * Include a discovered file in the workflow
 */
export function useIncludeFile() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.discovery.include(id),
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(
          discoveredFileKeys.detail(file.id).queryKey,
          file
        );
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId)
            .queryKey,
        });
        // Invalidate included files query
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.included(file.workflowStepId).queryKey,
        });
      }
    },
  });
}

/**
 * Update discovered files (batch operation)
 */
export function useUpdateDiscoveredFile() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: ({
      data,
      id,
    }: {
      data: Partial<NewDiscoveredFile>;
      id: number;
    }) => api!.discovery.update(id, data),
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(
          discoveredFileKeys.detail(file.id).queryKey,
          file
        );
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId)
            .queryKey,
        });
        // Invalidate included files query
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.included(file.workflowStepId).queryKey,
        });
        // Invalidate general list queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.list._def,
        });
      }
    },
  });
}
