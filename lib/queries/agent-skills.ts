import { createQueryKeys } from "@lukemorales/query-key-factory";

export const agentSkillKeys = createQueryKeys("agentSkills", {
  byAgent: (agentId: number) => [agentId],
  detail: (id: number) => [id],
});
