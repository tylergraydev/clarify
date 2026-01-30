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
 * - Importing agents from markdown files
 * - Exporting agents to markdown format
 */
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type {
  AgentSkillsRepository,
  AgentsRepository,
  AgentToolsRepository,
  ProjectsRepository,
} from "../../db/repositories";
import type { Agent, AgentSkill, AgentTool, NewAgent } from "../../db/schema";

import { serializeAgentToMarkdown } from "../../lib/utils/agent-markdown";
import {
  type AgentImportData,
  prepareAgentImportData,
  validateAgentImport,
} from "../../lib/validations/agent-import";
import { IpcChannels } from "./channels";

/**
 * Item in batch export result
 */
interface AgentExportBatchItem {
  agentName: string;
  error?: string;
  markdown?: string;
  success: boolean;
}

/**
 * Result type for agent export operations
 */
interface AgentExportResult {
  error?: string;
  markdown?: string;
  success: boolean;
}

/**
 * Input data for agent import - parsed markdown data from the renderer.
 * The renderer is responsible for parsing the markdown file before sending.
 */
interface AgentImportInput {
  frontmatter: {
    color?: string;
    description?: string;
    displayName: string;
    name: string;
    skills?: Array<{ isRequired: boolean; skillName: string }>;
    tools?: Array<{ pattern?: string; toolName: string }>;
    type: string;
    version: number;
  };
  systemPrompt: string;
}

/**
 * Result type for agent import operations
 */
interface AgentImportResult {
  agent?: Agent;
  errors?: Array<{ field: string; message: string }>;
  success: boolean;
  warnings?: Array<{ field: string; message: string }>;
}

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
  /**
   * When true, includes the skills array for each agent.
   * Useful for displaying skill counts in table views.
   */
  includeSkills?: boolean;
  /**
   * When true, includes the tools array for each agent.
   * Useful for displaying tool counts in table views.
   */
  includeTools?: boolean;
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
 * Extended Agent type that includes optional tools and skills arrays
 * for list responses when includeTools/includeSkills filters are used.
 */
