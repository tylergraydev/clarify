/**
 * Agent Tool IPC Handlers
 *
 * Handles all agent tool management operations including:
 * - Listing tools for an agent
 * - Creating new tools
 * - Updating tool configuration
 * - Allowing/disallowing tools
 * - Deleting tools
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { AgentToolsRepository } from '../../db/repositories';
import type { AgentTool, NewAgentTool } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Register all agent tool-related IPC handlers.
 *
 * @param agentToolsRepository - The agent tools repository for database operations
 */
export function registerAgentToolHandlers(agentToolsRepository: AgentToolsRepository): void {
  /**
   * List all tools for a specific agent by agent ID.
   */
  ipcMain.handle(IpcChannels.agentTool.list, (_event: IpcMainInvokeEvent, agentId: number): Array<AgentTool> => {
    try {
      return agentToolsRepository.findByAgentId(agentId);
    } catch (error) {
      console.error('[IPC Error] agentTool:list:', error);
      throw error;
    }
  });

  /**
   * Create a new tool for an agent.
   */
  ipcMain.handle(IpcChannels.agentTool.create, (_event: IpcMainInvokeEvent, data: NewAgentTool): AgentTool => {
    try {
      return agentToolsRepository.create(data);
    } catch (error) {
      console.error('[IPC Error] agentTool:create:', error);
      throw error;
    }
  });

  /**
   * Update a tool's configuration (name, pattern, order index, etc.).
   */
  ipcMain.handle(
    IpcChannels.agentTool.update,
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Omit<NewAgentTool, 'createdAt' | 'id'>>
    ): AgentTool | undefined => {
      try {
        return agentToolsRepository.update(id, data);
      } catch (error) {
        console.error('[IPC Error] agentTool:update:', error);
        throw error;
      }
    }
  );

  /**
   * Allow a tool by clearing its disallowedAt timestamp.
   */
  ipcMain.handle(IpcChannels.agentTool.allow, (_event: IpcMainInvokeEvent, id: number): AgentTool | undefined => {
    try {
      return agentToolsRepository.allow(id);
    } catch (error) {
      console.error('[IPC Error] agentTool:allow:', error);
      throw error;
    }
  });

  /**
   * Disallow a tool by setting its disallowedAt timestamp.
   */
  ipcMain.handle(IpcChannels.agentTool.disallow, (_event: IpcMainInvokeEvent, id: number): AgentTool | undefined => {
    try {
      return agentToolsRepository.disallow(id);
    } catch (error) {
      console.error('[IPC Error] agentTool:disallow:', error);
      throw error;
    }
  });

  /**
   * Delete a tool by ID.
   */
  ipcMain.handle(IpcChannels.agentTool.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    try {
      return agentToolsRepository.delete(id);
    } catch (error) {
      console.error('[IPC Error] agentTool:delete:', error);
      throw error;
    }
  });
}
