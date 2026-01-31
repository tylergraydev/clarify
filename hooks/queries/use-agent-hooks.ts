'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { agentHookKeys } from '@/lib/queries/agent-hooks';

import { useElectronDb } from '../use-electron';
import { useToast } from '../use-toast';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all hooks for an agent
 */
export function useAgentHooks(agentId: number) {
  const { agentHooks, isElectron } = useElectronDb();

  return useQuery({
    ...agentHookKeys.byAgent(agentId),
    enabled: isElectron && agentId > 0,
    queryFn: () => agentHooks.list(agentId),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new hook for an agent
 */
export function useCreateAgentHook() {
  const queryClient = useQueryClient();
  const { agentHooks } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof agentHooks.create>[0]) => agentHooks.create(data),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to create hook',
        title: 'Create Hook Failed',
      });
    },
    onSuccess: () => {
      // Invalidate all byAgent queries
      void queryClient.invalidateQueries({
        queryKey: agentHookKeys.byAgent._def,
      });

      toast.success({
        description: 'Agent hook created successfully',
        title: 'Hook Created',
      });
    },
  });
}

/**
 * Delete a hook
 */
export function useDeleteAgentHook() {
  const queryClient = useQueryClient();
  const { agentHooks } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ agentId, id }: { agentId: number; id: number }) => {
      await agentHooks.delete(id);
      return agentId;
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to delete hook',
        title: 'Delete Hook Failed',
      });
    },
    onSuccess: (agentId) => {
      // Use targeted invalidation for the specific agent
      void queryClient.invalidateQueries({
        queryKey: agentHookKeys.byAgent(agentId).queryKey,
      });

      toast.success({
        description: 'Agent hook deleted successfully',
        title: 'Hook Deleted',
      });
    },
  });
}

/**
 * Update a hook
 */
export function useUpdateAgentHook() {
  const queryClient = useQueryClient();
  const { agentHooks } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof agentHooks.update>[1]; id: number }) =>
      agentHooks.update(id, data),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to update hook',
        title: 'Update Hook Failed',
      });
    },
    onSuccess: () => {
      // Invalidate all byAgent queries
      void queryClient.invalidateQueries({
        queryKey: agentHookKeys.byAgent._def,
      });

      toast.success({
        description: 'Agent hook updated successfully',
        title: 'Hook Updated',
      });
    },
  });
}
