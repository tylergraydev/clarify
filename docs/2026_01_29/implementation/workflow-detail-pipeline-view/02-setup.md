# Setup and Routing Table

**Generated**: 2026-01-29

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|-----------------|-------|
| 1 | Create Step Status Badge Mapping Utility | `frontend-component` | `app/(app)/workflows/[id]/_components/step-status-badge.tsx` |
| 2 | Create Pipeline Step Node Component | `frontend-component` | `app/(app)/workflows/[id]/_components/pipeline-step-node.tsx` |
| 3 | Create Step Detail Panel Component | `frontend-component` | `app/(app)/workflows/[id]/_components/step-detail-panel.tsx` |
| 4 | Create Workflow Control Bar Component | `frontend-component` | `app/(app)/workflows/[id]/_components/workflow-control-bar.tsx` |
| 5 | Create Pipeline View Container Component | `frontend-component` | `app/(app)/workflows/[id]/_components/pipeline-view.tsx` |
| 6 | Create Loading Skeleton and Not Found Components | `frontend-component` | `workflow-detail-skeleton.tsx`, `workflow-not-found.tsx` |
| 7 | Create Component Index File | `general-purpose` | `app/(app)/workflows/[id]/_components/index.ts` |
| 8 | Implement Main Workflow Detail Page | `general-purpose` | `app/(app)/workflows/[id]/page.tsx`, `route-type.ts` |

## Specialist Selection Rationale

- **Steps 1-6**: `frontend-component` - All are React components in the feature component layer with CVA patterns
- **Step 7**: `general-purpose` - Simple barrel export file (TypeScript index)
- **Step 8**: `general-purpose` - Page component that composes feature components (not a UI primitive)

## Dependencies Between Steps

```
Step 1 (StepStatusBadge)
   ↓
Step 2 (PipelineStepNode) ← uses StepStatusBadge
   ↓
Step 3 (StepDetailPanel) ← used by PipelineStepNode
   ↓
Step 4 (WorkflowControlBar) ← independent
   ↓
Step 5 (PipelineView) ← composes PipelineStepNode
   ↓
Step 6 (Skeleton & NotFound) ← reference PipelineView structure
   ↓
Step 7 (Index) ← exports all components
   ↓
Step 8 (Page) ← imports from index, uses all components
```

## MILESTONE: PHASE_2_COMPLETE
