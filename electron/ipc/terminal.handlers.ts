/**
 * Terminal IPC Handlers
 *
 * Registers IPC handlers for terminal PTY management.
 * Uses `ipcMain.on` (fire-and-forget) for input and resize for minimal latency.
 * Uses `ipcMain.handle` for create, kill, getInfo, and listActive.
 */
import type { BrowserWindow } from 'electron';

import { ipcMain } from 'electron';

import type { TerminalCreateOptions } from '../../types/terminal';

import {
  createTerminal,
  getTerminalInfo,
  killTerminal,
  listActiveTerminals,
  resizeTerminal,
  subscribeTerminalData,
  subscribeTerminalExit,
  writeTerminal,
} from '../services/terminal.service';
import { IpcChannels } from './channels';

/**
 * Register all terminal IPC handlers.
 *
 * @param getMainWindow - Function to get the main BrowserWindow for sending data/exit events
 */
export function registerTerminalHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Create a new terminal PTY
  ipcMain.handle(
    IpcChannels.terminal.create,
    async (_event, options?: TerminalCreateOptions) => {
      const info = createTerminal(options);
      const mainWindow = getMainWindow();

      if (mainWindow && !mainWindow.isDestroyed()) {
        // Wire PTY data output to renderer
        subscribeTerminalData(info.terminalId, (data: string) => {
          if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IpcChannels.terminal.data, {
              data,
              terminalId: info.terminalId,
            });
          }
        });

        // Wire PTY exit to renderer
        subscribeTerminalExit(info.terminalId, (exitCode: number) => {
          if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IpcChannels.terminal.exit, {
              exitCode,
              terminalId: info.terminalId,
            });
          }
        });
      }

      return info;
    }
  );

  // User keystrokes — fire-and-forget for minimal latency
  ipcMain.on(IpcChannels.terminal.input, (_event, terminalId: string, data: string) => {
    writeTerminal(terminalId, data);
  });

  // Resize PTY — fire-and-forget
  ipcMain.on(IpcChannels.terminal.resize, (_event, terminalId: string, cols: number, rows: number) => {
    resizeTerminal(terminalId, cols, rows);
  });

  // Kill a terminal PTY
  ipcMain.handle(IpcChannels.terminal.kill, async (_event, terminalId: string) => {
    return killTerminal(terminalId);
  });

  // Get info about a terminal
  ipcMain.handle(IpcChannels.terminal.getInfo, async (_event, terminalId: string) => {
    return getTerminalInfo(terminalId);
  });

  // List active terminal IDs
  ipcMain.handle(IpcChannels.terminal.listActive, async () => {
    return listActiveTerminals();
  });
}
