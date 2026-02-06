# Setup and Routing Table

**Date**: 2026-02-06
**Feature**: View Workflow Info Dialog

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|-----------------|-------|
| 1 | Create the ViewWorkflowDialog Component | `frontend-component` | `components/workflows/view-workflow-dialog.tsx` (create) |
| 2 | Export the ViewWorkflowDialog from the Barrel File | `frontend-component` | `components/workflows/index.ts` (modify) |
| 3 | Add onViewInfo Callback to WorkflowTable | `frontend-component` | `components/workflows/workflow-table.tsx` (modify) |
| 4 | Add onViewInfo Callback to WorkflowHistoryTable | `frontend-component` | `components/workflows/workflow-history-table.tsx` (modify) |
| 5 | Wire ViewWorkflowDialog into WorkflowsTabContent | `frontend-component` | `components/workflows/workflows-tab-content.tsx` (modify) |
| 6 | Wire ViewWorkflowDialog into Active Workflows Page | `page-route` | `app/(app)/workflows/active/page.tsx` (modify) |
| 7 | Wire ViewWorkflowDialog into Created Workflows Page | `page-route` | `app/(app)/workflows/created/page.tsx` (modify) |
| 8 | Wire ViewWorkflowDialog into Workflow History Page | `page-route` | `app/(app)/workflows/history/page.tsx` (modify) |

## Rationale

- Steps 1-5: All component files in `components/workflows/` → `frontend-component`
- Steps 6-8: Page files in `app/(app)/` → `page-route`

## Status: MILESTONE:PHASE_2_COMPLETE
