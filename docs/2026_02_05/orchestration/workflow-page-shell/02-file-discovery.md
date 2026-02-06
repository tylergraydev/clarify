# Step 2: File Discovery

## Metadata

- Status: Completed
- Timestamp: 2026-02-05
- Duration: ~236s

## Input

Refined feature request for workflow page shell implementation.

## Discovery Summary

- Explored: 18 directories, 62 candidate files
- Found: 14 highly relevant files, 26 supporting files

## Files to Create (Critical)

| File | Purpose |
|------|---------|
| `lib/stores/workflow-detail-store.ts` | Zustand store for workflow detail UI state |
| `components/workflows/detail/workflow-top-bar.tsx` | Sticky top bar with workflow info and actions |
| `components/workflows/detail/workflow-step-accordion.tsx` | Main accordion with 4 workflow steps |
| `components/workflows/detail/workflow-streaming-panel.tsx` | Collapsible bottom streaming panel with tabs |
| `components/workflows/detail/workflow-pre-start-form.tsx` | Pre-start settings form |
| `components/workflows/detail/steps/clarification-step-content.tsx` | Clarification step expanded content |
| `components/workflows/detail/steps/refinement-step-content.tsx` | Refinement step expanded content |
| `components/workflows/detail/steps/file-discovery-step-content.tsx` | File Discovery step expanded content |
| `components/workflows/detail/steps/implementation-planning-step-content.tsx` | Implementation Planning step expanded content |
| `components/workflows/detail/index.ts` | Barrel exports |

## Files to Modify (High)

| File | Changes |
|------|---------|
| `app/(app)/workflows/[id]/page.tsx` | Replace placeholder with full three-zone layout |
| `app/(app)/workflows/[id]/route-type.ts` | Add `searchParams` with `step` enum parameter |
| `components/workflows/index.ts` | Add barrel exports for `detail/` |
| `lib/layout/constants.ts` | Add storage keys and defaults for workflow detail store |

## Reference Files (Medium)

- `components/ui/accordion.tsx` - AccordionRoot/Item/Header/Trigger/Panel with status variants
- `components/ui/tabs.tsx` - TabsRoot/List/Trigger/Indicator/Panel
- `components/ui/badge.tsx` - Badge with status variants
- `components/ui/button.tsx` - Button with variants
- `components/ui/card.tsx` - Card components
- `components/ui/icon-button.tsx` - IconButton for actions
- `components/ui/separator.tsx` - Separator
- `components/ui/tooltip.tsx` - Tooltip
- `components/ui/collapsible.tsx` - Collapsible for streaming panel
- `components/ui/empty-state.tsx` - EmptyState for pending steps
- `lib/forms/form-hook.ts` - useAppForm with registered field components
- `lib/utils.ts` - cn(), formatDuration(), getWorkflowStatusVariant()

## Reference Files (Low - Pattern Reference)

- `lib/stores/active-workflows-store.ts` - Zustand store pattern template
- `lib/stores/shell-store.ts` - Store with persistence pattern
- `app/(app)/workflows/history/page.tsx` - nuqs usage pattern
- `app/(app)/projects/[id]/page.tsx` - Detail page pattern
- `db/schema/workflows.schema.ts` - pauseBehaviors, workflowStatuses constants
- `db/schema/workflow-steps.schema.ts` - stepStatuses, stepTypes constants
- `types/electron.d.ts` - Workflow, WorkflowStep types
- `lib/validations/workflow.ts` - Workflow form validation schemas
- `hooks/queries/use-workflows.ts` - Workflow query hooks (future interface)
- `app/globals.css` - CSS custom properties for layout dimensions

## Architecture Insights

1. AccordionItem status variants directly map to workflow step statuses
2. Badge variants already include all needed workflow status variants
3. `getWorkflowStatusVariant()` utility maps status strings to badge variants
4. `pauseBehaviors` constant from schema maps to advance mode indicator
5. `stepTypes` constant provides canonical step type strings for `?step=` param
6. nuqs NuqsAdapter already in root layout - ready for `useQueryState`
7. CSS variables already define `--workflow-header-height: 64px`
