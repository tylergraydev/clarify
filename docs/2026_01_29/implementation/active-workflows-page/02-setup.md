# Setup and Routing Table

## Step Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Add `useActiveWorkflows` Query Hook with Polling | `tanstack-query` | `hooks/queries/use-workflows.ts` |
| 2 | Create Active Workflow Card Component with Quick Actions | `frontend-component` | `app/(app)/workflows/active/_components/active-workflow-card.tsx` |
| 3 | Create Loading Skeleton Component | `frontend-component` | `app/(app)/workflows/active/_components/active-workflow-card-skeleton.tsx` |
| 4 | Implement Active Workflows Page Content | `frontend-component` | `app/(app)/workflows/active/page.tsx` |
| 5 | Add Step Name Display Support | `frontend-component` | `app/(app)/workflows/active/_components/active-workflow-card.tsx` |
| 6 | Add Confirmation Dialog for Cancel Action | `frontend-component` | `app/(app)/workflows/active/page.tsx` |
| 7 | Integration Testing and Polish | `frontend-component` | Multiple files |

## Routing Logic Applied

- Step 1 → `tanstack-query`: Involves TanStack Query hooks and mutations
- Steps 2-7 → `frontend-component`: UI components and page implementation

## MILESTONE: PHASE_2_COMPLETE
