import { create } from 'zustand';

import type { TerminalTab } from '../../types/terminal';

import {
  DEFAULT_TERMINAL_PANEL_HEIGHT,
  DEFAULT_TERMINAL_PANEL_OPEN,
  TERMINAL_PANEL_HEIGHT_STORAGE_KEY,
  TERMINAL_PANEL_OPEN_STORAGE_KEY,
} from '../layout/constants';

/**
 * Terminal store actions.
 */
export interface TerminalActions {
  /** Add a new tab and set it as active */
  addTab: (tab: TerminalTab) => void;
  /** Close a tab by terminalId */
  closeTab: (terminalId: string) => void;
  /** Rename a tab */
  renameTab: (terminalId: string, title: string) => void;
  /** Reset store to defaults */
  reset: () => void;
  /** Set the active tab */
  setActiveTab: (terminalId: null | string) => void;
  /** Set whether the panel is open */
  setOpen: (open: boolean) => void;
  /** Set the panel height */
  setPanelHeight: (height: number) => void;
  /** Toggle the panel open/closed */
  toggle: () => void;
}

/**
 * Terminal store state.
 */
export interface TerminalState {
  /** Currently active tab ID */
  activeTabId: null | string;
  /** Whether the terminal panel is open */
  isOpen: boolean;
  /** Terminal panel height in pixels */
  panelHeight: number;
  /** List of terminal tabs */
  tabs: Array<TerminalTab>;
}

export type TerminalStore = TerminalActions & TerminalState;

export const useTerminalStore = create<TerminalStore>()((set) => ({
  activeTabId: null,
  addTab: (tab: TerminalTab) => {
    set((state) => ({
      activeTabId: tab.terminalId,
      isOpen: true,
      tabs: [...state.tabs, tab],
    }));

    // Persist open state
    if (typeof window !== 'undefined' && window.electronAPI?.store) {
      window.electronAPI.store.set(TERMINAL_PANEL_OPEN_STORAGE_KEY, true);
    }
  },
  closeTab: (terminalId: string) => {
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.terminalId !== terminalId);
      let newActiveTabId = state.activeTabId;

      // If we closed the active tab, switch to the last tab or null
      if (state.activeTabId === terminalId) {
        newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1]!.terminalId : null;
      }

      return {
        activeTabId: newActiveTabId,
        isOpen: newTabs.length > 0 ? state.isOpen : false,
        tabs: newTabs,
      };
    });
  },
  isOpen: DEFAULT_TERMINAL_PANEL_OPEN,

  panelHeight: DEFAULT_TERMINAL_PANEL_HEIGHT,

  renameTab: (terminalId: string, title: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.terminalId === terminalId ? { ...t, title } : t)),
    }));
  },

  reset: () => {
    set({
      activeTabId: null,
      isOpen: DEFAULT_TERMINAL_PANEL_OPEN,
      panelHeight: DEFAULT_TERMINAL_PANEL_HEIGHT,
      tabs: [],
    });
  },

  setActiveTab: (terminalId: null | string) => {
    set({ activeTabId: terminalId });
  },

  setOpen: (open: boolean) => {
    set({ isOpen: open });

    if (typeof window !== 'undefined' && window.electronAPI?.store) {
      window.electronAPI.store.set(TERMINAL_PANEL_OPEN_STORAGE_KEY, open);
    }
  },

  setPanelHeight: (height: number) => {
    set({ panelHeight: height });

    if (typeof window !== 'undefined' && window.electronAPI?.store) {
      window.electronAPI.store.set(TERMINAL_PANEL_HEIGHT_STORAGE_KEY, height);
    }
  },

  tabs: [],

  toggle: () => {
    set((state) => {
      const newOpen = !state.isOpen;

      if (typeof window !== 'undefined' && window.electronAPI?.store) {
        window.electronAPI.store.set(TERMINAL_PANEL_OPEN_STORAGE_KEY, newOpen);
      }

      return { isOpen: newOpen };
    });
  },
}));
