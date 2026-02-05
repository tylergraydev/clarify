'use client';

import { useQuery } from '@tanstack/react-query';

import type { AgentListFilters } from '@/types/electron';

import { agentKeys } from '@/lib/queries/agents';

import { useElectronDb } from '../use-electron';

/**
 * Fetch active agents, optionally filtered by project
 */
export function useActiveAgents(projectId?: number) {
  const { agents, isElectron } = useElectronDb();

  return useQuery({
    ...agentKeys.active(projectId),
    enabled: isElectron,
    queryFn: () =>
      agents.list({
        includeDeactivated: false,
        projectId,
      }),
  });
}

/**
 * Fetch a single agent by ID
 */
export function useAgent(id: number) {
  const { agents, isElectron } = useElectronDb();

  return useQuery({
    ...agentKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => agents.get(id),
  });
}

/**
 * Fetch all agents with optional filters
 */
export function useAgents(filters?: AgentListFilters) {
  const { agents, isElectron } = useElectronDb();

  return useQuery({
    ...agentKeys.list(filters),
    enabled: isElectron,
    queryFn: () => agents.list(filters),
  });
}

/**
 * Fetch agents filtered by project ID
 */
export function useAgentsByProject(projectId: number) {
  const { agents, isElectron } = useElectronDb();

  return useQuery({
    ...agentKeys.byProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: () => agents.list({ projectId }),
  });
}

/**
 * Fetch agents filtered by type
 */
export function useAgentsByType(type: 'planning' | 'review' | 'specialist') {
  const { agents, isElectron } = useElectronDb();

  return useQuery({
    ...agentKeys.byType(type),
    enabled: isElectron && Boolean(type),
    queryFn: () => agents.list({ type }),
  });
}

/**
 * Fetch all agents regardless of project scope (for unified table view)
 */
export function useAllAgents(filters?: {
  includeBuiltIn?: boolean;
  includeDeactivated?: boolean;
  includeHooks?: boolean;
  includeSkills?: boolean;
  includeTools?: boolean;
}) {
  const { agents, isElectron } = useElectronDb();

  return useQuery({
    ...agentKeys.all(filters),
    enabled: isElectron,
    queryFn: () =>
      agents.list({
        includeDeactivated: filters?.includeDeactivated,
        includeHooks: filters?.includeHooks,
        includeSkills: filters?.includeSkills,
        includeTools: filters?.includeTools,
      }),
  });
}

/**
 * Fetch built-in agents
 */
export function useBuiltInAgents() {
  const { agents, isElectron } = useElectronDb();

  return useQuery({
    ...agentKeys.builtIn,
    enabled: isElectron,
    queryFn: async () => {
      const allAgents = await agents.list();
      // Agent is built-in if builtInAt is not null
      return allAgents.filter((agent) => agent.builtInAt !== null);
    },
  });
}

/**
 * Fetch global agents (agents with no projectId)
 */
export function useGlobalAgents(filters?: { includeDeactivated?: boolean; type?: string }) {
  const { agents, isElectron } = useElectronDb();

  return useQuery({
    ...agentKeys.global(filters),
    enabled: isElectron,
    queryFn: () =>
      agents.list({
        includeDeactivated: filters?.includeDeactivated,
        scope: 'global',
        type: filters?.type as AgentListFilters['type'],
      }),
  });
}

/**
 * Fetch project-scoped agents for a specific project
 */
export function useProjectAgents(projectId: number, filters?: { includeDeactivated?: boolean; type?: string }) {
  const { agents, isElectron } = useElectronDb();

  return useQuery({
    ...agentKeys.projectScoped(projectId, filters),
    enabled: isElectron && projectId > 0,
    queryFn: () =>
      agents.list({
        includeDeactivated: filters?.includeDeactivated,
        projectId,
        scope: 'project',
        type: filters?.type as AgentListFilters['type'],
      }),
  });
}
