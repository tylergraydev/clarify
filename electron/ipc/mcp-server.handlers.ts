/**
 * MCP Server IPC Handlers
 *
 * Handles all MCP server management operations including:
 * - Listing configured MCP servers
 * - CRUD operations (save, delete, toggle)
 * - Project-scoped .mcp.json detection
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { McpServerConfig } from '../../types/mcp-server';

import {
  deleteMcpServer,
  listMcpServers,
  readMcpJsonFile,
  saveMcpServer,
  toggleMcpServer,
} from '../services/mcp-server.service';
import { IpcChannels } from './channels';

/**
 * Register all MCP server-related IPC handlers.
 */
export function registerMcpServerHandlers(): void {
  // List all globally configured MCP servers
  ipcMain.handle(IpcChannels.mcpServer.list, (_event: IpcMainInvokeEvent): Array<McpServerConfig> => {
    try {
      return listMcpServers();
    } catch (error) {
      console.error('[IPC Error] mcpServer:list:', error);
      throw error;
    }
  });

  // Create or update an MCP server
  ipcMain.handle(IpcChannels.mcpServer.save, (_event: IpcMainInvokeEvent, config: McpServerConfig): void => {
    try {
      saveMcpServer(config);
    } catch (error) {
      console.error('[IPC Error] mcpServer:save:', error);
      throw error;
    }
  });

  // Delete an MCP server by name
  ipcMain.handle(IpcChannels.mcpServer.delete, (_event: IpcMainInvokeEvent, name: string): boolean => {
    try {
      return deleteMcpServer(name);
    } catch (error) {
      console.error('[IPC Error] mcpServer:delete:', error);
      throw error;
    }
  });

  // Toggle an MCP server's enabled state
  ipcMain.handle(IpcChannels.mcpServer.toggle, (_event: IpcMainInvokeEvent, name: string, enabled: boolean): void => {
    try {
      toggleMcpServer(name, enabled);
    } catch (error) {
      console.error('[IPC Error] mcpServer:toggle:', error);
      throw error;
    }
  });

  // Detect MCP servers from a project's .mcp.json file
  ipcMain.handle(
    IpcChannels.mcpServer.detectProjectServers,
    (_event: IpcMainInvokeEvent, dirPath: string): Array<McpServerConfig> => {
      try {
        return readMcpJsonFile(dirPath);
      } catch (error) {
        console.error('[IPC Error] mcpServer:detectProjectServers:', error);
        throw error;
      }
    }
  );
}
