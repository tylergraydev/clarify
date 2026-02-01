import { create } from 'zustand';

import {
  ACTIVE_WORKFLOWS_COLLAPSED_GROUPS_STORAGE_KEY,
  ACTIVE_WORKFLOWS_GROUP_BY_PROJECT_STORAGE_KEY,
  ACTIVE_WORKFLOWS_SORT_COLUMN_STORAGE_KEY,
  ACTIVE_WORKFLOWS_SORT_DIRECTION_STORAGE_KEY,
  ACTIVE_WORKFLOWS_STATUS_FILTER_STORAGE_KEY,
  ACTIVE_WORKFLOWS_TYPE_FILTER_STORAGE_KEY,
  DEFAULT_ACTIVE_WORKFLOWS_COLLAPSED_GROUPS,
  DEFAULT_ACTIVE_WORKFLOWS_GROUP_BY_PROJECT,
  DEFAULT_ACTIVE_WORKFLOWS_SORT_COLUMN,
  DEFAULT_ACTIVE_WORKFLOWS_SORT_DIRECTION,
  DEFAULT_ACTIVE_WORKFLOWS_STATUS_FILTER,
  DEFAULT_ACTIVE_WORKFLOWS_TYPE_FILTER,
} from '../layout/constants';

/**
 * Active workflows actions interface for modifying store state.
 */
export interface ActiveWorkflowsActions {
  /** Reset store to initial state */
  reset: () => void;
  /** Set the collapsed state for a specific project group */
  setCollapsedGroup: (projectId: string, isCollapsed: boolean) => void;
  /** Set whether to group workflows by project */
  setGroupByProject: (groupByProject: boolean) => void;
  /** Set the sort column */
  setSortColumn: (sortColumn: ActiveWorkflowsSortColumn) => void;
  /** Set the sort direction */
  setSortDirection: (sortDirection: ActiveWorkflowsSortDirection) => void;
  /** Set the status filter */
  setStatusFilter: (statusFilter: ActiveWorkflowsStatusFilter) => void;
  /** Set the type filter */
  setTypeFilter: (typeFilter: ActiveWorkflowsTypeFilter) => void;
  /** Toggle the collapsed state for a specific project group */
  toggleCollapsedGroup: (projectId: string) => void;
}

/**
 * Sort column options for the active workflows list.
 */
export type ActiveWorkflowsSortColumn = 'createdAt' | 'name' | 'progress' | 'updatedAt';

/**
 * Sort direction options.
 */
export type ActiveWorkflowsSortDirection = 'asc' | 'desc';

/**
 * Active workflows state interface for managing UI preferences.
 */
export interface ActiveWorkflowsState {
  /** Set of project IDs whose groups are collapsed */
  collapsedGroups: Set<string>;
  /** Whether to group workflows by project */
  isGroupByProject: boolean;
  /** Current sort column */
  sortColumn: ActiveWorkflowsSortColumn;
  /** Current sort direction */
  sortDirection: ActiveWorkflowsSortDirection;
  /** Current status filter selection */
  statusFilter: ActiveWorkflowsStatusFilter;
  /** Current type filter selection */
  typeFilter: ActiveWorkflowsTypeFilter;
}

/**
 * Status filter options for active workflows.
 */
export type ActiveWorkflowsStatusFilter = 'all' | 'paused' | 'running';

/**
 * Combined active workflows store type for state and actions.
 */
export type ActiveWorkflowsStore = ActiveWorkflowsActions & ActiveWorkflowsState;

/**
 * Type filter options for active workflows.
 */
export type ActiveWorkflowsTypeFilter = 'all' | 'implementation' | 'planning';

/**
 * Initial state for reset functionality.
 */
const initialState: ActiveWorkflowsState = {
  collapsedGroups: DEFAULT_ACTIVE_WORKFLOWS_COLLAPSED_GROUPS,
  isGroupByProject: DEFAULT_ACTIVE_WORKFLOWS_GROUP_BY_PROJECT,
  sortColumn: DEFAULT_ACTIVE_WORKFLOWS_SORT_COLUMN,
  sortDirection: DEFAULT_ACTIVE_WORKFLOWS_SORT_DIRECTION,
  statusFilter: DEFAULT_ACTIVE_WORKFLOWS_STATUS_FILTER,
  typeFilter: DEFAULT_ACTIVE_WORKFLOWS_TYPE_FILTER,
};

/**
 * Helper to persist a value to electron-store via IPC.
 */
