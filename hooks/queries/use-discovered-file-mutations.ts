'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { FileDiscoveryRediscoverInput, FileDiscoveryStartInput, NewDiscoveredFile } from '@/types/electron';

import { discoveredFileKeys } from '@/lib/queries/discovered-files';
import { stepKeys } from '@/lib/queries/steps';

import { useElectronDb } from '../use-electron';
import { getDiscoveryAPI } from './use-discovered-file-queries';

/**
 * Add a new discovered file to a workflow step
 */
export function useAddDiscoveredFile() {
  const queryClient = useQueryClient();
  const { discovery } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, stepId }: { data: NewDiscoveredFile; stepId: number }) => discovery.add(stepId, data),
    onSuccess: (file) => {
      // Invalidate step-specific queries
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId).queryKey,
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
 * Cancel an active file discovery session.
 */
export function useCancelDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { sessionId: string; stepId: number }) => {
      const api = getDiscoveryAPI();
      if (!api) {
        throw new Error('Discovery API not available');
      }
      return api.cancel(input.sessionId);
    },
    onSuccess: (_outcome, input) => {
      // Invalidate discovered files for the step
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.byWorkflowStep(input.stepId).queryKey,
      });
      // Invalidate step queries to update step status
      void queryClient.invalidateQueries({
        queryKey: stepKeys._def,
      });
    },
  });
}

/**
 * Delete a discovered file from a workflow step
 */
export function useDeleteDiscoveredFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const api = getDiscoveryAPI();
      if (!api) {
        throw new Error('Discovery API not available');
      }
      return api.delete(id);
    },
    onSuccess: () => {
      // Invalidate all discovery queries since we don't have the stepId
      void queryClient.invalidateQueries({ queryKey: discoveredFileKeys._def });
    },
  });
}

/**
 * Exclude a discovered file from the workflow
 */
export function useExcludeFile() {
  const queryClient = useQueryClient();
  const { discovery } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => discovery.exclude(id),
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(discoveredFileKeys.detail(file.id).queryKey, file);
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId).queryKey,
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
 * Include a discovered file in the workflow
 */
export function useIncludeFile() {
  const queryClient = useQueryClient();
  const { discovery } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => discovery.include(id),
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(discoveredFileKeys.detail(file.id).queryKey, file);
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId).queryKey,
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
 * Re-run file discovery with a specified mode.
 * - 'additive': Add newly discovered files to existing list
 * - 'replace': Clear existing files and replace with new discoveries
 */
export function useRediscover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FileDiscoveryRediscoverInput) => {
      const api = getDiscoveryAPI();
      if (!api) {
        throw new Error('Discovery API not available');
      }
      return api.rediscover(input);
    },
    onSuccess: (_outcome, input) => {
      // Invalidate discovered files for the step
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.byWorkflowStep(input.stepId).queryKey,
      });
      // Invalidate included files query
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.included(input.stepId).queryKey,
      });
      // Invalidate step queries to update step status
      void queryClient.invalidateQueries({
        queryKey: stepKeys._def,
      });
    },
  });
}

/**
 * Start a file discovery session.
 * Returns the discovery outcome with pause information.
 */
export function useStartDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FileDiscoveryStartInput) => {
      const api = getDiscoveryAPI();
      if (!api) {
        throw new Error('Discovery API not available');
      }
      return api.start(input);
    },
    onSuccess: (_outcome, input) => {
      // Invalidate discovered files for the step
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.byWorkflowStep(input.stepId).queryKey,
      });
      // Invalidate included files query
      void queryClient.invalidateQueries({
        queryKey: discoveredFileKeys.included(input.stepId).queryKey,
      });
      // Invalidate step queries to update step status
      void queryClient.invalidateQueries({
        queryKey: stepKeys._def,
      });
    },
  });
}

/**
 * Toggle file inclusion (include if excluded, exclude if included)
 */
export function useToggleDiscoveredFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const api = getDiscoveryAPI();
      if (!api) {
        throw new Error('Discovery API not available');
      }
      return api.toggle(id);
    },
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(discoveredFileKeys.detail(file.id).queryKey, file);
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId).queryKey,
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
  const { discovery } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Partial<NewDiscoveredFile>; id: number }) => discovery.update(id, data),
    onSuccess: (file) => {
      if (file) {
        // Update detail cache directly
        queryClient.setQueryData(discoveredFileKeys.detail(file.id).queryKey, file);
        // Invalidate step-specific queries
        void queryClient.invalidateQueries({
          queryKey: discoveredFileKeys.byWorkflowStep(file.workflowStepId).queryKey,
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
