# Step 2: AI-Powered File Discovery

**Started**: 2026-01-29T00:01:00.000Z
**Completed**: 2026-01-29T00:02:00.000Z
**Duration**: ~60 seconds
**Status**: Completed

## Refined Request Used as Input

Implement the workflow list page and new workflow creation dialog to establish the primary user journey for Clarify's core orchestration feature. The workflow infrastructure is fully complete on the backend with the database schema defining workflows with status types (created, running, paused, editing, completed, failed, cancelled), workflow types (planning, implementation), and pause behaviors (continuous, auto_pause, gates_only), along with corresponding repositories, IPC handlers in the workflow domain, and TanStack Query hooks already implemented. The workflow list page at /workflows should follow the established Projects page pattern, featuring a dual card/table view toggle, status-based filtering, text search functionality, proper loading states with skeletons, and meaningful empty states. URL state for filters and view mode should be managed via nuqs. The new workflow creation flow should be implemented as a dialog component built on Base UI primitives with CVA styling patterns, incorporating a multi-section form using TanStack Form.

## Discovery Analysis Summary

- **Directories Explored**: 7 key directories (app, components, hooks, db, electron, lib, types)
- **Candidate Files Examined**: 60+
- **Highly Relevant Files Found**: 20+
- **Supporting Files Identified**: 15+

## Discovered Files by Priority

### Critical Files (Must modify/create)

| File Path                                         | Reason                                                                                                                                              | Action     |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `app/(app)/workflows/page.tsx`                    | Main workflow list page - currently a placeholder that needs full implementation with card/table views, filtering, search, and empty states         | **Modify** |
| `app/(app)/workflows/new/page.tsx`                | New workflow creation page - currently a placeholder that needs the creation form or dialog integration                                             | **Modify** |
| `components/workflows/create-workflow-dialog.tsx` | New workflow creation dialog - needs to be created following the pattern from `create-project-dialog.tsx` with multi-section form                   | **Create** |
| `components/workflows/workflow-card.tsx`          | Workflow card component for card view - needs to be created following the pattern from `project-card.tsx`                                           | **Create** |
| `components/workflows/workflow-table.tsx`         | Workflow table component for table view - needs to be created following the pattern from `project-table.tsx`                                        | **Create** |
| `app/(app)/workflows/route-type.ts`               | Route type definitions for workflow list page (view, status filter, search params) - needs to be created following `projects/route-type.ts` pattern | **Create** |
| `lib/validations/workflow.ts`                     | Zod validation schema for workflow creation form - needs to be created following `project.ts` pattern                                               | **Create** |

### High Priority (Direct dependencies)

| File Path                           | Reason                                                                                                                                    | Action        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `hooks/queries/use-workflows.ts`    | Existing TanStack Query hooks (useWorkflows, useWorkflowsByProject, useCreateWorkflow, etc.) - already implemented, will be used directly | **Reference** |
| `db/schema/workflows.schema.ts`     | Workflow schema with status types, workflow types, pause behaviors                                                                        | **Reference** |
| `lib/queries/workflows.ts`          | Workflow query keys factory for cache management                                                                                          | **Reference** |
| `hooks/queries/use-templates.ts`    | Template hooks for template selection in workflow creation                                                                                | **Reference** |
| `hooks/queries/use-repositories.ts` | Repository hooks for repository selection                                                                                                 | **Reference** |
| `hooks/queries/use-projects.ts`     | Project hooks for project selection and context                                                                                           | **Reference** |
| `types/electron.d.ts`               | Type definitions for ElectronAPI including NewWorkflow, Workflow types                                                                    | **Reference** |
| `lib/forms/form-hook.ts`            | TanStack Form configuration with pre-registered field components                                                                          | **Reference** |

### Medium Priority (Reference implementations)

| File Path                                                     | Reason                                                                                                                                           | Action        |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `app/(app)/projects/page.tsx`                                 | **Primary reference** - exemplary implementation of list page with card/table toggle, filtering, loading skeletons, empty states, nuqs URL state | **Reference** |
| `components/projects/create-project-dialog.tsx`               | **Dialog reference** - pattern for form dialog with TanStack Form, validation, mutation handling                                                 | **Reference** |
| `components/projects/project-card.tsx`                        | **Card reference** - pattern for item card with Badge, status display, actions                                                                   | **Reference** |
| `components/projects/project-table.tsx`                       | **Table reference** - pattern for table view with clickable rows, status badges                                                                  | **Reference** |
| `app/(app)/projects/route-type.ts`                            | **Route type reference** - pattern for defining search params with Zod for nuqs                                                                  | **Reference** |
| `app/(app)/dashboard/_components/active-workflows-widget.tsx` | Dashboard workflow display patterns - status mapping, progress calculation                                                                       | **Reference** |
| `app/(app)/dashboard/_components/recent-workflows-widget.tsx` | Additional workflow display patterns - status icons, relative time                                                                               | **Reference** |

### Low Priority (UI Components)

