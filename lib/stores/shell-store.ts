import { create } from 'zustand';

import {
  DEFAULT_SHELL_NAV_ITEMS_EXPANDED,
  DEFAULT_SHELL_SIDEBAR_COLLAPSED,
  SHELL_NAV_ITEMS_EXPANDED_STORAGE_KEY,
  SHELL_SIDEBAR_COLLAPSED_STORAGE_KEY,
} from '../layout/constants';

/**
 * Shell actions interface for modifying shell state.
 */
export interface ShellActions {
  /** Set the currently active navigation item */
  setActiveNavItem: (item: null | string) => void;
  /** Set the mobile drawer open state */
  setMobileDrawerOpen: (open: boolean) => void;
  /** Set whether a specific nav item is expanded */
  setNavItemExpanded: (itemKey: string, expanded: boolean) => void;
  /** Explicitly set sidebar collapsed state */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Toggle the expanded state of a specific nav item */
  toggleNavItemExpanded: (itemKey: string) => void;
  /** Toggle sidebar between collapsed and expanded states */
  toggleSidebar: () => void;
}

/**
 * Shell state interface for sidebar and navigation state management.
 */
export interface ShellState {
  /** Currently active navigation item identifier */
  activeNavItem: null | string;
  /** Array of nav item keys that are currently expanded */
  expandedNavItems: Array<string>;
  /** Whether the mobile navigation drawer is open */
  isMobileDrawerOpen: boolean;
  /** Whether the sidebar is currently collapsed */
  isSidebarCollapsed: boolean;
}

/**
 * Combined shell store type for state and actions.
 */
export type ShellStore = ShellActions & ShellState;

/**
 * Zustand store for managing shell UI state including sidebar visibility
 * and active navigation tracking.
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const { isSidebarCollapsed, toggleSidebar } = useShellStore();
 *   return (
 *     <aside data-collapsed={isSidebarCollapsed}>
 *       <button onClick={toggleSidebar}>Toggle</button>
 *     </aside>
 *   );
 * }
 * ```
 */
export const useShellStore = create<ShellStore>()((set) => ({
  activeNavItem: null,

  // Initial state - will be hydrated from electron-store on mount
  expandedNavItems: DEFAULT_SHELL_NAV_ITEMS_EXPANDED,
  isMobileDrawerOpen: false,
  isSidebarCollapsed: DEFAULT_SHELL_SIDEBAR_COLLAPSED,

  setActiveNavItem: (item: null | string) => {
    set({ activeNavItem: item });
  },

  setMobileDrawerOpen: (open: boolean) => {
    set({ isMobileDrawerOpen: open });
  },

  setNavItemExpanded: (itemKey: string, expanded: boolean) => {
    set((state) => {
      const newExpandedNavItems = expanded
        ? state.expandedNavItems.includes(itemKey)
          ? state.expandedNavItems
          : [...state.expandedNavItems, itemKey]
        : state.expandedNavItems.filter((key) => key !== itemKey);

      // Persist to electron-store via IPC
      if (typeof window !== 'undefined' && window.electronAPI?.store) {
        window.electronAPI.store.set(SHELL_NAV_ITEMS_EXPANDED_STORAGE_KEY, newExpandedNavItems);
      }

      return { expandedNavItems: newExpandedNavItems };
    });
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ isSidebarCollapsed: collapsed });

    // Persist to electron-store via IPC
    if (typeof window !== 'undefined' && window.electronAPI?.store) {
      window.electronAPI.store.set(SHELL_SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed);
    }
  },

  toggleNavItemExpanded: (itemKey: string) => {
    set((state) => {
      const isExpanded = state.expandedNavItems.includes(itemKey);
      const newExpandedNavItems = isExpanded
        ? state.expandedNavItems.filter((key) => key !== itemKey)
        : [...state.expandedNavItems, itemKey];

      // Persist to electron-store via IPC
      if (typeof window !== 'undefined' && window.electronAPI?.store) {
        window.electronAPI.store.set(SHELL_NAV_ITEMS_EXPANDED_STORAGE_KEY, newExpandedNavItems);
      }

      return { expandedNavItems: newExpandedNavItems };
    });
  },

  toggleSidebar: () => {
    set((state) => {
      const newCollapsed = !state.isSidebarCollapsed;

      // Persist to electron-store via IPC
      if (typeof window !== 'undefined' && window.electronAPI?.store) {
        window.electronAPI.store.set(SHELL_SIDEBAR_COLLAPSED_STORAGE_KEY, newCollapsed);
      }

      return { isSidebarCollapsed: newCollapsed };
    });
  },
}));
