# IPC Handler Conventions

A comprehensive guide for consistent, type-safe Electron IPC communication patterns in this project.

---

## Tech Stack

- **Framework**: Electron with context isolation
- **IPC Pattern**: Invoke/handle (async request-response)
- **Type Safety**: TypeScript interfaces throughout
- **State Management**: React hooks for renderer access

---

## Architecture Overview

The IPC system consists of four synchronized layers:

```
Renderer Process                    Main Process
┌─────────────────┐                ┌─────────────────┐
│ React Hooks     │                │ Handler Files   │
│ useElectronXxx  │                │ *.handlers.ts   │
└────────┬────────┘                └────────▲────────┘
         │                                  │
         ▼                                  │
┌─────────────────┐                ┌─────────────────┐
│ Preload Script  │◄──────────────►│ IPC Channels    │
│ preload.ts      │  ipcRenderer   │ channels.ts     │
└─────────────────┘    invoke      └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Type Definitions│
│ types/electron  │
└─────────────────┘
```

---

## File Organization

### Directory Structure

```
electron/
  ipc/
    index.ts                  # Central handler registration
    channels.ts               # Channel constant definitions
    app.handlers.ts           # App-related handlers
    dialog.handlers.ts        # Dialog handlers
    fs.handlers.ts            # File system handlers
    store.handlers.ts         # Electron store handlers
    projects.handlers.ts      # Database entity handlers
    repositories.handlers.ts  # Database entity handlers

electron/
  preload.ts                  # Context bridge API exposure

types/
  electron.d.ts               # ElectronAPI type definitions

hooks/
  useElectron.ts              # React hooks for IPC access
```

### File Naming

- Channel definitions: `channels.ts`
- Handler files: `{domain}.handlers.ts` (lowercase, domain-based)
- Central registration: `index.ts`
- Types: `types/electron.d.ts`
- Hooks: `hooks/useElectron.ts`

---

## Channel Definitions

### Channel Object Structure

```typescript
// electron/ipc/channels.ts
export const IpcChannels = {
  app: {
    getPath: "app:getPath",
    getVersion: "app:getVersion",
  },
  db: {
    projects: {
      create: "db:projects:create",
      delete: "db:projects:delete",
      getAll: "db:projects:getAll",
      getById: "db:projects:getById",
      update: "db:projects:update",
    },
    repositories: {
      create: "db:repositories:create",
      delete: "db:repositories:delete",
      getById: "db:repositories:getById",
      getByProjectId: "db:repositories:getByProjectId",
      update: "db:repositories:update",
    },
  },
  dialog: {
    openDirectory: "dialog:openDirectory",
    openFile: "dialog:openFile",
    saveFile: "dialog:saveFile",
  },
  fs: {
    exists: "fs:exists",
    readDirectory: "fs:readDirectory",
    readFile: "fs:readFile",
    stat: "fs:stat",
    writeFile: "fs:writeFile",
  },
  store: {
    delete: "store:delete",
    get: "store:get",
    set: "store:set",
  },
} as const;
```

### Channel Naming Conventions

| Pattern                         | Example              | Use Case                   |
| ------------------------------- | -------------------- | -------------------------- |
| `{domain}:{action}`             | `app:getVersion`     | Simple domain operations   |
| `{domain}:{subdomain}:{action}` | `db:projects:create` | Database entity operations |

**Rules**:

- Use lowercase with colons as separators
- Action names are camelCase: `getAll`, `getById`, `openDirectory`
- Group related channels under domain objects
- Always export as `const` for type inference

---

## Handler Implementation

### Handler File Structure

```typescript
// electron/ipc/{domain}.handlers.ts
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { SomeRepository } from "../../db/repositories";
import type { NewEntity, Entity } from "../../db/schema";

import { IpcChannels } from "./channels";

export function registerDomainHandlers(repository: SomeRepository): void {
  ipcMain.handle(
    IpcChannels.domain.action,
    (_event: IpcMainInvokeEvent, arg: ArgType): ReturnType => {
      return repository.method(arg);
    }
  );

  // Additional handlers...
}
```

