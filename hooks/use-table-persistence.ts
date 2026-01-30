'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PartialDataTableState, PersistableStateKey } from '@/components/ui/table/types';

import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useElectronStore } from '@/hooks/use-electron';

// =============================================================================
// Constants
// =============================================================================

/** Default delay for debounced writes to electron-store (in milliseconds) */
const DEFAULT_DEBOUNCE_DELAY = 500;

/** Storage key prefix for table state persistence */
const STORAGE_KEY_PREFIX = 'table-state-';

/** Default keys to persist if none are specified */
const DEFAULT_PERSISTED_KEYS: Array<PersistableStateKey> = ['columnOrder', 'columnVisibility', 'columnSizing'];

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration options for the useTablePersistence hook.
 */
export interface UseTablePersistenceOptions {
  /**
   * Debounce delay for saving state changes (in milliseconds).
   * @default 500
   */
  debounceDelay?: number;

  /**
   * Initial state to use when no persisted state is available.
   * This state is also used to fill in any missing keys from persisted state.
   */
  initialState: PartialDataTableState;

  /**
   * Array of state keys to persist.
   * Only these keys will be saved to and restored from storage.
   * @default ['columnOrder', 'columnVisibility', 'columnSizing']
   */
  persistedKeys?: Array<PersistableStateKey>;

  /**
   * Unique identifier for this table instance.
   * Used to generate the storage key.
   */
  tableId: string;
}

/**
 * Return value from the useTablePersistence hook.
 */
export interface UseTablePersistenceReturn {
  /**
   * Whether the persisted state has been loaded.
   * Will be false during initial mount, then true after loading attempt completes.
   */
  isLoaded: boolean;

  /**
   * Update the state and trigger debounced persistence.
   * Accepts partial state updates that are merged with existing state.
   */
  setState: (update: PartialDataTableState) => void;

  /**
   * Current table state (merged persisted + initial state).
   */
  state: PartialDataTableState;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the default persisted keys for table state persistence.
 */
export function getDefaultPersistedKeys(): Array<PersistableStateKey> {
  return [...DEFAULT_PERSISTED_KEYS];
}

/**
 * Type guard to check if a key is a valid persistable state key.
 */
export function isPersistableStateKey(key: string): key is PersistableStateKey {
  const validKeys: Array<string> = [
    'columnFilters',
    'columnOrder',
    'columnSizing',
    'columnVisibility',
    'globalFilter',
    'pagination',
    'sorting',
  ];
  return validKeys.includes(key);
}

/**
 * Hook for managing table state persistence using electron-store.
 *
 * This hook handles:
 * - Loading persisted state on mount
 * - Merging persisted state with initial state (persisted takes precedence)
 * - Debounced saving of state changes to prevent excessive writes
 * - Filtering state to only persist specified keys
 *
 * @example
 * ```tsx
 * const { state, setState, isLoaded } = useTablePersistence({
 *   tableId: 'users-table',
 *   initialState: {
 *     columnOrder: ['name', 'email', 'role'],
 *     columnVisibility: { role: true },
 *     columnSizing: {},
 *   },
 *   persistedKeys: ['columnOrder', 'columnVisibility', 'columnSizing'],
 * });
 *
 * // Wait for loading before rendering
 * if (!isLoaded) return <LoadingSkeleton />;
 *
 * // Use state in your table
 * return <DataTable columnOrder={state.columnOrder} />;
 * ```
 */
export function useTablePersistence({
  debounceDelay = DEFAULT_DEBOUNCE_DELAY,
  initialState,
  persistedKeys = DEFAULT_PERSISTED_KEYS,
  tableId,
}: UseTablePersistenceOptions): UseTablePersistenceReturn {
  const store = useElectronStore();
  const storageKey = getStorageKey(tableId);

  // Track whether we've completed the initial load
  const [isLoaded, setIsLoaded] = useState(false);

  // Track the current state (starts with initial, updated after load)
  const [state, setStateInternal] = useState<PartialDataTableState>(() =>
    filterStateByKeys(initialState, persistedKeys)
  );

  // Use refs to track values for use in callbacks without causing re-renders
  // These are updated via effects to comply with React rules
  const stateRef = useRef(state);
  const initialStateRef = useRef(initialState);
  const persistedKeysRef = useRef(persistedKeys);

  // Update refs via effects (not during render)
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    initialStateRef.current = initialState;
  }, [initialState]);

  useEffect(() => {
    persistedKeysRef.current = persistedKeys;
  }, [persistedKeys]);

  // Save state to electron-store
  const saveState = useCallback(
    async (stateToSave: PartialDataTableState) => {
      const filtered = filterStateByKeys(stateToSave, persistedKeysRef.current);
      await store.set(storageKey, filtered);
    },
    [store, storageKey]
  );

  // Debounced save function
  const { debounced: debouncedSave } = useDebouncedCallback(
    (stateToSave: PartialDataTableState) => {
      void saveState(stateToSave);
    },
    { delay: debounceDelay }
  );

  // Load persisted state on mount
  useEffect(() => {
    let isMounted = true;

    async function loadPersistedState() {
      try {
        const persisted = await store.get<PartialDataTableState>(storageKey);

        if (isMounted) {
          const merged = mergeState(persisted, initialStateRef.current, persistedKeysRef.current);
          setStateInternal(merged);
          setIsLoaded(true);
        }
      } catch (error) {
        // If loading fails, use initial state and mark as loaded
        console.error(`[useTablePersistence] Failed to load state for ${storageKey}:`, error);
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    void loadPersistedState();

    return () => {
      isMounted = false;
    };
  }, [store, storageKey]);

  // Public setState function that merges updates and triggers persistence
  const setState = useCallback(
    (update: PartialDataTableState) => {
      setStateInternal((prev) => {
        // Merge the update with previous state
        const next = { ...prev };

        // Only update keys that are in persistedKeys
        for (const key of persistedKeysRef.current) {
          if (key in update && update[key] !== undefined) {
            (next as Record<string, unknown>)[key] = update[key];
          }
        }

        // Trigger debounced save
        debouncedSave(next);

        return next;
      });
    },
    [debouncedSave]
  );

  return {
    isLoaded,
    setState,
    state,
  };
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Filter state object to only include specified keys.
 */
function filterStateByKeys(state: PartialDataTableState, keys: Array<PersistableStateKey>): PartialDataTableState {
  const filtered: PartialDataTableState = {};

  for (const key of keys) {
    if (key in state && state[key] !== undefined) {
      // Use type assertion since we're building a partial object
      (filtered as Record<string, unknown>)[key] = state[key];
    }
  }

  return filtered;
}

/**
 * Generate the storage key for a table based on its ID.
 */
function getStorageKey(tableId: string): string {
  return `${STORAGE_KEY_PREFIX}${tableId}`;
}

/**
 * Merge persisted state with initial state, preferring persisted values.
 * Only includes keys that are in the persistedKeys array.
 */
function mergeState(
  persisted: PartialDataTableState | undefined,
  initial: PartialDataTableState,
  persistedKeys: Array<PersistableStateKey>
): PartialDataTableState {
  // Start with initial state filtered to persisted keys
  const result: PartialDataTableState = filterStateByKeys(initial, persistedKeys);

  // Override with persisted values if they exist
  if (persisted) {
    for (const key of persistedKeys) {
      if (key in persisted && persisted[key] !== undefined) {
        (result as Record<string, unknown>)[key] = persisted[key];
      }
    }
  }

  return result;
}
