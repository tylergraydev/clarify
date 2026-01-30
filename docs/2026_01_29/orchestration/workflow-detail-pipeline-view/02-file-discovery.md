# Step 2: AI-Powered File Discovery

**Started**: 2026-01-29T00:01:00Z
**Completed**: 2026-01-29T00:02:30Z
**Duration**: ~90 seconds
**Status**: Completed

## Input

### Refined Feature Request

The Workflow Detail and Pipeline View feature implements the /workflows/[id] dynamic route page to visualize workflow execution progress through the orchestration pipeline stages (Clarify, Refine, Discover, Plan). This page serves as the primary interface for monitoring and controlling active workflows after creation, leveraging the existing IPC infrastructure where step handlers (step:get, step:list, step:edit, step:create, step:delete, step:regenerate) are already implemented in electron/ipc/step.handlers.ts, and corresponding TanStack Query hooks exist in hooks/queries/use-steps.ts alongside workflow hooks in hooks/queries/use-workflows.ts. The page should display a horizontal or vertical pipeline visualization showing each workflow step as a distinct node with real-time status indicators reflecting the step statuses defined in db/schema/workflow-steps.schema.ts (pending, running, completed, failed, skipped), using appropriate visual treatments such as color-coded badges, progress spinners for running steps, and checkmarks or error icons for terminal states. Each step node should be expandable to reveal detail panels showing the step's input data (the context or request that initiated the step) and output data (the generated content or results), with the content appropriately formatted and scrollable for longer outputs. The page must implement workflow control actions—pause, resume, and cancel—as prominent action buttons in the page header or a floating control bar, triggering the corresponding IPC workflow handlers (workflow:pause, workflow:resume, workflow:cancel) and optimistically updating the UI state via TanStack Query mutations with proper cache invalidation using the query key factories defined in lib/queries/. The implementation should follow the existing CVA Component Pattern for UI elements, building step indicators and detail panels using Base UI primitives with class-variance-authority variants for consistent styling across states, and integrate with the four-region app shell layout where the pipeline visualization occupies the main content area. The route should use next-typesafe-url for type-safe parameter handling of the workflow ID, fetch the workflow and its steps on mount using the existing query hooks, and handle loading, error, and empty states appropriately with the QueryErrorBoundary pattern established in components/data/. This feature directly unblocks subsequent capabilities including inline step editing (allowing users to modify intermediate outputs), file discovery management (editing discovered files with priority and include/exclude controls), step regeneration (re-running individual steps with modified inputs), and real-time progress updates via polling or event-based refresh patterns.

## File Discovery Results

### Critical Priority (Must Modify/Create)

| #   | File                                     | Reason                                | Expected Changes                                                                                                                        |
| --- | ---------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `app/(app)/workflows/[id]/page.tsx`      | Main page file, currently placeholder | Complete rewrite - implement full pipeline visualization, step display, workflow controls (pause/resume/cancel), and step detail panels |
| 2   | `app/(app)/workflows/[id]/route-type.ts` | Route type definition                 | May need to update to use `z.coerce.number().int().positive()` pattern like projects/[id] for consistent numeric ID handling            |

### High Priority (Likely Changes)

| #   | File                             | Reason                                                                             | Expected Changes                                                                                     |
| --- | -------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | `hooks/queries/use-workflows.ts` | Contains useWorkflow, usePauseWorkflow, useResumeWorkflow, useCancelWorkflow hooks | May need to add optimistic update patterns or polling configuration for real-time status updates     |
| 2   | `hooks/queries/use-steps.ts`     | Contains useStepsByWorkflow, useStep, useEditStep, etc.                            | Will be used directly; may need polling or refetch configuration                                     |
| 3   | `lib/queries/steps.ts`           | Query key factory for steps                                                        | May need to ensure key patterns support the page's caching needs                                     |
| 4   | `lib/queries/workflows.ts`       | Query key factory for workflows                                                    | Will be used for cache invalidation patterns                                                         |
| 5   | `components/ui/badge.tsx`        | Has existing status variants                                                       | May need additional variants for step-specific statuses (pending, running, paused, editing, skipped) |

### Medium Priority (May Need Changes/Reference)

| #   | File                                       | Reason                                                                         |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| 1   | `db/schema/workflow-steps.schema.ts`       | Defines step statuses and types - essential reference                          |
| 2   | `db/schema/workflows.schema.ts`            | Defines workflow statuses and types - essential reference                      |
| 3   | `electron/ipc/step.handlers.ts`            | IPC handlers for step operations - reference for available operations          |
| 4   | `electron/ipc/workflow.handlers.ts`        | IPC handlers for workflow operations - reference for control actions           |
| 5   | `electron/preload.ts`                      | Defines ElectronAPI interface - reference for API contract                     |
| 6   | `types/electron.d.ts`                      | TypeScript declarations for ElectronAPI - exports Workflow, WorkflowStep types |
| 7   | `components/data/query-error-boundary.tsx` | Error boundary component - should wrap page content                            |
| 8   | `components/ui/collapsible.tsx`            | Collapsible component for expandable step detail panels                        |
| 9   | `components/ui/card.tsx`                   | Card components for containing step details                                    |
| 10  | `components/ui/button.tsx`                 | Button component for workflow control actions                                  |
| 11  | `components/ui/tabs.tsx`                   | Tabs component - could be used for step input/output switching                 |
| 12  | `components/ui/empty-state.tsx`            | Empty state component for when workflow has no steps                           |
| 13  | `components/ui/tooltip.tsx`                | Tooltip component for additional context on step statuses                      |
| 14  | `components/ui/alert.tsx`                  | Alert component for displaying workflow errors/warnings                        |
| 15  | `components/ui/separator.tsx`              | Separator component for visual division                                        |
| 16  | `hooks/use-electron.ts`                    | Hook for accessing ElectronAPI                                                 |
| 17  | `hooks/use-toast.ts`                       | Toast hook for success/error notifications                                     |

