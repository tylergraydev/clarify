import { contextBridge, ipcRenderer } from 'electron';

import type { DebugLogAPI, DebugLogFilters } from '../../types/debug-log';

import { IpcChannels } from '../ipc/channels';

/**
 * Debug Log API exposed to the debug window renderer.
 * Provides access to log reading, filtering, and file operations.
 */
const debugLogAPI: DebugLogAPI = {
  clearLogs: () => ipcRenderer.invoke(IpcChannels.debugLog.clearLogs),
  getLogPath: () => ipcRenderer.invoke(IpcChannels.debugLog.getLogPath),
  getLogs: (filters?: DebugLogFilters) => ipcRenderer.invoke(IpcChannels.debugLog.getLogs, filters),
  getSessionIds: () => ipcRenderer.invoke(IpcChannels.debugLog.getSessionIds),
  openLogFile: () => ipcRenderer.invoke(IpcChannels.debugLog.openLogFile),
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
