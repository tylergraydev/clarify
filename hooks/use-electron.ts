'use client';

import { useCallback, useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

interface UseElectronResult {
  api: ElectronAPI | null;
  isElectron: boolean;
}

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

export function useElectronApp() {
  const { api, isElectron } = useElectron();

  const getVersion = useCallback(async (): Promise<null | string> => {
    if (!api) return null;
    return api.app.getVersion();
  }, [api]);

  const getPath = useCallback(
    async (
      name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'
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

/**
 * Hook that provides access to all database domains via the ElectronAPI.
 * Write operations throw errors when API is unavailable.
 * Read operations return safe defaults (empty arrays or undefined).
 */
export function useElectronDb() {
  const { api, isElectron } = useElectron();

  const throwIfNoApi = useCallback(
    (operation: string) => {
      if (!api) {
        throw new Error(`Cannot perform ${operation}: Electron API not available`);
      }
      return api;
    },
    [api]
  );

  const workflows = useMemo(
    () => ({
      cancel: async (id: number) => {
        const electronApi = throwIfNoApi('workflow.cancel');
        return electronApi.workflow.cancel(id);
      },
      create: async (data: Parameters<NonNullable<ElectronAPI>['workflow']['create']>[0]) => {
        const electronApi = throwIfNoApi('workflow.create');
        return electronApi.workflow.create(data);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.workflow.get(id);
      },
      list: async () => {
        if (!api) return [];
        return api.workflow.list();
      },
      pause: async (id: number) => {
        const electronApi = throwIfNoApi('workflow.pause');
        return electronApi.workflow.pause(id);
      },
      resume: async (id: number) => {
        const electronApi = throwIfNoApi('workflow.resume');
        return electronApi.workflow.resume(id);
      },
      start: async (id: number) => {
        const electronApi = throwIfNoApi('workflow.start');
        return electronApi.workflow.start(id);
      },
    }),
    [api, throwIfNoApi]
  );

  const steps = useMemo(
    () => ({
      complete: async (id: number, output?: string, durationMs?: number) => {
        const electronApi = throwIfNoApi('step.complete');
        return electronApi.step.complete(id, output, durationMs);
      },
      edit: async (id: number, editedOutput: string) => {
        const electronApi = throwIfNoApi('step.edit');
        return electronApi.step.edit(id, editedOutput);
      },
      fail: async (id: number, errorMessage: string) => {
        const electronApi = throwIfNoApi('step.fail');
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
        const electronApi = throwIfNoApi('step.regenerate');
        return electronApi.step.regenerate(id);
      },
    }),
    [api, throwIfNoApi]
  );

  const discovery = useMemo(
    () => ({
      add: async (stepId: number, data: Parameters<NonNullable<ElectronAPI>['discovery']['add']>[1]) => {
        const electronApi = throwIfNoApi('discovery.add');
        return electronApi.discovery.add(stepId, data);
      },
      exclude: async (id: number) => {
        const electronApi = throwIfNoApi('discovery.exclude');
        return electronApi.discovery.exclude(id);
      },
      include: async (id: number) => {
        const electronApi = throwIfNoApi('discovery.include');
        return electronApi.discovery.include(id);
      },
      list: async (stepId: number) => {
        if (!api) return [];
        return api.discovery.list(stepId);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['discovery']['update']>[1]) => {
        const electronApi = throwIfNoApi('discovery.update');
        return electronApi.discovery.update(id, data);
      },
      updatePriority: async (id: number, priority: string) => {
        const electronApi = throwIfNoApi('discovery.updatePriority');
        return electronApi.discovery.updatePriority(id, priority);
      },
    }),
    [api, throwIfNoApi]
  );

  const agents = useMemo(
    () => ({
      activate: async (id: number) => {
        const electronApi = throwIfNoApi('agent.activate');
        return electronApi.agent.activate(id);
      },
      copyToProject: async (agentId: number, targetProjectId: number) => {
        const electronApi = throwIfNoApi('agent.copyToProject');
        return electronApi.agent.copyToProject(agentId, targetProjectId);
      },
      create: async (data: Parameters<NonNullable<ElectronAPI>['agent']['create']>[0]) => {
        const electronApi = throwIfNoApi('agent.create');
        return electronApi.agent.create(data);
      },
      createOverride: async (agentId: number, projectId: number) => {
        const electronApi = throwIfNoApi('agent.createOverride');
        return electronApi.agent.createOverride(agentId, projectId);
      },
      deactivate: async (id: number) => {
        const electronApi = throwIfNoApi('agent.deactivate');
        return electronApi.agent.deactivate(id);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi('agent.delete');
        return electronApi.agent.delete(id);
      },
      duplicate: async (id: number) => {
        const electronApi = throwIfNoApi('agent.duplicate');
        return electronApi.agent.duplicate(id);
      },
      export: async (id: number) => {
        const electronApi = throwIfNoApi('agent.export');
        return electronApi.agent.export(id);
      },
      exportBatch: async (ids: Array<number>) => {
        const electronApi = throwIfNoApi('agent.exportBatch');
        return electronApi.agent.exportBatch(ids);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.agent.get(id);
      },
      import: async (parsedMarkdown: Parameters<NonNullable<ElectronAPI>['agent']['import']>[0]) => {
        const electronApi = throwIfNoApi('agent.import');
        return electronApi.agent.import(parsedMarkdown);
      },
      list: async (filters?: Parameters<NonNullable<ElectronAPI>['agent']['list']>[0]) => {
        if (!api) return [];
        return api.agent.list(filters);
      },
      move: async (agentId: number, targetProjectId: null | number) => {
        const electronApi = throwIfNoApi('agent.move');
        return electronApi.agent.move(agentId, targetProjectId);
      },
      reset: async (id: number) => {
        const electronApi = throwIfNoApi('agent.reset');
        return electronApi.agent.reset(id);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['agent']['update']>[1]) => {
        const electronApi = throwIfNoApi('agent.update');
        return electronApi.agent.update(id, data);
      },
    }),
    [api, throwIfNoApi]
  );

  const agentHooks = useMemo(
    () => ({
      create: async (data: Parameters<NonNullable<ElectronAPI>['agentHook']['create']>[0]) => {
        const electronApi = throwIfNoApi('agentHook.create');
        return electronApi.agentHook.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi('agentHook.delete');
        return electronApi.agentHook.delete(id);
      },
      list: async (agentId: number) => {
        if (!api) return [];
        return api.agentHook.list(agentId);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['agentHook']['update']>[1]) => {
        const electronApi = throwIfNoApi('agentHook.update');
        return electronApi.agentHook.update(id, data);
      },
    }),
    [api, throwIfNoApi]
  );

  const agentSkills = useMemo(
    () => ({
      create: async (data: Parameters<NonNullable<ElectronAPI>['agentSkill']['create']>[0]) => {
        const electronApi = throwIfNoApi('agentSkill.create');
        return electronApi.agentSkill.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi('agentSkill.delete');
        return electronApi.agentSkill.delete(id);
      },
      list: async (agentId: number) => {
        if (!api) return [];
        return api.agentSkill.list(agentId);
      },
      setRequired: async (id: number, required: boolean) => {
        const electronApi = throwIfNoApi('agentSkill.setRequired');
        return electronApi.agentSkill.setRequired(id, required);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['agentSkill']['update']>[1]) => {
        const electronApi = throwIfNoApi('agentSkill.update');
        return electronApi.agentSkill.update(id, data);
      },
    }),
    [api, throwIfNoApi]
  );

  const agentTools = useMemo(
    () => ({
      allow: async (id: number) => {
        const electronApi = throwIfNoApi('agentTool.allow');
        return electronApi.agentTool.allow(id);
      },
      create: async (data: Parameters<NonNullable<ElectronAPI>['agentTool']['create']>[0]) => {
        const electronApi = throwIfNoApi('agentTool.create');
        return electronApi.agentTool.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi('agentTool.delete');
        return electronApi.agentTool.delete(id);
      },
      disallow: async (id: number) => {
        const electronApi = throwIfNoApi('agentTool.disallow');
        return electronApi.agentTool.disallow(id);
      },
      list: async (agentId: number) => {
        if (!api) return [];
        return api.agentTool.list(agentId);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['agentTool']['update']>[1]) => {
        const electronApi = throwIfNoApi('agentTool.update');
        return electronApi.agentTool.update(id, data);
      },
    }),
    [api, throwIfNoApi]
  );

  const templates = useMemo(
    () => ({
      create: async (data: Parameters<NonNullable<ElectronAPI>['template']['create']>[0]) => {
        const electronApi = throwIfNoApi('template.create');
        return electronApi.template.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi('template.delete');
        return electronApi.template.delete(id);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.template.get(id);
      },
      incrementUsage: async (id: number) => {
        const electronApi = throwIfNoApi('template.incrementUsage');
        return electronApi.template.incrementUsage(id);
      },
      list: async () => {
        if (!api) return [];
        return api.template.list();
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['template']['update']>[1]) => {
        const electronApi = throwIfNoApi('template.update');
        return electronApi.template.update(id, data);
      },
    }),
    [api, throwIfNoApi]
  );

  const projects = useMemo(
    () => ({
      addRepo: async (projectId: number, repoData: Parameters<NonNullable<ElectronAPI>['project']['addRepo']>[1]) => {
        const electronApi = throwIfNoApi('project.addRepo');
        return electronApi.project.addRepo(projectId, repoData);
      },
      create: async (data: Parameters<NonNullable<ElectronAPI>['project']['create']>[0]) => {
        const electronApi = throwIfNoApi('project.create');
        return electronApi.project.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi('project.delete');
        return electronApi.project.delete(id);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.project.get(id);
      },
      list: async () => {
        if (!api) return [];
        return api.project.list();
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['project']['update']>[1]) => {
        const electronApi = throwIfNoApi('project.update');
        return electronApi.project.update(id, data);
      },
    }),
    [api, throwIfNoApi]
  );

  const repositories = useMemo(
    () => ({
      create: async (data: Parameters<NonNullable<ElectronAPI>['repository']['create']>[0]) => {
        const electronApi = throwIfNoApi('repository.create');
        return electronApi.repository.create(data);
      },
      delete: async (id: number) => {
        const electronApi = throwIfNoApi('repository.delete');
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
        const electronApi = throwIfNoApi('repository.setDefault');
        return electronApi.repository.setDefault(id);
      },
      update: async (id: number, data: Parameters<NonNullable<ElectronAPI>['repository']['update']>[1]) => {
        const electronApi = throwIfNoApi('repository.update');
        return electronApi.repository.update(id, data);
      },
    }),
    [api, throwIfNoApi]
  );

  const audit = useMemo(
    () => ({
      create: async (data: Parameters<NonNullable<ElectronAPI>['audit']['create']>[0]) => {
        const electronApi = throwIfNoApi('audit.create');
        return electronApi.audit.create(data);
      },
      export: async (workflowId: number) => {
        const electronApi = throwIfNoApi('audit.export');
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
    [api, throwIfNoApi]
  );

  const settings = useMemo(
    () => ({
      bulkUpdate: async (updates: Array<{ key: string; value: string }>) => {
        const electronApi = throwIfNoApi('settings.bulkUpdate');
        return electronApi.settings.bulkUpdate(updates);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.settings.get(id);
      },
      getByCategory: async (category: string) => {
        if (!api) return [];
        return api.settings.getByCategory(category);
      },
      getByKey: async (key: string) => {
        if (!api) return undefined;
        return api.settings.getByKey(key);
      },
      list: async () => {
        if (!api) return [];
        return api.settings.list();
      },
      resetToDefault: async (key: string) => {
        const electronApi = throwIfNoApi('settings.resetToDefault');
        return electronApi.settings.resetToDefault(key);
      },
      setValue: async (key: string, value: string) => {
        const electronApi = throwIfNoApi('settings.setValue');
        return electronApi.settings.setValue(key, value);
      },
    }),
    [api, throwIfNoApi]
  );

  return {
    agentHooks,
    agents,
    agentSkills,
    agentTools,
    audit,
    discovery,
    isElectron,
    projects,
    repositories,
    settings,
    steps,
    templates,
    workflows,
  };
}

export function useElectronDialog() {
  const { api, isElectron } = useElectron();

  const openDirectory = useCallback(async (): Promise<null | string> => {
    if (!api) return null;
    return api.dialog.openDirectory();
  }, [api]);

  const openFile = useCallback(
    async (filters?: Array<{ extensions: Array<string>; name: string }>): Promise<null | string> => {
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
    async (path: string): Promise<{ content?: string; error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.readFile(path);
    },
    [api]
  );

  const writeFile = useCallback(
    async (path: string, content: string): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
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
      if (!api) return { error: 'Not running in Electron', success: false };
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
      if (!api) return { error: 'Not running in Electron', success: false };
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