### Handler Patterns by Domain

#### Database Entity Handlers

```typescript
// electron/ipc/projects.handlers.ts
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { ProjectsRepository } from "../../db/repositories";
import type { NewProject, Project } from "../../db/schema";

import { IpcChannels } from "./channels";

export function registerProjectsHandlers(
  projectsRepository: ProjectsRepository
): void {
  ipcMain.handle(IpcChannels.db.projects.getAll, (): Array<Project> => {
    return projectsRepository.getAll();
  });

  ipcMain.handle(
    IpcChannels.db.projects.getById,
    (_event: IpcMainInvokeEvent, id: number): Project | undefined => {
      return projectsRepository.getById(id);
    }
  );

  ipcMain.handle(
    IpcChannels.db.projects.create,
    (_event: IpcMainInvokeEvent, data: NewProject): Project => {
      return projectsRepository.create(data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.projects.update,
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<NewProject>
    ): Project | undefined => {
      return projectsRepository.update(id, data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.projects.delete,
    (_event: IpcMainInvokeEvent, id: number): boolean => {
      return projectsRepository.delete(id);
    }
  );
}
```

#### Dialog Handlers

```typescript
// electron/ipc/dialog.handlers.ts
import {
  type BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
  type OpenDialogOptions,
  type SaveDialogOptions,
} from "electron";

import { IpcChannels } from "./channels";

export function registerDialogHandlers(
  getMainWindow: () => BrowserWindow | null
): void {
  ipcMain.handle(
    IpcChannels.dialog.openDirectory,
    async (): Promise<null | string> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) return null;

      const options: OpenDialogOptions = {
        properties: ["openDirectory"],
      };
      const result = await dialog.showOpenDialog(mainWindow, options);
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      return result.filePaths[0] ?? null;
    }
  );

  // Additional dialog handlers...
}
```

#### File System Handlers

```typescript
// electron/ipc/fs.handlers.ts
import { ipcMain, type IpcMainInvokeEvent } from "electron";
import * as fs from "fs/promises";
import * as path from "path";

import { IpcChannels } from "./channels";

export function registerFsHandlers(): void {
  ipcMain.handle(
    IpcChannels.fs.readFile,
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

  // Additional fs handlers...
}

// Path validation to prevent directory traversal attacks
function isValidPath(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  return !normalizedPath.includes("..");
}
```

#### Store Handlers

```typescript
// electron/ipc/store.handlers.ts
import { ipcMain, type IpcMainInvokeEvent } from "electron";
import Store from "electron-store";

import { IpcChannels } from "./channels";

interface StoreType {
  delete(key: string): void;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

const store = new Store() as unknown as StoreType;

export function registerStoreHandlers(): void {
  ipcMain.handle(
    IpcChannels.store.get,
    (_event: IpcMainInvokeEvent, key: string): unknown => {
      return store.get(key);
    }
  );

  ipcMain.handle(
    IpcChannels.store.set,
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
    IpcChannels.store.delete,
    (_event: IpcMainInvokeEvent, key: string): boolean => {
      try {
        store.delete(key);
        return true;
      } catch {
        return false;
      }
    }
  );
}
```

### Event Parameter Convention

- Always type as `IpcMainInvokeEvent`
- Prefix with `_` when unused: `_event: IpcMainInvokeEvent`
- Only use event when accessing properties like `event.sender`

---

## Central Handler Registration

### Registration Index File

