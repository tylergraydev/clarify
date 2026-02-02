import { contextBridge, ipcRenderer } from 'electron';

import type { DebugLogAPI, DebugLogFilters } from '../../types/debug-log';

/**
 * IPC Channel Constants (Duplicate - Required for Preload)
 *
 * This is a subset of electron/ipc/channels.ts containing only debug log channels.
 * Due to Electron's sandboxed preload restrictions, we cannot import local modules.
 *
 * IMPORTANT: Keep this synchronized with the source in electron/ipc/channels.ts.
 * When adding or modifying debug log channels, update BOTH files.
 */
const DebugLogChannels = {
  clearLogs: 'debugLog:clearLogs',
  getLogPath: 'debugLog:getLogPath',
  getLogs: 'debugLog:getLogs',
  getSessionIds: 'debugLog:getSessionIds',
  openDebugWindow: 'debugLog:openDebugWindow',
  openLogFile: 'debugLog:openLogFile',
} as const;

/**
 * Debug Log API exposed to the debug window renderer.
 * Provides access to log reading, filtering, and file operations.
 */
const debugLogAPI: DebugLogAPI = {
  clearLogs: () => ipcRenderer.invoke(DebugLogChannels.clearLogs),
  getLogPath: () => ipcRenderer.invoke(DebugLogChannels.getLogPath),
  getLogs: (filters?: DebugLogFilters) => ipcRenderer.invoke(DebugLogChannels.getLogs, filters),
  getSessionIds: () => ipcRenderer.invoke(DebugLogChannels.getSessionIds),
  openLogFile: () => ipcRenderer.invoke(DebugLogChannels.openLogFile),
};

/**
 * Expose the debug log API to the renderer process.
 * The debug window uses a separate preload script with a focused API.
 */
contextBridge.exposeInMainWorld('debugLogAPI', debugLogAPI);

/**
 * Type augmentation for the debug window's global scope.
 * This allows TypeScript to recognize window.debugLogAPI.
 */
declare global {
  interface Window {
    debugLogAPI: DebugLogAPI;
  }
}
