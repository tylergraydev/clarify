# TanStack Query Conventions

A comprehensive guide for consistent, maintainable data fetching and server state management using TanStack Query (React Query) with Electron IPC.

---

## Tech Stack

- **TanStack Query**: `@tanstack/react-query` for data fetching and caching
- **Query Key Factory**: `@lukemorales/query-key-factory` for type-safe key management
- **Runtime**: Electron renderer process via IPC

---

## File Organization

### Directory Structure

```
lib/
  queries/
    index.ts                    # Merged query keys and type exports
    projects.ts                 # Project query key definitions
    features.ts                 # Feature query key definitions
    repositories.ts             # Repository query key definitions

hooks/
  queries/
    use-projects.ts             # Project query and mutation hooks
    use-features.ts             # Feature query and mutation hooks
    use-repositories.ts         # Repository query and mutation hooks

components/
  providers/
    query-provider.tsx          # QueryClient provider configuration
```

### File Naming

- Query key files: `{entity}.ts` (kebab-case for multi-word entities)
- Query hook files: `use-{entity}.ts` (kebab-case, prefixed with `use-`)
- One entity per file for both keys and hooks

---

## Query Key Management

### Query Key Factory Pattern

Use `@lukemorales/query-key-factory` for all query key definitions:

```typescript
// lib/queries/projects.ts
import { createQueryKeys } from '@lukemorales/query-key-factory';

export const projectKeys = createQueryKeys('projects', {
  detail: (id: number) => [id],
  list: (filters?: string) => [{ filters }],
});
```

### Key Structure Rules

1. **Base key**: First argument to `createQueryKeys` is the entity name (plural)
2. **List queries**: Use `list` with optional filters object
3. **Detail queries**: Use `detail` with the entity ID
4. **Nested queries**: For related data, include parent ID

```typescript
// Correct patterns
export const featureKeys = createQueryKeys('features', {
  byProject: (projectId: number) => [projectId],
  detail: (id: number) => [id],
  list: (filters?: { projectId?: number; status?: string }) => [{ filters }],
});

// For child entities
export const planKeys = createQueryKeys('plans', {
  byFeature: (featureId: number) => [featureId],
  detail: (id: number) => [id],
});
```

### Merging Query Keys

All query keys must be merged and exported from the index file:

```typescript
// lib/queries/index.ts
import { inferQueryKeyStore, mergeQueryKeys } from '@lukemorales/query-key-factory';

import { featureKeys } from './features';
import { projectKeys } from './projects';

export const queries = mergeQueryKeys(projectKeys, featureKeys);
export type QueryKeys = inferQueryKeyStore<typeof queries>;
```

---

## Query Hooks

### Basic Query Hook Structure

```typescript
// hooks/queries/use-projects.ts
'use client';

import { useQuery } from '@tanstack/react-query';

import { projectKeys } from '@/lib/queries/projects';

import { useElectronDb } from '../useElectron';

export function useProjects() {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    ...projectKeys.list(),
    enabled: isElectron,
    queryFn: () => projects.getAll(),
  });
}

export function useProject(id: number) {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    ...projectKeys.detail(id),
    enabled: isElectron,
    queryFn: () => projects.getById(id),
  });
}
```

### Query Hook Naming Conventions

| Pattern       | Name                      | Example                           |
| ------------- | ------------------------- | --------------------------------- |
| List all      | `use{Entities}`           | `useProjects()`                   |
| Get by ID     | `use{Entity}`             | `useProject(id)`                  |
| Filtered list | `use{Entities}By{Filter}` | `useFeaturesByProject(projectId)` |

### Required Query Options

Every query hook must include:

1. **Spread query key**: `...entityKeys.query()` - provides `queryKey` automatically
2. **Electron check**: `enabled: isElectron` - prevents queries in non-Electron environments
3. **Query function**: `queryFn: () => ...` - the actual data fetching logic

```typescript
// Correct
return useQuery({
  ...projectKeys.detail(id),
  enabled: isElectron,
  queryFn: () => projects.getById(id),
});

// Incorrect - missing enabled check
return useQuery({
  ...projectKeys.detail(id),
  queryFn: () => projects.getById(id),
});

// Incorrect - manual queryKey instead of spread
return useQuery({
  enabled: isElectron,
  queryFn: () => projects.getById(id),
  queryKey: ['projects', 'detail', id],
});
```

---

## Mutation Hooks

### Basic Mutation Structure

```typescript
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof projects.create>[0]) => projects.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
    },
  });
}
```

### Mutation Hook Naming Conventions

| Operation     | Name                  | Example               |
| ------------- | --------------------- | --------------------- |
| Create        | `useCreate{Entity}`   | `useCreateProject()`  |
| Update        | `useUpdate{Entity}`   | `useUpdateProject()`  |
| Delete        | `useDelete{Entity}`   | `useDeleteProject()`  |
| Custom action | `use{Action}{Entity}` | `useArchiveProject()` |

### Cache Invalidation Patterns

Use `_def` property for base key invalidation:

```typescript
// Invalidate all list queries for an entity
void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });

// Invalidate all queries for an entity (list + details)
void queryClient.invalidateQueries({ queryKey: projectKeys._def });

// Invalidate specific query
void queryClient.invalidateQueries({
  queryKey: projectKeys.detail(id).queryKey,
});
```

