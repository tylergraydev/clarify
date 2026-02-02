# Setup and Routing Table

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Create Route Type File for URL State Management | `page-route` | `app/(app)/workflows/history/route-type.ts` |
| 2 | Create History Table Toolbar Component | `frontend-component` | `components/workflows/history-table-toolbar.tsx` |
| 3 | Create Workflow History Table Component | `tanstack-table` | `components/workflows/workflow-history-table.tsx` |
| 4 | Update Components Index Export | `frontend-component` | `components/workflows/index.ts` |
| 5 | Implement Workflow History Page | `page-route` | `app/(app)/workflows/history/page.tsx` |
| 6 | Add Server-Side Pagination Support to History Query Hook | `tanstack-query` | `hooks/queries/use-workflows.ts` |
| 7 | Implement Controlled Pagination in History Table | `tanstack-table` | `components/workflows/workflow-history-table.tsx`, `app/(app)/workflows/history/page.tsx` |
| 8 | Add Statistics Summary Section | `page-route` | `app/(app)/workflows/history/page.tsx` |

## Specialist Assignment Reasoning

- **Step 1 (page-route)**: Route type files with Zod schemas are part of Next.js routing conventions
- **Step 2 (frontend-component)**: Toolbar is a UI component using Base UI + CVA patterns
- **Step 3 (tanstack-table)**: Data table component with column definitions and TanStack Table
- **Step 4 (frontend-component)**: Barrel export file modification
- **Step 5 (page-route)**: Full Next.js page implementation
- **Step 6 (tanstack-query)**: TanStack Query hook enhancement
- **Step 7 (tanstack-table)**: Table pagination state management (primary), page integration (secondary)
- **Step 8 (page-route)**: Page-level UI addition with query integration

## Step Dependencies

```
Step 1 (route-type) → Step 5 (page uses route type)
Step 2 (toolbar) → Step 5 (page uses toolbar)
Step 3 (table) → Step 5 (page uses table) → Step 7 (pagination enhancement)
Step 4 (exports) → Step 5 (page imports from barrel)
Step 6 (query hook) → Step 5 (page uses hook)
Step 5 (page) → Step 7 (pagination) → Step 8 (statistics)
```

## Execution Order

Optimal execution order (respecting dependencies):
1. Step 1 - Route Type (no dependencies)
2. Step 2 - Toolbar Component (no dependencies)
3. Step 3 - Table Component (no dependencies)
4. Step 4 - Index Exports (depends on 2, 3)
5. Step 6 - Query Hook (no dependencies)
6. Step 5 - Page Implementation (depends on 1, 2, 3, 4, 6)
7. Step 7 - Controlled Pagination (depends on 3, 5)
8. Step 8 - Statistics Section (depends on 5)

MILESTONE:PHASE_2_COMPLETE
