import type { DynamicRoute } from 'next-typesafe-url';

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/**
 * Valid tab values for project detail page
 */
export const projectTabValues = ['overview', 'repositories', 'workflows', 'chat'] as const;

// ============================================================================
// Route Type
// ============================================================================

export const Route = {
  routeParams: z.object({
    id: z.coerce.number().int().positive(),
  }),
  searchParams: z.object({
    // Active tab selection
    tab: z.enum(projectTabValues).optional().default('overview'),
  }),
} satisfies DynamicRoute;

/**
 * Type-safe tab value type
 */
export type ProjectTabValue = (typeof projectTabValues)[number];

// ============================================================================
// Derived Types
// ============================================================================

export type RouteType = typeof Route;
