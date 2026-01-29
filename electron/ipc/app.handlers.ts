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
    return app.getVersion();
  });

  ipcMain.handle(
    IpcChannels.app.getPath,
    (
      _event: IpcMainInvokeEvent,
      name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'
    ): string => {
      return app.getPath(name);
    }
  );
}
