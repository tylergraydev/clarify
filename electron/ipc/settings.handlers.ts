/**
 * Settings IPC Handlers
 *
 * Handles all settings management operations including:
 * - Listing settings with optional category filter
 * - Getting settings by ID, key, or category
 * - Setting values by key
 * - Resetting settings to default values
 * - Bulk updating multiple settings at once
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { SettingsRepository } from '../../db/repositories';
import type { Setting } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Data for bulk updating settings
 */
interface BulkUpdateItem {
  key: string;
  value: string;
}

/**
 * Register all settings-related IPC handlers.
 *
 * @param settingsRepository - The settings repository for database operations
 */
export function registerSettingsHandlers(settingsRepository: SettingsRepository): void {
  // List settings with optional category filter
  ipcMain.handle(
    IpcChannels.settings.list,
    (_event: IpcMainInvokeEvent, options?: { category?: string }): Array<Setting> => {
      try {
        return settingsRepository.findAll(options);
      } catch (error) {
        console.error('[IPC Error] settings:list:', error);
        throw error;
      }
    }
  );

  // Get a setting by ID
  ipcMain.handle(IpcChannels.settings.get, (_event: IpcMainInvokeEvent, id: number): Setting | undefined => {
    try {
      return settingsRepository.findById(id);
    } catch (error) {
      console.error('[IPC Error] settings:get:', error);
      throw error;
    }
  });

  // Get a setting by key
  ipcMain.handle(IpcChannels.settings.getByKey, (_event: IpcMainInvokeEvent, key: string): Setting | undefined => {
    try {
      return settingsRepository.findByKey(key);
    } catch (error) {
      console.error('[IPC Error] settings:getByKey:', error);
      throw error;
    }
  });

  // Get settings by category
  ipcMain.handle(IpcChannels.settings.getByCategory, (_event: IpcMainInvokeEvent, category: string): Array<Setting> => {
    try {
      return settingsRepository.findByCategory(category);
    } catch (error) {
      console.error('[IPC Error] settings:getByCategory:', error);
      throw error;
    }
  });

  // Set a setting value by key
  ipcMain.handle(
    IpcChannels.settings.setValue,
    (_event: IpcMainInvokeEvent, key: string, value: string): Setting | undefined => {
      try {
        return settingsRepository.setValue(key, value);
      } catch (error) {
        console.error('[IPC Error] settings:setValue:', error);
        throw error;
      }
    }
  );

  // Reset a setting to its default value
  ipcMain.handle(
    IpcChannels.settings.resetToDefault,
    (_event: IpcMainInvokeEvent, key: string): Setting | undefined => {
      try {
        return settingsRepository.resetToDefault(key);
      } catch (error) {
        console.error('[IPC Error] settings:resetToDefault:', error);
        throw error;
      }
    }
  );

  // Bulk update multiple settings at once
  ipcMain.handle(
    IpcChannels.settings.bulkUpdate,
    (_event: IpcMainInvokeEvent, updates: Array<BulkUpdateItem>): Array<Setting> => {
      try {
        const results: Array<Setting> = [];

        for (const { key, value } of updates) {
          const result = settingsRepository.setValue(key, value);
          if (result) {
            results.push(result);
          }
        }

        return results;
      } catch (error) {
        console.error('[IPC Error] settings:bulkUpdate:', error);
        throw error;
      }
    }
  );
}
