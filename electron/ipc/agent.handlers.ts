/**
 * Agent IPC Handlers
 *
 * Handles all agent management operations including:
 * - Creating new agents
 * - Listing agents with optional filters
 * - Getting agent details by ID
 * - Updating agent configuration (prompts, settings)
 * - Deleting agents (with built-in protection)
 * - Activating and deactivating agents
 * - Resetting agents to built-in defaults
 */
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type {
  AgentSkillsRepository,
  AgentsRepository,
  AgentToolsRepository,
} from "../../db/repositories";
import type { Agent, NewAgent } from "../../db/schema";

import { IpcChannels } from "./channels";

/**
 * Filter options for listing agents
 */
interface AgentListFilters {
  /**
   * When true, excludes agents that have a projectId set.
   * Useful for showing only global agents in the global view.
   */
  excludeProjectAgents?: boolean;
  includeDeactivated?: boolean;
  projectId?: number;
  /**
   * Filter by agent scope:
   * - "global": Only agents with projectId IS NULL (global agents)
   * - "project": Only agents with projectId IS NOT NULL (project-specific agents)
   */
  scope?: "global" | "project";
  type?: string;
}

/**
 * Result type for operations that can fail due to validation or protection rules
 */
interface AgentOperationResult {
  agent?: Agent;
  error?: string;
  success: boolean;
}

/**
 * Core properties that cannot be modified on built-in agents.
 * Only displayName, description, and color are allowed to be changed.
 */
const BUILT_IN_PROTECTED_FIELDS = new Set(["name", "systemPrompt", "type"]);

/**
 * Register all agent-related IPC handlers.
 *
 * @param agentsRepository - The agents repository for database operations
 * @param agentToolsRepository - The agent tools repository for duplication
 * @param agentSkillsRepository - The agent skills repository for duplication
 */
