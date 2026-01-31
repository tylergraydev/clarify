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

      toast.success({
        description: 'Agent skill created successfully',
        title: 'Skill Created',
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
    onSuccess: (agentId) => {
      // Use targeted invalidation for the specific agent
      void queryClient.invalidateQueries({
        queryKey: agentSkillKeys.byAgent(agentId).queryKey,
      });

      toast.success({
        description: 'Agent skill deleted successfully',
        title: 'Skill Deleted',
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

      toast.success({
        description: 'Skill requirement updated successfully',
        title: 'Skill Updated',
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

      toast.success({
        description: 'Agent skill updated successfully',
        title: 'Skill Updated',
      });
    },
  });
}
