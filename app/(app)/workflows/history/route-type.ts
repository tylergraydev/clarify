import type { DynamicRoute } from 'next-typesafe-url';

import { z } from 'zod';

export const Route = {
  searchParams: z.object({}),
} satisfies DynamicRoute;

export type RouteType = typeof Route;
