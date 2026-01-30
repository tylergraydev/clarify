import type { DynamicRoute } from 'next-typesafe-url';

import { z } from 'zod';

import { workflowStatuses } from '@/db/schema/workflows.schema';

const VIEW_OPTIONS = ['card', 'table'] as const;

export const Route = {
  searchParams: z.object({
    projectId: z.coerce.number().optional(),
    search: z.string().optional(),
    status: z.enum(workflowStatuses).optional(),
    view: z.enum(VIEW_OPTIONS).optional().default('card'),
  }),
} satisfies DynamicRoute;

export type RouteType = typeof Route;
