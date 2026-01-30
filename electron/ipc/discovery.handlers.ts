/**
 * Discovery Files IPC Handlers
 *
 * Handles all file discovery operations including:
 * - Listing discovered files by workflow step
 * - Batch updating discovered files
 * - Including/excluding files from discovery results
 * - Adding user files to discovery
 * - Updating file priorities
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { DiscoveredFilesRepository } from '../../db/repositories';
import type { DiscoveredFile, NewDiscoveredFile } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Input for batch update operation
 */
interface BatchUpdateInput {
  data: Partial<NewDiscoveredFile>;
  id: number;
}

/**
 * Register all discovery file-related IPC handlers.
 *
 * @param discoveredFilesRepository - The discovered files repository for database operations
 */
export function registerDiscoveryHandlers(discoveredFilesRepository: DiscoveredFilesRepository): void {
  // List discovered files by workflow step
  ipcMain.handle(
    IpcChannels.discovery.list,
    (_event: IpcMainInvokeEvent, workflowStepId: number, options?: { priority?: string }): Array<DiscoveredFile> => {
      try {
        return discoveredFilesRepository.findAll({
          priority: options?.priority,
          workflowStepId,
        });
      } catch (error) {
        console.error('[IPC Error] discovery:list:', error);
        throw error;
      }
    }
  );

  // Batch update discovered files for a workflow step
  ipcMain.handle(
    IpcChannels.discovery.update,
    (_event: IpcMainInvokeEvent, updates: Array<BatchUpdateInput>): Array<DiscoveredFile | undefined> => {
      try {
        return updates.map((update) => discoveredFilesRepository.update(update.id, update.data));
      } catch (error) {
        console.error('[IPC Error] discovery:update:', error);
        throw error;
      }
    }
  );

  // Include a file in the discovery results
  ipcMain.handle(
    IpcChannels.discovery.include,
    (_event: IpcMainInvokeEvent, id: number): DiscoveredFile | undefined => {
      try {
        return discoveredFilesRepository.include(id);
      } catch (error) {
        console.error('[IPC Error] discovery:include:', error);
        throw error;
      }
    }
  );

  // Exclude a file from discovery results
  ipcMain.handle(
    IpcChannels.discovery.exclude,
    (_event: IpcMainInvokeEvent, id: number): DiscoveredFile | undefined => {
      try {
        return discoveredFilesRepository.exclude(id);
      } catch (error) {
        console.error('[IPC Error] discovery:exclude:', error);
        throw error;
      }
    }
  );

  // Add a user file to discovery
  ipcMain.handle(IpcChannels.discovery.add, (_event: IpcMainInvokeEvent, data: NewDiscoveredFile): DiscoveredFile => {
    try {
      const file = discoveredFilesRepository.create(data);
      // Mark as user-added
      return discoveredFilesRepository.markUserAdded(file.id) ?? file;
    } catch (error) {
      console.error('[IPC Error] discovery:add:', error);
      throw error;
    }
  });

  // Update file priority
  ipcMain.handle(
    IpcChannels.discovery.updatePriority,
    (_event: IpcMainInvokeEvent, id: number, priority: string): DiscoveredFile | undefined => {
      try {
        return discoveredFilesRepository.updatePriority(id, priority);
      } catch (error) {
        console.error('[IPC Error] discovery:updatePriority:', error);
        throw error;
      }
    }
  );
}
