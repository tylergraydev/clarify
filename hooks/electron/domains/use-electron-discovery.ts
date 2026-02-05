'use client';

import { useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronDiscovery() {
  const { api } = useElectron();

  const discovery = useMemo(
    () => ({
      add: async (stepId: number, data: Parameters<NonNullable<ElectronAPI>['discovery']['add']>[1]) => {
        const electronApi = throwIfNoApi(api, 'discovery.add');
        return electronApi.discovery.add(stepId, data);
      },
      exclude: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'discovery.exclude');
        return electronApi.discovery.exclude(id);
      },
      include: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'discovery.include');
        return electronApi.discovery.include(id);
      },
      list: async (stepId: number) => {
        if (!api) return [];
        return api.discovery.list(stepId);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['discovery']['update']>[1]) => {
        const electronApi = throwIfNoApi(api, 'discovery.update');
        return electronApi.discovery.update(id, data);
      },
      updatePriority: async (id: number, priority: string) => {
        const electronApi = throwIfNoApi(api, 'discovery.updatePriority');
        return electronApi.discovery.updatePriority(id, priority);
      },
    }),
    [api]
  );

  return { discovery };
}
