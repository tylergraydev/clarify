'use client';

import { useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronProjects() {
  const { api } = useElectron();

  const projects = useMemo(
    () => ({
      addRepo: async (projectId: number, repoData: Parameters<NonNullable<ElectronAPI>['project']['addRepo']>[1]) => {
        const electronApi = throwIfNoApi(api, 'project.addRepo');
        return electronApi.project.addRepo(projectId, repoData);
      },
      archive: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'project.archive');
        return electronApi.project.archive(id);
      },
      create: async (data: Parameters<NonNullable<ElectronAPI>['project']['create']>[0]) => {
        const electronApi = throwIfNoApi(api, 'project.create');
        return electronApi.project.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'project.delete');
        return electronApi.project.delete(id);
      },
      deleteHard: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'project.deleteHard');
        return electronApi.project.deleteHard(id);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.project.get(id);
      },
      list: async (options?: Parameters<NonNullable<ElectronAPI>['project']['list']>[0]) => {
        if (!api) return [];
        return api.project.list(options);
      },
      listFavorites: async () => {
        if (!api) return [];
        return api.project.listFavorites();
      },
      toggleFavorite: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'project.toggleFavorite');
        return electronApi.project.toggleFavorite(id);
      },
      unarchive: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'project.unarchive');
        return electronApi.project.unarchive(id);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['project']['update']>[1]) => {
        const electronApi = throwIfNoApi(api, 'project.update');
        return electronApi.project.update(id, data);
      },
    }),
    [api]
  );

  const repositories = useMemo(
    () => ({
      clearDefault: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'repository.clearDefault');
        return electronApi.repository.clearDefault(id);
      },
      create: async (data: Parameters<NonNullable<ElectronAPI>['repository']['create']>[0]) => {
        const electronApi = throwIfNoApi(api, 'repository.create');
        return electronApi.repository.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'repository.delete');
        return electronApi.repository.delete(id);
      },
      findByPath: async (path: string) => {
        if (!api) return undefined;
        return api.repository.findByPath(path);
      },
      findByProject: async (projectId: number) => {
        if (!api) return [];
        return api.repository.findByProject(projectId);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.repository.get(id);
      },
      list: async () => {
        if (!api) return [];
        return api.repository.list();
      },
      setDefault: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'repository.setDefault');
        return electronApi.repository.setDefault(id);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['repository']['update']>[1]) => {
        const electronApi = throwIfNoApi(api, 'repository.update');
        return electronApi.repository.update(id, data);
      },
    }),
    [api]
  );

  return { projects, repositories };
}
