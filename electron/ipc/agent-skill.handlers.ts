/**
 * Agent Skill IPC Handlers
 *
 * Handles all agent skill management operations including:
 * - Listing skills for an agent
 * - Creating new skills
 * - Updating skill configuration
 * - Setting skill required status
 * - Deleting skills
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { AgentSkillsRepository } from '../../db/repositories';
import type { AgentSkill, NewAgentSkill } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Register all agent skill-related IPC handlers.
 *
 * @param agentSkillsRepository - The agent skills repository for database operations
 */
export function registerAgentSkillHandlers(agentSkillsRepository: AgentSkillsRepository): void {
  /**
   * List all skills for a specific agent by agent ID.
   */
  ipcMain.handle(IpcChannels.agentSkill.list, (_event: IpcMainInvokeEvent, agentId: number): Array<AgentSkill> => {
    try {
      return agentSkillsRepository.findByAgentId(agentId);
    } catch (error) {
      console.error('[IPC Error] agentSkill:list:', error);
      throw error;
    }
  });

  /**
   * Create a new skill for an agent.
   */
  ipcMain.handle(IpcChannels.agentSkill.create, (_event: IpcMainInvokeEvent, data: NewAgentSkill): AgentSkill => {
    try {
      return agentSkillsRepository.create(data);
    } catch (error) {
      console.error('[IPC Error] agentSkill:create:', error);
      throw error;
    }
  });

  /**
   * Update a skill's configuration (name, order index, etc.).
   */
  ipcMain.handle(
    IpcChannels.agentSkill.update,
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Omit<NewAgentSkill, 'createdAt' | 'id'>>
    ): AgentSkill | undefined => {
      try {
        return agentSkillsRepository.update(id, data);
      } catch (error) {
        console.error('[IPC Error] agentSkill:update:', error);
        throw error;
      }
    }
  );

  /**
   * Set the required status of a skill (sets or clears requiredAt timestamp).
   */
  ipcMain.handle(
    IpcChannels.agentSkill.setRequired,
    (_event: IpcMainInvokeEvent, id: number, required: boolean): AgentSkill | undefined => {
      try {
        return agentSkillsRepository.setRequired(id, required);
      } catch (error) {
        console.error('[IPC Error] agentSkill:setRequired:', error);
        throw error;
      }
    }
  );

  /**
   * Delete a skill by ID.
   */
  ipcMain.handle(IpcChannels.agentSkill.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    try {
      return agentSkillsRepository.delete(id);
    } catch (error) {
      console.error('[IPC Error] agentSkill:delete:', error);
      throw error;
    }
  });
}
