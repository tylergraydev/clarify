'use client';

import { useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronPlanning() {
  const { api } = useElectron();

  const planning = useMemo(
    () => ({
      approvePlan: async (workflowId: number, stepId: number) => {
        const electronApi = throwIfNoApi(api, 'planning.approvePlan');
        return electronApi.planning.approvePlan(workflowId, stepId);
      },
      cancel: async (workflowId: number) => {
        const electronApi = throwIfNoApi(api, 'planning.cancel');
        return electronApi.planning.cancel(workflowId);
      },
      editPlan: async (input: Parameters<NonNullable<ElectronAPI>['planning']['editPlan']>[0]) => {
        const electronApi = throwIfNoApi(api, 'planning.editPlan');
        return electronApi.planning.editPlan(input);
      },
      getState: async (workflowId: number) => {
        if (!api) return null;
        return api.planning.getState(workflowId);
      },
      onStreamMessage: (callback: Parameters<NonNullable<ElectronAPI>['planning']['onStreamMessage']>[0]) => {
        const electronApi = throwIfNoApi(api, 'planning.onStreamMessage');
        return electronApi.planning.onStreamMessage(callback);
      },
      retry: async (input: Parameters<NonNullable<ElectronAPI>['planning']['retry']>[0]) => {
        const electronApi = throwIfNoApi(api, 'planning.retry');
        return electronApi.planning.retry(input);
      },
      start: async (input: Parameters<NonNullable<ElectronAPI>['planning']['start']>[0]) => {
        const electronApi = throwIfNoApi(api, 'planning.start');
        return electronApi.planning.start(input);
      },
      submitFeedback: async (input: Parameters<NonNullable<ElectronAPI>['planning']['submitFeedback']>[0]) => {
        const electronApi = throwIfNoApi(api, 'planning.submitFeedback');
        return electronApi.planning.submitFeedback(input);
      },
    }),
    [api]
  );

  return { planning };
}
