'use client';

import { useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronWorkflows() {
  const { api } = useElectron();

  const workflows = useMemo(
    () => ({
      cancel: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'workflow.cancel');
        return electronApi.workflow.cancel(id);
      },
      create: async (data: Parameters<NonNullable<ElectronAPI>['workflow']['create']>[0]) => {
        const electronApi = throwIfNoApi(api, 'workflow.create');
        return electronApi.workflow.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'workflow.delete');
        return electronApi.workflow.delete(id);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.workflow.get(id);
      },
      getStatistics: async (filters?: Parameters<NonNullable<ElectronAPI>['workflow']['getStatistics']>[0]) => {
        const electronApi = throwIfNoApi(api, 'workflow.getStatistics');
        return electronApi.workflow.getStatistics(filters);
      },
      list: async () => {
        if (!api) return [];
        return api.workflow.list();
      },
      listHistory: async (filters?: Parameters<NonNullable<ElectronAPI>['workflow']['listHistory']>[0]) => {
        const electronApi = throwIfNoApi(api, 'workflow.listHistory');
        return electronApi.workflow.listHistory(filters);
      },
      pause: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'workflow.pause');
        return electronApi.workflow.pause(id);
      },
      resume: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'workflow.resume');
        return electronApi.workflow.resume(id);
      },
      start: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'workflow.start');
        return electronApi.workflow.start(id);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['workflow']['update']>[1]) => {
        const electronApi = throwIfNoApi(api, 'workflow.update');
        return electronApi.workflow.update(id, data);
      },
    }),
    [api]
  );

  const steps = useMemo(
    () => ({
      complete: async (id: number, output?: string, durationMs?: number) => {
        const electronApi = throwIfNoApi(api, 'step.complete');
        return electronApi.step.complete(id, output, durationMs);
      },
      edit: async (id: number, editedOutput: string) => {
        const electronApi = throwIfNoApi(api, 'step.edit');
        return electronApi.step.edit(id, editedOutput);
      },
      fail: async (id: number, errorMessage: string) => {
        const electronApi = throwIfNoApi(api, 'step.fail');
        return electronApi.step.fail(id, errorMessage);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.step.get(id);
      },
      list: async (workflowId: number) => {
        if (!api) return [];
        return api.step.list(workflowId);
      },
      regenerate: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'step.regenerate');
        return electronApi.step.regenerate(id);
      },
      skip: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'step.skip');
        return electronApi.step.skip(id);
      },
      start: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'step.start');
        return electronApi.step.start(id);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['step']['update']>[1]) => {
        const electronApi = throwIfNoApi(api, 'step.update');
        return electronApi.step.update(id, data);
      },
    }),
    [api]
  );

  const workflowRepositories = useMemo(
    () => ({
      addMultiple: async (workflowId: number, repositoryIds: Array<number>, primaryRepositoryId?: number) => {
        const electronApi = throwIfNoApi(api, 'workflowRepository.addMultiple');
        return electronApi.workflowRepository.addMultiple(workflowId, repositoryIds, primaryRepositoryId);
      },
    }),
    [api]
  );

  return { steps, workflowRepositories, workflows };
}
