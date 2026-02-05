'use client';

import { useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronTemplates() {
  const { api } = useElectron();

  const templates = useMemo(
    () => ({
      create: async (data: Parameters<NonNullable<ElectronAPI>['template']['create']>[0]) => {
        const electronApi = throwIfNoApi(api, 'template.create');
        return electronApi.template.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'template.delete');
        return electronApi.template.delete(id);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.template.get(id);
      },
      getPlaceholders: async (templateId: number) => {
        if (!api) return [];
        return api.template.getPlaceholders(templateId);
      },
      incrementUsage: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'template.incrementUsage');
        return electronApi.template.incrementUsage(id);
      },
      list: async (filters?: Parameters<NonNullable<ElectronAPI>['template']['list']>[0]) => {
        if (!api) return [];
        return api.template.list(filters);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['template']['update']>[1]) => {
        const electronApi = throwIfNoApi(api, 'template.update');
        return electronApi.template.update(id, data);
      },
      updatePlaceholders: async (
        templateId: number,
        placeholders: Parameters<NonNullable<ElectronAPI>['template']['updatePlaceholders']>[1]
      ) => {
        const electronApi = throwIfNoApi(api, 'template.updatePlaceholders');
        return electronApi.template.updatePlaceholders(templateId, placeholders);
      },
    }),
    [api]
  );

  return { templates };
}
