import type { DynamicRoute } from 'next-typesafe-url';

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/**
 * Valid workflow step values for the pipeline step selection.
 */
export const workflowStepValues = ['clarification', 'refinement', 'discovery', 'planning'] as const;

// ============================================================================
// Route Type
// ============================================================================

export const Route = {
  routeParams: z.object({
    id: z.coerce.number().int().positive(),
  }),
  searchParams: z.object({
    // Active pipeline step selection
    step: z.enum(workflowStepValues).optional(),
  }),
} satisfies DynamicRoute;

export type RouteType = typeof Route;

// ============================================================================
// Derived Types
// ============================================================================

/**
 * Type-safe workflow step value type.
 */
export type WorkflowStepValue = (typeof workflowStepValues)[number];
