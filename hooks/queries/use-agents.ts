'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewAgent } from '@/types/electron';

import { agentKeys } from '@/lib/queries/agents';

import { useElectron } from '../use-electron';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Activate an agent
 */
export function useActivateAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.agent.activate(id),
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
    queryFn: async () => {
      const agents = await api!.agent.list();
      return agents.filter((agent) => {
        // Agent is active if deactivatedAt is null
        if (agent.deactivatedAt !== null) return false;
        if (projectId && agent.projectId !== projectId) return false;
        return true;
      });
    },
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
 * Fetch all agents
 */
export function useAgents(filters?: { includeDeactivated?: boolean; projectId?: number; type?: string }) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentKeys.list(filters),
    enabled: isElectron,
    queryFn: async () => {
      const agents = await api!.agent.list();
      // Apply client-side filtering since API returns all agents
      return agents.filter((agent) => {
        // Agent is active if deactivatedAt is null
        if (!filters?.includeDeactivated && agent.deactivatedAt !== null) {
          return false;
        }
        if (filters?.projectId && agent.projectId !== filters.projectId) {
          return false;
        }
        if (filters?.type && agent.type !== filters.type) {
          return false;
        }
        return true;
      });
    },
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
    queryFn: async () => {
      const agents = await api!.agent.list();
      return agents.filter((agent) => agent.projectId === projectId);
    },
  });
}

/**
 * Fetch agents filtered by type
 */
export function useAgentsByType(type: string) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentKeys.byType(type),
    enabled: isElectron && Boolean(type),
    queryFn: async () => {
      const agents = await api!.agent.list();
      return agents.filter((agent) => agent.type === type);
    },
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
 * Deactivate an agent
 */
export function useDeactivateAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.agent.deactivate(id),
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
 * Reset an agent to its default configuration
 */
export function useResetAgent() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.agent.reset(id),
    onSuccess: (agent) => {
      if (agent) {
        // Update detail cache directly
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
        // Invalidate all agent queries to refresh all views
        void queryClient.invalidateQueries({ queryKey: agentKeys._def });
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

  return useMutation({
    mutationFn: ({ data, id }: { data: Partial<NewAgent>; id: number }) =>
      api!.agent.update(id, data),
    onSuccess: (agent) => {
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
      }
    },
  });
}
