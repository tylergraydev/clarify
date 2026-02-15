/**
 * MCP (Model Context Protocol) Server Types
 *
 * Types for managing MCP server configurations stored via electron-store.
 * These are used across the IPC layer, React hooks, and settings UI.
 */

/**
 * Stored MCP server configuration (Clarify's representation).
 * This is what gets persisted in electron-store and passed through IPC.
 */
export interface McpServerConfig {
  /** Arguments for stdio command */
  args?: Array<string>;
  /** Command to execute for stdio transport */
  command?: string;
  /** Whether this server is enabled (disabled servers are not passed to the SDK) */
  enabled: boolean;
  /** Environment variables for stdio transport */
  env?: Record<string, string>;
  /** HTTP headers for sse/http transport */
  headers?: Record<string, string>;
  /** Unique server name (used as the key in the SDK mcpServers record) */
  name: string;
  /** Transport protocol */
  transport: McpServerTransport;
  /** URL for sse/http transport */
  url?: string;
}

/** Supported MCP server transport types */
export type McpServerTransport = 'http' | 'sse' | 'stdio';
