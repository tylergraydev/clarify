/**
 * Dialog IPC Handlers
 *
 * Provides native file/directory dialog operations for the renderer process.
 * Uses the main window as the parent for modal dialogs.
 */
import {
  type BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
  type OpenDialogOptions,
  type SaveDialogOptions,
} from 'electron';

import { IpcChannels } from './channels';

/**
 * Register all dialog IPC handlers.
 *
 * @param getMainWindow - Function to get the main BrowserWindow (may be null during startup)
 */
export function registerDialogHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IpcChannels.dialog.openDirectory, async (): Promise<null | string> => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;

    try {
      const options: OpenDialogOptions = {
        properties: ['openDirectory'],
      };
      const result = await dialog.showOpenDialog(mainWindow, options);
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      return result.filePaths[0] ?? null;
    } catch (error) {
      console.error('[IPC Error] dialog:openDirectory:', error);
      throw error;
    }
  });

  ipcMain.handle(
    IpcChannels.dialog.openFile,
    async (
      _event: IpcMainInvokeEvent,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) return null;

      try {
        const options: OpenDialogOptions = {
          filters: filters ?? [{ extensions: ['*'], name: 'All Files' }],
          properties: ['openFile'],
        };
        const result = await dialog.showOpenDialog(mainWindow, options);
        if (result.canceled || result.filePaths.length === 0) {
          return null;
        }
        return result.filePaths[0] ?? null;
      } catch (error) {
        console.error('[IPC Error] dialog:openFile:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    IpcChannels.dialog.saveFile,
    async (
      _event: IpcMainInvokeEvent,
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) return null;

      try {
        const options: SaveDialogOptions = {
          defaultPath,
          filters: filters ?? [{ extensions: ['*'], name: 'All Files' }],
        };
        const result = await dialog.showSaveDialog(mainWindow, options);
        if (result.canceled || !result.filePath) {
          return null;
        }
        return result.filePath;
      } catch (error) {
        console.error('[IPC Error] dialog:saveFile:', error);
        throw error;
      }
    }
  );
}
