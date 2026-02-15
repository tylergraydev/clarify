import Store from 'electron-store';
/**
 * MCP Server Management Service
 *
 * Manages MCP server configurations using electron-store.
 * Provides CRUD operations for global MCP servers, .mcp.json file
 * detection for project-scoped servers, and a builder that merges
 * both into the Record<string, McpServerConfig> format the SDK expects.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { McpServerConfig, McpServerTransport } from '../../types/mcp-server';

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface McpServerStore {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

const store = new Store({ name: 'mcp-servers' }) as unknown as McpServerStore;

const SERVERS_KEY = 'servers';

interface McpJsonFile {
  mcpServers?: Record<
    string,
    {
      args?: Array<string>;
      command?: string;
      env?: Record<string, string>;
      headers?: Record<string, string>;
      type?: string;
      url?: string;
    }
  >;
}

type SdkMcpServerConfig = SdkMcpStdioConfig | SdkMcpUrlConfig;

interface SdkMcpStdioConfig {
  args?: Array<string>;
  command: string;
  env?: Record<string, string>;
  type?: 'stdio';
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

interface SdkMcpUrlConfig {
  headers?: Record<string, string>;
  type: 'http' | 'sse';
  url: string;
}

type StoredServers = Record<string, McpServerConfig>;

/**
 * Build the `mcpServers` record for the Claude Agent SDK Options.
 *
 * Merges enabled global servers with project-scoped servers from .mcp.json.
 * Project servers override global servers with the same name.
 */
export function buildSdkMcpServers(projectPath?: string): Record<string, SdkMcpServerConfig> {
  const result: Record<string, SdkMcpServerConfig> = {};

  // Add enabled global servers
  const globalServers = listMcpServers().filter((s) => s.enabled);
  for (const server of globalServers) {
    const sdkConfig = toSdkConfig(server);
    if (sdkConfig) {
      result[server.name] = sdkConfig;
    }
  }

  // Merge project .mcp.json servers (override global by name)
  if (projectPath) {
    const projectServers = readMcpJsonFile(projectPath);
    for (const server of projectServers) {
      const sdkConfig = toSdkConfig(server);
      if (sdkConfig) {
        result[server.name] = sdkConfig;
      }
    }
  }

  return result;
}

/**
 * Delete an MCP server by name.
 */
export function deleteMcpServer(name: string): boolean {
  const servers = loadServers();
  if (!(name in servers)) return false;
  delete servers[name];
  saveServers(servers);
  return true;
}

/**
 * Get a single MCP server by name.
 */
export function getMcpServer(name: string): McpServerConfig | undefined {
  return loadServers()[name];
}

// ---------------------------------------------------------------------------
// .mcp.json detection
// ---------------------------------------------------------------------------

/**
 * List all globally configured MCP servers.
 */
export function listMcpServers(): Array<McpServerConfig> {
  const servers = loadServers();
  return Object.values(servers).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Read and parse a .mcp.json file from the given directory.
 * Returns an array of McpServerConfig objects (all marked enabled).
 * Returns an empty array if the file doesn't exist or is malformed.
 */
export function readMcpJsonFile(dirPath: string): Array<McpServerConfig> {
  const filePath = join(dirPath, '.mcp.json');
  if (!existsSync(filePath)) return [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content) as McpJsonFile;
    if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') return [];

    return Object.entries(parsed.mcpServers).map(([name, cfg]) => {
      const transport: McpServerTransport = cfg.type === 'sse' ? 'sse' : cfg.type === 'http' ? 'http' : 'stdio';

      return {
        ...(cfg.args && { args: cfg.args }),
        ...(cfg.command && { command: cfg.command }),
        enabled: true,
        ...(cfg.env && { env: cfg.env }),
        ...(cfg.headers && { headers: cfg.headers }),
        name,
        transport,
        ...(cfg.url && { url: cfg.url }),
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// SDK config builder
// ---------------------------------------------------------------------------

/**
 * Create or update an MCP server config.
 */
export function saveMcpServer(config: McpServerConfig): void {
  const servers = loadServers();
  servers[config.name] = config;
  saveServers(servers);
}

/**
 * Toggle an MCP server's enabled state.
 */
export function toggleMcpServer(name: string, enabled: boolean): void {
  const servers = loadServers();
  const server = servers[name];
  if (!server) return;
  server.enabled = enabled;
  saveServers(servers);
}

function loadServers(): StoredServers {
  const raw = store.get(SERVERS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StoredServers;
  } catch {
    return {};
  }
}

function saveServers(servers: StoredServers): void {
  store.set(SERVERS_KEY, JSON.stringify(servers));
}

/**
 * Convert a McpServerConfig to the SDK-compatible format.
 */
function toSdkConfig(server: McpServerConfig): SdkMcpServerConfig | undefined {
  switch (server.transport) {
    case 'http': {
      if (!server.url) return undefined;
      return {
        ...(server.headers && Object.keys(server.headers).length > 0 && { headers: server.headers }),
        type: 'http',
        url: server.url,
      };
    }
    case 'sse': {
      if (!server.url) return undefined;
      return {
        ...(server.headers && Object.keys(server.headers).length > 0 && { headers: server.headers }),
        type: 'sse',
        url: server.url,
      };
    }
    case 'stdio': {
      if (!server.command) return undefined;
      return {
        ...(server.args && server.args.length > 0 && { args: server.args }),
        command: server.command,
        ...(server.env && Object.keys(server.env).length > 0 && { env: server.env }),
        type: 'stdio',
      };
    }
    default:
      return undefined;
  }
}
