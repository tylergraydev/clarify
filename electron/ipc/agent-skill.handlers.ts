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
  // List skills for an agent
  ipcMain.handle(
    IpcChannels.agentSkill.list,
    async (_event: IpcMainInvokeEvent, agentId: number): Promise<Array<AgentSkill>> => {
      try {
        return agentSkillsRepository.findByAgentId(agentId);
      } catch (error) {
        console.error('[IPC Error] agentSkill:list:', error);
        throw error;
      }
    }
  );

  // Create a new skill for an agent
  ipcMain.handle(
    IpcChannels.agentSkill.create,
    async (_event: IpcMainInvokeEvent, data: NewAgentSkill): Promise<AgentSkill> => {
      try {
        return agentSkillsRepository.create(data);
      } catch (error) {
        console.error('[IPC Error] agentSkill:create:', error);
        throw error;
      }
    }
  );

  // Update a skill's configuration
  ipcMain.handle(
    IpcChannels.agentSkill.update,
    async (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Omit<NewAgentSkill, 'createdAt' | 'id'>>
    ): Promise<AgentSkill | undefined> => {
      try {
        return agentSkillsRepository.update(id, data);
      } catch (error) {
        console.error('[IPC Error] agentSkill:update:', error);
        throw error;
      }
    }
  );

  // Set skill required status
  ipcMain.handle(
    IpcChannels.agentSkill.setRequired,
    async (_event: IpcMainInvokeEvent, id: number, required: boolean): Promise<AgentSkill | undefined> => {
      try {
        return agentSkillsRepository.setRequired(id, required);
      } catch (error) {
        console.error('[IPC Error] agentSkill:setRequired:', error);
        throw error;
      }
    }
  );

  // Delete a skill
  ipcMain.handle(IpcChannels.agentSkill.delete, async (_event: IpcMainInvokeEvent, id: number): Promise<void> => {
    try {
      return agentSkillsRepository.delete(id);
    } catch (error) {
      console.error('[IPC Error] agentSkill:delete:', error);
      throw error;
    }
  });
}
