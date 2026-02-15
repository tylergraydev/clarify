'use client';

import { useMemo } from 'react';

import type { Provider } from '@/lib/constants/providers';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronProviders() {
  const { api } = useElectron();

  const providers = useMemo(
    () => ({
      deleteKey: async (provider: Provider) => {
        const electronApi = throwIfNoApi(api, 'provider.deleteKey');
        return electronApi.provider.deleteKey(provider);
      },
      getKey: async (provider: Provider) => {
        if (!api) return undefined;
        return api.provider.getKey(provider);
      },
      list: async () => {
        if (!api) return [];
        return api.provider.list();
      },
      listConfigured: async () => {
        if (!api) return [];
        return api.provider.listConfigured();
      },
      setKey: async (provider: Provider, apiKey: string) => {
        const electronApi = throwIfNoApi(api, 'provider.setKey');
        return electronApi.provider.setKey(provider, apiKey);
      },
      validate: async (provider: Provider) => {
        const electronApi = throwIfNoApi(api, 'provider.validate');
        return electronApi.provider.validate(provider);
      },
    }),
    [api]
  );

  return { providers };
}
