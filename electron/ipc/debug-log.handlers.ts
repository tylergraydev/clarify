/**
 * Debug Log IPC Handlers
 *
 * Provides debug log operations for the renderer process.
 * Exposes the debug logger service methods via IPC.
 */
import { type BrowserWindow, ipcMain, type IpcMainInvokeEvent, shell } from 'electron';

import type { DebugLogEntry, DebugLogFilters } from '../../types/debug-log';

import { debugLoggerService } from '../services/debug-logger.service';
import { IpcChannels } from './channels';

/**
 * Register all debug log IPC handlers.
 *
 * @param createDebugWindow - Optional function to create/focus the debug window.
 *                            If not provided, openDebugWindow will return a stub response.
 */
export function registerDebugLogHandlers(createDebugWindow?: () => Promise<BrowserWindow>): void {
  ipcMain.handle(
    IpcChannels.debugLog.getLogs,
    async (_event: IpcMainInvokeEvent, filters?: DebugLogFilters): Promise<Array<DebugLogEntry>> => {
      try {
        return debugLoggerService.readLogs(filters);
      } catch (error) {
        console.error('[IPC Error] debugLog:getLogs:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(IpcChannels.debugLog.getLogPath, (): string => {
    try {
      return debugLoggerService.getLogFilePath();
    } catch (error) {
      console.error('[IPC Error] debugLog:getLogPath:', error);
      throw error;
    }
  });

  ipcMain.handle(IpcChannels.debugLog.clearLogs, async (): Promise<{ error?: string; success: boolean }> => {
    try {
      return debugLoggerService.clearLogs();
    } catch (error) {
      console.error('[IPC Error] debugLog:clearLogs:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  });

  ipcMain.handle(IpcChannels.debugLog.openLogFile, async (): Promise<{ error?: string; success: boolean }> => {
    try {
      const logPath = debugLoggerService.getLogFilePath();
      const errorMessage = await shell.openPath(logPath);

      if (errorMessage) {
        return { error: errorMessage, success: false };
      }

      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  });

  ipcMain.handle(IpcChannels.debugLog.getSessionIds, async (): Promise<Array<string>> => {
    try {
      return debugLoggerService.getSessionIds();
    } catch (error) {
      console.error('[IPC Error] debugLog:getSessionIds:', error);
      throw error;
    }
  });

  ipcMain.handle(IpcChannels.debugLog.openDebugWindow, async (): Promise<{ error?: string; success: boolean }> => {
    if (!createDebugWindow) {
      return { error: 'Debug window creation not available', success: false };
    }

    try {
      await createDebugWindow();
      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to open debug window',
        success: false,
      };
    }
  });
}
