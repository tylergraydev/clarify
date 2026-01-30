import type { DynamicRoute } from "next-typesafe-url";

import { z } from "zod";

const VIEW_OPTIONS = ["card", "table"] as const;

export const Route = {
  searchParams: z.object({
    showArchived: z.coerce.boolean().optional().default(false),
    view: z.enum(VIEW_OPTIONS).optional().default("card"),
  }),
} satisfies DynamicRoute;

export type RouteType = typeof Route;