function persistToElectronStore<T>(key: string, value: T): void {
  if (typeof window !== 'undefined' && window.electronAPI?.store) {
    // For Set values, convert to array for storage
    const storageValue = value instanceof Set ? Array.from(value) : value;
    window.electronAPI.store.set(key, storageValue);
  }
}

/**
 * Zustand store for managing active workflows page UI preferences
 * including filter selections, sorting preferences, and group visibility.
 *
 * @example
 * ```tsx
 * function ActiveWorkflowsFilters() {
 *   const { statusFilter, setStatusFilter, typeFilter, setTypeFilter } =
 *     useActiveWorkflowsStore();
 *
 *   return (
 *     <div>
 *       <Select value={statusFilter} onValueChange={setStatusFilter}>
 *         <SelectItem value="all">All</SelectItem>
 *         <SelectItem value="running">Running</SelectItem>
 *         <SelectItem value="paused">Paused</SelectItem>
 *       </Select>
 *       <Select value={typeFilter} onValueChange={setTypeFilter}>
 *         <SelectItem value="all">All Types</SelectItem>
 *         <SelectItem value="planning">Planning</SelectItem>
 *         <SelectItem value="implementation">Implementation</SelectItem>
 *       </Select>
 *     </div>
 *   );
 * }
 * ```
 */
export const useActiveWorkflowsStore = create<ActiveWorkflowsStore>()((set) => ({
  ...initialState,

  reset: () => {
    set(initialState);

    // Clear persisted values
    persistToElectronStore(ACTIVE_WORKFLOWS_STATUS_FILTER_STORAGE_KEY, initialState.statusFilter);
    persistToElectronStore(ACTIVE_WORKFLOWS_TYPE_FILTER_STORAGE_KEY, initialState.typeFilter);
    persistToElectronStore(ACTIVE_WORKFLOWS_SORT_COLUMN_STORAGE_KEY, initialState.sortColumn);
    persistToElectronStore(ACTIVE_WORKFLOWS_SORT_DIRECTION_STORAGE_KEY, initialState.sortDirection);
    persistToElectronStore(ACTIVE_WORKFLOWS_GROUP_BY_PROJECT_STORAGE_KEY, initialState.isGroupByProject);
    persistToElectronStore(ACTIVE_WORKFLOWS_COLLAPSED_GROUPS_STORAGE_KEY, initialState.collapsedGroups);
  },

  setCollapsedGroup: (projectId: string, isCollapsed: boolean) => {
    set((state) => {
      const newCollapsedGroups = new Set(state.collapsedGroups);
      if (isCollapsed) {
        newCollapsedGroups.add(projectId);
      } else {
        newCollapsedGroups.delete(projectId);
      }
      persistToElectronStore(ACTIVE_WORKFLOWS_COLLAPSED_GROUPS_STORAGE_KEY, newCollapsedGroups);
      return { collapsedGroups: newCollapsedGroups };
    });
  },

  setGroupByProject: (groupByProject: boolean) => {
    set({ isGroupByProject: groupByProject });
    persistToElectronStore(ACTIVE_WORKFLOWS_GROUP_BY_PROJECT_STORAGE_KEY, groupByProject);
  },

  setSortColumn: (sortColumn: ActiveWorkflowsSortColumn) => {
    set({ sortColumn });
    persistToElectronStore(ACTIVE_WORKFLOWS_SORT_COLUMN_STORAGE_KEY, sortColumn);
  },

  setSortDirection: (sortDirection: ActiveWorkflowsSortDirection) => {
    set({ sortDirection });
    persistToElectronStore(ACTIVE_WORKFLOWS_SORT_DIRECTION_STORAGE_KEY, sortDirection);
  },

  setStatusFilter: (statusFilter: ActiveWorkflowsStatusFilter) => {
    set({ statusFilter });
    persistToElectronStore(ACTIVE_WORKFLOWS_STATUS_FILTER_STORAGE_KEY, statusFilter);
  },

  setTypeFilter: (typeFilter: ActiveWorkflowsTypeFilter) => {
    set({ typeFilter });
    persistToElectronStore(ACTIVE_WORKFLOWS_TYPE_FILTER_STORAGE_KEY, typeFilter);
  },

  toggleCollapsedGroup: (projectId: string) => {
    set((state) => {
      const newCollapsedGroups = new Set(state.collapsedGroups);
      if (newCollapsedGroups.has(projectId)) {
        newCollapsedGroups.delete(projectId);
      } else {
        newCollapsedGroups.add(projectId);
      }
      persistToElectronStore(ACTIVE_WORKFLOWS_COLLAPSED_GROUPS_STORAGE_KEY, newCollapsedGroups);
      return { collapsedGroups: newCollapsedGroups };
    });
  },
}));
