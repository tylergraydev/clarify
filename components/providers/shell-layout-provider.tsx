'use client';

import { useEffect, useState } from 'react';

import { SHELL_NAV_ITEMS_EXPANDED_STORAGE_KEY, SHELL_SIDEBAR_COLLAPSED_STORAGE_KEY } from '@/lib/layout/constants';
import { useShellStore } from '@/lib/stores/shell-store';

type ShellLayoutProviderProps = RequiredChildren;

/**
 * Provider component that hydrates the shell store from electron-store
 * on mount. This ensures sidebar and nav-item preferences are loaded from
 * persistent storage before rendering, preventing flash of default values.
 *
 * @example
 * ```tsx
 * <ShellLayoutProvider>
 *   <App />
 * </ShellLayoutProvider>
 * ```
 */
export const ShellLayoutProvider = ({ children }: ShellLayoutProviderProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateStore = async () => {
      // Check if running in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI?.store) {
        // Hydrate sidebar collapsed preference
        const persistedSidebarCollapsed = await window.electronAPI.store.get<boolean>(
          SHELL_SIDEBAR_COLLAPSED_STORAGE_KEY
        );

        // Hydrate expanded nav items preference
        const persistedExpandedNavItems = await window.electronAPI.store.get<Array<string>>(
          SHELL_NAV_ITEMS_EXPANDED_STORAGE_KEY
        );

        // Build state update object
        const stateUpdate: Partial<{
          expandedNavItems: Array<string>;
          isSidebarCollapsed: boolean;
        }> = {};

        // Validate and add isSidebarCollapsed to update
        if (typeof persistedSidebarCollapsed === 'boolean') {
          stateUpdate.isSidebarCollapsed = persistedSidebarCollapsed;
        }

        // Validate and add expandedNavItems to update
        if (Array.isArray(persistedExpandedNavItems)) {
          stateUpdate.expandedNavItems = persistedExpandedNavItems;
        }

        // Apply state update if any values were persisted
        if (Object.keys(stateUpdate).length > 0) {
          useShellStore.setState(stateUpdate);
        }
      }

      setIsHydrated(true);
    };

    void hydrateStore();
  }, []);

  // Prevent flash of default values by not rendering until hydrated
  if (!isHydrated) {
    return null;
  }

  return children;
};
