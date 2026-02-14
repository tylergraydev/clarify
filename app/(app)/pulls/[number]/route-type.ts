import type { DynamicRoute } from 'next-typesafe-url';

import { z } from 'zod';

export const prDetailTabValues = ['overview', 'changes', 'comments', 'checks', 'deployments'] as const;

export const Route = {
  routeParams: z.object({
    number: z.coerce.number().int().positive(),
  }),
  searchParams: z.object({
    repo: z.coerce.number().int().positive().optional(),
    tab: z.enum(prDetailTabValues).optional().default('overview'),
  }),
} satisfies DynamicRoute;

export type PrDetailTab = (typeof prDetailTabValues)[number];
export type RouteType = typeof Route;
