import { create } from 'zustand';

import type { DebugLogFilters } from '../../types/debug-log';

/**
 * Default auto-refresh interval in milliseconds.
 */
const DEFAULT_AUTO_REFRESH_INTERVAL = 2000;

/**
 * Storage keys for persisting debug log preferences.
 */
const DEBUG_LOG_AUTO_REFRESH_STORAGE_KEY = 'debug-log-auto-refresh';
const DEBUG_LOG_AUTO_REFRESH_INTERVAL_STORAGE_KEY = 'debug-log-auto-refresh-interval';
const DEBUG_LOG_FILTERS_STORAGE_KEY = 'debug-log-filters';

/**
 * Default filter values.
 */
const defaultFilters: DebugLogFilters = {};

/**
 * Debug log actions interface for modifying store state.
 */
export interface DebugLogActions {
  /** Reset all state to initial values */
  reset: () => void;
  /** Reset filters to default values */
  resetFilters: () => void;
  /** Set the auto-refresh interval in milliseconds */
  setAutoRefreshInterval: (interval: number) => void;
  /** Update filter settings (partial update supported) */
  setFilters: (filters: Partial<DebugLogFilters>) => void;
  /** Set the currently selected log entry ID */
  setSelectedLogId: (id: null | string) => void;
  /** Toggle auto-refresh on/off */
  toggleAutoRefresh: () => void;
}

/**
 * Debug log state interface for managing debug log UI state.
 */
export interface DebugLogState {
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval: number;
  /** Current filter settings */
  filters: DebugLogFilters;
  /** Whether auto-refresh is enabled */
  isAutoRefresh: boolean;
  /** Currently selected log entry ID */
  selectedLogId: null | string;
}

/**
 * Combined debug log store type for state and actions.
 */
export type DebugLogStore = DebugLogActions & DebugLogState;

/**
 * Initial state for reset functionality.
 */
const initialState: DebugLogState = {
  autoRefreshInterval: DEFAULT_AUTO_REFRESH_INTERVAL,
  filters: defaultFilters,
  isAutoRefresh: false,
  selectedLogId: null,
};

/**
 * Helper to persist a value to electron-store via IPC.
 */
function persistToElectronStore<T>(key: string, value: T): void {
  if (typeof window !== 'undefined' && window.electronAPI?.store) {
    window.electronAPI.store.set(key, value);
  }
}

/**
 * Zustand store for managing debug log UI state including filters,
 * selected entries, and auto-refresh settings.
 *
 * @example
 * ```tsx
 * function DebugLogFilters() {
 *   const { filters, setFilters, resetFilters } = useDebugLogStore();
 *
 *   return (
 *     <div>
 *       <Select
 *         value={filters.level ?? 'all'}
 *         onValueChange={(level) => setFilters({ level: level === 'all' ? undefined : level })}
 *       >
 *         <SelectItem value="all">All Levels</SelectItem>
 *         <SelectItem value="debug">Debug</SelectItem>
 *         <SelectItem value="info">Info</SelectItem>
 *         <SelectItem value="warn">Warn</SelectItem>
 *         <SelectItem value="error">Error</SelectItem>
 *       </Select>
 *       <Button onClick={resetFilters}>Reset Filters</Button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function AutoRefreshToggle() {
 *   const { isAutoRefresh, toggleAutoRefresh, autoRefreshInterval, setAutoRefreshInterval } =
 *     useDebugLogStore();
 *
 *   return (
 *     <div>
 *       <Switch checked={isAutoRefresh} onCheckedChange={toggleAutoRefresh} />
 *       <Input
 *         type="number"
 *         value={autoRefreshInterval}
 *         onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const useDebugLogStore = create<DebugLogStore>()((set) => ({
  ...initialState,

  reset: () => {
    set(initialState);

    // Clear persisted values
    persistToElectronStore(DEBUG_LOG_AUTO_REFRESH_STORAGE_KEY, initialState.isAutoRefresh);
    persistToElectronStore(DEBUG_LOG_AUTO_REFRESH_INTERVAL_STORAGE_KEY, initialState.autoRefreshInterval);
    persistToElectronStore(DEBUG_LOG_FILTERS_STORAGE_KEY, initialState.filters);
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    persistToElectronStore(DEBUG_LOG_FILTERS_STORAGE_KEY, defaultFilters);
  },

  setAutoRefreshInterval: (interval: number) => {
    set({ autoRefreshInterval: interval });
    persistToElectronStore(DEBUG_LOG_AUTO_REFRESH_INTERVAL_STORAGE_KEY, interval);
  },

  setFilters: (filters: Partial<DebugLogFilters>) => {
    set((state) => {
      const newFilters = { ...state.filters, ...filters };
      persistToElectronStore(DEBUG_LOG_FILTERS_STORAGE_KEY, newFilters);
      return { filters: newFilters };
    });
  },

  setSelectedLogId: (id: null | string) => {
    set({ selectedLogId: id });
  },

  toggleAutoRefresh: () => {
    set((state) => {
      const newAutoRefresh = !state.isAutoRefresh;
      persistToElectronStore(DEBUG_LOG_AUTO_REFRESH_STORAGE_KEY, newAutoRefresh);
      return { isAutoRefresh: newAutoRefresh };
    });
  },
}));
