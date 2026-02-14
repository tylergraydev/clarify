import { create } from 'zustand';

/**
 * Sort mode for the file list.
 */
export type DiffSortMode = 'changes' | 'name' | 'status';

/**
 * Filter mode for the file list.
 */
export type DiffStatusFilter = 'added' | 'all' | 'deleted' | 'modified' | 'renamed';

/**
 * Diff view actions.
 */
export interface DiffViewActions {
  collapseAllFiles: (filePaths: Array<string>) => void;
  expandAllFiles: () => void;
  reset: () => void;
  setFileSearchQuery: (query: string) => void;
  setSelectedFilePath: (path: null | string) => void;
  setSortMode: (mode: DiffSortMode) => void;
  setStatusFilter: (filter: DiffStatusFilter) => void;
  setViewMode: (mode: DiffViewMode) => void;
  toggleFileCollapsed: (filePath: string) => void;
}

/**
 * View mode for the diff viewer.
 */
export type DiffViewMode = 'split' | 'unified';

/**
 * Diff view state.
 */
export interface DiffViewState {
  collapsedFiles: Set<string>;
  fileSearchQuery: string;
  selectedFilePath: null | string;
  sortMode: DiffSortMode;
  statusFilter: DiffStatusFilter;
  viewMode: DiffViewMode;
}

export type DiffViewStore = DiffViewActions & DiffViewState;

const initialState: DiffViewState = {
  collapsedFiles: new Set(),
  fileSearchQuery: '',
  selectedFilePath: null,
  sortMode: 'name',
  statusFilter: 'all',
  viewMode: 'unified',
};

export const useDiffViewStore = create<DiffViewStore>()((set) => ({
  ...initialState,

  collapseAllFiles: (filePaths: Array<string>) => {
    set({ collapsedFiles: new Set(filePaths) });
  },

  expandAllFiles: () => {
    set({ collapsedFiles: new Set() });
  },

  reset: () => {
    set(initialState);
  },

  setFileSearchQuery: (query: string) => {
    set({ fileSearchQuery: query });
  },

  setSelectedFilePath: (path: null | string) => {
    set({ selectedFilePath: path });
  },

  setSortMode: (mode: DiffSortMode) => {
    set({ sortMode: mode });
  },

  setStatusFilter: (filter: DiffStatusFilter) => {
    set({ statusFilter: filter });
  },

  setViewMode: (mode: DiffViewMode) => {
    set({ viewMode: mode });
  },

  toggleFileCollapsed: (filePath: string) => {
    set((state) => {
      const newCollapsed = new Set(state.collapsedFiles);
      if (newCollapsed.has(filePath)) {
        newCollapsed.delete(filePath);
      } else {
        newCollapsed.add(filePath);
      }
      return { collapsedFiles: newCollapsed };
    });
  },
}));
