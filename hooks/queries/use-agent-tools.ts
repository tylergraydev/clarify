'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewAgentTool } from '@/types/electron';

import { agentToolKeys } from '@/lib/queries/agent-tools';

import { useElectron } from '../use-electron';
import { useToast } from '../use-toast';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all tools for an agent
 */
export function useAgentTools(agentId: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentToolKeys.byAgent(agentId),
    enabled: isElectron && agentId > 0,
    queryFn: async () => {
      if (!api) throw new Error('API not available');
      return api.agentTool.list(agentId);
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Allow a tool (clear disallowedAt)
 */
export function useAllowAgentTool() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      if (!api) throw new Error('API not available');
      return api.agentTool.allow(id);
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to allow tool',
        title: 'Allow Tool Failed',
      });
    },
    onSuccess: (tool) => {
      if (tool) {
        // Invalidate the agent's tools list
        void queryClient.invalidateQueries({
          queryKey: agentToolKeys.byAgent(tool.agentId).queryKey,
        });
      }
    },
  });
}

/**
 * Create a new tool for an agent
 */
export function useCreateAgentTool() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: NewAgentTool) => {
      if (!api) throw new Error('API not available');
      return api.agentTool.create(data);
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to create tool',
        title: 'Create Tool Failed',
      });
    },
    onSuccess: (tool) => {
      if (tool) {
        // Invalidate the agent's tools list
        void queryClient.invalidateQueries({
          queryKey: agentToolKeys.byAgent(tool.agentId).queryKey,
        });
      }
    },
  });
}

/**
 * Delete a tool
 */
export function useDeleteAgentTool() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ agentId, id }: { agentId: number; id: number }) => {
      if (!api) throw new Error('API not available');
      await api.agentTool.delete(id);
      return agentId;
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to delete tool',
        title: 'Delete Tool Failed',
      });
    },
    onSuccess: (agentId) => {
      // Invalidate the agent's tools list
      void queryClient.invalidateQueries({
        queryKey: agentToolKeys.byAgent(agentId).queryKey,
      });
    },
  });
}

/**
 * Disallow a tool (set disallowedAt)
 */
export function useDisallowAgentTool() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      if (!api) throw new Error('API not available');
      return api.agentTool.disallow(id);
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to disallow tool',
        title: 'Disallow Tool Failed',
      });
    },
    onSuccess: (tool) => {
      if (tool) {
        // Invalidate the agent's tools list
        void queryClient.invalidateQueries({
          queryKey: agentToolKeys.byAgent(tool.agentId).queryKey,
        });
      }
    },
  });
}

/**
 * Update a tool
 */
export function useUpdateAgentTool() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ data, id }: { data: Partial<NewAgentTool>; id: number }) => {
      if (!api) throw new Error('API not available');
      return api.agentTool.update(id, data);
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to update tool',
        title: 'Update Tool Failed',
      });
    },
    onSuccess: (tool) => {
      if (tool) {
        // Invalidate the agent's tools list
        void queryClient.invalidateQueries({
          queryKey: agentToolKeys.byAgent(tool.agentId).queryKey,
        });
      }
    },
  });
}
