# Phase 3: Horizontal Pipeline Static - Setup & Routing Table

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Create Pipeline Zustand Store | `zustand-store` | `lib/stores/pipeline-store.ts` (Create) |
| 2 | Create PipelineStep Subcomponent | `frontend-component` | `components/workflows/pipeline-step.tsx` (Create) |
| 3 | Create PipelineConnector Subcomponent | `frontend-component` | `components/workflows/pipeline-connector.tsx` (Create) |
| 4 | Create Main PipelineView Component | `frontend-component` | `components/workflows/pipeline-view.tsx` (Create) |
| 5 | Update Workflow Components Index | `frontend-component` | `components/workflows/index.ts` (Modify) |
| 6 | Update WorkflowDetailSkeleton | `frontend-component` | `components/workflows/workflow-detail-skeleton.tsx` (Modify) |
| 7 | Integrate PipelineView into Page | `page-route` | `app/(app)/workflows/[id]/page.tsx` (Modify) |
| 8 | Verify Visual Rendering | `general-purpose` | Manual verification (no file changes) |

## Specialist Assignment Summary

- **zustand-store**: 1 step (Store creation)
- **frontend-component**: 5 steps (Components and exports)
- **page-route**: 1 step (Page integration)
- **general-purpose**: 1 step (Verification)

## Step Dependencies

```
Step 1 (Store) → Step 4 (PipelineView uses store)
Step 2 (PipelineStep) → Step 4 (PipelineView uses PipelineStep)
Step 3 (PipelineConnector) → Step 4 (PipelineView uses PipelineConnector)
Step 4 (PipelineView) → Step 5 (Index exports PipelineView)
Step 4 (PipelineView) → Step 7 (Page imports PipelineView)
Step 5 (Index) → Step 7 (Page imports from index)
Step 6 (Skeleton) - Independent
Step 7 (Page) → Step 8 (Verification needs page)
```

## Execution Order

Steps 1, 2, 3 can be executed in parallel (no dependencies).
Step 4 requires 1, 2, 3 to complete.
Steps 5, 6 can be executed after Step 4.
Step 7 requires Step 4, 5.
Step 8 requires Step 7.

## MILESTONE: PHASE_2_COMPLETE
