'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AgentListFilters } from '@/types/electron';

import { agentKeys } from '@/lib/queries/agents';

import { useElectronDb } from '../use-electron';
import { useToast } from '../use-toast';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Activate an agent
 */
export function useActivateAgent() {
  const queryClient = useQueryClient();
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => agents.activate(id),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to activate agent',
        title: 'Activation Failed',
      });
    },
    onSuccess: (agent) => {
      if (agent) {
        // Update detail cache directly
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
        // Only invalidate active queries since activation status changed
        void queryClient.invalidateQueries({ queryKey: agentKeys.active._def });

        toast.success({
          description: 'Agent has been activated successfully',
          title: 'Agent Activated',
        });
      }
    },
  });
}

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
 * Copy an agent to a specific project (creates a project-scoped copy)
 */
export function useCopyAgentToProject() {
  const queryClient = useQueryClient();
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ agentId, targetProjectId }: { agentId: number; targetProjectId: number }) =>
      agents.copyToProject(agentId, targetProjectId),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to copy agent',
        title: 'Copy Failed',
      });
    },
    onSuccess: (result, variables) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? 'Failed to copy agent',
          title: 'Copy Failed',
        });
        return;
      }

      const agent = result.agent;

      // Set detail cache for the new agent
      if (agent) {
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
      }

      // Invalidate only the target project's queries since a new agent was added there
      void queryClient.invalidateQueries({
        queryKey: agentKeys.byProject(variables.targetProjectId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: agentKeys.projectScoped._def,
      });

      toast.success({
        description: 'Agent copied to project successfully',
        title: 'Agent Copied',
      });
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new agent
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof agents.create>[0]) => agents.create(data),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to create agent',
        title: 'Create Failed',
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? 'Failed to create agent',
          title: 'Create Failed',
        });
        return;
      }

      // Invalidate list queries to show the new agent
      void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });

      toast.success({
        description: 'Agent created successfully',
        title: 'Agent Created',
      });
    },
  });
}

/**
 * Create a project-specific override of a global agent
 */
export function useCreateAgentOverride() {
  const queryClient = useQueryClient();
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ agentId, projectId }: { agentId: number; projectId: number }) =>
      agents.createOverride(agentId, projectId),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to create agent override',
        title: 'Override Failed',
      });
    },
    onSuccess: (result, variables) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? 'Failed to create agent override',
          title: 'Override Failed',
        });
        return;
      }
      const agent = result.agent;

      // Set detail cache for the new override
      if (agent) {
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
      }

      // Invalidate the specific project's queries since an override was created there
      void queryClient.invalidateQueries({
        queryKey: agentKeys.byProject(variables.projectId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: agentKeys.projectScoped._def,
      });

      toast.success({
        description: 'Project override created successfully. You can now customize this agent for your project.',
        title: 'Override Created',
      });
    },
  });
}

/**
 * Deactivate an agent
 */
export function useDeactivateAgent() {
  const queryClient = useQueryClient();
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => agents.deactivate(id),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to deactivate agent',
        title: 'Deactivation Failed',
      });
    },
    onSuccess: (agent) => {
      if (agent) {
        // Update detail cache directly
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
        // Only invalidate active queries since deactivation status changed
        void queryClient.invalidateQueries({ queryKey: agentKeys.active._def });

        toast.success({
          description: 'Agent has been deactivated successfully',
          title: 'Agent Deactivated',
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
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: number; projectId?: number }) => agents.delete(id),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to delete agent',
        title: 'Delete Failed',
      });
    },
    onSuccess: (result, variables) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? 'Failed to delete agent',
          title: 'Delete Failed',
        });
        return;
      }

      // Remove the deleted agent from detail cache
      queryClient.removeQueries({
        queryKey: agentKeys.detail(variables.id).queryKey,
      });

      // Invalidate list queries to remove the deleted agent from lists
      void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });

      toast.success({
        description: 'Agent deleted successfully',
        title: 'Agent Deleted',
      });
    },
  });
}

/**
 * Duplicate an agent
 */
export function useDuplicateAgent() {
  const queryClient = useQueryClient();
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => agents.duplicate(id),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to duplicate agent',
        title: 'Duplicate Failed',
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? 'Failed to duplicate agent',
          title: 'Duplicate Failed',
        });
        return;
      }

      // Invalidate list queries to show the duplicated agent
      void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });

      toast.success({
        description: 'Agent duplicated successfully',
        title: 'Agent Duplicated',
      });
    },
  });
}