export function registerAgentHandlers(
  agentsRepository: AgentsRepository,
  agentToolsRepository: AgentToolsRepository,
  agentSkillsRepository: AgentSkillsRepository
): void {
  // Create a new agent
  ipcMain.handle(
    IpcChannels.agent.create,
    async (
      _event: IpcMainInvokeEvent,
      data: NewAgent
    ): Promise<AgentOperationResult> => {
      try {
        // Validate required fields
        if (!data.name || !data.name.trim()) {
          return { error: "Agent name is required", success: false };
        }
        if (!data.displayName || !data.displayName.trim()) {
          return { error: "Agent display name is required", success: false };
        }
        if (!data.systemPrompt || !data.systemPrompt.trim()) {
          return { error: "Agent system prompt is required", success: false };
        }
        if (!data.type || !data.type.trim()) {
          return { error: "Agent type is required", success: false };
        }

        // Check for duplicate names
        const existingAgent = await agentsRepository.findByName(data.name);
        if (existingAgent) {
          return {
            error: `An agent with the name "${data.name}" already exists`,
            success: false,
          };
        }

        const agent = await agentsRepository.create(data);
        return { agent, success: true };
      } catch (error) {
        console.error("[IPC Error] agent:create:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to create agent",
          success: false,
        };
      }
    }
  );

  // Delete an agent (with built-in protection)
  ipcMain.handle(
    IpcChannels.agent.delete,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<AgentOperationResult> => {
      try {
        // Get the agent to check if it's built-in
        const agent = await agentsRepository.findById(id);
        if (!agent) {
          return { error: "Agent not found", success: false };
        }

        // Protect built-in agents from deletion
        if (isBuiltInAgent(agent)) {
          return {
            error:
              "Cannot delete built-in agents. You can only deactivate them.",
            success: false,
          };
        }

        // Delete the custom agent
        await agentsRepository.delete(id);
        return { success: true };
      } catch (error) {
        console.error("[IPC Error] agent:delete:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to delete agent",
          success: false,
        };
      }
    }
  );

  // Duplicate an agent (creates a copy with modified name)
  ipcMain.handle(
    IpcChannels.agent.duplicate,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<AgentOperationResult> => {
      try {
        // Fetch the source agent by ID
        const sourceAgent = await agentsRepository.findById(id);
        if (!sourceAgent) {
          return { error: "Agent not found", success: false };
        }

        // Generate a unique name by appending "-copy" and checking for conflicts
        // Name uses kebab-case to comply with the agent name regex pattern
        // Display name uses human-readable format with spaces
        let copyNumber = 1;
        let newName = `${sourceAgent.name}-copy`;
        let newDisplayName = `${sourceAgent.displayName} (Copy)`;

        // Check if a copy already exists and increment the number if needed
        let existingAgent = await agentsRepository.findByName(newName);
        while (existingAgent) {
          copyNumber++;
          newName = `${sourceAgent.name}-copy-${copyNumber}`;
          newDisplayName = `${sourceAgent.displayName} (Copy ${copyNumber})`;
          existingAgent = await agentsRepository.findByName(newName);
        }

        // Create the duplicate agent with copied data
        const newAgentData: NewAgent = {
          builtInAt: null, // Custom agent, not built-in
          color: sourceAgent.color,
          description: sourceAgent.description,
          displayName: newDisplayName,
          name: newName,
          parentAgentId: null, // No parent for duplicated agents
          projectId: sourceAgent.projectId,
          systemPrompt: sourceAgent.systemPrompt,
          type: sourceAgent.type,
          version: 1, // Reset version to 1 for the new copy
        };

        const duplicatedAgent = await agentsRepository.create(newAgentData);

        // Copy tools from source agent to duplicated agent
        const sourceTools = await agentToolsRepository.findByAgentId(id);
        for (const tool of sourceTools) {
          await agentToolsRepository.create({
            agentId: duplicatedAgent.id,
            disallowedAt: tool.disallowedAt,
            orderIndex: tool.orderIndex,
            toolName: tool.toolName,
            toolPattern: tool.toolPattern,
          });
        }

        // Copy skills from source agent to duplicated agent
        const sourceSkills = await agentSkillsRepository.findByAgentId(id);
        for (const skill of sourceSkills) {
          await agentSkillsRepository.create({
            agentId: duplicatedAgent.id,
            orderIndex: skill.orderIndex,
            requiredAt: skill.requiredAt,
            skillName: skill.skillName,
          });
        }

        return { agent: duplicatedAgent, success: true };
      } catch (error) {
        console.error("[IPC Error] agent:duplicate:", error);
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to duplicate agent",
          success: false,
        };
      }
    }
  );

  // Create a project-specific override of a global agent
  ipcMain.handle(
    IpcChannels.agent.createOverride,
    async (
      _event: IpcMainInvokeEvent,
      agentId: number,
      projectId: number
    ): Promise<AgentOperationResult> => {
      try {
        // Validate projectId
        if (!projectId || projectId <= 0) {
          return {
            error: "A valid project ID is required to create an override",
            success: false,
          };
        }

        // Fetch the source agent by ID
        const sourceAgent = await agentsRepository.findById(agentId);
        if (!sourceAgent) {
          return { error: "Agent not found", success: false };
        }

        // Ensure the source agent is a global agent (no projectId)
        if (sourceAgent.projectId !== null) {
          return {
            error: "Can only create overrides of global agents",
            success: false,
          };
        }

        // Check if an override already exists for this agent and project
        const existingOverrides = await agentsRepository.findAll({
          projectId,
          scope: "project",
        });
        const hasExistingOverride = existingOverrides.some(
          (agent) => agent.parentAgentId === agentId
        );
        if (hasExistingOverride) {
          return {
            error: "An override for this agent already exists in this project",
            success: false,
          };
        }

        // Generate a unique name by appending project ID
        // Name uses kebab-case to comply with the agent name regex pattern
        let newName = `${sourceAgent.name}-project-${projectId}`;
        let newDisplayName = `${sourceAgent.displayName} (Project Override)`;

        // Check for name conflicts (unlikely but handle gracefully)
        let copyNumber = 1;
        let existingAgent = await agentsRepository.findByName(newName);
        while (existingAgent) {
          copyNumber++;
          newName = `${sourceAgent.name}-project-${projectId}-${copyNumber}`;
          newDisplayName = `${sourceAgent.displayName} (Project Override ${copyNumber})`;
          existingAgent = await agentsRepository.findByName(newName);
        }

        // Create the override agent with projectId and parentAgentId set
        const newAgentData: NewAgent = {
          builtInAt: null, // Custom agent, not built-in
          color: sourceAgent.color,
          description: sourceAgent.description,
          displayName: newDisplayName,
          name: newName,
          parentAgentId: agentId, // Links to the global agent
          projectId, // Scoped to the specific project
          systemPrompt: sourceAgent.systemPrompt,
          type: sourceAgent.type,
          version: 1,
        };

        const overrideAgent = await agentsRepository.create(newAgentData);
        return { agent: overrideAgent, success: true };
      } catch (error) {
        console.error("[IPC Error] agent:createOverride:", error);
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to create agent override",
          success: false,
        };
      }
    }
  );

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

  // Update an agent's configuration (with built-in protection)
  ipcMain.handle(
    IpcChannels.agent.update,
    async (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Omit<NewAgent, "createdAt" | "id">>
    ): Promise<AgentOperationResult> => {
      try {
        // Get the agent to check if it's built-in
        const agent = await agentsRepository.findById(id);
        if (!agent) {
          return { error: "Agent not found", success: false };
        }

        // For built-in agents, restrict which fields can be modified
        if (isBuiltInAgent(agent)) {
          const protectedFields = getProtectedFieldsInUpdate(data);
          if (protectedFields.length > 0) {
            return {
              error: `Cannot modify protected properties of built-in agents: ${protectedFields.join(", ")}. Only displayName, description, and color can be changed.`,
              success: false,
            };
          }
        }

        // Perform the update
        const updatedAgent = await agentsRepository.update(id, data);
        if (!updatedAgent) {
          return { error: "Failed to update agent", success: false };
        }

        return { agent: updatedAgent, success: true };
      } catch (error) {
        console.error("[IPC Error] agent:update:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to update agent",
          success: false,
        };
      }
    }
  );

  // Reset an agent to built-in defaults
  // This deletes any custom agent and activates the built-in version
  // Properly cascades to clean up orphaned records
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

        // If this is a custom agent with a parent, delete it entirely and activate the parent
        // This prevents orphaned records from accumulating in the database
        if (agent.parentAgentId !== null) {
          // Store the parent ID before deletion
          const parentId = agent.parentAgentId;
          // Delete the custom agent entirely (not just deactivate)
          await agentsRepository.delete(id);
          // Activate the parent (built-in) agent
          return agentsRepository.activate(parentId);
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

/**
 * Get the protected fields that are being modified in an update.
 *
 * @param data - The update data
 * @returns Array of protected field names being modified
 */
function getProtectedFieldsInUpdate(
  data: Partial<Omit<NewAgent, "createdAt" | "id">>
): Array<string> {
  return Object.keys(data).filter((key) => BUILT_IN_PROTECTED_FIELDS.has(key));
}

/**
 * Check if an agent is a built-in agent.
 *
 * @param agent - The agent to check
 * @returns true if the agent is built-in (has builtInAt set)
 */
function isBuiltInAgent(agent: Agent): boolean {
  return agent.builtInAt !== null;
}