### Low Priority (Reference Only)

| #   | File                                                          | Reason                                                                       |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | `app/(app)/projects/[id]/page.tsx`                            | Reference for dynamic route pattern, breadcrumbs, loading/error states, tabs |
| 2   | `app/(app)/projects/[id]/route-type.ts`                       | Reference for numeric ID validation pattern                                  |
| 3   | `components/workflows/workflow-card.tsx`                      | Reference for status variant mapping, progress calculation                   |
| 4   | `components/workflows/workflow-table.tsx`                     | Reference for status handling and action button patterns                     |
| 5   | `app/(app)/dashboard/_components/active-workflows-widget.tsx` | Reference for workflow progress display, elapsed time formatting             |
| 6   | `app/(app)/layout.tsx`                                        | App shell layout - reference for four-region layout                          |
| 7   | `app/layout.tsx`                                              | Root layout with providers - reference for provider composition              |
| 8   | `app/globals.css`                                             | CSS variables including workflow-specific dimensions                         |
| 9   | `lib/utils.ts`                                                | Utility function cn() for className composition                              |
| 10  | `lib/stores/shell-store.ts`                                   | Zustand store for shell state                                                |
| 11  | `db/repositories/workflow-steps.repository.ts`                | Repository implementation - reference for data structure                     |
| 12  | `db/repositories/workflows.repository.ts`                     | Repository implementation - reference for data operations                    |
| 13  | `components/providers/query-provider.tsx`                     | TanStack Query provider configuration                                        |
| 14  | `electron/ipc/channels.ts`                                    | IPC channel constants                                                        |
| 15  | `hooks/queries/index.ts`                                      | Barrel export for query hooks                                                |
| 16  | `lib/queries/index.ts`                                        | Barrel export for query key factories                                        |

## Discovery Statistics

- **Total files discovered**: 40
- **Critical**: 2
- **High**: 5
- **Medium**: 17
- **Low**: 16

## Architecture Insights

### Key Patterns Discovered

1. **Type-Safe Routing Pattern**: The `projects/[id]` route demonstrates the pattern for dynamic routes using `next-typesafe-url`. The workflow detail page should follow the same pattern with `useRouteParams(Route.routeParams)` for validating the workflow ID.

2. **Query Hook Pattern**: Existing hooks use `useQuery` with query keys from `@lukemorales/query-key-factory` and the `useElectron` hook for API access. Mutations use `useMutation` with cache invalidation via `queryClient.invalidateQueries`.

3. **CVA Component Pattern**: UI components use `class-variance-authority` for variant-based styling. The badge component already has status variants that can be leveraged.

4. **Error Handling Pattern**: The `QueryErrorBoundary` component wraps content that uses TanStack Query, providing automatic error display with retry functionality.

5. **Status Mapping**: Both workflow cards and dashboard widgets map workflow status strings to badge variants. This pattern should be extended to step statuses.

### Existing Similar Functionality

- Dashboard `ActiveWorkflowsWidget` shows workflow progress and allows navigation to detail pages
- `WorkflowCard` and `WorkflowTable` components display workflow status with badges and progress bars
- `projects/[id]/page.tsx` demonstrates the full pattern for detail pages with breadcrumbs, tabs, loading states, and mutations

### Integration Points

1. **Navigation**: From workflow list/cards/dashboard widgets to `/workflows/[id]`
2. **Query Invalidation**: Step mutations should invalidate both step queries and related workflow queries (already implemented in hooks)
3. **Cache Updates**: Optimistic updates for control actions (pause/resume/cancel) should update the detail cache directly

### Potential Challenges

1. **Real-Time Updates**: May need to implement polling via `refetchInterval` or event-based refresh for active workflows to show live step progress
2. **Step Content Display**: Steps have both `inputText` and `outputText` fields that could contain large content requiring scrollable panels
3. **Visual Pipeline**: Creating a horizontal/vertical pipeline visualization with connected step nodes will require custom CSS and possibly new UI primitives

## File Validation

All discovered file paths were validated to exist in the codebase. The discovery covers:

- Database layer (schemas, repositories)
- Electron layer (IPC handlers, preload, channels)
- Query layer (hooks, key factories)
- UI layer (components, providers)
- App layer (pages, layouts)
- Type definitions
