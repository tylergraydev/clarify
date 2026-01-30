import { create } from "zustand";

import {
  AGENT_LAYOUT_STORAGE_KEY,
  AGENT_SHOW_BUILTIN_STORAGE_KEY,
  AGENT_SHOW_DEACTIVATED_STORAGE_KEY,
  AgentLayout,
  DEFAULT_AGENT_LAYOUT,
  DEFAULT_AGENT_SHOW_BUILTIN,
  DEFAULT_AGENT_SHOW_DEACTIVATED,
} from "../layout/constants";

/**
 * Agent layout actions interface for modifying state.
 */
export interface AgentLayoutActions {
  /** Set the layout preference and persist to electron-store */
  setLayout: (layout: AgentLayout) => void;
  /** Set the show built-in preference and persist to electron-store */
  setShowBuiltIn: (show: boolean) => void;
  /** Set the show deactivated preference and persist to electron-store */
  setShowDeactivated: (show: boolean) => void;
}

/**
 * Agent layout state interface for managing layout and filter preferences.
 */
export interface AgentLayoutState {
  /** Currently selected layout for the agents view */
  layout: AgentLayout;
  /** Whether to show built-in agents */
  showBuiltIn: boolean;
  /** Whether to show deactivated agents */
  showDeactivated: boolean;
}

/**
 * Combined agent layout store type for state and actions.
 */
export type AgentLayoutStore = AgentLayoutActions & AgentLayoutState;

/**
 * Zustand store for managing agent layout and filter preferences with
 * persistence to electron-store.
 *
 * @example
 * ```tsx
 * function AgentLayoutToggle() {
 *   const { layout, setLayout } = useAgentLayoutStore();
 *   return (
 *     <ToggleGroup value={layout} onValueChange={setLayout}>
 *       <ToggleGroupItem value="card">Card</ToggleGroupItem>
 *       <ToggleGroupItem value="list">List</ToggleGroupItem>
 *       <ToggleGroupItem value="table">Table</ToggleGroupItem>
 *     </ToggleGroup>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function ShowDeactivatedToggle() {
 *   const { showDeactivated, setShowDeactivated } = useAgentLayoutStore();
 *   return (
 *     <Switch
 *       checked={showDeactivated}
 *       onCheckedChange={setShowDeactivated}
 *     />
 *   );
 * }
 * ```
 */
export const useAgentLayoutStore = create<AgentLayoutStore>()((set) => ({
  // Initial state - will be hydrated from electron-store on mount
  layout: DEFAULT_AGENT_LAYOUT,
  // Actions
  setLayout: (layout: AgentLayout) => {
    set({ layout });

    // Persist to electron-store via IPC
    if (typeof window !== "undefined" && window.electronAPI?.store) {
      window.electronAPI.store.set(AGENT_LAYOUT_STORAGE_KEY, layout);
    }
  },

  setShowBuiltIn: (show: boolean) => {
    set({ showBuiltIn: show });

    // Persist to electron-store via IPC
    if (typeof window !== "undefined" && window.electronAPI?.store) {
      window.electronAPI.store.set(AGENT_SHOW_BUILTIN_STORAGE_KEY, show);
    }
  },

  setShowDeactivated: (show: boolean) => {
    set({ showDeactivated: show });

    // Persist to electron-store via IPC
    if (typeof window !== "undefined" && window.electronAPI?.store) {
      window.electronAPI.store.set(AGENT_SHOW_DEACTIVATED_STORAGE_KEY, show);
    }
  },

  showBuiltIn: DEFAULT_AGENT_SHOW_BUILTIN,

  showDeactivated: DEFAULT_AGENT_SHOW_DEACTIVATED,
}));
