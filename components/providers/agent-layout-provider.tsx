"use client";

import type { ReactNode } from "react";

import { useEffect, useState } from "react";

import {
  AGENT_LAYOUT_STORAGE_KEY,
  AGENT_SHOW_BUILTIN_STORAGE_KEY,
  AGENT_SHOW_DEACTIVATED_STORAGE_KEY,
  type AgentLayout,
} from "@/lib/layout/constants";
import { useAgentLayoutStore } from "@/lib/stores/agent-layout-store";

interface AgentLayoutProviderProps {
  children: ReactNode;
}

/**
 * Provider component that hydrates the agent layout store from electron-store
 * on mount. This ensures layout and filter preferences are loaded from
 * persistent storage before rendering, preventing flash of default values.
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
    const hydrateStore = async () => {
      // Check if running in Electron environment
      if (typeof window !== "undefined" && window.electronAPI?.store) {
        // Hydrate layout preference
        const persistedLayout = await window.electronAPI.store.get<AgentLayout>(
          AGENT_LAYOUT_STORAGE_KEY
        );

        // Hydrate show built-in preference
        const persistedShowBuiltIn =
          await window.electronAPI.store.get<boolean>(
            AGENT_SHOW_BUILTIN_STORAGE_KEY
          );

        // Hydrate show deactivated preference
        const persistedShowDeactivated =
          await window.electronAPI.store.get<boolean>(
            AGENT_SHOW_DEACTIVATED_STORAGE_KEY
          );

        // Build state update object
        const stateUpdate: Partial<{
          layout: AgentLayout;
          showBuiltIn: boolean;
          showDeactivated: boolean;
        }> = {};

        // Validate and add layout to update
        if (
          persistedLayout &&
          ["card", "list", "table"].includes(persistedLayout)
        ) {
          stateUpdate.layout = persistedLayout;
        }

        // Validate and add showBuiltIn to update
        if (typeof persistedShowBuiltIn === "boolean") {
          stateUpdate.showBuiltIn = persistedShowBuiltIn;
        }

        // Validate and add showDeactivated to update
        if (typeof persistedShowDeactivated === "boolean") {
          stateUpdate.showDeactivated = persistedShowDeactivated;
        }

        // Apply state update if any values were persisted
        if (Object.keys(stateUpdate).length > 0) {
          useAgentLayoutStore.setState(stateUpdate);
        }
      }

      setIsHydrated(true);
    };

    hydrateStore();
  }, []);

  // Prevent flash of default values by not rendering until hydrated
  if (!isHydrated) {
    return null;
  }

  return children;
};
