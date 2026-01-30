'use client';

import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';

import {
  AGENT_LAYOUT_STORAGE_KEY,
  type AgentLayout,
  DEFAULT_AGENT_LAYOUT,
} from '@/lib/layout/constants';
import { useAgentLayoutStore } from '@/lib/stores/agent-layout-store';

interface AgentLayoutProviderProps {
  children: ReactNode;
}

/**
 * Provider component that hydrates the agent layout store from electron-store
 * on mount. This ensures layout preference is loaded from persistent storage
 * before rendering, preventing flash of default layout.
 *
 * @example
 * ```tsx
 * <AgentLayoutProvider>
 *   <App />
 * </AgentLayoutProvider>
 * ```
 */
export const AgentLayoutProvider = ({ children }: AgentLayoutProviderProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateLayout = async () => {
      // Check if running in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI?.store) {
        const persistedLayout = await window.electronAPI.store.get<AgentLayout>(
          AGENT_LAYOUT_STORAGE_KEY
        );

        // Validate and hydrate the store with persisted value
        if (
          persistedLayout &&
          ['card', 'list', 'table'].includes(persistedLayout)
        ) {
          useAgentLayoutStore.setState({ layout: persistedLayout });
        }
      }

      setIsHydrated(true);
    };

    hydrateLayout();
  }, []);

  // Prevent flash of default layout by not rendering until hydrated
  if (!isHydrated) {
    return null;
  }

  return children;
};
