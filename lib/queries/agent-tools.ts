import { createQueryKeys } from "@lukemorales/query-key-factory";

export const agentToolKeys = createQueryKeys("agentTools", {
  byAgent: (agentId: number) => [agentId],
  detail: (id: number) => [id],
});
