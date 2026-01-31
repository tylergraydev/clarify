# Next.js Routing Conventions

A comprehensive guide for creating consistent Next.js App Router pages with type-safe URL validation.

---

## Directory Structure

```
app/
├── layout.tsx                    (Root layout with providers)
├── globals.css                   (Global styles)
├── page.tsx                      (Root redirect)
└── (app)/                        (Route group for app shell)
    ├── layout.tsx                (App shell layout)
    ├── dashboard/
    │   ├── page.tsx
    │   └── _components/          (Page-specific components)
    ├── projects/
    │   ├── page.tsx
    │   ├── route-type.ts         (URL parameter validation)
    │   ├── [id]/                  (Dynamic route)
    │   │   ├── page.tsx
    │   │   ├── route-type.ts
    │   │   └── _components/
    │   └── _components/
    └── ...
```

---

## Route Type Files

### Requirement

**ALL pages with URL parameters MUST have a `route-type.ts` file**:

- Pages with search params (filters, pagination, view toggles)
- Pages with dynamic route params (`[id]`, `[slug]`)

### Standard Structure

```tsx
// route-type.ts
import type { DynamicRoute } from 'next-typesafe-url';
import { z } from 'zod';

export const Route = {
  // For search parameters (?view=card&page=1)
  searchParams: z.object({
    view: z.enum(['card', 'table']).optional().default('card'),
    page: z.coerce.number().int().positive().optional().default(1),
    search: z.string().optional(),
  }),

  // For dynamic route segments ([id])
  routeParams: z.object({
    id: z.coerce.number().int().positive(),
  }),
} satisfies DynamicRoute;

export type RouteType = typeof Route;
```

### ID Validation

**Dynamic route IDs MUST use numeric validation with coercion**:

```tsx
// ✅ Correct: Numeric with coercion
routeParams: z.object({
  id: z.coerce.number().int().positive(),
})

// ❌ Incorrect: String (requires manual parsing)
routeParams: z.object({
  id: z.string(),
})
```

### Common Schema Patterns

**View Toggle**:
```tsx
view: z.enum(['card', 'table']).optional().default('card')
```

**Pagination**:
```tsx
page: z.coerce.number().int().positive().optional().default(1),
pageSize: z.coerce.number().int().positive().optional().default(20),
```

**Sorting**:
```tsx
sortBy: z.string().optional().default('createdAt'),
sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
```

**Filters**:
```tsx
status: z.enum(['active', 'inactive', 'archived']).optional(),
projectId: z.coerce.number().int().positive().optional(),
search: z.string().optional(),
```

---

## Page Component Pattern

### Client-Side Default

**ALL pages are client-side by default** (due to Electron IPC requirements):

```tsx
'use client';

import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { useRouteParams, useQueryStates } from 'next-typesafe-url/app';
import { Route } from './route-type';

// ============================================================================
// HELPERS
// ============================================================================

const formatStatus = (status: Status): string => {
  // ...
};

// ============================================================================
// SKELETONS
// ============================================================================

const PageSkeleton = () => (
  <div className="animate-pulse">
    {/* ... */}
  </div>
);

// ============================================================================
// PAGE CONTENT
// ============================================================================

function PageContent() {
  // 1. Route validation
  const routeParams = useRouteParams(Route.routeParams);
  const [queryState, setQueryState] = useQueryStates(Route.searchParams);

  // 2. Data fetching
  const { data, isLoading, isError } = useEntityQuery(routeParams.data?.id);

  // 3. Derived state
  const filteredItems = useMemo(() => {
    // ...
  }, [data, queryState.search]);

  // 4. Event handlers
  const handleAction = useCallback(() => {
    // ...
  }, []);

  // 5. Render states
  if (routeParams.isLoading) return <PageSkeleton />;
  if (routeParams.isError) {
    redirect('/fallback');
  }
  if (isLoading) return <PageSkeleton />;
  if (isError || !data) return <NotFound />;

  // 6. Main render
  return (
    <QueryErrorBoundary>
      {/* Page content */}
    </QueryErrorBoundary>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default withParamValidation(PageContent, Route);
```

### withParamValidation HOC

**ALL pages with parameters MUST use the HOC**:

```tsx
// ✅ Correct: Wrap with HOC
export default withParamValidation(PageContent, Route);

// ❌ Incorrect: Direct export without validation
export default function Page() { ... }
```

---

## URL State Management

### Single State

```tsx
import { useQueryState, parseAsStringLiteral } from 'nuqs';

const VIEW_OPTIONS = ['card', 'table'] as const;

const [view, setView] = useQueryState(
  'view',
  parseAsStringLiteral(VIEW_OPTIONS).withDefault('card')
);
```

### Multiple States

```tsx
import { useQueryStates, parseAsString, parseAsInteger, parseAsStringLiteral } from 'nuqs';

const [queryState, setQueryState] = useQueryStates({
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  sortBy: parseAsString.withDefault('createdAt'),
  sortDirection: parseAsStringLiteral(['asc', 'desc']).withDefault('desc'),
  status: parseAsStringLiteral(['active', 'inactive', 'archived']),
  search: parseAsString,
});
```

