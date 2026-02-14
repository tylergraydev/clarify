import type { DynamicRoute } from 'next-typesafe-url';

import { z } from 'zod';

export const Route = {
  searchParams: z.object({
    project: z.coerce.number().int().positive().optional(),
    repo: z.coerce.number().int().positive().optional(),
    state: z.enum(['open', 'closed', 'merged', 'all']).optional().default('open'),
  }),
} satisfies DynamicRoute;

export type RouteType = typeof Route;
