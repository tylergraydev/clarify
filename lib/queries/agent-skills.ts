import { createQueryKeys } from "@lukemorales/query-key-factory";

/**
 * Query keys for agent skills.
 *
 * Skills are always fetched in the context of an agent (byAgent),
 * so no standalone detail or list keys are needed.
 */
export const agentSkillKeys = createQueryKeys("agentSkills", {
  /** All skills for a specific agent */
  byAgent: (agentId: number) => [agentId],
});
