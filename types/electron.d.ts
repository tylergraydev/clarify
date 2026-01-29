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
      filters?: Array<{ name: string; extensions: Array<string> }>
    ): Promise<null | string>;
    saveFile(
      defaultPath?: string,
      filters?: Array<{ name: string; extensions: Array<string> }>
    ): Promise<null | string>;
  };
  fs: {
    exists(path: string): Promise<boolean>;
    readDirectory(path: string): Promise<{
      entries?: Array<{ name: string; isDirectory: boolean; isFile: boolean }>;
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

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
