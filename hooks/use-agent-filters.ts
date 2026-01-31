'use client';

import { useCallback, useState } from 'react';

import { useAgentLayoutStore } from '@/lib/stores/agent-layout-store';

// ============================================================================
// Types
// ============================================================================

/**
 * Filter value type that can be null or a string.
 */
export type FilterValue = null | string;

/**
 * Return type for the useAgentFilters hook.
 */
export interface UseAgentFiltersReturn {
  /** Whether any filter (type, project, or status) is currently active */
  hasActiveFilters: boolean;
  /** Whether to show built-in agents */
  isShowingBuiltIn: boolean;
  /** Whether to show deactivated agents */
  isShowingDeactivated: boolean;
  /** Callback to reset all filters to their default values */
  onResetFilters: () => void;
  /** Current project filter value */
  projectFilter: FilterValue;
  /** Current search filter value */
  searchFilter: string;
  /** Callback to update whether to show built-in agents */
  setIsShowingBuiltIn: (value: boolean) => void;
  /** Callback to update whether to show deactivated agents */
  setIsShowingDeactivated: (value: boolean) => void;
  /** Callback to update the project filter */
  setProjectFilter: (value: FilterValue) => void;
  /** Callback to update the search filter */
  setSearchFilter: (value: string) => void;
  /** Callback to update the status filter */
  setStatusFilter: (value: FilterValue) => void;
  /** Callback to update the type filter */
  setTypeFilter: (value: FilterValue) => void;
  /** Current status filter value */
  statusFilter: FilterValue;
  /** Current type filter value */
  typeFilter: FilterValue;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing agent filter state.
 *
 * Combines local useState for search, type, project, and status filters
 * with persisted Zustand store values for showBuiltIn and showDeactivated.
 *
 * @returns Filter state and callbacks for managing agent filters
 *
 * @example
 * ```tsx
 * const {
 *   searchFilter,
 *   typeFilter,
 *   projectFilter,
 *   statusFilter,
 *   isShowingBuiltIn,
 *   isShowingDeactivated,
 *   hasActiveFilters,
 *   setSearchFilter,
 *   setTypeFilter,
 *   setProjectFilter,
 *   setStatusFilter,
 *   setIsShowingBuiltIn,
 *   setIsShowingDeactivated,
 *   onResetFilters,
 * } = useAgentFilters();
 * ```
 */
export const useAgentFilters = (): UseAgentFiltersReturn => {
  // Local filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterValue>(null);
  const [projectFilter, setProjectFilter] = useState<FilterValue>(null);
  const [statusFilter, setStatusFilter] = useState<FilterValue>(null);

  // Persisted state from Zustand store
  const { setShowBuiltIn, setShowDeactivated, showBuiltIn, showDeactivated } = useAgentLayoutStore();

  // Derived state - check if any filter is active
  const hasActiveFilters = Boolean(typeFilter || projectFilter || statusFilter);

  // Reset all filters callback
  const handleResetFilters = useCallback(() => {
    setTypeFilter(null);
    setProjectFilter(null);
    setStatusFilter(null);
  }, []);

  return {
    hasActiveFilters,
    isShowingBuiltIn: showBuiltIn,
    isShowingDeactivated: showDeactivated,
    onResetFilters: handleResetFilters,
    projectFilter,
    searchFilter,
    setIsShowingBuiltIn: setShowBuiltIn,
    setIsShowingDeactivated: setShowDeactivated,
    setProjectFilter,
    setSearchFilter,
    setStatusFilter,
    setTypeFilter,
    statusFilter,
    typeFilter,
  };
};
