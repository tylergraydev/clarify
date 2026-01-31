'use client';

import { useMemo } from 'react';

import type { AgentWithRelations } from '@/components/agents/agent-table';
import type { FilterValue } from '@/hooks/use-agent-filters';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for filtering agents.
 */
export interface UseFilteredAgentsOptions {
  /** Array of agents to filter */
  agents: Array<AgentWithRelations> | undefined;
  /** Whether to include built-in agents */
  isShowingBuiltIn: boolean;
  /** Filter by project ID or 'global' for global agents */
  projectFilter: FilterValue;
  /** Search term to filter by name, display name, or description */
  searchFilter: string;
  /** Filter by status ('active' or 'inactive') */
  statusFilter: FilterValue;
  /** Filter by agent type */
  typeFilter: FilterValue;
}

/**
 * Return type for the useFilteredAgents hook.
 */
export interface UseFilteredAgentsReturn {
  /** Filtered agents array */
  filteredAgents: Array<AgentWithRelations>;
  /** Number of agents after filtering */
  filteredCount: number;
  /** Whether the list is currently filtered (filteredCount !== totalCount) */
  isFiltered: boolean;
  /** Total number of agents before filtering */
  totalCount: number;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for filtering agents based on various criteria.
 *
 * Performs client-side filtering using useMemo for optimal performance.
 * Handles all filter combinations including search, type, project, status,
 * and showBuiltIn preference.
 *
 * @param options - Filter options
 * @returns Filtered agents and related counts
 *
 * @example
 * ```tsx
 * const { filteredAgents, filteredCount, totalCount, isFiltered } = useFilteredAgents({
 *   agents: allAgents,
 *   isShowingBuiltIn,
 *   projectFilter,
 *   searchFilter,
 *   statusFilter,
 *   typeFilter,
 * });
 * ```
 */
export const useFilteredAgents = ({
  agents,
  isShowingBuiltIn,
  projectFilter,
  searchFilter,
  statusFilter,
  typeFilter,
}: UseFilteredAgentsOptions): UseFilteredAgentsReturn => {
  // Client-side filtering with memoization
  const filteredAgents = useMemo(() => {
    if (!agents) return [];

    return agents.filter((agent) => {
      // Filter by isShowingBuiltIn preference
      if (!isShowingBuiltIn && agent.builtInAt !== null) {
        return false;
      }

      // Filter by search term (matches name, displayName, or description)
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        const isMatchesName = agent.name.toLowerCase().includes(searchLower);
        const isMatchesDisplayName = agent.displayName.toLowerCase().includes(searchLower);
        const isMatchesDescription = agent.description?.toLowerCase().includes(searchLower) ?? false;
        if (!isMatchesName && !isMatchesDisplayName && !isMatchesDescription) {
          return false;
        }
      }

      // Filter by type
      if (typeFilter && agent.type !== typeFilter) {
        return false;
      }

      // Filter by project
      if (projectFilter === 'global' && agent.projectId !== null) {
        return false;
      } else if (projectFilter && projectFilter !== 'global' && agent.projectId !== Number(projectFilter)) {
        return false;
      }

      // Filter by status
      if (statusFilter === 'active' && agent.deactivatedAt !== null) {
        return false;
      } else if (statusFilter === 'inactive' && agent.deactivatedAt === null) {
        return false;
      }

      return true;
    });
  }, [agents, isShowingBuiltIn, projectFilter, searchFilter, statusFilter, typeFilter]);

  // Derived state
  const totalCount = agents?.length ?? 0;
  const filteredCount = filteredAgents.length;
  const hasActiveFilters = Boolean(typeFilter || projectFilter || statusFilter);
  const isFiltered = hasActiveFilters && filteredCount !== totalCount;

  return {
    filteredAgents,
    filteredCount,
    isFiltered,
    totalCount,
  };
};
