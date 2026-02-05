/**
 * App IPC Handlers
 *
 * Provides application information operations for the renderer process.
 * Exposes Electron app APIs in a controlled manner.
 */
import { app, ipcMain, type IpcMainInvokeEvent } from 'electron';

import { IpcChannels } from './channels';

/**
 * Register all app info IPC handlers.
 */
export function registerAppHandlers(): void {
  ipcMain.handle(IpcChannels.app.getVersion, (): string => {
    try {
      return app.getVersion();
    } catch (error) {
      console.error('[IPC Error] app:getVersion:', error);
      throw error;
    }
  });

  ipcMain.handle(
    IpcChannels.app.getPath,
    (
      _event: IpcMainInvokeEvent,
      name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'
    ): string => {
      try {
        return app.getPath(name);
      } catch (error) {
        console.error('[IPC Error] app:getPath:', error);
        throw error;
      }
    }
  );
}
