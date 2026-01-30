import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { app, BrowserWindow } from "electron";
import serve from "electron-serve";
import * as path from "path";

import { closeDatabase, type DrizzleDatabase, initializeDatabase } from "../db";
import { seedDatabase } from "../db/seed";
import { registerAllHandlers } from "./ipc";

const isDev = process.env.NODE_ENV === "development";
const loadURL = isDev ? null : serve({ directory: "out" });

let db: DrizzleDatabase;
let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    backgroundColor: "#000000",
    height: 1000,
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
    width: 1600,
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

/**
 * Get the main BrowserWindow instance.
 * Used by IPC handlers that need access to the window (e.g., dialogs).
 */
function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/**
 * Initialize database, run migrations, and seed built-in data
 */
function initializeDb(): void {
  const dbPath = isDev
    ? path.join(process.cwd(), "clarify-dev.db")
    : path.join(app.getPath("userData"), "clarify.db");

  db = initializeDatabase(dbPath);

  // Run migrations
  const migrationsFolder = isDev
    ? path.join(process.cwd(), "drizzle")
    : path.join(process.resourcesPath, "drizzle");

  migrate(db, { migrationsFolder });

  // Seed built-in data (idempotent - safe to run multiple times)
  seedDatabase(db);
}

app.whenReady().then(async () => {
  // Initialize database first
  initializeDb();

  // Register all IPC handlers with database and window access
  registerAllHandlers(db, getMainWindow);

  // Create the main window
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
