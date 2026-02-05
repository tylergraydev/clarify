'use client';

import { useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronAudit() {
  const { api } = useElectron();

  const audit = useMemo(
    () => ({
      create: async (data: Parameters<NonNullable<ElectronAPI>['audit']['create']>[0]) => {
        const electronApi = throwIfNoApi(api, 'audit.create');
        return electronApi.audit.create(data);
      },
      export: async (workflowId: number) => {
        const electronApi = throwIfNoApi(api, 'audit.export');
        return electronApi.audit.export(workflowId);
      },
      findByStep: async (stepId: number) => {
        if (!api) return [];
        return api.audit.findByStep(stepId);
      },
      findByWorkflow: async (workflowId: number) => {
        if (!api) return [];
        return api.audit.findByWorkflow(workflowId);
      },
      list: async () => {
        if (!api) return [];
        return api.audit.list();
      },
    }),
    [api]
  );

  return { audit };
}
