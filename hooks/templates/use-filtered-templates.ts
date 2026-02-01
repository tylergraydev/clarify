'use client';

import { useMemo } from 'react';

import type { Template } from '@/db/schema/templates.schema';
import type { FilterValue } from '@/hooks/templates/use-template-filters';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for filtering templates.
 */
export interface UseFilteredTemplatesOptions {
  /** Filter by template category */
  categoryFilter: FilterValue;
  /** Whether to include built-in templates */
  isShowingBuiltIn: boolean;
  /** Whether to include deactivated templates */
  isShowingDeactivated: boolean;
  /** Search term to filter by name or description */
  searchFilter: string;
  /** Filter by status ('active' or 'inactive') */
  statusFilter: FilterValue;
  /** Array of templates to filter */
  templates: Array<Template> | undefined;
}

/**
 * Return type for the useFilteredTemplates hook.
 */
export interface UseFilteredTemplatesReturn {
  /** Number of templates after filtering */
  filteredCount: number;
  /** Filtered templates array */
  filteredTemplates: Array<Template>;
  /** Whether the list is currently filtered (filteredCount !== totalCount) */
  isFiltered: boolean;
  /** Total number of templates before filtering */
  totalCount: number;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for filtering templates based on various criteria.
 *
 * Performs client-side filtering using useMemo for optimal performance.
 * Handles all filter combinations including search, category, status,
 * showBuiltIn, and showDeactivated preferences.
 *
 * @param options - Filter options
 * @returns Filtered templates and related counts
 *
 * @example
 * ```tsx
 * const { filteredTemplates, filteredCount, totalCount, isFiltered } = useFilteredTemplates({
 *   templates: allTemplates,
 *   searchFilter,
 *   categoryFilter,
 *   statusFilter,
 *   isShowingBuiltIn,
 *   isShowingDeactivated,
 * });
 * ```
 */
export const useFilteredTemplates = ({
  categoryFilter,
  isShowingBuiltIn,
  isShowingDeactivated,
  searchFilter,
  statusFilter,
  templates,
}: UseFilteredTemplatesOptions): UseFilteredTemplatesReturn => {
  // Client-side filtering with memoization
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];

    return templates.filter((template) => {
      // Filter by isShowingBuiltIn preference
      if (!isShowingBuiltIn && template.builtInAt !== null) {
        return false;
      }

      // Filter by isShowingDeactivated preference
      if (!isShowingDeactivated && template.deactivatedAt !== null) {
        return false;
      }

      // Filter by search term (matches name or description)
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        const isMatchesName = template.name.toLowerCase().includes(searchLower);
        const isMatchesDescription = template.description?.toLowerCase().includes(searchLower) ?? false;
        if (!isMatchesName && !isMatchesDescription) {
          return false;
        }
      }

      // Filter by category
      if (categoryFilter && template.category !== categoryFilter) {
        return false;
      }

      // Filter by status
      if (statusFilter === 'active' && template.deactivatedAt !== null) {
        return false;
      } else if (statusFilter === 'inactive' && template.deactivatedAt === null) {
        return false;
      }

      return true;
    });
  }, [categoryFilter, isShowingBuiltIn, isShowingDeactivated, searchFilter, statusFilter, templates]);

  // Derived state
  const totalCount = templates?.length ?? 0;
  const filteredCount = filteredTemplates.length;
  const hasActiveFilters = Boolean(categoryFilter || statusFilter);
  const isFiltered = hasActiveFilters && filteredCount !== totalCount;

  return {
    filteredCount,
    filteredTemplates,
    isFiltered,
    totalCount,
  };
};
