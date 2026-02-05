'use client';

import { useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronAgents() {
  const { api } = useElectron();

  const agents = useMemo(
    () => ({
      activate: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agent.activate');
        return electronApi.agent.activate(id);
      },
      copyToProject: async (agentId: number, targetProjectId: number) => {
        const electronApi = throwIfNoApi(api, 'agent.copyToProject');
        return electronApi.agent.copyToProject(agentId, targetProjectId);
      },
      create: async (data: Parameters<NonNullable<ElectronAPI>['agent']['create']>[0]) => {
        const electronApi = throwIfNoApi(api, 'agent.create');
        return electronApi.agent.create(data);
      },
      createOverride: async (agentId: number, projectId: number) => {
        const electronApi = throwIfNoApi(api, 'agent.createOverride');
        return electronApi.agent.createOverride(agentId, projectId);
      },
      deactivate: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agent.deactivate');
        return electronApi.agent.deactivate(id);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agent.delete');
        return electronApi.agent.delete(id);
      },
      duplicate: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agent.duplicate');
        return electronApi.agent.duplicate(id);
      },
      export: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agent.export');
        return electronApi.agent.export(id);
      },
      exportBatch: async (ids: Array<number>) => {
        const electronApi = throwIfNoApi(api, 'agent.exportBatch');
        return electronApi.agent.exportBatch(ids);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.agent.get(id);
      },
      import: async (parsedMarkdown: Parameters<NonNullable<ElectronAPI>['agent']['import']>[0]) => {
        const electronApi = throwIfNoApi(api, 'agent.import');
        return electronApi.agent.import(parsedMarkdown);
      },
      list: async (filters?: Parameters<NonNullable<ElectronAPI>['agent']['list']>[0]) => {
        if (!api) return [];
        return api.agent.list(filters);
      },
      move: async (agentId: number, targetProjectId: null | number) => {
        const electronApi = throwIfNoApi(api, 'agent.move');
        return electronApi.agent.move(agentId, targetProjectId);
      },
      reset: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agent.reset');
        return electronApi.agent.reset(id);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['agent']['update']>[1]) => {
        const electronApi = throwIfNoApi(api, 'agent.update');
        return electronApi.agent.update(id, data);
      },
    }),
    [api]
  );

  const agentHooks = useMemo(
    () => ({
      create: async (data: Parameters<NonNullable<ElectronAPI>['agentHook']['create']>[0]) => {
        const electronApi = throwIfNoApi(api, 'agentHook.create');
        return electronApi.agentHook.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agentHook.delete');
        return electronApi.agentHook.delete(id);
      },
      list: async (agentId: number) => {
        if (!api) return [];
        return api.agentHook.list(agentId);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['agentHook']['update']>[1]) => {
        const electronApi = throwIfNoApi(api, 'agentHook.update');
        return electronApi.agentHook.update(id, data);
      },
    }),
    [api]
  );

  const agentSkills = useMemo(
    () => ({
      create: async (data: Parameters<NonNullable<ElectronAPI>['agentSkill']['create']>[0]) => {
        const electronApi = throwIfNoApi(api, 'agentSkill.create');
        return electronApi.agentSkill.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agentSkill.delete');
        return electronApi.agentSkill.delete(id);
      },
      list: async (agentId: number) => {
        if (!api) return [];
        return api.agentSkill.list(agentId);
      },
      setRequired: async (id: number, required: boolean) => {
        const electronApi = throwIfNoApi(api, 'agentSkill.setRequired');
        return electronApi.agentSkill.setRequired(id, required);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['agentSkill']['update']>[1]) => {
        const electronApi = throwIfNoApi(api, 'agentSkill.update');
        return electronApi.agentSkill.update(id, data);
      },
    }),
    [api]
  );

  const agentTools = useMemo(
    () => ({
      allow: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agentTool.allow');
        return electronApi.agentTool.allow(id);
      },
      create: async (data: Parameters<NonNullable<ElectronAPI>['agentTool']['create']>[0]) => {
        const electronApi = throwIfNoApi(api, 'agentTool.create');
        return electronApi.agentTool.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agentTool.delete');
        return electronApi.agentTool.delete(id);
      },
      disallow: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'agentTool.disallow');
        return electronApi.agentTool.disallow(id);
      },
      list: async (agentId: number) => {
        if (!api) return [];
        return api.agentTool.list(agentId);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['agentTool']['update']>[1]) => {
        const electronApi = throwIfNoApi(api, 'agentTool.update');
        return electronApi.agentTool.update(id, data);
      },
    }),
    [api]
  );

  return { agentHooks, agents, agentSkills, agentTools };
}