```typescript
// electron/ipc/index.ts
import type { BrowserWindow } from "electron";

import type { DrizzleDatabase } from "../../db";

import {
  createProjectsRepository,
  createRepositoriesRepository,
} from "../../db/repositories";
import { registerAppHandlers } from "./app.handlers";
import { registerDialogHandlers } from "./dialog.handlers";
import { registerFsHandlers } from "./fs.handlers";
import { registerProjectsHandlers } from "./projects.handlers";
import { registerRepositoriesHandlers } from "./repositories.handlers";
import { registerStoreHandlers } from "./store.handlers";

export { IpcChannels } from "./channels";

export function registerAllHandlers(
  db: DrizzleDatabase,
  getMainWindow: () => BrowserWindow | null
): void {
  // File system handlers
  registerFsHandlers();

  // Dialog handlers (need window reference)
  registerDialogHandlers(getMainWindow);

  // Electron store handlers
  registerStoreHandlers();

  // App info handlers
  registerAppHandlers();

  // Database handlers - Projects
  const projectsRepository = createProjectsRepository(db);
  registerProjectsHandlers(projectsRepository);

  // Database handlers - Repositories
  const repositoriesRepository = createRepositoriesRepository(db);
  registerRepositoriesHandlers(repositoriesRepository);
}
```

### Registration Rules

1. Create repository instances in `registerAllHandlers`, not in handler files
2. Pass dependencies as parameters to registration functions
3. Group registrations with comments by domain
4. Export `IpcChannels` for external use
5. Order: stateless handlers first, then handlers with dependencies

---

## Preload Script

### API Interface and Exposure

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

import type { NewProject, Project } from "../db/schema";

import { IpcChannels } from "./ipc";

