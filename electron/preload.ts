import { contextBridge, ipcRenderer } from "electron";

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
    getPath: (name) => ipcRenderer.invoke("app:getPath", name),
    getVersion: () => ipcRenderer.invoke("app:getVersion"),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
    openFile: (filters) => ipcRenderer.invoke("dialog:openFile", filters),
    saveFile: (defaultPath, filters) =>
      ipcRenderer.invoke("dialog:saveFile", defaultPath, filters),
  },
  fs: {
    exists: (path) => ipcRenderer.invoke("fs:exists", path),
    readDirectory: (path) => ipcRenderer.invoke("fs:readDirectory", path),
    readFile: (path) => ipcRenderer.invoke("fs:readFile", path),
    stat: (path) => ipcRenderer.invoke("fs:stat", path),
    writeFile: (path, content) =>
      ipcRenderer.invoke("fs:writeFile", path, content),
  },
  store: {
    delete: (key) => ipcRenderer.invoke("store:delete", key),
    get: <T>(key: string) =>
      ipcRenderer.invoke("store:get", key) as Promise<T | undefined>,
    set: (key, value) => ipcRenderer.invoke("store:set", key, value),
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
