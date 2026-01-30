"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NewAgentTool } from "@/types/electron";

import { agentToolKeys } from "@/lib/queries/agent-tools";

import { useElectron } from "../use-electron";

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
    queryFn: () => api!.agentTool.list(agentId),
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

  return useMutation({
    mutationFn: (id: number) => api!.agentTool.allow(id),
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

  return useMutation({
    mutationFn: (data: NewAgentTool) => api!.agentTool.create(data),
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

  return useMutation({
    mutationFn: ({ agentId, id }: { agentId: number; id: number }) =>
      api!.agentTool.delete(id).then(() => agentId),
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

  return useMutation({
    mutationFn: (id: number) => api!.agentTool.disallow(id),
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

  return useMutation({
    mutationFn: ({ data, id }: { data: Partial<NewAgentTool>; id: number }) =>
      api!.agentTool.update(id, data),
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
