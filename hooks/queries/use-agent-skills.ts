'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { agentSkillKeys } from '@/lib/queries/agent-skills';
import { agentKeys } from '@/lib/queries/agents';

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
    mutationFn: (data: Parameters<typeof agentSkills.create>[0]) => agentSkills.create(data),
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
      // Invalidate agent queries that may include embedded skills
      void queryClient.invalidateQueries({
        queryKey: agentKeys.all._def,
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
      // Invalidate agent queries that may include embedded skills
      void queryClient.invalidateQueries({
        queryKey: agentKeys.all._def,
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
      // Invalidate agent queries that may include embedded skills
      void queryClient.invalidateQueries({
        queryKey: agentKeys.all._def,
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
    mutationFn: ({ data, id }: { data: Parameters<typeof agentSkills.update>[1]; id: number }) =>
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
      // Invalidate agent queries that may include embedded skills
      void queryClient.invalidateQueries({
        queryKey: agentKeys.all._def,
      });

      toast.success({
        description: 'Agent skill updated successfully',
        title: 'Skill Updated',
      });
    },
  });
}
