/**
 * Electron Store IPC Handlers
 *
 * Provides persistent key-value storage operations for the renderer process.
 * Uses electron-store for cross-platform persistent storage.
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import Store from 'electron-store';

import { IpcChannels } from './channels';

interface StoreType {
  delete(key: string): void;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

const store = new Store() as unknown as StoreType;

/**
 * Register all electron-store IPC handlers.
 */
export function registerStoreHandlers(): void {
  ipcMain.handle(IpcChannels.store.get, (_event: IpcMainInvokeEvent, key: string): unknown => {
    try {
      return store.get(key);
    } catch (error) {
      console.error('[IPC Error] store:get:', error);
      return undefined;
    }
  });

  ipcMain.handle(IpcChannels.store.set, (_event: IpcMainInvokeEvent, key: string, value: unknown): boolean => {
    try {
      store.set(key, value);
      return true;
    } catch (error) {
      console.error('[IPC Error] store:set:', error);
      return false;
    }
  });

  ipcMain.handle(IpcChannels.store.delete, (_event: IpcMainInvokeEvent, key: string): boolean => {
    try {
      store.delete(key);
      return true;
    } catch (error) {
      console.error('[IPC Error] store:delete:', error);
      return false;
    }
  });
}
