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
        // Invalidate general list queries
        void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });
        // Invalidate active queries
        void queryClient.invalidateQueries({ queryKey: agentKeys.active._def });

        // Invalidate scope-specific queries based on whether agent has projectId
        if (agent.projectId) {
          // Invalidate project-scoped queries for this project
          void queryClient.invalidateQueries({
            queryKey: agentKeys.projectScoped._def,
          });
          void queryClient.invalidateQueries({
            queryKey: agentKeys.byProject(agent.projectId).queryKey,
          });
        } else {
          // Invalidate global queries
          void queryClient.invalidateQueries({
            queryKey: agentKeys.global._def,
          });
        }

        // Invalidate type-specific queries
        void queryClient.invalidateQueries({
          queryKey: agentKeys.byType(agent.type).queryKey,
        });
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
      const agent = result.agent;
      // Invalidate general list queries
      void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });
      // Invalidate active queries
      void queryClient.invalidateQueries({ queryKey: agentKeys.active._def });

      // Invalidate scope-specific queries based on whether agent has projectId
      if (agent?.projectId) {
        // Invalidate project-scoped queries for this project
        void queryClient.invalidateQueries({
          queryKey: agentKeys.projectScoped._def,
        });
        void queryClient.invalidateQueries({
          queryKey: agentKeys.byProject(agent.projectId).queryKey,
        });
      } else {
        // Invalidate global queries
        void queryClient.invalidateQueries({ queryKey: agentKeys.global._def });
      }

      toast.success({
        description: "Agent created successfully",
        title: "Agent Created",
      });
    },
  });
}

/**
 * Create a project-specific override of a global agent
 */
export function useCreateAgentOverride() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      agentId,
      projectId,
    }: {
      agentId: number;
      projectId: number;
    }) => api!.agent.createOverride(agentId, projectId),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error
            ? error.message
            : "Failed to create agent override",
        title: "Override Failed",
      });
    },
    onSuccess: (result, variables) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? "Failed to create agent override",
          title: "Override Failed",
        });
        return;
      }
      const agent = result.agent;

      // Invalidate general list queries
      void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });
      // Invalidate active queries
      void queryClient.invalidateQueries({ queryKey: agentKeys.active._def });
      // Invalidate global queries (source agent)
      void queryClient.invalidateQueries({ queryKey: agentKeys.global._def });
      // Invalidate project-scoped queries for the target project
      void queryClient.invalidateQueries({
        queryKey: agentKeys.projectScoped._def,
      });
      void queryClient.invalidateQueries({
        queryKey: agentKeys.byProject(variables.projectId).queryKey,
      });

      // Update detail cache if we have the agent
      if (agent) {
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
      }

      toast.success({
        description:
          "Project override created successfully. You can now customize this agent for your project.",
        title: "Override Created",
      });
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

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
          error instanceof Error ? error.message : "Failed to deactivate agent",
        title: "Deactivation Failed",
      });
    },
    onSuccess: (agent) => {
      if (agent) {
        // Update detail cache directly
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
        // Invalidate general list queries
        void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });
        // Invalidate active queries
        void queryClient.invalidateQueries({ queryKey: agentKeys.active._def });

        // Invalidate scope-specific queries based on whether agent has projectId
        if (agent.projectId) {
          // Invalidate project-scoped queries for this project
          void queryClient.invalidateQueries({
            queryKey: agentKeys.projectScoped._def,
          });
          void queryClient.invalidateQueries({
            queryKey: agentKeys.byProject(agent.projectId).queryKey,
          });
        } else {
          // Invalidate global queries
          void queryClient.invalidateQueries({
            queryKey: agentKeys.global._def,
          });
        }

        // Invalidate type-specific queries
        void queryClient.invalidateQueries({
          queryKey: agentKeys.byType(agent.type).queryKey,
        });
      }
    },
  });
}

/**
 * Delete an agent
 * @param projectId - Optional projectId to enable targeted cache invalidation.
 *                    When provided, only the specific project's cache is invalidated.
 *                    When not provided, all agent caches are invalidated.
 */
