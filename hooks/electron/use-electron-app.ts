'use client';

import { useCallback } from 'react';

import { useElectron } from './use-electron-base';

export function useElectronApp() {
  const { api, isElectron } = useElectron();

  const getVersion = useCallback(async (): Promise<null | string> => {
    if (!api) return null;
    return api.app.getVersion();
  }, [api]);

  const getPath = useCallback(
    async (
      name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'
    ): Promise<null | string> => {
      if (!api) return null;
      return api.app.getPath(name);
    },
    [api]
  );

  return {
    getPath,
    getVersion,
    isElectron,
  };
}