export interface ElectronAPI {
  app: {
    getPath(
      name:
        | "appData"
        | "desktop"
        | "documents"
        | "downloads"
        | "home"
        | "temp"
        | "userData"
    ): Promise<string>;
    getVersion(): Promise<string>;
  };
  db: {
    projects: {
      create(data: NewProject): Promise<Project>;
      delete(id: number): Promise<boolean>;
      getAll(): Promise<Array<Project>>;
      getById(id: number): Promise<Project | undefined>;
      update(
        id: number,
        data: Partial<NewProject>
      ): Promise<Project | undefined>;
    };
  };
  dialog: {
    openDirectory(): Promise<null | string>;
    openFile(
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string>;
    saveFile(
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string>;
  };
  fs: {
    exists(path: string): Promise<boolean>;
    readDirectory(path: string): Promise<{
      entries?: Array<{ isDirectory: boolean; isFile: boolean; name: string }>;
      error?: string;
      success: boolean;
    }>;
    readFile(
      path: string
    ): Promise<{ content?: string; error?: string; success: boolean }>;
    stat(path: string): Promise<{
      error?: string;
      stats?: {
        ctime: string;
        isDirectory: boolean;
        isFile: boolean;
        mtime: string;
        size: number;
      };
      success: boolean;
    }>;
    writeFile(
      path: string,
      content: string
    ): Promise<{ error?: string; success: boolean }>;
  };
  store: {
    delete(key: string): Promise<boolean>;
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown): Promise<boolean>;
  };
}

const electronAPI: ElectronAPI = {
  app: {
    getPath: (name) => ipcRenderer.invoke(IpcChannels.app.getPath, name),
    getVersion: () => ipcRenderer.invoke(IpcChannels.app.getVersion),
  },
  db: {
    projects: {
      create: (data) =>
        ipcRenderer.invoke(IpcChannels.db.projects.create, data),
      delete: (id) => ipcRenderer.invoke(IpcChannels.db.projects.delete, id),
      getAll: () => ipcRenderer.invoke(IpcChannels.db.projects.getAll),
      getById: (id) => ipcRenderer.invoke(IpcChannels.db.projects.getById, id),
      update: (id, data) =>
        ipcRenderer.invoke(IpcChannels.db.projects.update, id, data),
    },
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke(IpcChannels.dialog.openDirectory),
    openFile: (filters) =>
      ipcRenderer.invoke(IpcChannels.dialog.openFile, filters),
    saveFile: (defaultPath, filters) =>
      ipcRenderer.invoke(IpcChannels.dialog.saveFile, defaultPath, filters),
  },
  fs: {
    exists: (path) => ipcRenderer.invoke(IpcChannels.fs.exists, path),
    readDirectory: (path) =>
      ipcRenderer.invoke(IpcChannels.fs.readDirectory, path),
    readFile: (path) => ipcRenderer.invoke(IpcChannels.fs.readFile, path),
    stat: (path) => ipcRenderer.invoke(IpcChannels.fs.stat, path),
    writeFile: (path, content) =>
      ipcRenderer.invoke(IpcChannels.fs.writeFile, path, content),
  },
  store: {
    delete: (key) => ipcRenderer.invoke(IpcChannels.store.delete, key),
    get: <T>(key: string) =>
      ipcRenderer.invoke(IpcChannels.store.get, key) as Promise<T | undefined>,
    set: (key, value) => ipcRenderer.invoke(IpcChannels.store.set, key, value),
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
```

### Preload Rules

1. Mirror the `IpcChannels` structure in `ElectronAPI` interface
2. All methods return Promises (via `ipcRenderer.invoke`)
3. Use arrow functions for implementation
4. Import types from `db/schema` or `db/types`
5. Single `contextBridge.exposeInMainWorld` call at the end

---

## Type Definitions

### ElectronAPI Types

```typescript
// types/electron.d.ts
// Re-export database types for renderer use
export type { NewProject, Project } from "../db/types";

export interface ElectronAPI {
  // Mirror the interface from preload.ts exactly
  app: {
    getPath(
      name:
        | "appData"
        | "desktop"
        | "documents"
        | "downloads"
        | "home"
        | "temp"
        | "userData"
    ): Promise<string>;
    getVersion(): Promise<string>;
  };
  db: {
    projects: {
      create(
        data: import("../db/types").NewProject
      ): Promise<import("../db/types").Project>;
      delete(id: number): Promise<boolean>;
      getAll(): Promise<Array<import("../db/types").Project>>;
      getById(id: number): Promise<import("../db/types").Project | undefined>;
      update(
        id: number,
        data: Partial<import("../db/types").NewProject>
      ): Promise<import("../db/types").Project | undefined>;
    };
  };
  // ... additional domains
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
```

### Type Definition Rules

1. Keep `ElectronAPI` in sync with `preload.ts`
2. Re-export schema types from `db/types` for renderer use
3. Augment global `Window` interface with optional `electronAPI`
4. Use `import()` syntax for types when needed
5. Export empty object at end to make it a module

---

## React Hooks

### Hook Structure

```typescript
// hooks/use-electron.ts
"use client";

import { useCallback, useMemo } from "react";

import type { ElectronAPI } from "@/types/electron";

interface UseElectronResult {
  api: ElectronAPI | null;
  isElectron: boolean;
}

export function useElectron(): UseElectronResult {
  const isElectron = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.electronAPI !== undefined;
  }, []);

  const api = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.electronAPI ?? null;
  }, []);

  return { api, isElectron };
}
```

### Domain-Specific Hooks

```typescript
export function useElectronDb() {
  const { api, isElectron } = useElectron();

  const projects = useMemo(
    () => ({
      create: (
        data: Parameters<NonNullable<typeof api>["db"]["projects"]["create"]>[0]
      ) => {
        if (!api) throw new Error("Electron API not available");
        return api.db.projects.create(data);
      },
      delete: (id: number) => {
        if (!api) throw new Error("Electron API not available");
        return api.db.projects.delete(id);
      },
      getAll: () => api?.db.projects.getAll() ?? Promise.resolve([]),
      getById: (id: number) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.projects.getById(id);
      },
      update: (
        id: number,
        data: Parameters<NonNullable<typeof api>["db"]["projects"]["update"]>[1]
      ) => {
        if (!api) throw new Error("Electron API not available");
        return api.db.projects.update(id, data);
      },
    }),
    [api]
  );

  return { isElectron, projects };
}

