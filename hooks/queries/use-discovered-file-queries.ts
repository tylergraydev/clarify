'use client';

import { useQuery } from '@tanstack/react-query';

import { discoveredFileKeys } from '@/lib/queries/discovered-files';

import { useElectronDb } from '../use-electron';

/**
 * Get the discovery API from window.electronAPI.
 * Returns undefined if not available (e.g., in browser environment).
 */
export function getDiscoveryAPI() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.electronAPI?.discovery;
}

/**
 * Fetch all discovered files for a workflow step
 */
export function useDiscoveredFiles(stepId: number) {
  const { discovery, isElectron } = useElectronDb();

  return useQuery({
    ...discoveredFileKeys.byWorkflowStep(stepId),
    enabled: isElectron && stepId > 0,
    queryFn: () => discovery.list(stepId),
  });
}

/**
 * Fetch only included files for a workflow step
 * Filters client-side from the full list
 */
export function useIncludedFiles(stepId: number) {
  const { discovery, isElectron } = useElectronDb();

  return useQuery({
    ...discoveredFileKeys.included(stepId),
    enabled: isElectron && stepId > 0,
    queryFn: async () => {
      const files = await discovery.list(stepId);
      return files.filter((file) => file.includedAt !== null);
    },
  });
}
