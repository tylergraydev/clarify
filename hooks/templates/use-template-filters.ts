'use client';

import { useCallback, useState } from 'react';

import { useTemplateLayoutStore } from '@/lib/stores/template-layout-store';

// ============================================================================
// Types
// ============================================================================

/**
 * Filter value type that can be null or a string.
 */
export type FilterValue = null | string;

/**
 * Return type for the useTemplateFilters hook.
 */
export interface UseTemplateFiltersReturn {
  /** Current category filter value */
  categoryFilter: FilterValue;
  /** Whether any filter (category or status) is currently active */
  hasActiveFilters: boolean;
  /** Whether to show built-in templates */
  isShowingBuiltIn: boolean;
  /** Whether to show deactivated templates */
  isShowingDeactivated: boolean;
  /** Callback to reset all filters to their default values */
  onResetFilters: () => void;
  /** Current search filter value */
  searchFilter: string;
  /** Callback to update the category filter */
  setCategoryFilter: (value: FilterValue) => void;
  /** Callback to update whether to show built-in templates */
  setIsShowingBuiltIn: (value: boolean) => void;
  /** Callback to update whether to show deactivated templates */
  setIsShowingDeactivated: (value: boolean) => void;
  /** Callback to update the search filter */
  setSearchFilter: (value: string) => void;
  /** Callback to update the status filter */
  setStatusFilter: (value: FilterValue) => void;
  /** Current status filter value */
  statusFilter: FilterValue;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing template filter state.
 *
 * Combines local useState for search, category, and status filters
 * with persisted Zustand store values for showBuiltIn and showDeactivated.
 *
 * @returns Filter state and callbacks for managing template filters
 *
 * @example
 * ```tsx
 * const {
 *   searchFilter,
 *   categoryFilter,
 *   statusFilter,
 *   isShowingBuiltIn,
 *   isShowingDeactivated,
 *   hasActiveFilters,
 *   setSearchFilter,
 *   setCategoryFilter,
 *   setStatusFilter,
 *   setIsShowingBuiltIn,
 *   setIsShowingDeactivated,
 *   onResetFilters,
 * } = useTemplateFilters();
 * ```
 */
export const useTemplateFilters = (): UseTemplateFiltersReturn => {
  // Local filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FilterValue>(null);
  const [statusFilter, setStatusFilter] = useState<FilterValue>(null);

  // Persisted state from Zustand store
  const { setShowBuiltIn, setShowDeactivated, showBuiltIn, showDeactivated } = useTemplateLayoutStore();

  // Derived state - check if any filter is active
  const hasActiveFilters = Boolean(categoryFilter || statusFilter);

  // Reset all filters callback
  const handleResetFilters = useCallback(() => {
    setCategoryFilter(null);
    setStatusFilter(null);
  }, []);

  return {
    categoryFilter,
    hasActiveFilters,
    isShowingBuiltIn: showBuiltIn,
    isShowingDeactivated: showDeactivated,
    onResetFilters: handleResetFilters,
    searchFilter,
    setCategoryFilter,
    setIsShowingBuiltIn: setShowBuiltIn,
    setIsShowingDeactivated: setShowDeactivated,
    setSearchFilter,
    setStatusFilter,
    statusFilter,
  };
};
