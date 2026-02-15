import { create } from 'zustand';

import {
  DEFAULT_FILE_EXPLORER_PANEL_OPEN,
  DEFAULT_FILE_EXPLORER_PANEL_WIDTH,
  FILE_EXPLORER_PANEL_OPEN_STORAGE_KEY,
  FILE_EXPLORER_PANEL_WIDTH_STORAGE_KEY,
} from '../layout/constants';

export interface FileExplorerActions {
  addFileSelection: (relativePath: string) => void;
  clearFileSelections: () => void;
  collapseAll: () => void;
  collapseDir: (dirPath: string) => void;
  expandDir: (dirPath: string) => void;
  removeFileSelection: (relativePath: string) => void;
  reset: () => void;
  setOpen: (open: boolean) => void;
  setPanelWidth: (width: number) => void;
  setPreviewFile: (relativePath: null | string) => void;
  toggleDir: (dirPath: string) => void;
  toggleFileSelection: (relativePath: string) => void;
  togglePanel: () => void;
}

export interface FileExplorerState {
  expandedDirs: Set<string>;
  isOpen: boolean;
  panelWidth: number;
  previewFilePath: null | string;
  selectedFiles: Array<{ relativePath: string }>;
}

export type FileExplorerStore = FileExplorerActions & FileExplorerState;

export const useFileExplorerStore = create<FileExplorerStore>()((set) => ({
  addFileSelection: (relativePath: string) => {
    set((state) => {
      if (state.selectedFiles.some((f) => f.relativePath === relativePath)) return state;
      return { selectedFiles: [...state.selectedFiles, { relativePath }] };
    });
  },

  clearFileSelections: () => {
    set({ selectedFiles: [] });
  },

  collapseAll: () => {
    set({ expandedDirs: new Set() });
  },

  collapseDir: (dirPath: string) => {
    set((state) => {
      const next = new Set(state.expandedDirs);
      next.delete(dirPath);
      return { expandedDirs: next };
    });
  },

  expandDir: (dirPath: string) => {
    set((state) => {
      const next = new Set(state.expandedDirs);
      next.add(dirPath);
      return { expandedDirs: next };
    });
  },

  expandedDirs: new Set<string>(),

  isOpen: DEFAULT_FILE_EXPLORER_PANEL_OPEN,

  panelWidth: DEFAULT_FILE_EXPLORER_PANEL_WIDTH,

  previewFilePath: null,

  removeFileSelection: (relativePath: string) => {
    set((state) => ({
      selectedFiles: state.selectedFiles.filter((f) => f.relativePath !== relativePath),
    }));
  },

  reset: () => {
    set({
      expandedDirs: new Set(),
      isOpen: DEFAULT_FILE_EXPLORER_PANEL_OPEN,
      panelWidth: DEFAULT_FILE_EXPLORER_PANEL_WIDTH,
      previewFilePath: null,
      selectedFiles: [],
    });
  },

  selectedFiles: [],

  setOpen: (open: boolean) => {
    set({ isOpen: open });
    if (typeof window !== 'undefined' && window.electronAPI?.store) {
      window.electronAPI.store.set(FILE_EXPLORER_PANEL_OPEN_STORAGE_KEY, open);
    }
  },

  setPanelWidth: (width: number) => {
    set({ panelWidth: width });
    if (typeof window !== 'undefined' && window.electronAPI?.store) {
      window.electronAPI.store.set(FILE_EXPLORER_PANEL_WIDTH_STORAGE_KEY, width);
    }
  },

  setPreviewFile: (relativePath: null | string) => {
    set({ previewFilePath: relativePath });
  },

  toggleDir: (dirPath: string) => {
    set((state) => {
      const next = new Set(state.expandedDirs);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        next.add(dirPath);
      }
      return { expandedDirs: next };
    });
  },

  toggleFileSelection: (relativePath: string) => {
    set((state) => {
      const exists = state.selectedFiles.some((f) => f.relativePath === relativePath);
      if (exists) {
        return { selectedFiles: state.selectedFiles.filter((f) => f.relativePath !== relativePath) };
      }
      return { selectedFiles: [...state.selectedFiles, { relativePath }] };
    });
  },

  togglePanel: () => {
    set((state) => {
      const newOpen = !state.isOpen;
      if (typeof window !== 'undefined' && window.electronAPI?.store) {
        window.electronAPI.store.set(FILE_EXPLORER_PANEL_OPEN_STORAGE_KEY, newOpen);
      }
      return { isOpen: newOpen };
    });
  },
}));
