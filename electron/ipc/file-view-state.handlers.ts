/**
 * File View State IPC Handlers
 *
 * Handles file view state tracking for diff reviews:
 * - Listing viewed files for a workflow
 * - Marking files as viewed/unviewed
 * - Getting view statistics
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { FileViewStateRepository } from '../../db/repositories';
import type { FileViewStateRow } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Register all file view state IPC handlers.
 */
export function registerFileViewStateHandlers(fileViewStateRepository: FileViewStateRepository): void {
  // List viewed files for a workflow
  ipcMain.handle(
    IpcChannels.fileViewState.list,
    async (_event: IpcMainInvokeEvent, workflowId: number): Promise<Array<FileViewStateRow>> => {
      try {
        return fileViewStateRepository.findByWorkflow(workflowId);
      } catch (error) {
        console.error('[IPC Error] fileViewState:list:', error);
        throw error;
      }
    }
  );

  // Mark a file as viewed
  ipcMain.handle(
    IpcChannels.fileViewState.markViewed,
    async (
      _event: IpcMainInvokeEvent,
      workflowId: number,
      filePath: string
    ): Promise<FileViewStateRow> => {
      try {
        return fileViewStateRepository.markViewed(workflowId, filePath);
      } catch (error) {
        console.error('[IPC Error] fileViewState:markViewed:', error);
        throw error;
      }
    }
  );

  // Mark a file as unviewed
  ipcMain.handle(
    IpcChannels.fileViewState.markUnviewed,
    async (_event: IpcMainInvokeEvent, workflowId: number, filePath: string): Promise<boolean> => {
      try {
        return fileViewStateRepository.markUnviewed(workflowId, filePath);
      } catch (error) {
        console.error('[IPC Error] fileViewState:markUnviewed:', error);
        throw error;
      }
    }
  );

  // Get view statistics
  ipcMain.handle(
    IpcChannels.fileViewState.getStats,
    async (
      _event: IpcMainInvokeEvent,
      workflowId: number,
      totalFiles: number
    ): Promise<{ totalFiles: number; viewedFiles: number }> => {
      try {
        return fileViewStateRepository.getStats(workflowId, totalFiles);
      } catch (error) {
        console.error('[IPC Error] fileViewState:getStats:', error);
        throw error;
      }
    }
  );
}
