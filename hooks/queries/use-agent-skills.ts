'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewAgentSkill } from '@/types/electron';

import { agentSkillKeys } from '@/lib/queries/agent-skills';

import { useElectronDb } from '../use-electron';
import { useToast } from '../use-toast';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all skills for an agent
 */
export function useAgentSkills(agentId: number) {
  const { agentSkills, isElectron } = useElectronDb();

  return useQuery({
    ...agentSkillKeys.byAgent(agentId),
    enabled: isElectron && agentId > 0,
    queryFn: () => agentSkills.list(agentId),
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
  const { agentSkills } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: NewAgentSkill) => agentSkills.create(data),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to create skill',
        title: 'Create Skill Failed',
      });
    },
    onSuccess: () => {
      // Invalidate all byAgent queries
      void queryClient.invalidateQueries({
        queryKey: agentSkillKeys.byAgent._def,
      });
    },
  });
}

/**
 * Delete a skill
 */
export function useDeleteAgentSkill() {
  const queryClient = useQueryClient();
  const { agentSkills } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ agentId, id }: { agentId: number; id: number }) => {
      await agentSkills.delete(id);
      return agentId;
    },
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to delete skill',
        title: 'Delete Skill Failed',
      });
    },
    onSuccess: () => {
      // Invalidate all byAgent queries
      void queryClient.invalidateQueries({
        queryKey: agentSkillKeys.byAgent._def,
      });
    },
  });
}

/**
 * Set skill required status
 */
export function useSetAgentSkillRequired() {
  const queryClient = useQueryClient();
  const { agentSkills } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, required }: { id: number; required: boolean }) =>
      agentSkills.setRequired(id, required),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to update skill status',
        title: 'Update Skill Failed',
      });
    },
    onSuccess: () => {
      // Invalidate all byAgent queries
      void queryClient.invalidateQueries({
        queryKey: agentSkillKeys.byAgent._def,
      });
    },
  });
}

/**
 * Update a skill
 */
export function useUpdateAgentSkill() {
  const queryClient = useQueryClient();
  const { agentSkills } = useElectronDb();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ data, id }: { data: Partial<NewAgentSkill>; id: number }) =>
      agentSkills.update(id, data),
    onError: (error) => {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to update skill',
        title: 'Update Skill Failed',
      });
    },
    onSuccess: () => {
      // Invalidate all byAgent queries
      void queryClient.invalidateQueries({
        queryKey: agentSkillKeys.byAgent._def,
      });
    },
  });
}
