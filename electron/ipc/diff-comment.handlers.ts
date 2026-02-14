/**
 * Diff Comment IPC Handlers
 *
 * Handles comment CRUD operations for inline diff comments:
 * - Creating, updating, and deleting comments
 * - Listing comments by workflow or file
 * - Toggling resolved state
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { DiffCommentsRepository } from '../../db/repositories';
import type { DiffCommentRow, NewDiffCommentRow } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Register all diff comment IPC handlers.
 */
export function registerDiffCommentHandlers(diffCommentsRepository: DiffCommentsRepository): void {
  // Create a comment
  ipcMain.handle(
    IpcChannels.diffComment.create,
    async (_event: IpcMainInvokeEvent, data: NewDiffCommentRow): Promise<DiffCommentRow> => {
      try {
        return diffCommentsRepository.create(data);
      } catch (error) {
        console.error('[IPC Error] diffComment:create:', error);
        throw error;
      }
    }
  );

  // Update a comment
  ipcMain.handle(
    IpcChannels.diffComment.update,
    async (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Pick<NewDiffCommentRow, 'content'>>
    ): Promise<DiffCommentRow | undefined> => {
      try {
        return diffCommentsRepository.update(id, data);
      } catch (error) {
        console.error('[IPC Error] diffComment:update:', error);
        throw error;
      }
    }
  );

  // Delete a comment
  ipcMain.handle(
    IpcChannels.diffComment.delete,
    async (_event: IpcMainInvokeEvent, id: number): Promise<boolean> => {
      try {
        return diffCommentsRepository.delete(id);
      } catch (error) {
        console.error('[IPC Error] diffComment:delete:', error);
        throw error;
      }
    }
  );

  // List comments by workflow
  ipcMain.handle(
    IpcChannels.diffComment.list,
    async (_event: IpcMainInvokeEvent, workflowId: number): Promise<Array<DiffCommentRow>> => {
      try {
        return diffCommentsRepository.findByWorkflow(workflowId);
      } catch (error) {
        console.error('[IPC Error] diffComment:list:', error);
        throw error;
      }
    }
  );

  // List comments by workflow and file
  ipcMain.handle(
    IpcChannels.diffComment.listByFile,
    async (
      _event: IpcMainInvokeEvent,
      workflowId: number,
      filePath: string
    ): Promise<Array<DiffCommentRow>> => {
      try {
        return diffCommentsRepository.findByWorkflowAndFile(workflowId, filePath);
      } catch (error) {
        console.error('[IPC Error] diffComment:listByFile:', error);
        throw error;
      }
    }
  );

  // Toggle resolved state
  ipcMain.handle(
    IpcChannels.diffComment.toggleResolved,
    async (_event: IpcMainInvokeEvent, id: number): Promise<DiffCommentRow | undefined> => {
      try {
        return diffCommentsRepository.toggleResolved(id);
      } catch (error) {
        console.error('[IPC Error] diffComment:toggleResolved:', error);
        throw error;
      }
    }
  );
}
