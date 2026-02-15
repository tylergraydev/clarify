'use client';

import { useMemo } from 'react';

import type { McpServerConfig } from '@/types/mcp-server';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronMcpServers() {
  const { api } = useElectron();

  const mcpServers = useMemo(
    () => ({
      delete: async (name: string) => {
        const electronApi = throwIfNoApi(api, 'mcpServer.delete');
        return electronApi.mcpServer.delete(name);
      },
      detectProjectServers: async (dirPath: string) => {
        if (!api) return [];
        return api.mcpServer.detectProjectServers(dirPath);
      },
      list: async () => {
        if (!api) return [];
        return api.mcpServer.list();
      },
      save: async (config: McpServerConfig) => {
        const electronApi = throwIfNoApi(api, 'mcpServer.save');
        return electronApi.mcpServer.save(config);
      },
      toggle: async (name: string, enabled: boolean) => {
        const electronApi = throwIfNoApi(api, 'mcpServer.toggle');
        return electronApi.mcpServer.toggle(name, enabled);
      },
    }),
    [api]
  );

  return { mcpServers };
}
