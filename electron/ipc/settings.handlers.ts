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
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { SettingsRepository } from "../../db/repositories";
import type { Setting } from "../../db/schema";

import { IpcChannels } from "./channels";

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
export function registerSettingsHandlers(
  settingsRepository: SettingsRepository
): void {
  // List settings with optional category filter
  ipcMain.handle(
    IpcChannels.settings.list,
    async (
      _event: IpcMainInvokeEvent,
      options?: { category?: string }
    ): Promise<Array<Setting>> => {
      return settingsRepository.findAll(options);
    }
  );

  // Get a setting by ID
  ipcMain.handle(
    IpcChannels.settings.get,
    async (
      _event: IpcMainInvokeEvent,
      id: number
    ): Promise<Setting | undefined> => {
      return settingsRepository.findById(id);
    }
  );

  // Get a setting by key
  ipcMain.handle(
    IpcChannels.settings.getByKey,
    async (
      _event: IpcMainInvokeEvent,
      key: string
    ): Promise<Setting | undefined> => {
      return settingsRepository.findByKey(key);
    }
  );

  // Get settings by category
  ipcMain.handle(
    IpcChannels.settings.getByCategory,
    async (
      _event: IpcMainInvokeEvent,
      category: string
    ): Promise<Array<Setting>> => {
      return settingsRepository.findByCategory(category);
    }
  );

  // Set a setting value by key
  ipcMain.handle(
    IpcChannels.settings.setValue,
    async (
      _event: IpcMainInvokeEvent,
      key: string,
      value: string
    ): Promise<Setting | undefined> => {
      return settingsRepository.setValue(key, value);
    }
  );

  // Reset a setting to its default value
  ipcMain.handle(
    IpcChannels.settings.resetToDefault,
    async (
      _event: IpcMainInvokeEvent,
      key: string
    ): Promise<Setting | undefined> => {
      return settingsRepository.resetToDefault(key);
    }
  );

  // Bulk update multiple settings at once
  ipcMain.handle(
    IpcChannels.settings.bulkUpdate,
    async (
      _event: IpcMainInvokeEvent,
      updates: Array<BulkUpdateItem>
    ): Promise<Array<Setting>> => {
      const results: Array<Setting> = [];

      for (const { key, value } of updates) {
        const result = await settingsRepository.setValue(key, value);
        if (result) {
          results.push(result);
        }
      }

      return results;
    }
  );
}
