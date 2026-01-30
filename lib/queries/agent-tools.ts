import { createQueryKeys } from '@lukemorales/query-key-factory';

/**
 * Query keys for agent tools.
 *
 * Tools are always fetched in the context of an agent (byAgent),
 * so no standalone detail or list keys are needed.
 */
export const agentToolKeys = createQueryKeys('agentTools', {
  /** All tools for a specific agent */
  byAgent: (agentId: number) => [agentId],
});
