'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { settingKeys } from '@/lib/queries/settings';

import { useElectronDb } from '../use-electron';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CLARIFICATION_AGENT_KEY = 'defaultClarificationAgentId';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch the default clarification agent ID setting.
 * Returns the agent ID as a number or null if not set.
 */
export function useDefaultClarificationAgent() {
  const { isElectron, settings } = useElectronDb();

  const query = useQuery({
    ...settingKeys.byKey(DEFAULT_CLARIFICATION_AGENT_KEY),
    enabled: isElectron,
    queryFn: () => settings.getByKey(DEFAULT_CLARIFICATION_AGENT_KEY),
  });

  // Parse the setting value to a number or null
  const agentId = query.data?.value ? parseInt(query.data.value, 10) : null;
  const validAgentId = agentId !== null && !isNaN(agentId) ? agentId : null;

  return {
    agentId: validAgentId,
    error: query.error,
    isLoading: query.isLoading,
  };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Mutation to set the default clarification agent.
 * Pass an agent ID to set, or null to clear the default.
 */
export function useSetDefaultClarificationAgent() {
  const queryClient = useQueryClient();
  const { settings } = useElectronDb();

  return useMutation({
    mutationFn: (agentId: null | number) =>
      settings.setValue(DEFAULT_CLARIFICATION_AGENT_KEY, agentId?.toString() ?? ''),
    onSuccess: (setting) => {
      if (setting) {
        // Update the cache directly for immediate feedback
        queryClient.setQueryData(settingKeys.byKey(DEFAULT_CLARIFICATION_AGENT_KEY).queryKey, setting);
        // Invalidate settings queries to ensure consistency
        void queryClient.invalidateQueries({ queryKey: settingKeys.list._def });
      }
    },
  });
}
