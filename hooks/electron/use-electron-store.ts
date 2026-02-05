'use client';

import { useCallback } from 'react';

import { useElectron } from './use-electron-base';

export function useElectronStore() {
  const { api, isElectron } = useElectron();

  const get = useCallback(
    async <T>(key: string): Promise<T | undefined> => {
      if (!api) return undefined;
      return api.store.get<T>(key);
    },
    [api]
  );

  const set = useCallback(
    async (key: string, value: unknown): Promise<boolean> => {
      if (!api) return false;
      return api.store.set(key, value);
    },
    [api]
  );

  const remove = useCallback(
    async (key: string): Promise<boolean> => {
      if (!api) return false;
      return api.store.delete(key);
    },
    [api]
  );

  return {
    get,
    isElectron,
    remove,
    set,
  };
}
