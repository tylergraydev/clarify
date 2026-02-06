'use client';

import { useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronClarification() {
  const { api } = useElectron();

  const clarification = useMemo(
    () => ({
      getState: async (workflowId: number) => {
        if (!api) return null;
        return api.clarification.getState(workflowId);
      },
      onStreamMessage: (callback: Parameters<NonNullable<ElectronAPI>['clarification']['onStreamMessage']>[0]) => {
        const electronApi = throwIfNoApi(api, 'clarification.onStreamMessage');
        return electronApi.clarification.onStreamMessage(callback);
      },
      retry: async (input: Parameters<NonNullable<ElectronAPI>['clarification']['retry']>[0]) => {
        const electronApi = throwIfNoApi(api, 'clarification.retry');
        return electronApi.clarification.retry(input);
      },
      skip: async (workflowId: number, reason?: string) => {
        const electronApi = throwIfNoApi(api, 'clarification.skip');
        return electronApi.clarification.skip(workflowId, reason);
      },
      start: async (input: Parameters<NonNullable<ElectronAPI>['clarification']['start']>[0]) => {
        const electronApi = throwIfNoApi(api, 'clarification.start');
        return electronApi.clarification.start(input);
      },
      submitAnswers: async (input: Parameters<NonNullable<ElectronAPI>['clarification']['submitAnswers']>[0]) => {
        const electronApi = throwIfNoApi(api, 'clarification.submitAnswers');
        return electronApi.clarification.submitAnswers(input);
      },
      submitEdits: async (workflowId: number, editedText: string) => {
        const electronApi = throwIfNoApi(api, 'clarification.submitEdits');
        return electronApi.clarification.submitEdits(workflowId, editedText);
      },
    }),
    [api]
  );

  return { clarification };
}
