'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Provider } from '@/lib/constants/providers';

import { providerKeys } from '@/lib/queries/providers';

import { useElectronDb } from '../use-electron';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch only configured providers.
 */
export function useConfiguredProviders() {
  const { isElectron, providers } = useElectronDb();

  return useQuery({
    ...providerKeys.configured,
    enabled: isElectron,
    queryFn: () => providers.listConfigured(),
  });
}

/**
 * Delete an API key for a provider.
 */
export function useDeleteProviderKey() {
  const queryClient = useQueryClient();
  const { providers } = useElectronDb();

  return useMutation({
    mutationFn: (provider: Provider) => providers.deleteKey(provider),
    onSuccess: (_result, provider) => {
      void queryClient.invalidateQueries({ queryKey: providerKeys.list.queryKey });
      void queryClient.invalidateQueries({ queryKey: providerKeys.configured.queryKey });
      void queryClient.invalidateQueries({ queryKey: providerKeys.maskedKey(provider).queryKey });
    },
  });
}

/**
 * Fetch the masked API key for a specific provider.
 */
export function useProviderKey(provider: Provider) {
  const { isElectron, providers } = useElectronDb();

  return useQuery({
    ...providerKeys.maskedKey(provider),
    enabled: isElectron && Boolean(provider),
    queryFn: () => providers.getKey(provider),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Fetch all providers with their configuration status.
 */
export function useProviders() {
  const { isElectron, providers } = useElectronDb();

  return useQuery({
    ...providerKeys.list,
    enabled: isElectron,
    queryFn: () => providers.list(),
  });
}

/**
 * Set an API key for a provider.
 */
export function useSetProviderKey() {
  const queryClient = useQueryClient();
  const { providers } = useElectronDb();

  return useMutation({
    mutationFn: ({ apiKey, provider }: { apiKey: string; provider: Provider }) => providers.setKey(provider, apiKey),
    onSuccess: (_result, { provider }) => {
      void queryClient.invalidateQueries({ queryKey: providerKeys.list.queryKey });
      void queryClient.invalidateQueries({ queryKey: providerKeys.configured.queryKey });
      void queryClient.invalidateQueries({ queryKey: providerKeys.maskedKey(provider).queryKey });
    },
  });
}

/**
 * Validate a provider's API key.
 */
export function useValidateProvider() {
  const { providers } = useElectronDb();

  return useMutation({
    mutationFn: (provider: Provider) => providers.validate(provider),
  });
}
