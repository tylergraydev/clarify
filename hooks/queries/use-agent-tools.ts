'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { agentToolKeys } from '@/lib/queries/agent-tools';

import { useElectronDb } from '../use-electron';
import { useToast } from '../use-toast';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all tools for an agent
 */
export function useAgentTools(agentId: number) {
  const { agentTools, isElectron } = useElectronDb();

  return useQuery({
    ...agentToolKeys.byAgent(agentId),
    enabled: isElectron && agentId > 0,
    queryFn: () => agentTools.list(agentId),
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
  const { agentTools } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => agentTools.allow(id),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to allow tool',
        title: 'Allow Tool Failed',
      });
    },
    onSuccess: () => {
      // Invalidate all byAgent queries
      void queryClient.invalidateQueries({
        queryKey: agentToolKeys.byAgent._def,
      });

      toast.success({
        description: 'Tool has been allowed',
        title: 'Tool Allowed',
      });
    },
  });
}

/**
 * Create a new tool for an agent
 */
export function useCreateAgentTool() {
  const queryClient = useQueryClient();
  const { agentTools } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof agentTools.create>[0]) => agentTools.create(data),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to create tool',
        title: 'Create Tool Failed',
      });
    },
    onSuccess: () => {
      // Invalidate all byAgent queries
      void queryClient.invalidateQueries({
        queryKey: agentToolKeys.byAgent._def,
      });

      toast.success({
        description: 'Agent tool created successfully',
        title: 'Tool Created',
      });
    },
  });
}

/**
 * Delete a tool
 */
export function useDeleteAgentTool() {
  const queryClient = useQueryClient();
  const { agentTools } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ agentId, id }: { agentId: number; id: number }) => {
      await agentTools.delete(id);
      return agentId;
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to delete tool',
        title: 'Delete Tool Failed',
      });
    },
    onSuccess: (agentId) => {
      // Use targeted invalidation for the specific agent
      void queryClient.invalidateQueries({
        queryKey: agentToolKeys.byAgent(agentId).queryKey,
      });

      toast.success({
        description: 'Agent tool deleted successfully',
        title: 'Tool Deleted',
      });
    },
  });
}

/**
 * Disallow a tool (set disallowedAt)
 */
export function useDisallowAgentTool() {
  const queryClient = useQueryClient();
  const { agentTools } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => agentTools.disallow(id),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to disallow tool',
        title: 'Disallow Tool Failed',
      });
    },
    onSuccess: () => {
      // Invalidate all byAgent queries
      void queryClient.invalidateQueries({
        queryKey: agentToolKeys.byAgent._def,
      });

      toast.success({
        description: 'Tool has been disallowed',
        title: 'Tool Disallowed',
      });
    },
  });
}

/**
 * Update a tool
 */
export function useUpdateAgentTool() {
  const queryClient = useQueryClient();
  const { agentTools } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof agentTools.update>[1]; id: number }) =>
      agentTools.update(id, data),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to update tool',
        title: 'Update Tool Failed',
      });
    },
    onSuccess: () => {
      // Invalidate all byAgent queries
      void queryClient.invalidateQueries({
        queryKey: agentToolKeys.byAgent._def,
      });

      toast.success({
        description: 'Agent tool updated successfully',
        title: 'Tool Updated',
      });
    },
  });
}
