'use client';

import { useMemo } from 'react';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronSettings() {
  const { api } = useElectron();

  const settings = useMemo(
    () => ({
      bulkUpdate: async (updates: Array<{ key: string; value: string }>) => {
        const electronApi = throwIfNoApi(api, 'settings.bulkUpdate');
        return electronApi.settings.bulkUpdate(updates);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.settings.get(id);
      },
      getByCategory: async (category: string) => {
        if (!api) return [];
        return api.settings.getByCategory(category);
      },
      getByKey: async (key: string) => {
        if (!api) return undefined;
        return api.settings.getByKey(key);
      },
      list: async () => {
        if (!api) return [];
        return api.settings.list();
      },
      resetToDefault: async (key: string) => {
        const electronApi = throwIfNoApi(api, 'settings.resetToDefault');
        return electronApi.settings.resetToDefault(key);
      },
      setValue: async (key: string, value: string) => {
        const electronApi = throwIfNoApi(api, 'settings.setValue');
        return electronApi.settings.setValue(key, value);
      },
    }),
    [api]
  );

  return { settings };
}
