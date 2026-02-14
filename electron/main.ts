import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app, BrowserWindow, globalShortcut, Menu, type MenuItemConstructorOptions } from 'electron';
import serve from 'electron-serve';
import * as path from 'path';

import { closeDatabase, type DrizzleDatabase, initializeDatabase } from '../db';
import { seedDatabase } from '../db/seed';
import { registerAllHandlers } from './ipc';
import { killAllTerminals } from './services/terminal.service';

const isDev = process.env.NODE_ENV === 'development';
const loadURL = isDev ? null : serve({ directory: 'out' });

let db: DrizzleDatabase;
let mainWindow: BrowserWindow | null = null;
let debugWindow: BrowserWindow | null = null;

/**
 * Create the application menu with View menu containing Debug Log Viewer.
 */
function createApplicationMenu(): void {
  const isMac = process.platform === 'darwin';
  const isWindows = process.platform === 'win32';

  // Set the App User Model ID (required for Windows notifications/taskbar grouping)
  if (isWindows) {
    app.setAppUserModelId('ai.clarify.app');
  }

  const template: Array<MenuItemConstructorOptions> = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    // File menu
    {
      label: 'File',
      submenu: isMac ? [{ role: 'close' }] : [{ role: 'quit' }],
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [{ role: 'pasteAndMatchStyle' as const }, { role: 'delete' as const }, { role: 'selectAll' as const }]
          : [{ role: 'delete' as const }, { type: 'separator' as const }, { role: 'selectAll' as const }]),
      ],
    },
    // View menu
    {
      label: 'View',
      submenu: [
        {
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => {
            createDebugWindow();
          },
          label: 'Debug Log Viewer',
        },
        { type: 'separator' },
        {
          accelerator: 'Ctrl+`',
          click: () => {
            mainWindow?.webContents.send('terminal:toggle');
          },
          label: 'Toggle Terminal',
        },
        {
          accelerator: 'Ctrl+Shift+`',
          click: () => {
            mainWindow?.webContents.send('terminal:new');
          },
          label: 'New Terminal',
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Create or focus the debug window.
 * The debug window displays real-time debug logs and can be positioned independently,
 * including on secondary monitors.
 */
async function createDebugWindow(): Promise<BrowserWindow> {
  // If debug window exists and is not destroyed, focus it
  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.focus();
    return debugWindow;
  }

  debugWindow = new BrowserWindow({
    alwaysOnTop: false,
    backgroundColor: '#1a1a1a',
    height: 700,
    minHeight: 400,
    minWidth: 500,
    // Allow positioning on any monitor
    movable: true,
    // No parent - independent window that can be on any monitor
    parent: undefined,
    show: false,
    title: 'Debug Log',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'debug-window', 'preload.js'),
      sandbox: true,
    },
    width: 900,
  });

  debugWindow.once('ready-to-show', () => {
    debugWindow?.show();
  });

  if (isDev) {
    debugWindow.loadURL('http://localhost:3000/debug');
  } else {
    // For production, load the debug route from the static export
    await loadURL?.(debugWindow);
    debugWindow.loadURL(`file://${path.join(__dirname, '../out/debug.html')}`);
  }

  debugWindow.on('closed', () => {
    debugWindow = null;
  });

  return debugWindow;
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    backgroundColor: '#000000',
    height: 1000,
    minHeight: 600,
    minWidth: 800,
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
    width: 1600,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    await loadURL?.(mainWindow);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Get the debug window instance.
 * Used by IPC handlers that need to open/manage the debug window.
 */
function getDebugWindow(): BrowserWindow | null {
  return debugWindow;
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
  const dbPath = isDev ? path.join(process.cwd(), 'clarify-dev.db') : path.join(app.getPath('userData'), 'clarify.db');

  db = initializeDatabase(dbPath);

  // Run migrations
  const migrationsFolder = isDev ? path.join(process.cwd(), 'drizzle') : path.join(process.resourcesPath, 'drizzle');

  migrate(db, { migrationsFolder });

  // Seed built-in data (idempotent - safe to run multiple times)
  seedDatabase(db);
}

/**
 * Register global keyboard shortcuts.
 * Called during app initialization.
 */
function registerGlobalShortcuts(): void {
  // Register Ctrl+Shift+D (Windows/Linux) or Cmd+Shift+D (macOS) to toggle debug window
  const shortcut = process.platform === 'darwin' ? 'Cmd+Shift+D' : 'Ctrl+Shift+D';

  const registered = globalShortcut.register(shortcut, () => {
    toggleDebugWindow();
  });

  if (!registered) {
    console.warn(`Failed to register global shortcut: ${shortcut}`);
  }
}

/**
 * Toggle the debug window visibility.
 * Creates the window if it doesn't exist, or closes it if it does.
 */
async function toggleDebugWindow(): Promise<void> {
  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.close();
  } else {
    await createDebugWindow();
  }
}

app.whenReady().then(async () => {
  // Initialize database first
  initializeDb();

  // Register all IPC handlers with database, window access, and debug window creation
  registerAllHandlers(db, getMainWindow, createDebugWindow);

  // Register global keyboard shortcuts
  registerGlobalShortcuts();

  // Create application menu
  createApplicationMenu();

  // Create the main window
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();

  // Kill all terminal PTY sessions
  killAllTerminals();

  // Close debug window if open
  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.close();
  }

  closeDatabase();
});

// Export functions for use by IPC handlers or other modules
export { createDebugWindow, getDebugWindow, getMainWindow };
