# Step 2: File Discovery

**Status**: Completed
**Files Discovered**: 25 files (8 high priority, 9 medium priority, 8 low priority)

## High Priority (Core Implementation)

| File | Role |
|------|------|
| `components/workflows/workflow-table.tsx` | Primary table with ActionsCell "View" action (lines 115-121). Needs new `onViewInfo` prop. |
| `components/workflows/workflow-history-table.tsx` | History table with same pattern. Needs same `onViewInfo` prop. |
| `components/workflows/workflows-tab-content.tsx` | Parent component on project page. Wires `handleViewDetails` (line 84-94). Must add dialog state. |
| `app/(app)/workflows/active/page.tsx` | Active Workflows page. Renders `WorkflowTable` with `onViewDetails` (line 366). |
| `app/(app)/workflows/history/page.tsx` | Workflow History page. Renders `WorkflowHistoryTable` with `onViewDetails` (line 576). |
| `app/(app)/workflows/created/page.tsx` | Created Workflows page. Renders `WorkflowTable` with `onViewDetails` (line 305). |
| `components/ui/dialog.tsx` | Dialog component library (Base UI). Foundation for new dialog. |
| `components/workflows/index.ts` | Barrel exports. Must add new dialog export. |

## Medium Priority (Supporting)

| File | Role |
|------|------|
| `db/schema/workflows.schema.ts` | Workflow schema with all 18 fields. Source of truth for dialog fields. |
| `hooks/queries/use-workflows.ts` | `useWorkflow(id)` hook. Available if fresh data needed. |
| `hooks/queries/use-projects.ts` | `useProject(id)` for resolving projectId to name. |
| `hooks/queries/use-agent-queries.ts` | `useAgent(id)` for resolving clarificationAgentId to name. |
| `hooks/queries/use-worktrees.ts` | `useWorktree(id)` for resolving worktreeId to path. |
| `lib/utils.ts` | Formatting utilities: `formatDate`, `formatDateTime`, `formatDuration`, `getWorkflowStatusVariant`. |
| `components/ui/badge.tsx` | Badge component for status/type display. |
| `types/electron.d.ts` | Re-exports `Workflow` type. |
| `hooks/queries/index.ts` | Barrel exports for query hooks. |

## Low Priority (Reference/No Changes)

| File | Role |
|------|------|
| `components/workflows/edit-workflow-dialog.tsx` | Pattern reference for dialog structure. |
| `components/ui/confirm-action-dialog.tsx` | Pattern reference for controlled dialog. |
| `lib/queries/workflows.ts` | Query key factory. No changes needed. |
| `db/schema/worktrees.schema.ts` | Reference for worktree `path` field. |
| `db/schema/agents.schema.ts` | Reference for agent `name` field. |
| `db/schema/projects.schema.ts` | Reference for project `name` field. |

## Key Architecture Insights

1. **Dialog Pattern**: Controlled `isOpen`/`onOpenChange` with `DialogRoot > DialogPortal > DialogBackdrop + DialogPopup`
2. **Action Handler Bifurcation**: Currently both row click and View action use same `onViewDetails`. Must split into `onViewDetails` (row) and `onViewInfo` (action menu).
3. **Related Entity Resolution**: Use existing `useProject`, `useAgent`, `useWorktree` hooks inside dialog.
4. **No Existing Read-Only Detail Dialog**: New pattern combining `ConfirmActionDialog` simplicity with `EditWorkflowDialog` layout.
5. **Four Integration Points**: `workflows-tab-content.tsx`, `active/page.tsx`, `created/page.tsx`, `history/page.tsx` all need dialog wired in.
