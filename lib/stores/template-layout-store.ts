import { create } from 'zustand';

import {
  DEFAULT_TEMPLATE_SHOW_BUILTIN,
  DEFAULT_TEMPLATE_SHOW_DEACTIVATED,
  TEMPLATE_SHOW_BUILTIN_STORAGE_KEY,
  TEMPLATE_SHOW_DEACTIVATED_STORAGE_KEY,
} from '../layout/constants';

/**
 * Template filter actions interface for modifying state.
 */
export interface TemplateLayoutActions {
  /** Set the show built-in preference and persist to electron-store */
  setShowBuiltIn: (show: boolean) => void;
  /** Set the show deactivated preference and persist to electron-store */
  setShowDeactivated: (show: boolean) => void;
}

/**
 * Template filter state interface for managing filter preferences.
 */
export interface TemplateLayoutState {
  /** Whether to show built-in templates */
  showBuiltIn: boolean;
  /** Whether to show deactivated templates */
  showDeactivated: boolean;
}

/**
 * Combined template filter store type for state and actions.
 */
export type TemplateLayoutStore = TemplateLayoutActions & TemplateLayoutState;

/**
 * Zustand store for managing template filter preferences with
 * persistence to electron-store.
 *
 * @example
 * ```tsx
 * function ShowDeactivatedToggle() {
 *   const { showDeactivated, setShowDeactivated } = useTemplateLayoutStore();
 *   return (
 *     <Switch
 *       checked={showDeactivated}
 *       onCheckedChange={setShowDeactivated}
 *     />
 *   );
 * }
 * ```
 */
export const useTemplateLayoutStore = create<TemplateLayoutStore>()((set) => ({
  // Actions
  setShowBuiltIn: (show: boolean) => {
    set({ showBuiltIn: show });

    // Persist to electron-store via IPC
    if (typeof window !== 'undefined' && window.electronAPI?.store) {
      window.electronAPI.store.set(TEMPLATE_SHOW_BUILTIN_STORAGE_KEY, show);
    }
  },

  setShowDeactivated: (show: boolean) => {
    set({ showDeactivated: show });

    // Persist to electron-store via IPC
    if (typeof window !== 'undefined' && window.electronAPI?.store) {
      window.electronAPI.store.set(TEMPLATE_SHOW_DEACTIVATED_STORAGE_KEY, show);
    }
  },

  // Initial state - will be hydrated from electron-store on mount
  showBuiltIn: DEFAULT_TEMPLATE_SHOW_BUILTIN,

  showDeactivated: DEFAULT_TEMPLATE_SHOW_DEACTIVATED,
}));
