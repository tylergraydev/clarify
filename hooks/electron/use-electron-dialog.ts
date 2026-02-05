'use client';

import { useCallback } from 'react';

import { useElectron } from './use-electron-base';

export function useElectronDialog() {
  const { api, isElectron } = useElectron();

  const openDirectory = useCallback(async (): Promise<null | string> => {
    if (!api) return null;
    return api.dialog.openDirectory();
  }, [api]);

  const openFile = useCallback(
    async (filters?: Array<{ extensions: Array<string>; name: string }>): Promise<null | string> => {
      if (!api) return null;
      return api.dialog.openFile(filters);
    },
    [api]
  );

  const saveFile = useCallback(
    async (
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string> => {
      if (!api) return null;
      return api.dialog.saveFile(defaultPath, filters);
    },
    [api]
  );

  return {
    isElectron,
    openDirectory,
    openFile,
    saveFile,
  };
}
