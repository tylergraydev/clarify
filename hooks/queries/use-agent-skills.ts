"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NewAgentSkill } from "@/types/electron";

import { agentSkillKeys } from "@/lib/queries/agent-skills";

import { useElectron } from "../use-electron";
import { useToast } from "../use-toast";

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
    queryFn: () => api!.agentSkill.list(agentId),
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
    mutationFn: (data: NewAgentSkill) => api!.agentSkill.create(data),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to create skill",
        title: "Create Skill Failed",
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
    mutationFn: ({ agentId, id }: { agentId: number; id: number }) =>
      api!.agentSkill.delete(id).then(() => agentId),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to delete skill",
        title: "Delete Skill Failed",
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
    mutationFn: ({ id, required }: { id: number; required: boolean }) =>
      api!.agentSkill.setRequired(id, required),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error
            ? error.message
            : "Failed to update skill status",
        title: "Update Skill Failed",
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
    mutationFn: ({ data, id }: { data: Partial<NewAgentSkill>; id: number }) =>
      api!.agentSkill.update(id, data),
    onError: (error) => {
      toast.error({
        description:
          error instanceof Error ? error.message : "Failed to update skill",
        title: "Update Skill Failed",
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
