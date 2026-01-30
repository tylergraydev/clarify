import type { DynamicRoute } from 'next-typesafe-url';

import { z } from 'zod';

const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;
const SORT_FIELDS = ['featureName', 'status', 'durationMs', 'completedAt'] as const;

export const Route = {
  searchParams: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().optional(),
    pageSize: z.coerce.number().optional(),
    projectId: z.coerce.number().optional(),
    search: z.string().optional(),
    sortBy: z.enum(SORT_FIELDS).optional(),
    sortOrder: z.enum(SORT_ORDERS).optional(),
    status: z.enum(TERMINAL_STATUSES).optional(),
  }),
} satisfies DynamicRoute;

export type RouteType = typeof Route;
