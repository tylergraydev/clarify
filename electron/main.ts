import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
  type OpenDialogOptions,
  type SaveDialogOptions,
} from "electron";
import serve from "electron-serve";
import Store from "electron-store";
import * as fs from "fs/promises";
import * as path from "path";

import { closeDatabase, DrizzleDatabase } from "../db";
import { initializeDatabase } from "../db";

const isDev = process.env.NODE_ENV === "development";
const loadURL = isDev ? null : serve({ directory: "out" });

interface StoreType {
  delete(key: string): void;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}
const store = new Store() as unknown as StoreType;

let db: DrizzleDatabase;

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    backgroundColor: "#000000",
    height: 800,
    minHeight: 600,
    minWidth: 800,
    show: false,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      sandbox: true,
    },
    width: 1200,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    await loadURL?.(mainWindow);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Initialize database and run migrations
function initializeDb(): void {
  const dbPath = isDev ? path.join(process.cwd(), 'clarify-dev.db') : path.join(app.getPath('userData'), 'clarify.db');

  db = initializeDatabase(dbPath);

  // Run migrations
  const migrationsFolder = isDev ? path.join(process.cwd(), 'drizzle') : path.join(process.resourcesPath, 'drizzle');

  migrate(db, { migrationsFolder });
}

// Path validation to prevent directory traversal attacks
function isValidPath(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  // Prevent paths that try to escape with ..
  if (normalizedPath.includes("..")) {
    return false;
  }
  return true;
}

// IPC Handlers for file system operations
ipcMain.handle(
  "fs:readFile",
  async (
    _event: IpcMainInvokeEvent,
    filePath: string
  ): Promise<{ content?: string; error?: string; success: boolean }> => {
    if (!isValidPath(filePath)) {
      return { error: "Invalid file path", success: false };
    }
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return { content, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      };
    }
  }
);

ipcMain.handle(
  "fs:writeFile",
  async (
    _event: IpcMainInvokeEvent,
    filePath: string,
    content: string
  ): Promise<{ error?: string; success: boolean }> => {
    if (!isValidPath(filePath)) {
      return { error: "Invalid file path", success: false };
    }
    try {
      await fs.writeFile(filePath, content, "utf-8");
      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      };
    }
  }
);

ipcMain.handle(
  "fs:readDirectory",
  async (
    _event: IpcMainInvokeEvent,
    dirPath: string
  ): Promise<{
    entries?: Array<{ isDirectory: boolean; isFile: boolean; name: string }>;
    error?: string;
    success: boolean;
  }> => {
    if (!isValidPath(dirPath)) {
      return { error: "Invalid directory path", success: false };
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
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      };
    }
  }
);

ipcMain.handle(
  "fs:exists",
  async (_event: IpcMainInvokeEvent, filePath: string): Promise<boolean> => {
    if (!isValidPath(filePath)) {
      return false;
    }
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
);

ipcMain.handle(
  "fs:stat",
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
      return { error: "Invalid file path", success: false };
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
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      };
    }
  }
);

// IPC Handlers for dialogs
ipcMain.handle("dialog:openDirectory", async (): Promise<null | string> => {
  const options: OpenDialogOptions = {
    properties: ["openDirectory"],
  };
  const result = await dialog.showOpenDialog(mainWindow!, options);
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0] ?? null;
});

ipcMain.handle(
  "dialog:openFile",
  async (
    _event: IpcMainInvokeEvent,
    filters?: Array<{ extensions: Array<string>; name: string }>
  ): Promise<null | string> => {
    const options: OpenDialogOptions = {
      filters: filters ?? [{ extensions: ["*"], name: "All Files" }],
      properties: ["openFile"],
    };
    const result = await dialog.showOpenDialog(mainWindow!, options);
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0] ?? null;
  }
);

ipcMain.handle(
  "dialog:saveFile",
  async (
    _event: IpcMainInvokeEvent,
    defaultPath?: string,
    filters?: Array<{ extensions: Array<string>; name: string }>
  ): Promise<null | string> => {
    const options: SaveDialogOptions = {
      defaultPath,
      filters: filters ?? [{ extensions: ["*"], name: "All Files" }],
    };
    const result = await dialog.showSaveDialog(mainWindow!, options);
    if (result.canceled || !result.filePath) {
      return null;
    }
    return result.filePath;
  }
);

// IPC Handlers for electron-store
ipcMain.handle(
  "store:get",
  (_event: IpcMainInvokeEvent, key: string): unknown => {
    return store.get(key);
  }
);

ipcMain.handle(
  "store:set",
  (_event: IpcMainInvokeEvent, key: string, value: unknown): boolean => {
    try {
      store.set(key, value);
      return true;
    } catch {
      return false;
    }
  }
);

ipcMain.handle(
  "store:delete",
  (_event: IpcMainInvokeEvent, key: string): boolean => {
    try {
      store.delete(key);
      return true;
    } catch {
      return false;
    }
  }
);

// IPC Handlers for app info
ipcMain.handle("app:getVersion", (): string => {
  return app.getVersion();
});

ipcMain.handle(
  "app:getPath",
  (
    _event: IpcMainInvokeEvent,
    name:
      | "appData"
      | "desktop"
      | "documents"
      | "downloads"
      | "home"
      | "temp"
      | "userData"
  ): string => {
    return app.getPath(name);
  }
);

app.whenReady().then(async () => {
   initializeDb();
   await createWindow();
 });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  closeDatabase();
});

