# Setup and Routing Table

**Feature**: Phase 2 - Workflow Detail Header & Metadata
**Date**: 2026-02-01

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Create helper functions for status and date formatting | `frontend-component` | `app/(app)/workflows/[id]/page.tsx` |
| 2 | Update WorkflowDetailSkeleton with full header layout | `frontend-component` | `components/workflows/workflow-detail-skeleton.tsx` |
| 3 | Implement header section with feature name and badges | `frontend-component` | `app/(app)/workflows/[id]/page.tsx` |
| 4 | Add metadata section with project link and timestamps | `frontend-component` | `app/(app)/workflows/[id]/page.tsx` |
| 5 | Implement action bar with placeholder buttons | `frontend-component` | `app/(app)/workflows/[id]/page.tsx` |
| 6 | Handle edge cases and conditional rendering | `frontend-component` | `app/(app)/workflows/[id]/page.tsx` |
| 7 | Verify barrel export and integration | `frontend-component` | `components/workflows/index.ts` |

## Specialist Assignment Reasoning

All steps are assigned to `frontend-component` because:

1. Steps 1, 3, 4, 5, 6 modify the page component (`app/(app)/workflows/[id]/page.tsx`) - this is React/UI work
2. Step 2 modifies a React skeleton component
3. Step 7 verifies barrel exports - simple file check/modification

No database schema, IPC handlers, query hooks, forms, or stores are being created - only React components and page modifications.

## Step Dependencies

```
Step 1 (Helpers) → Step 3, 4, 5 depend on helpers
Step 2 (Skeleton) → Independent
Step 3 (Header) → Depends on Step 1
Step 4 (Metadata) → Depends on Step 1
Step 5 (Action Bar) → Depends on Step 1
Step 6 (Edge Cases) → Depends on Steps 3, 4, 5
Step 7 (Verification) → Depends on Step 2
```

## Execution Order

Steps can be executed sequentially as written, with Step 2 being independent and potentially parallelizable with Step 1.

---

**MILESTONE:PHASE_2_COMPLETE**