export function useDeleteAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: number; projectId?: number }) =>
      api!.agent.delete(id),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to delete agent",
        title: "Delete Failed",
      });
    },
    onSuccess: (result, variables) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? "Failed to delete agent",
          title: "Delete Failed",
        });
        return;
      }

      // Invalidate general list queries
      void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });
      // Invalidate active queries
      void queryClient.invalidateQueries({ queryKey: agentKeys.active._def });
      // Invalidate builtIn queries (in case this was related to a built-in override)
      void queryClient.invalidateQueries({
        queryKey: agentKeys.builtIn.queryKey,
      });

      // Invalidate scope-specific queries based on whether agent had projectId
      if (variables.projectId) {
        // Invalidate project-scoped queries for this project
        void queryClient.invalidateQueries({
          queryKey: agentKeys.projectScoped._def,
        });
        void queryClient.invalidateQueries({
          queryKey: agentKeys.byProject(variables.projectId).queryKey,
        });
      } else {
        // Invalidate global queries
        void queryClient.invalidateQueries({ queryKey: agentKeys.global._def });
      }

      // Remove the deleted agent from detail cache
      queryClient.removeQueries({
        queryKey: agentKeys.detail(variables.id).queryKey,
      });

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

      const agent = result.agent;

      // Invalidate general list queries
      void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });
      // Invalidate active queries
      void queryClient.invalidateQueries({ queryKey: agentKeys.active._def });

      // Invalidate scope-specific queries based on whether duplicated agent has projectId
      if (agent?.projectId) {
        // Invalidate project-scoped queries for this project
        void queryClient.invalidateQueries({
          queryKey: agentKeys.projectScoped._def,
        });
        void queryClient.invalidateQueries({
          queryKey: agentKeys.byProject(agent.projectId).queryKey,
        });
      } else {
        // Invalidate global queries
        void queryClient.invalidateQueries({ queryKey: agentKeys.global._def });
      }

      // Invalidate type-specific queries if agent exists
      if (agent) {
        void queryClient.invalidateQueries({
          queryKey: agentKeys.byType(agent.type).queryKey,
        });
      }

      toast.success({
        description: "Agent duplicated successfully",
        title: "Agent Duplicated",
      });
    },
  });
}

/**
 * Fetch global agents (agents with no projectId)
 */
export function useGlobalAgents(filters?: {
  includeDeactivated?: boolean;
  type?: string;
}) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentKeys.global(filters),
    enabled: isElectron,
    queryFn: () =>
      api!.agent.list({
        includeDeactivated: filters?.includeDeactivated,
        scope: "global",
        type: filters?.type as AgentListFilters["type"],
      }),
  });
}

/**
 * Fetch project-scoped agents for a specific project
 */
export function useProjectAgents(
  projectId: number,
  filters?: { includeDeactivated?: boolean; type?: string }
) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentKeys.projectScoped(projectId, filters),
    enabled: isElectron && projectId > 0,
    queryFn: () =>
      api!.agent.list({
        includeDeactivated: filters?.includeDeactivated,
        projectId,
        scope: "project",
        type: filters?.type as AgentListFilters["type"],
      }),
  });
}

/**
 * Reset an agent to its default configuration.
 * For project overrides, this deletes the override and activates the parent.
 * For global agents, this resets to built-in defaults.
 *
 * @param projectId - Optional projectId of the agent being reset.
 *                    When provided, enables targeted cache invalidation for project-scoped agents.
 */
export function useResetAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: number; projectId?: number }) =>
      api!.agent.reset(id),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to reset agent",
        title: "Reset Failed",
      });
    },
    onSuccess: (agent, variables) => {
      // Invalidate general list queries
      void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });
      // Invalidate active queries
      void queryClient.invalidateQueries({ queryKey: agentKeys.active._def });
      // Invalidate builtIn queries
      void queryClient.invalidateQueries({
        queryKey: agentKeys.builtIn.queryKey,
      });

      // Handle scope-specific invalidation
      // For project overrides being reset, we need to invalidate the project cache
      // The returned agent is the parent (global) agent, not the deleted override
      if (variables.projectId) {
        // Invalidate project-scoped queries for this project
        void queryClient.invalidateQueries({
          queryKey: agentKeys.projectScoped._def,
        });
        void queryClient.invalidateQueries({
          queryKey: agentKeys.byProject(variables.projectId).queryKey,
        });
        // Also invalidate global since the parent agent may have been reactivated
        void queryClient.invalidateQueries({ queryKey: agentKeys.global._def });
        // Remove the detail cache for the deleted override
        queryClient.removeQueries({
          queryKey: agentKeys.detail(variables.id).queryKey,
        });
      } else {
        // Invalidate global queries
        void queryClient.invalidateQueries({ queryKey: agentKeys.global._def });
      }

      if (agent) {
        // Update detail cache for the returned agent (parent after reset)
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
        // Invalidate type-specific queries
        void queryClient.invalidateQueries({
          queryKey: agentKeys.byType(agent.type).queryKey,
        });
      }

      toast.success({
        description: "Agent reset to default successfully",
        title: "Agent Reset",
      });
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

        // Invalidate scope-specific queries based on whether agent has projectId
        if (agent.projectId) {
          // Invalidate project-scoped queries for this project
          void queryClient.invalidateQueries({
            queryKey: agentKeys.projectScoped._def,
          });
          void queryClient.invalidateQueries({
            queryKey: agentKeys.byProject(agent.projectId).queryKey,
          });
        } else {
          // Invalidate global queries
          void queryClient.invalidateQueries({
            queryKey: agentKeys.global._def,
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
