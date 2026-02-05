/**
 * Agent Hook IPC Handlers
 *
 * Handles all agent hook management operations including:
 * - Listing hooks for an agent
 * - Creating new hooks
 * - Updating hook configuration
 * - Deleting hooks
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { AgentHooksRepository } from '../../db/repositories';
import type { AgentHook, NewAgentHook } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Register all agent hook-related IPC handlers.
 *
 * @param agentHooksRepository - The agent hooks repository for database operations
 */
export function registerAgentHookHandlers(agentHooksRepository: AgentHooksRepository): void {
  /**
   * List all hooks for a specific agent by agent ID.
   */
  ipcMain.handle(
    IpcChannels.agentHook.list,
    (_event: IpcMainInvokeEvent, agentId: number): Array<AgentHook> => {
      try {
        return agentHooksRepository.findByAgentId(agentId);
      } catch (error) {
        console.error('[IPC Error] agentHook:list:', error);
        throw error;
      }
    }
  );

  /**
   * Create a new hook for an agent.
   */
  ipcMain.handle(
    IpcChannels.agentHook.create,
    (_event: IpcMainInvokeEvent, data: NewAgentHook): AgentHook => {
      try {
        return agentHooksRepository.create(data);
      } catch (error) {
        console.error('[IPC Error] agentHook:create:', error);
        throw error;
      }
    }
  );

  /**
   * Update a hook's configuration (body, matcher, order index, etc.).
   */
  ipcMain.handle(
    IpcChannels.agentHook.update,
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Omit<NewAgentHook, 'createdAt' | 'id'>>
    ): AgentHook | undefined => {
      try {
        return agentHooksRepository.update(id, data);
      } catch (error) {
        console.error('[IPC Error] agentHook:update:', error);
        throw error;
      }
    }
  );

  /**
   * Delete a hook by ID.
   */
  ipcMain.handle(IpcChannels.agentHook.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    try {
      return agentHooksRepository.delete(id);
    } catch (error) {
      console.error('[IPC Error] agentHook:delete:', error);
      throw error;
    }
  });
}
