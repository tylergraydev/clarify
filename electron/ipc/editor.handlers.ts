/**
 * Editor IPC Handlers
 *
 * Handles editor detection, preference management, and file opening.
 * Stateless handlers — no database dependency.
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type {
  DetectedEditor,
  EditorDefinition,
  EditorPreference,
  OpenInEditorInput,
  OpenInEditorResult,
} from '../../types/editor';

import {
  detectEditors,
  getEditorRegistry,
  getPreference,
  openInEditor,
  setPreference,
} from '../services/editor.service';
import { IpcChannels } from './channels';

/**
 * Register all editor-related IPC handlers.
 */
export function registerEditorHandlers(): void {
  // Detect installed editors on the system
  ipcMain.handle(IpcChannels.editor.detect, async (_event: IpcMainInvokeEvent): Promise<Array<DetectedEditor>> => {
    try {
      return await detectEditors(true);
    } catch (error) {
      console.error('[IPC Error] editor:detect:', error);
      throw error;
    }
  });

  // Get user's preferred editor
  ipcMain.handle(IpcChannels.editor.getPreferred, (_event: IpcMainInvokeEvent): EditorPreference | undefined => {
    try {
      return getPreference();
    } catch (error) {
      console.error('[IPC Error] editor:getPreferred:', error);
      throw error;
    }
  });

  // Get the editor registry (platform-filtered)
  ipcMain.handle(IpcChannels.editor.getRegistry, (_event: IpcMainInvokeEvent): Array<EditorDefinition> => {
    try {
      return getEditorRegistry();
    } catch (error) {
      console.error('[IPC Error] editor:getRegistry:', error);
      throw error;
    }
  });

  // Open a file in the preferred editor
  ipcMain.handle(
    IpcChannels.editor.open,
    async (_event: IpcMainInvokeEvent, input: OpenInEditorInput): Promise<OpenInEditorResult> => {
      try {
        return await openInEditor(input);
      } catch (error) {
        console.error('[IPC Error] editor:open:', error);
        return {
          error: error instanceof Error ? error.message : 'Failed to open editor',
          success: false,
        };
      }
    }
  );

  // Set preferred editor
  ipcMain.handle(IpcChannels.editor.setPreferred, (_event: IpcMainInvokeEvent, pref: EditorPreference): void => {
    try {
      setPreference(pref);
    } catch (error) {
      console.error('[IPC Error] editor:setPreferred:', error);
      throw error;
    }
  });
}
