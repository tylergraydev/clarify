'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { McpServerConfig } from '@/types/mcp-server';

import { mcpServerKeys } from '@/lib/queries/mcp-servers';

import { useElectronDb } from '../use-electron';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Delete an MCP server by name.
 */
export function useDeleteMcpServer() {
  const queryClient = useQueryClient();
  const { mcpServers } = useElectronDb();

  return useMutation({
    mutationFn: (name: string) => mcpServers.delete(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mcpServerKeys.list.queryKey });
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Fetch all globally configured MCP servers.
 */
export function useMcpServers() {
  const { isElectron, mcpServers } = useElectronDb();

  return useQuery({
    ...mcpServerKeys.list,
    enabled: isElectron,
    queryFn: () => mcpServers.list(),
  });
}

/**
 * Create or update an MCP server configuration.
 */
export function useSaveMcpServer() {
  const queryClient = useQueryClient();
  const { mcpServers } = useElectronDb();

  return useMutation({
    mutationFn: (config: McpServerConfig) => mcpServers.save(config),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mcpServerKeys.list.queryKey });
    },
  });
}

/**
 * Toggle an MCP server's enabled/disabled state.
 */
export function useToggleMcpServer() {
  const queryClient = useQueryClient();
  const { mcpServers } = useElectronDb();

  return useMutation({
    mutationFn: ({ enabled, name }: { enabled: boolean; name: string }) => mcpServers.toggle(name, enabled),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mcpServerKeys.list.queryKey });
    },
  });
}
