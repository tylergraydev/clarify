"use client";

import { useCallback, useMemo } from "react";

import type { ElectronAPI } from "@/types/electron";

interface UseElectronResult {
  api: ElectronAPI | null;
  isElectron: boolean;
}

export function useElectron(): UseElectronResult {
  const isElectron = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.electronAPI !== undefined;
  }, []);

  const api = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.electronAPI ?? null;
  }, []);

  return { api, isElectron };
}

export function useElectronApp() {
  const { api, isElectron } = useElectron();

  const getVersion = useCallback(async (): Promise<null | string> => {
    if (!api) return null;
    return api.app.getVersion();
  }, [api]);

  const getPath = useCallback(
    async (
      name:
        | "appData"
        | "desktop"
        | "documents"
        | "downloads"
        | "home"
        | "temp"
        | "userData"
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

export function useElectronDialog() {
  const { api, isElectron } = useElectron();

  const openDirectory = useCallback(async (): Promise<null | string> => {
    if (!api) return null;
    return api.dialog.openDirectory();
  }, [api]);

  const openFile = useCallback(
    async (
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string> => {
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

export function useElectronFs() {
  const { api, isElectron } = useElectron();

  const readFile = useCallback(
    async (
      path: string
    ): Promise<{ content?: string; error?: string; success: boolean }> => {
      if (!api) return { error: "Not running in Electron", success: false };
      return api.fs.readFile(path);
    },
    [api]
  );

  const writeFile = useCallback(
    async (
      path: string,
      content: string
    ): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: "Not running in Electron", success: false };
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
      if (!api) return { error: "Not running in Electron", success: false };
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
      if (!api) return { error: "Not running in Electron", success: false };
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
