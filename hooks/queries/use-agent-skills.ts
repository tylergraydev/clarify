'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewAgentSkill } from '@/types/electron';

import { agentSkillKeys } from '@/lib/queries/agent-skills';

import { useElectron } from '../use-electron';
import { useToast } from '../use-toast';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all skills for an agent
 */
export function useAgentSkills(agentId: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...agentSkillKeys.byAgent(agentId),
    enabled: isElectron && agentId > 0,
    queryFn: async () => {
      if (!api) throw new Error('API not available');
      return api.agentSkill.list(agentId);
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new skill for an agent
 */
export function useCreateAgentSkill() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: NewAgentSkill) => {
      if (!api) throw new Error('API not available');
      return api.agentSkill.create(data);
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to create skill',
        title: 'Create Skill Failed',
      });
    },
    onSuccess: (skill) => {
      if (skill) {
        // Invalidate the agent's skills list
        void queryClient.invalidateQueries({
          queryKey: agentSkillKeys.byAgent(skill.agentId).queryKey,
        });
      }
    },
  });
}

/**
 * Delete a skill
 */
export function useDeleteAgentSkill() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ agentId, id }: { agentId: number; id: number }) => {
      if (!api) throw new Error('API not available');
      await api.agentSkill.delete(id);
      return agentId;
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to delete skill',
        title: 'Delete Skill Failed',
      });
    },
    onSuccess: (agentId) => {
      // Invalidate the agent's skills list
      void queryClient.invalidateQueries({
        queryKey: agentSkillKeys.byAgent(agentId).queryKey,
      });
    },
  });
}

/**
 * Set skill required status
 */
export function useSetAgentSkillRequired() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, required }: { id: number; required: boolean }) => {
      if (!api) throw new Error('API not available');
      return api.agentSkill.setRequired(id, required);
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to update skill status',
        title: 'Update Skill Failed',
      });
    },
    onSuccess: (skill) => {
      if (skill) {
        // Invalidate the agent's skills list
        void queryClient.invalidateQueries({
          queryKey: agentSkillKeys.byAgent(skill.agentId).queryKey,
        });
      }
    },
  });
}

/**
 * Update a skill
 */
export function useUpdateAgentSkill() {
  const queryClient = useQueryClient();
  const { api } = useElectron();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ data, id }: { data: Partial<NewAgentSkill>; id: number }) => {
      if (!api) throw new Error('API not available');
      return api.agentSkill.update(id, data);
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to update skill',
        title: 'Update Skill Failed',
      });
    },
    onSuccess: (skill) => {
      if (skill) {
        // Invalidate the agent's skills list
        void queryClient.invalidateQueries({
          queryKey: agentSkillKeys.byAgent(skill.agentId).queryKey,
        });
      }
    },
  });
}
