import { createQueryKeys } from '@lukemorales/query-key-factory';

/**
 * Query keys for agent hooks.
 *
 * Hooks are always fetched in the context of an agent (byAgent),
 * so no standalone detail or list keys are needed.
 */
export const agentHookKeys = createQueryKeys('agentHooks', {
  /** All hooks for a specific agent */
  byAgent: (agentId: number) => [agentId],
});
