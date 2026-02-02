/**
 * Type Declarations for the Debug Window's Global API
 *
 * The debug window uses a separate preload script (`electron/debug-window/preload.ts`)
 * that exposes `window.debugLogAPI` instead of `window.electronAPI`.
 *
 * This file provides TypeScript type declarations for the debug window's renderer
 * process to have proper type safety when accessing the API.
 */

import type { DebugLogAPI } from './debug-log';

/**
 * Augment the global Window interface for the debug window.
 * The debug window's preload script exposes debugLogAPI.
 */
declare global {
  interface Window {
    /**
     * Debug Log API exposed via contextBridge in the debug window.
     * Provides access to log reading, filtering, and file operations.
     *
     * Note: This is only available in the debug window, not the main window.
     * The main window uses `window.electronAPI.debugLog` instead.
     */
    debugLogAPI: DebugLogAPI;
  }
}

export {};
