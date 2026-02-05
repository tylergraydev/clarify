'use client';

import { useCallback } from 'react';

import { useElectron } from './use-electron-base';

export function useElectronFs() {
  const { api, isElectron } = useElectron();

  const readFile = useCallback(
    async (path: string): Promise<{ content?: string; error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.readFile(path);
    },
    [api]
  );

  const writeFile = useCallback(
    async (path: string, content: string): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.writeFile(path, content);
    },
    [api]
  );

  const readDirectory = useCallback(
    async (
      path: string
    ): Promise<{
      entries?: Array<{ isDirectory: boolean; isFile: boolean; name: string }>;
      error?: string;
      success: boolean;
    }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.readDirectory(path);
    },
    [api]
  );

  const exists = useCallback(
    async (path: string): Promise<boolean> => {
      if (!api) return false;
      return api.fs.exists(path);
    },
    [api]
  );

  const stat = useCallback(
    async (
      path: string
    ): Promise<{
      error?: string;
      stats?: {
        ctime: string;
        isDirectory: boolean;
        isFile: boolean;
        mtime: string;
        size: number;
      };
      success: boolean;
    }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.stat(path);
    },
    [api]
  );

  return {
    exists,
    isElectron,
    readDirectory,
    readFile,
    stat,
    writeFile,
  };
}