| File Path                                  | Reason                                                        | Action                        |
| ------------------------------------------ | ------------------------------------------------------------- | ----------------------------- |
| `components/ui/dialog.tsx`                 | Dialog primitives                                             | **Reference**                 |
| `components/ui/badge.tsx`                  | Badge component - may need new variants for workflow statuses | **Reference/Possible Modify** |
| `components/ui/empty-state.tsx`            | EmptyState component                                          | **Reference**                 |
| `components/ui/button.tsx`                 | Button component with variants                                | **Reference**                 |
| `components/ui/button-group.tsx`           | ButtonGroup for view toggle                                   | **Reference**                 |
| `components/ui/card.tsx`                   | Card components                                               | **Reference**                 |
| `components/ui/form/select-field.tsx`      | SelectField for selections                                    | **Reference**                 |
| `components/ui/form/radio-field.tsx`       | RadioField for workflow type                                  | **Reference**                 |
| `components/ui/form/textarea-field.tsx`    | TextareaField for feature request                             | **Reference**                 |
| `components/ui/form/text-field.tsx`        | TextField for feature name                                    | **Reference**                 |
| `components/ui/form/number-field.tsx`      | NumberField for timeout settings                              | **Reference**                 |
| `components/data/query-error-boundary.tsx` | QueryErrorBoundary for error handling                         | **Reference**                 |
| `lib/utils.ts`                             | cn utility function                                           | **Reference**                 |
| `hooks/use-electron.ts`                    | useElectron hook for API access                               | **Reference**                 |

### Supporting Files (Context/Infrastructure)

| File Path                                 | Reason                                     | Action        |
| ----------------------------------------- | ------------------------------------------ | ------------- |
| `db/schema/templates.schema.ts`           | Template schema for template selection     | **Reference** |
| `db/schema/repositories.schema.ts`        | Repository schema for repository selection | **Reference** |
| `db/schema/projects.schema.ts`            | Project schema for project relationship    | **Reference** |
| `db/repositories/workflows.repository.ts` | Workflows repository                       | **Reference** |
| `electron/ipc/workflow.handlers.ts`       | IPC handlers for workflow operations       | **Reference** |
| `lib/queries/templates.ts`                | Template query keys                        | **Reference** |
| `lib/queries/projects.ts`                 | Project query keys                         | **Reference** |
| `app/(app)/layout.tsx`                    | App shell layout context                   | **Reference** |
| `app/globals.css`                         | CSS variables and theme definitions        | **Reference** |
| `types/component-types.ts`                | Global type utilities                      | **Reference** |
| `app/(app)/workflows/[id]/route-type.ts`  | Route type for workflow detail page        | **Reference** |

## Architecture Insights

### Key Patterns Discovered

1. **List Page Pattern** (`projects/page.tsx`):
   - URL state management with `nuqs` (parseAsStringLiteral, parseAsBoolean)
   - Type-safe routes with `next-typesafe-url` (withParamValidation HOC)
   - Dual view toggle (card/table) with view state persistence
   - Loading skeletons matching actual content layout
   - QueryErrorBoundary wrapping data-dependent content
   - Empty states differentiating "no data" vs "filtered out"

2. **Dialog Form Pattern** (`create-project-dialog.tsx`):
   - Controlled dialog state with useState
   - TanStack Form via `useAppForm` with Zod validation
   - Form reset on dialog close
   - Mutation with optimistic cache invalidation
   - Pre-registered field components (TextField, TextareaField, SelectField)

3. **Query Hooks Pattern** (`use-workflows.ts`):
   - Query key factory pattern with @lukemorales/query-key-factory
   - Proper cache invalidation on mutations
   - useElectron hook for API access with isElectron guard

4. **Schema Pattern** (`workflows.schema.ts`):
   - Const arrays for enum-like values (workflowStatuses, workflowTypes, pauseBehaviors)
   - Inferred types with $inferInsert/$inferSelect
   - Indexed columns for common queries

### Existing Similar Functionality

- Dashboard widgets already display workflows with:
  - Status badge mapping (getStatusVariant function)
  - Progress calculation from currentStepNumber/totalSteps
  - Elapsed time formatting with date-fns
  - Navigation to `/workflows/[id]` via $path

### Integration Points

1. **Navigation**: Links to `/workflows/new` already exist in dashboard widgets
2. **Route Types**: Workflow detail route type exists at `/workflows/[id]/route-type.ts`
3. **Query Keys**: Workflow keys already support byProject, byStatus, byType filtering
4. **Badge Variants**: Existing variants cover most workflow statuses

## Discovery Statistics

| Metric                | Count  |
| --------------------- | ------ |
| Critical Files        | 7      |
| High Priority Files   | 8      |
| Medium Priority Files | 7      |
| Low Priority Files    | 14     |
| Supporting Files      | 11     |
| **Total Discovered**  | **47** |
| Files to Create       | 5      |
| Files to Modify       | 2      |
| Reference Files       | 40     |

## File Path Validation

All discovered files were validated for existence:

- Existing files: All reference files confirmed to exist
- Files to create: Confirmed parent directories exist
- No inaccessible files detected

---

**MILESTONE:STEP_2_COMPLETE**
