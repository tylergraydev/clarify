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
    (
      _event: IpcMainInvokeEvent,
      workflowStepId: number,
      options?: { priority?: string }
    ): Array<DiscoveredFile> => {
      return discoveredFilesRepository.findAll({
        priority: options?.priority,
        workflowStepId,
      });
    }
  );

  // Batch update discovered files for a workflow step
  ipcMain.handle(
    IpcChannels.discovery.update,
    (_event: IpcMainInvokeEvent, updates: Array<BatchUpdateInput>): Array<DiscoveredFile | undefined> => {
      return updates.map((update) => discoveredFilesRepository.update(update.id, update.data));
    }
  );

  // Include a file in the discovery results
  ipcMain.handle(
    IpcChannels.discovery.include,
    (_event: IpcMainInvokeEvent, id: number): DiscoveredFile | undefined => {
      return discoveredFilesRepository.include(id);
    }
  );

  // Exclude a file from discovery results
  ipcMain.handle(
    IpcChannels.discovery.exclude,
    (_event: IpcMainInvokeEvent, id: number): DiscoveredFile | undefined => {
      return discoveredFilesRepository.exclude(id);
    }
  );

  // Add a user file to discovery
  ipcMain.handle(
    IpcChannels.discovery.add,
    (_event: IpcMainInvokeEvent, data: NewDiscoveredFile): DiscoveredFile => {
      const file = discoveredFilesRepository.create(data);
      // Mark as user-added
      return discoveredFilesRepository.markUserAdded(file.id) ?? file;
    }
  );

  // Update file priority
  ipcMain.handle(
    IpcChannels.discovery.updatePriority,
    (_event: IpcMainInvokeEvent, id: number, priority: string): DiscoveredFile | undefined => {
      return discoveredFilesRepository.updatePriority(id, priority);
    }
  );
}
