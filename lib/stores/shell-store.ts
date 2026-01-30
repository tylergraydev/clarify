import { create } from "zustand";

/**
 * Shell actions interface for modifying shell state.
 */
export interface ShellActions {
  /** Set the currently active navigation item */
  setActiveNavItem: (item: null | string) => void;
  /** Set the mobile drawer open state */
  setMobileDrawerOpen: (open: boolean) => void;
  /** Set the currently selected project */
  setSelectedProject: (id: null | number) => void;
  /** Explicitly set sidebar collapsed state */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Toggle sidebar between collapsed and expanded states */
  toggleSidebar: () => void;
  /** Update the last sync timestamp */
  updateLastSync: (timestamp: Date) => void;
}

/**
 * Shell state interface for sidebar and navigation state management.
 */
export interface ShellState {
  /** Currently active navigation item identifier */
  activeNavItem: null | string;
  /** Whether the mobile navigation drawer is open */
  isMobileDrawerOpen: boolean;
  /** Whether the sidebar is currently collapsed */
  isSidebarCollapsed: boolean;
  /** Timestamp of the last data sync operation */
  lastSyncTimestamp: Date | null;
  /** Currently selected project ID */
  selectedProjectId: null | number;
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
  // Initial state
  isMobileDrawerOpen: false,
  isSidebarCollapsed: false,
  lastSyncTimestamp: null,
  selectedProjectId: null,

  setActiveNavItem: (item: null | string) => {
    set({ activeNavItem: item });
  },

  setMobileDrawerOpen: (open: boolean) => {
    set({ isMobileDrawerOpen: open });
  },

  setSelectedProject: (id: null | number) => {
    set({ selectedProjectId: id });
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ isSidebarCollapsed: collapsed });
  },

  // Actions
  toggleSidebar: () => {
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }));
  },

  updateLastSync: (timestamp: Date) => {
    set({ lastSyncTimestamp: timestamp });
  },
}));
