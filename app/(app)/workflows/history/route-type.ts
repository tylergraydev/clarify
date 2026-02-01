import type { DynamicRoute } from 'next-typesafe-url';

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/**
 * Terminal workflow statuses for history filtering
 * Matches TerminalStatus type from workflows.repository.ts
 */
export const terminalStatuses = ['completed', 'failed', 'cancelled'] as const;

/**
 * Workflow type filter options including 'all' for no filter
 */
export const workflowTypeFilters = ['all', 'planning', 'implementation'] as const;

/**
 * Valid sort fields for workflow history
 * Matches WorkflowHistorySortField from workflows.repository.ts
 */
export const sortFields = ['createdAt', 'completedAt', 'featureName', 'status', 'durationMs'] as const;

/**
 * Sort order options
 */
export const sortOrders = ['asc', 'desc'] as const;

// ============================================================================
// Route Type
// ============================================================================

export const Route = {
  searchParams: z.object({
    // Date range filters
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),

    // Pagination
    page: z.coerce.number().int().positive().optional().default(1),
    pageSize: z.coerce.number().int().positive().optional().default(20),

    // Project filter
    project: z.coerce.number().int().positive().optional(),

    // Search
    search: z.string().optional(),

    // Sorting
    sortBy: z.enum(sortFields).optional().default('createdAt'),
    sortOrder: z.enum(sortOrders).optional().default('desc'),

    // Status filter (array of terminal statuses)
    status: z.array(z.enum(terminalStatuses)).optional(),

    // Workflow type filter
    type: z.enum(workflowTypeFilters).optional().default('all'),
  }),
} satisfies DynamicRoute;

export type RouteType = typeof Route;