/**
 * Export a single agent to markdown format
 */
export function useExportAgent() {
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => agents.export(id),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to export agent',
        title: 'Export Failed',
      });
    },
  });
}

/**
 * Export multiple agents to markdown format in batch
 */
export function useExportAgentsBatch() {
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (ids: Array<number>) => agents.exportBatch(ids),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to export agents',
        title: 'Export Failed',
      });
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
 * Import an agent from parsed markdown data
 */
export function useImportAgent() {
  const queryClient = useQueryClient();
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof agents.import>[0]) => agents.import(data),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to import agent',
        title: 'Import Failed',
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        // Show validation errors
        const errorMessage = result.errors?.map((e) => `${e.field}: ${e.message}`).join('; ');
        toast.error({
          description: errorMessage ?? 'Failed to import agent',
          title: 'Import Failed',
        });
        return;
      }

      const agent = result.agent;

      // Set detail cache for the imported agent
      if (agent) {
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
      }

      // Invalidate list queries to show the imported agent
      void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        const warningMessage = result.warnings.map((w) => `${w.field}: ${w.message}`).join('; ');
        toast.warning({
          description: warningMessage,
          title: 'Agent Imported with Warnings',
        });
      } else {
        toast.success({
          description: 'Agent imported successfully',
          title: 'Agent Imported',
        });
      }
    },
  });
}

/**
 * Move an agent to a different project or make it global
 * @param targetProjectId - The project ID to move to, or null to make it global
 */
export function useMoveAgent() {
  const queryClient = useQueryClient();
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ agentId, targetProjectId }: { agentId: number; targetProjectId: null | number }) =>
      agents.move(agentId, targetProjectId),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to move agent',
        title: 'Move Failed',
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? 'Failed to move agent',
          title: 'Move Failed',
        });
        return;
      }

      const agent = result.agent;

      // Update detail cache with new project assignment
      if (agent) {
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
      }

      // For move operations, invalidate source and target project caches
      // Use byProject._def to invalidate all byProject queries (covers source and target)
      void queryClient.invalidateQueries({ queryKey: agentKeys.byProject._def });
      void queryClient.invalidateQueries({
        queryKey: agentKeys.projectScoped._def,
      });
      // Also invalidate global in case moving to/from global scope
      void queryClient.invalidateQueries({ queryKey: agentKeys.global._def });

      toast.success({
        description: 'Agent moved successfully',
        title: 'Agent Moved',
      });
    },
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
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: number; projectId?: number }) => agents.reset(id),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to reset agent',
        title: 'Reset Failed',
      });
    },
    onSuccess: (agent, variables) => {
      // Remove the detail cache for the reset/deleted override
      queryClient.removeQueries({
        queryKey: agentKeys.detail(variables.id).queryKey,
      });

      // Update detail cache for the returned agent (parent after reset)
      if (agent) {
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);
      }

      // For project overrides, invalidate project-specific caches
      if (variables.projectId) {
        void queryClient.invalidateQueries({
          queryKey: agentKeys.byProject(variables.projectId).queryKey,
        });
        void queryClient.invalidateQueries({
          queryKey: agentKeys.projectScoped._def,
        });
      }

      // Invalidate global queries since parent may have been reactivated
      void queryClient.invalidateQueries({ queryKey: agentKeys.global._def });

      toast.success({
        description: 'Agent reset to default successfully',
        title: 'Agent Reset',
      });
    },
  });
}

/**
 * Update an agent
 */
export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const { agents } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof agents.update>[1]; id: number }) => agents.update(id, data),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to update agent',
        title: 'Update Failed',
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error({
          description: result.error ?? 'Failed to update agent',
          title: 'Update Failed',
        });
        return;
      }
      const agent = result.agent;
      if (agent) {
        // Update detail cache directly - this is the primary optimization
        queryClient.setQueryData(agentKeys.detail(agent.id).queryKey, agent);

        // Invalidate list queries to reflect updated data in list views
        void queryClient.invalidateQueries({ queryKey: agentKeys.list._def });

        toast.success({
          description: 'Agent updated successfully',
          title: 'Agent Updated',
        });
      }
    },
  });
}
