"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AgentListFilters, NewAgent } from "@/types/electron";

import { agentKeys } from "@/lib/queries/agents";

import { useElectron } from "../use-electron";
import { useToast } from "../use-toast";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Activate an agent
 */
export function useActivateAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => api!.agent.activate(id),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to activate agent",
        title: "Activation Failed",
      });
    },
    onSuccess: (agent) => {
      if (agent) {
        // Update detail cache directly
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
        // Invalidate all agent queries to refresh lists
        void queryClient.invalidateQueries({ queryKey: agentKeys._def });
      }
    },
  });
}

/**
 * Fetch active agents, optionally filtered by project
 */
export function useActiveAgents(projectId?: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentKeys.active(projectId),
    enabled: isElectron,
    queryFn: () =>
      api!.agent.list({
        includeDeactivated: false,
        projectId,
      }),
  });
}

/**
 * Fetch a single agent by ID
 */
export function useAgent(id: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => api!.agent.get(id),
  });
}

/**
 * Fetch all agents with optional filters
 */
export function useAgents(filters?: AgentListFilters) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentKeys.list(filters),
    enabled: isElectron,
    queryFn: () => api!.agent.list(filters),
  });
}

/**
 * Fetch agents filtered by project ID
 */
export function useAgentsByProject(projectId: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentKeys.byProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: () => api!.agent.list({ projectId }),
  });
}

/**
 * Fetch agents filtered by type
 */
export function useAgentsByType(type: "planning" | "review" | "specialist") {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentKeys.byType(type),
    enabled: isElectron && Boolean(type),
    queryFn: () => api!.agent.list({ type }),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Fetch built-in agents
 */
export function useBuiltInAgents() {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentKeys.builtIn,
    enabled: isElectron,
    queryFn: async () => {
      const agents = await api!.agent.list();
      // Agent is built-in if builtInAt is not null
      return agents.filter((agent) => agent.builtInAt !== null);
    },
  });
}

/**
 * Create a new agent
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: NewAgent) => api!.agent.create(data),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to create agent",
        title: "Create Failed",
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? "Failed to create agent",
          title: "Create Failed",
        });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: agentKeys._def });
      toast.success({
        description: "Agent created successfully",
        title: "Agent Created",
      });
    },
  });
}

/**
 * Deactivate an agent
 */
export function useDeactivateAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => api!.agent.deactivate(id),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error
            ? error.message
            : "Failed to deactivate agent",
        title: "Deactivation Failed",
      });
    },
    onSuccess: (agent) => {
      if (agent) {
        // Update detail cache directly
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
        // Invalidate all agent queries to refresh lists
        void queryClient.invalidateQueries({ queryKey: agentKeys._def });
      }
    },
  });
}

/**
 * Delete an agent
 */
export function useDeleteAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => api!.agent.delete(id),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to delete agent",
        title: "Delete Failed",
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? "Failed to delete agent",
          title: "Delete Failed",
        });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: agentKeys._def });
      toast.success({
        description: "Agent deleted successfully",
        title: "Agent Deleted",
      });
    },
  });
}

/**
 * Duplicate an agent
 */
export function useDuplicateAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => api!.agent.duplicate(id),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to duplicate agent",
        title: "Duplicate Failed",
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? "Failed to duplicate agent",
          title: "Duplicate Failed",
        });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: agentKeys._def });
      toast.success({
        description: "Agent duplicated successfully",
        title: "Agent Duplicated",
      });
    },
  });
}

/**
 * Reset an agent to its default configuration
 */
export function useResetAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => api!.agent.reset(id),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to reset agent",
        title: "Reset Failed",
      });
    },
    onSuccess: (agent) => {
      if (agent) {
        // Update detail cache directly
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
        // Invalidate all agent queries to refresh all views
        void queryClient.invalidateQueries({ queryKey: agentKeys._def });
        toast.success({
          description: "Agent reset to default successfully",
          title: "Agent Reset",
        });
      }
    },
  });
}

/**
 * Update an agent
 */
export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ data, id }: { data: Partial<NewAgent>; id: number }) =>
      api!.agent.update(id, data),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to update agent",
        title: "Update Failed",
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? "Failed to update agent",
          title: "Update Failed",
        });
        return;
      }
      const agent = result.agent;
      if (agent) {
        // Update detail cache directly
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
        // Invalidate list queries
        void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });
        // Invalidate active queries
        void queryClient.invalidateQueries({ queryKey: agentKeys.active._def });
        // Invalidate project-specific queries if agent has projectId
        if (agent.projectId) {
          void queryClient.invalidateQueries({
            queryKey: agentKeys.byProject(agent.projectId).queryKey,
          });
        }
        // Invalidate type-specific queries
        void queryClient.invalidateQueries({
          queryKey: agentKeys.byType(agent.type).queryKey,
        });
        toast.success({
          description: "Agent updated successfully",
          title: "Agent Updated",
        });
      }
    },
  });
}
