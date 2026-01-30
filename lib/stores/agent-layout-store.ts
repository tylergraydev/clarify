import { create } from "zustand";

import {
  AGENT_LAYOUT_STORAGE_KEY,
  AgentLayout,
  DEFAULT_AGENT_LAYOUT,
} from "../layout/constants";

/**
 * Agent layout state interface for managing layout preference.
 */
export interface AgentLayoutState {
  /** Currently selected layout for the agents view */
  layout: AgentLayout;
}

/**
 * Agent layout actions interface for modifying layout state.
 */
export interface AgentLayoutActions {
  /** Set the layout preference and persist to electron-store */
  setLayout: (layout: AgentLayout) => void;
}

/**
 * Combined agent layout store type for state and actions.
 */
export type AgentLayoutStore = AgentLayoutActions & AgentLayoutState;

/**
 * Zustand store for managing agent layout preference with persistence
 * to electron-store.
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
}));
