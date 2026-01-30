/**
 * File System IPC Handlers
 *
 * Provides secure file system operations for the renderer process.
 * Includes path validation to prevent directory traversal attacks.
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

import { IpcChannels } from './channels';

/**
 * Register all file system IPC handlers.
 */
export function registerFsHandlers(): void {
  ipcMain.handle(
    IpcChannels.fs.readFile,
    async (
      _event: IpcMainInvokeEvent,
      filePath: string
    ): Promise<{ content?: string; error?: string; success: boolean }> => {
      if (!isValidPath(filePath)) {
        return { error: 'Invalid file path', success: false };
      }
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { content, success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }
  );

  ipcMain.handle(
    IpcChannels.fs.writeFile,
    async (
      _event: IpcMainInvokeEvent,
      filePath: string,
      content: string
    ): Promise<{ error?: string; success: boolean }> => {
      if (!isValidPath(filePath)) {
        return { error: 'Invalid file path', success: false };
      }
      try {
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }
  );

  ipcMain.handle(
    IpcChannels.fs.readDirectory,
    async (
      _event: IpcMainInvokeEvent,
      dirPath: string
    ): Promise<{
      entries?: Array<{ isDirectory: boolean; isFile: boolean; name: string }>;
      error?: string;
      success: boolean;
    }> => {
      if (!isValidPath(dirPath)) {
        return { error: 'Invalid directory path', success: false };
      }
      try {
        const dirents = await fs.readdir(dirPath, { withFileTypes: true });
        const entries = dirents.map((dirent) => ({
          isDirectory: dirent.isDirectory(),
          isFile: dirent.isFile(),
          name: dirent.name,
        }));
        return { entries, success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }
  );

  ipcMain.handle(IpcChannels.fs.exists, async (_event: IpcMainInvokeEvent, filePath: string): Promise<boolean> => {
    if (!isValidPath(filePath)) {
      return false;
    }
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(
    IpcChannels.fs.stat,
    async (
      _event: IpcMainInvokeEvent,
      filePath: string
    ): Promise<{
      error?: string;
      stats?: {
        ctime: string;
        isDirectory: boolean;
        isFile: boolean;
        mtime: string;
        size: number;
      };
      success: boolean;
    }> => {
      if (!isValidPath(filePath)) {
        return { error: 'Invalid file path', success: false };
      }
      try {
        const stats = await fs.stat(filePath);
        return {
          stats: {
            ctime: stats.ctime.toISOString(),
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            mtime: stats.mtime.toISOString(),
            size: stats.size,
          },
          success: true,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }
  );
}

/**
 * Path validation to prevent directory traversal attacks
 */
function isValidPath(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  // Prevent paths that try to escape with ..
  return !normalizedPath.includes('..');
}
