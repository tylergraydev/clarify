import { create } from 'zustand';

import {
  AGENT_SHOW_BUILTIN_STORAGE_KEY,
  AGENT_SHOW_DEACTIVATED_STORAGE_KEY,
  DEFAULT_AGENT_SHOW_BUILTIN,
  DEFAULT_AGENT_SHOW_DEACTIVATED,
} from '../layout/constants';

/**
 * Agent filter actions interface for modifying state.
 */
export interface AgentLayoutActions {
  /** Set the show built-in preference and persist to electron-store */
  setShowBuiltIn: (show: boolean) => void;
  /** Set the show deactivated preference and persist to electron-store */
  setShowDeactivated: (show: boolean) => void;
}

/**
 * Agent filter state interface for managing filter preferences.
 */
export interface AgentLayoutState {
  /** Whether to show built-in agents */
  showBuiltIn: boolean;
  /** Whether to show deactivated agents */
  showDeactivated: boolean;
}

/**
 * Combined agent filter store type for state and actions.
 */
export type AgentLayoutStore = AgentLayoutActions & AgentLayoutState;

/**
 * Zustand store for managing agent filter preferences with
 * persistence to electron-store.
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
  // Actions
  setShowBuiltIn: (show: boolean) => {
    set({ showBuiltIn: show });

    // Persist to electron-store via IPC
    if (typeof window !== 'undefined' && window.electronAPI?.store) {
      window.electronAPI.store.set(AGENT_SHOW_BUILTIN_STORAGE_KEY, show);
    }
  },

  setShowDeactivated: (show: boolean) => {
    set({ showDeactivated: show });

    // Persist to electron-store via IPC
    if (typeof window !== 'undefined' && window.electronAPI?.store) {
      window.electronAPI.store.set(AGENT_SHOW_DEACTIVATED_STORAGE_KEY, show);
    }
  },

  // Initial state - will be hydrated from electron-store on mount
  showBuiltIn: DEFAULT_AGENT_SHOW_BUILTIN,

  showDeactivated: DEFAULT_AGENT_SHOW_DEACTIVATED,
}));