interface AgentWithRelations extends Agent {
  skills?: Array<AgentSkill>;
  tools?: Array<AgentTool>;
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
 * @param projectsRepository - The projects repository for move/copy validation
 */
export function registerAgentHandlers(
  agentsRepository: AgentsRepository,
  agentToolsRepository: AgentToolsRepository,
  agentSkillsRepository: AgentSkillsRepository,
  projectsRepository: ProjectsRepository
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
    ): Promise<Array<AgentWithRelations>> => {
      try {
        const agents = await agentsRepository.findAll(filters);

        // If neither includeTools nor includeSkills is requested, return plain agents
        if (!filters?.includeTools && !filters?.includeSkills) {
          return agents;
        }

        // Fetch tools and/or skills for each agent
        const agentsWithRelations: Array<AgentWithRelations> = await Promise.all(
          agents.map(async (agent) => {
            const result: AgentWithRelations = { ...agent };

            if (filters?.includeTools) {
              result.tools = await agentToolsRepository.findByAgentId(agent.id);
            }

            if (filters?.includeSkills) {
              result.skills = await agentSkillsRepository.findByAgentId(agent.id);
            }

            return result;
          })
        );

        return agentsWithRelations;
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

  // Move an agent to a different project (reassign projectId)
  ipcMain.handle(
    IpcChannels.agent.move,
    async (
      _event: IpcMainInvokeEvent,
      agentId: number,
      targetProjectId: null | number
    ): Promise<AgentOperationResult> => {
      try {
        // Validate agent exists
        const agent = await agentsRepository.findById(agentId);
        if (!agent) {
          return { error: "Agent not found", success: false };
        }

        // Built-in agents cannot be moved (they should remain global)
        if (isBuiltInAgent(agent)) {
          return {
            error: "Cannot move built-in agents. Create an override instead.",
            success: false,
          };
        }

        // If moving to a project, validate the project exists
        if (targetProjectId !== null) {
          const project = await projectsRepository.findById(targetProjectId);
          if (!project) {
            return { error: "Target project not found", success: false };
          }

          // Check if project is archived
          if (project.archivedAt !== null) {
            return {
              error: "Cannot move agent to an archived project",
              success: false,
            };
          }
        }

        // Update the agent's projectId
        const updatedAgent = await agentsRepository.update(agentId, {
          projectId: targetProjectId,
        });
        if (!updatedAgent) {
          return { error: "Failed to move agent", success: false };
        }

        return { agent: updatedAgent, success: true };
      } catch (error) {
        console.error("[IPC Error] agent:move:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to move agent",
          success: false,
        };
      }
    }
  );

  // Copy an agent to a specific project (creates a new agent with tools and skills)
  ipcMain.handle(
    IpcChannels.agent.copyToProject,
    async (
      _event: IpcMainInvokeEvent,
      agentId: number,
      targetProjectId: number
    ): Promise<AgentOperationResult> => {
      try {
        // Validate agent exists
        const sourceAgent = await agentsRepository.findById(agentId);
        if (!sourceAgent) {
          return { error: "Agent not found", success: false };
        }

        // Validate projectId is provided and valid
        if (!targetProjectId || targetProjectId <= 0) {
          return {
            error: "A valid target project ID is required",
            success: false,
          };
        }

        // Validate the target project exists
        const project = await projectsRepository.findById(targetProjectId);
        if (!project) {
          return { error: "Target project not found", success: false };
        }

        // Check if project is archived
        if (project.archivedAt !== null) {
          return {
            error: "Cannot copy agent to an archived project",
            success: false,
          };
        }

        // Generate a unique name for the copy
        // Name uses kebab-case to comply with the agent name regex pattern
        let copyNumber = 1;
        let newName = `${sourceAgent.name}-project-${targetProjectId}`;
        let newDisplayName = `${sourceAgent.displayName} (${project.name})`;

        // Check if a copy already exists and increment the number if needed
        let existingAgent = await agentsRepository.findByName(newName);
        while (existingAgent) {
          copyNumber++;
          newName = `${sourceAgent.name}-project-${targetProjectId}-${copyNumber}`;
          newDisplayName = `${sourceAgent.displayName} (${project.name} ${copyNumber})`;
          existingAgent = await agentsRepository.findByName(newName);
        }

        // Create the copy with the target projectId
        const newAgentData: NewAgent = {
          builtInAt: null, // Custom agent, not built-in
          color: sourceAgent.color,
          description: sourceAgent.description,
          displayName: newDisplayName,
          name: newName,
          parentAgentId: sourceAgent.id, // Link to source agent for reference
          projectId: targetProjectId,
          systemPrompt: sourceAgent.systemPrompt,
          type: sourceAgent.type,
          version: 1, // Reset version to 1 for the new copy
        };

        const copiedAgent = await agentsRepository.create(newAgentData);

        // Copy tools from source agent to the new agent
        const sourceTools = await agentToolsRepository.findByAgentId(agentId);
        for (const tool of sourceTools) {
          await agentToolsRepository.create({
            agentId: copiedAgent.id,
            disallowedAt: tool.disallowedAt,
            orderIndex: tool.orderIndex,
            toolName: tool.toolName,
            toolPattern: tool.toolPattern,
          });
        }

        // Copy skills from source agent to the new agent
        const sourceSkills = await agentSkillsRepository.findByAgentId(agentId);
        for (const skill of sourceSkills) {
          await agentSkillsRepository.create({
            agentId: copiedAgent.id,
            orderIndex: skill.orderIndex,
            requiredAt: skill.requiredAt,
            skillName: skill.skillName,
          });
        }

        return { agent: copiedAgent, success: true };
      } catch (error) {
        console.error("[IPC Error] agent:copyToProject:", error);
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to copy agent to project",
          success: false,
        };
      }
    }
  );

  // Import an agent from parsed markdown data
  ipcMain.handle(
    IpcChannels.agent.import,
    async (
      _event: IpcMainInvokeEvent,
      parsedMarkdown: AgentImportInput
    ): Promise<AgentImportResult> => {
      try {
        // Prepare the data for validation
        const importData = prepareAgentImportData(parsedMarkdown);

        // Validate the import data
        const validationResult = validateAgentImport(importData);
        if (!validationResult.success || !validationResult.data) {
          return {
            errors: validationResult.errors,
            success: false,
            warnings: validationResult.warnings,
          };
        }

        const validatedData: AgentImportData = validationResult.data;

        // Check for duplicate agent names in database
        const existingAgent = await agentsRepository.findByName(
          validatedData.name
        );
        if (existingAgent) {
          return {
            errors: [
              {
                field: "name",
                message: `An agent with the name "${validatedData.name}" already exists`,
              },
            ],
            success: false,
            warnings: validationResult.warnings,
          };
        }

        // Create the agent record
        const newAgentData: NewAgent = {
          builtInAt: null, // Imported agents are not built-in
          color: validatedData.color ?? null,
          description: validatedData.description ?? null,
          displayName: validatedData.displayName,
          name: validatedData.name,
          parentAgentId: null,
          projectId: null, // Imported agents are global by default
          systemPrompt: validatedData.systemPrompt,
          type: validatedData.type,
          version: validatedData.version ?? 1,
        };

        const createdAgent = await agentsRepository.create(newAgentData);

        // Create associated tools
        if (validatedData.tools && validatedData.tools.length > 0) {
          for (let i = 0; i < validatedData.tools.length; i++) {
            const tool = validatedData.tools[i];
            if (tool) {
              await agentToolsRepository.create({
                agentId: createdAgent.id,
                disallowedAt: null,
                orderIndex: i,
                toolName: tool.toolName,
                toolPattern: tool.pattern ?? "*",
              });
            }
          }
        }

        // Create associated skills
        if (validatedData.skills && validatedData.skills.length > 0) {
          for (let i = 0; i < validatedData.skills.length; i++) {
            const skill = validatedData.skills[i];
            if (skill) {
              await agentSkillsRepository.create({
                agentId: createdAgent.id,
                orderIndex: i,
                requiredAt: skill.isRequired ? new Date().toISOString() : null,
                skillName: skill.skillName,
              });
            }
          }
        }

        return {
          agent: createdAgent,
          success: true,
          warnings: validationResult.warnings,
        };
      } catch (error) {
        console.error("[IPC Error] agent:import:", error);
        return {
          errors: [
            {
              field: "_root",
              message:
                error instanceof Error ? error.message : "Failed to import agent",
            },
          ],
          success: false,
        };
      }
    }
  );

  // Export an agent to markdown format
  ipcMain.handle(
    IpcChannels.agent.export,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<AgentExportResult> => {
      try {
        // Fetch the agent
        const agent = await agentsRepository.findById(id);
        if (!agent) {
          return { error: "Agent not found", success: false };
        }

        // Fetch associated tools and skills
        const tools = await agentToolsRepository.findByAgentId(id);
        const skills = await agentSkillsRepository.findByAgentId(id);

        // Serialize to markdown format
        const markdown = serializeAgentToMarkdown({
          agent: {
            color: agent.color,
            description: agent.description,
            displayName: agent.displayName,
            name: agent.name,
            systemPrompt: agent.systemPrompt,
            type: agent.type,
          },
          skills: skills.map((skill) => ({
            requiredAt: skill.requiredAt,
            skillName: skill.skillName,
          })),
          tools: tools.map((tool) => ({
            toolName: tool.toolName,
            toolPattern: tool.toolPattern,
          })),
        });

        return { markdown, success: true };
      } catch (error) {
        console.error("[IPC Error] agent:export:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to export agent",
          success: false,
        };
      }
    }
  );

  // Export multiple agents to markdown format (batch export)
  ipcMain.handle(
    IpcChannels.agent.exportBatch,
    async (
      _event: IpcMainInvokeEvent,
      ids: Array<number>
    ): Promise<Array<AgentExportBatchItem>> => {
      const results: Array<AgentExportBatchItem> = [];

      for (const id of ids) {
        try {
          // Fetch the agent
          const agent = await agentsRepository.findById(id);
          if (!agent) {
            results.push({
              agentName: `Unknown (ID: ${id})`,
              error: "Agent not found",
              success: false,
            });
            continue;
          }

          // Fetch associated tools and skills
          const tools = await agentToolsRepository.findByAgentId(id);
          const skills = await agentSkillsRepository.findByAgentId(id);

          // Serialize to markdown format
          const markdown = serializeAgentToMarkdown({
            agent: {
              color: agent.color,
              description: agent.description,
              displayName: agent.displayName,
              name: agent.name,
              systemPrompt: agent.systemPrompt,
              type: agent.type,
            },
            skills: skills.map((skill) => ({
              requiredAt: skill.requiredAt,
              skillName: skill.skillName,
            })),
            tools: tools.map((tool) => ({
              toolName: tool.toolName,
              toolPattern: tool.toolPattern,
            })),
          });

          results.push({
            agentName: agent.name,
            markdown,
            success: true,
          });
        } catch (error) {
          console.error(`[IPC Error] agent:exportBatch (ID: ${id}):`, error);
          results.push({
            agentName: `Unknown (ID: ${id})`,
            error:
              error instanceof Error ? error.message : "Failed to export agent",
            success: false,
          });
        }
      }

      return results;
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
