import type { DynamicRoute } from 'next-typesafe-url';

import { z } from 'zod';

// ============================================================================
// Route Type
// ============================================================================

export const Route = {
  routeParams: z.object({
    id: z.coerce.number().int().positive(),
  }),
} satisfies DynamicRoute;

export type RouteType = typeof Route;
