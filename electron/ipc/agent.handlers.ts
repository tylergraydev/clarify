/**
 * Agent IPC Handlers
 *
 * Handles all agent management operations including:
 * - Listing agents with optional filters
 * - Getting agent details by ID
 * - Updating agent configuration (prompts, settings)
 * - Activating and deactivating agents
 * - Resetting agents to built-in defaults
 */
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { AgentsRepository } from "../../db/repositories";
import type { Agent, NewAgent } from "../../db/schema";

import { IpcChannels } from "./channels";

/**
 * Filter options for listing agents
 */
interface AgentListFilters {
  includeDeactivated?: boolean;
  projectId?: number;
  type?: string;
}

/**
 * Register all agent-related IPC handlers.
 *
 * @param agentsRepository - The agents repository for database operations
 */
export function registerAgentHandlers(
  agentsRepository: AgentsRepository
): void {
  // List agents with optional filters
  ipcMain.handle(
    IpcChannels.agent.list,
    async (
      _event: IpcMainInvokeEvent,
      filters?: AgentListFilters
    ): Promise<Array<Agent>> => {
      try {
        return agentsRepository.findAll(filters);
      } catch (error) {
        console.error("[IPC Error] agent:list:", error);
        throw error;
      }
    }
  );

  // Get an agent by ID
  ipcMain.handle(
    IpcChannels.agent.get,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<Agent | undefined> => {
      try {
        return agentsRepository.findById(id);
      } catch (error) {
        console.error("[IPC Error] agent:get:", error);
        throw error;
      }
    }
  );

  // Update an agent's configuration
  ipcMain.handle(
    IpcChannels.agent.update,
    async (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Omit<NewAgent, "createdAt" | "id">>
    ): Promise<Agent | undefined> => {
      try {
        return agentsRepository.update(id, data);
      } catch (error) {
        console.error("[IPC Error] agent:update:", error);
        throw error;
      }
    }
  );

  // Reset an agent to built-in defaults
  // This deactivates any custom agent and activates the built-in version
  ipcMain.handle(
    IpcChannels.agent.reset,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<Agent | undefined> => {
      try {
        // Get the current agent to find its parent (built-in version)
        const agent = await agentsRepository.findById(id);
        if (!agent) {
          return undefined;
        }

        // If this is a custom agent with a parent, deactivate it and activate the parent
        if (agent.parentAgentId !== null) {
          // Deactivate the custom agent
          await agentsRepository.deactivate(id);
          // Activate the parent (built-in) agent
          return agentsRepository.activate(agent.parentAgentId);
        }

        // If this is a built-in agent, just ensure it's active
        return agentsRepository.activate(id);
      } catch (error) {
        console.error("[IPC Error] agent:reset:", error);
        throw error;
      }
    }
  );

  // Activate an agent
  ipcMain.handle(
    IpcChannels.agent.activate,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<Agent | undefined> => {
      try {
        return agentsRepository.activate(id);
      } catch (error) {
        console.error("[IPC Error] agent:activate:", error);
        throw error;
      }
    }
  );

  // Deactivate an agent
  ipcMain.handle(
    IpcChannels.agent.deactivate,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<Agent | undefined> => {
      try {
        return agentsRepository.deactivate(id);
      } catch (error) {
        console.error("[IPC Error] agent:deactivate:", error);
        throw error;
      }
    }
  );
}
