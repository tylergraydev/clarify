# Implementation Setup - Routing Table

**Feature**: Active Workflows Page
**Phase**: 2 - Setup and Routing

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Create Active Workflows UI Preferences Store | `zustand-store` | `lib/stores/active-workflows-store.ts` |
| 2 | Extend WorkflowTable with Pause/Resume Actions | `frontend-component` | `components/workflows/workflow-table.tsx` |
| 3 | Extend WorkflowTableToolbar with Active Workflows Filter Options | `frontend-component` | `components/workflows/workflow-table-toolbar.tsx` |
| 4 | Implement Active Workflows Page Component | `page-route` | `app/(app)/workflows/active/page.tsx` |
| 5 | Add Cancel Confirmation Dialog | `frontend-component` | `app/(app)/workflows/active/page.tsx` |
| 6 | Add Empty State with Quick Action | `frontend-component` | `app/(app)/workflows/active/page.tsx` |
| 7 | Integration Testing and Edge Cases | `frontend-component` | `app/(app)/workflows/active/page.tsx` |

## Agent Selection Rationale

- **Step 1**: Zustand store creation → `zustand-store` specialist
- **Step 2-3**: React component modifications with CVA patterns → `frontend-component` specialist
- **Step 4**: Page in app router with hooks → `page-route` specialist (handles page structure + data fetching)
- **Steps 5-7**: Component/page enhancements → `frontend-component` specialist

## MILESTONE: PHASE_2_COMPLETE