### Parser Types

| Parser | Type | Example |
|--------|------|---------|
| `parseAsString` | `string \| null` | Search text |
| `parseAsInteger` | `number \| null` | Page number |
| `parseAsBoolean` | `boolean \| null` | Toggle flags |
| `parseAsStringLiteral` | `T \| null` | Enum values |

---

## Loading States

### Skeleton Location

Skeletons are colocated with their page in `_components/`:

```
projects/
├── page.tsx
└── _components/
    ├── project-card.tsx
    └── project-card-skeleton.tsx
```

### Skeleton Pattern

```tsx
const ProjectCardSkeleton = () => (
  <div className="animate-pulse rounded-lg border p-4">
    <div className="h-5 w-3/4 rounded bg-muted" />
    <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
    <div className="mt-4 flex gap-2">
      <div className="h-6 w-16 rounded bg-muted" />
      <div className="h-6 w-16 rounded bg-muted" />
    </div>
  </div>
);
```

### Loading State Flow

```tsx
// 1. Route params loading
if (routeParams.isLoading) return <PageSkeleton />;

// 2. Route params error
if (routeParams.isError || !routeParams.data?.id) {
  redirect('/fallback');
}

// 3. Data loading
if (isLoading) return <PageSkeleton />;

// 4. Data error or not found
if (isError || !data) return <EntityNotFound />;
```

---

## Error Handling

### Route Parameter Errors

```tsx
if (routeParams.isLoading) return <PageSkeleton />;
if (routeParams.isError || !routeParams.data?.id) {
  redirect('/projects');  // Redirect to parent list
}
```

### Data Fetching Errors

```tsx
if (isLoading) return <PageSkeleton />;
if (isError || !data) return <EntityNotFound />;
```

### QueryErrorBoundary

Wrap data-dependent content:

```tsx
import { QueryErrorBoundary } from '@/components/data/query-error-boundary';

return (
  <QueryErrorBoundary fallback={<EntityError />}>
    <EntityContent data={data} />
  </QueryErrorBoundary>
);
```

---

## Layout Patterns

### Route Group Layout

```tsx
// app/(app)/layout.tsx
'use client';

import { AppHeader } from '@/components/shell/app-header';
import { AppSidebar } from '@/components/shell/app-sidebar';
import { StatusBar } from '@/components/shell/status-bar';
import { useShellStore } from '@/lib/stores/shell-store';

export default function AppLayout({ children }: { children: ReactNode }) {
  const isSidebarCollapsed = useShellStore((s) => s.isSidebarCollapsed);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main
          className={cn(
            'flex-1 overflow-auto p-6',
            isSidebarCollapsed ? 'ml-16' : 'ml-64'
          )}
        >
          {children}
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
```

### Domain-Specific Layouts

```tsx
// app/(app)/agents/layout.tsx
'use client';

import { AgentLayoutProvider } from '@/components/providers/agent-layout-provider';

export default function AgentsLayout({ children }: { children: ReactNode }) {
  return (
    <AgentLayoutProvider>
      {children}
    </AgentLayoutProvider>
  );
}
```

---

## Navigation

### Type-Safe Links

```tsx
import { $path } from 'next-typesafe-url';
import Link from 'next/link';

// Dynamic route
<Link href={$path({
  route: '/projects/[id]',
  routeParams: { id: project.id }
})}>
  {project.name}
</Link>

// With search params
<Link href={$path({
  route: '/workflows',
  searchParams: { status: 'active', projectId: project.id }
})}>
  View Workflows
</Link>
```

### Programmatic Navigation

```tsx
import { useRouter } from 'next/navigation';
import { $path } from 'next-typesafe-url';

const router = useRouter();

const handleNavigate = () => {
  router.push($path({
    route: '/workflows/[id]',
    routeParams: { id: workflowId }
  }));
};
```

---

## Page Sections

Use semantic HTML with section comments:

```tsx
function DashboardContent() {
  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">Overview</h2>
        <OverviewCards />
      </section>

      {/* Recent Activity Section */}
      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading">Recent Activity</h2>
        <ActivityList />
      </section>
    </div>
  );
}
```

---

## Essential Rules Summary

1. **Route-type required**: ALL pages with URL params need `route-type.ts`
2. **Numeric IDs**: Use `z.coerce.number().int().positive()` for ID validation
3. **withParamValidation**: ALL pages with params use the HOC
4. **Client-side**: All pages use `'use client'` directive
5. **Colocated skeletons**: Place in `_components/` directory
6. **Loading state flow**: Route params → Data loading → Content
7. **QueryErrorBoundary**: Wrap data-dependent content
8. **Type-safe navigation**: Use `$path()` for links
9. **Section organization**: Helpers → Skeletons → Content → Export
10. **nuqs for URL state**: Use parsers with `.withDefault()`

---