export function useElectronDialog() {
  const { api, isElectron } = useElectron();

  const openDirectory = useCallback(async (): Promise<null | string> => {
    if (!api) return null;
    return api.dialog.openDirectory();
  }, [api]);

  const openFile = useCallback(
    async (
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string> => {
      if (!api) return null;
      return api.dialog.openFile(filters);
    },
    [api]
  );

  const saveFile = useCallback(
    async (
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string> => {
      if (!api) return null;
      return api.dialog.saveFile(defaultPath, filters);
    },
    [api]
  );

  return {
    isElectron,
    openDirectory,
    openFile,
    saveFile,
  };
}
```

### Hook Naming Conventions

| Hook Name           | Purpose                          |
| ------------------- | -------------------------------- |
| `useElectron`       | Base hook returning api and flag |
| `useElectronApp`    | App info methods                 |
| `useElectronDb`     | Database entity access           |
| `useElectronDialog` | File/directory dialogs           |
| `useElectronFs`     | File system operations           |
| `useElectronStore`  | Persistent key-value storage     |

### Hook Rules

1. Always include `'use client'` directive
2. Return `isElectron` flag for conditional rendering
3. Check `api` availability before calling methods
4. Use `useCallback` for individual methods
5. Use `useMemo` for method objects
6. Handle SSR with `typeof window === 'undefined'` checks
7. For write operations that require api, throw errors
8. For read operations, return safe defaults (`null`, `[]`, `undefined`)

---

## Error Handling Patterns

### Handler Error Patterns

```typescript
// For operations that can fail, return result objects
ipcMain.handle(
  IpcChannels.fs.readFile,
  async (
    _event,
    filePath: string
  ): Promise<{ content?: string; error?: string; success: boolean }> => {
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

// For simple operations, return boolean success
ipcMain.handle(
  IpcChannels.store.set,
  (_event, key: string, value: unknown): boolean => {
    try {
      store.set(key, value);
      return true;
    } catch {
      return false;
    }
  }
);

// For database operations, let errors propagate (handled by query layer)
ipcMain.handle(
  IpcChannels.db.projects.create,
  (_event, data: NewProject): Project => {
    return projectsRepository.create(data);
  }
);
```

---

## Security Considerations

### Path Validation

```typescript
// Always validate paths in fs handlers
function isValidPath(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  return !normalizedPath.includes("..");
}

// Use before any file operation
if (!isValidPath(filePath)) {
  return { error: "Invalid file path", success: false };
}
```

### Context Isolation

- Always use context isolation (enabled by default in Electron)
- Only expose necessary APIs via `contextBridge`
- Never expose `ipcRenderer` directly
- Validate all inputs in main process handlers

### Limited API Surface

- Only expose methods that the renderer actually needs
- Prefer specific methods over generic ones
- Don't expose shell or child_process access unless absolutely necessary

---

## Adding New IPC Handlers Checklist

When adding a new IPC capability, update all four layers:

1. **channels.ts**: Add channel constant
2. **{domain}.handlers.ts**: Implement handler with `ipcMain.handle`
3. **index.ts**: Register handler in `registerAllHandlers`
4. **preload.ts**: Add to `ElectronAPI` interface and implementation
5. **types/electron.d.ts**: Update type definitions
6. **useElectron.ts**: Add React hook (if needed for renderer access)

---

## Essential Rules Summary

1. **Use invoke/handle pattern**: Always use `ipcMain.handle` and `ipcRenderer.invoke`
2. **Channel naming**: `{domain}:{action}` or `{domain}:{subdomain}:{action}`
3. **Handler files**: One file per domain, named `{domain}.handlers.ts`
4. **Registration function**: `registerXxxHandlers(dependencies)` export
5. **Event typing**: `_event: IpcMainInvokeEvent` (underscore prefix if unused)
6. **Preload interface**: Mirror channel structure in `ElectronAPI`
7. **Type definitions**: Keep `types/electron.d.ts` in sync with preload
8. **React hooks**: Domain-specific `useElectronXxx` hooks with availability checks
9. **Error handling**: Use result objects for fallible operations
10. **Security**: Validate paths, use context isolation, limit API surface

---
