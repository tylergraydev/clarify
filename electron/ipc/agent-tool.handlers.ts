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
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { AgentToolsRepository } from "../../db/repositories";
import type { AgentTool, NewAgentTool } from "../../db/schema";

import { IpcChannels } from "./channels";

/**
 * Register all agent tool-related IPC handlers.
 *
 * @param agentToolsRepository - The agent tools repository for database operations
 */
export function registerAgentToolHandlers(
  agentToolsRepository: AgentToolsRepository
): void {
  // List tools for an agent
  ipcMain.handle(
    IpcChannels.agentTool.list,
    async (
      _event: IpcMainInvokeEvent,
      agentId: number
    ): Promise<Array<AgentTool>> => {
      return agentToolsRepository.findByAgentId(agentId);
    }
  );

  // Create a new tool for an agent
  ipcMain.handle(
    IpcChannels.agentTool.create,
    async (
      _event: IpcMainInvokeEvent,
      data: NewAgentTool
    ): Promise<AgentTool> => {
      return agentToolsRepository.create(data);
    }
  );

  // Update a tool's configuration
  ipcMain.handle(
    IpcChannels.agentTool.update,
    async (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Omit<NewAgentTool, "createdAt" | "id">>
    ): Promise<AgentTool | undefined> => {
      return agentToolsRepository.update(id, data);
    }
  );

  // Allow a tool (clear disallowedAt)
  ipcMain.handle(
    IpcChannels.agentTool.allow,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<AgentTool | undefined> => {
      return agentToolsRepository.allow(id);
    }
  );

  // Disallow a tool (set disallowedAt)
  ipcMain.handle(
    IpcChannels.agentTool.disallow,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<AgentTool | undefined> => {
      return agentToolsRepository.disallow(id);
    }
  );

  // Delete a tool
  ipcMain.handle(
    IpcChannels.agentTool.delete,
    async (_event: IpcMainInvokeEvent, id: number): Promise<void> => {
      return agentToolsRepository.delete(id);
    }
  );
}
