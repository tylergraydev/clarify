'use client';

import { useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

export interface UseElectronResult {
  api: ElectronAPI | null;
  isElectron: boolean;
}

/**
 * Asserts that the Electron API is available and returns it.
 * Throws if the API is null.
 */
export function throwIfNoApi(api: ElectronAPI | null, operation: string): ElectronAPI {
  if (!api) {
    throw new Error(`Cannot perform ${operation}: Electron API not available`);
  }
  return api;
}

/**
 * Base hook that detects the Electron environment and provides the API reference.
 */
export function useElectron(): UseElectronResult {
  const isElectron = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.electronAPI !== undefined;
  }, []);

  const api = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.electronAPI ?? null;
  }, []);

  return { api, isElectron };
}