### Optimistic Updates with setQueryData

For update mutations, set query data directly when beneficial:

```typescript
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof projects.update>[1]; id: number }) =>
      projects.update(id, data),
    onSuccess: (project) => {
      if (project) {
        // Update the detail cache directly
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        // Invalidate list to refetch
        void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
      }
    },
  });
}
```

### Delete Mutation Pattern

```typescript
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => projects.delete(id),
    onSuccess: () => {
      // Invalidate all project queries (removes deleted item from cache)
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
    },
  });
}
```

---

## Prefetching

### Layout-Level Prefetching

Prefetch critical data at the layout level for faster page loads:

```typescript
// app/(app)/layout.tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useElectronDb } from '@/hooks/useElectron';
import { projectKeys } from '@/lib/queries/projects';

function PrefetchCriticalData() {
  const queryClient = useQueryClient();
  const { isElectron, projects } = useElectronDb();

  useEffect(() => {
    if (!isElectron) return;

    void queryClient.prefetchQuery({
      ...projectKeys.list(),
      queryFn: () => projects.getAll(),
    });
  }, [queryClient, isElectron, projects]);

  return null;
}
```

### Prefetch on Hover/Focus

For detail pages, prefetch when user shows intent:

```typescript
const handleMouseEnter = () => {
  void queryClient.prefetchQuery({
    ...projectKeys.detail(projectId),
    queryFn: () => projects.getById(projectId),
  });
};
```

---

## Provider Configuration

### QueryClient Setup

Configure QueryClient with Electron-appropriate defaults:

```typescript
// components/providers/query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

type QueryProviderProps = RequiredChildren;

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // Electron doesn't need this
            staleTime: 5 * 60 * 1000, // 5 minutes (IPC is fast, cache aggressively)
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        buttonPosition={"top-right"}
        initialIsOpen={false}
        position={"top"}
      />
    </QueryClientProvider>
  );
}
```

### Default Options Rationale

- **refetchOnWindowFocus: false**: Electron apps don't benefit from refetching when the window gains focus since data is local
- **staleTime: 5 minutes**: IPC calls are fast, so aggressive caching improves perceived performance

---

## Type Safety

### Parameter Type Inference

Use `Parameters<typeof fn>` for mutation input types:

```typescript
export function useCreateProject() {
  const { projects } = useElectronDb();

  return useMutation({
    // Infer the parameter type from the repository method
    mutationFn: (data: Parameters<typeof projects.create>[0]) => projects.create(data),
  });
}
```

### Update Mutation Type Pattern

For updates with ID and data, use explicit object type:

```typescript
export function useUpdateProject() {
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof projects.update>[1]; id: number }) =>
      projects.update(id, data),
  });
}
```

### Query Return Types

Query hooks inherit return types from the query function:

```typescript
// Return type is UseQueryResult<Project | undefined>
export function useProject(id: number) {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    ...projectKeys.detail(id),
    enabled: isElectron,
    queryFn: () => projects.getById(id), // Returns Project | undefined
  });
}
```

---

## Electron Integration

### useElectronDb Hook Pattern

Always destructure `isElectron` along with repository methods:

```typescript
const { isElectron, projects } = useElectronDb();
```

### Enabled Condition

The `enabled` option must check `isElectron`:

```typescript
enabled: isElectron,

// For queries with additional conditions
enabled: isElectron && id > 0,
enabled: isElectron && Boolean(projectId),
```

### Why This Matters

- During SSR/SSG, `window.electronAPI` doesn't exist
- Queries would fail without the Electron check
- The `isElectron` flag prevents queries from running in non-Electron contexts

---

## Complete Hook File Example

```typescript
// hooks/queries/use-projects.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { projectKeys } from '@/lib/queries/projects';

import { useElectronDb } from '../useElectron';

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof projects.create>[0]) => projects.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => projects.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys._def });
    },
  });
}

export function useProject(id: number) {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    ...projectKeys.detail(id),
    enabled: isElectron,
    queryFn: () => projects.getById(id),
  });
}

export function useProjects() {
  const { isElectron, projects } = useElectronDb();

  return useQuery({
    ...projectKeys.list(),
    enabled: isElectron,
    queryFn: () => projects.getAll(),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { projects } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof projects.update>[1]; id: number }) =>
      projects.update(id, data),
    onSuccess: (project) => {
      if (project) {
        queryClient.setQueryData(projectKeys.detail(project.id).queryKey, project);
        void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
      }
    },
  });
}
```

---

## Essential Rules Summary

1. **Query Key Factory**: Always use `@lukemorales/query-key-factory` for key definitions
2. **Spread Keys**: Use `...entityKeys.query()` to spread query key options
3. **Electron Check**: Every query must have `enabled: isElectron`
4. **Invalidation Pattern**: Use `_def` for base key invalidation
5. **Void Prefix**: Use `void` for invalidation promises
6. **Naming Convention**: `use{Entity}` for detail, `use{Entities}` for list
7. **File Organization**: Keys in `lib/queries/`, hooks in `hooks/queries/`
8. **Type Inference**: Use `Parameters<typeof fn>` for mutation inputs
9. **Cache Updates**: Use `setQueryData` for optimistic updates on mutations
10. **Merged Exports**: All keys merged in `lib/queries/index.ts`
11. **Query Functions**: Always return null or data, never undefined

---
