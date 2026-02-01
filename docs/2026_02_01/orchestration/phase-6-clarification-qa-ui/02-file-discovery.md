# Step 2: AI-Powered File Discovery

**Status**: Completed
**Started**: 2026-02-01T00:02:00Z
**Completed**: 2026-02-01T00:03:30Z
**Duration**: ~1.5 minutes

## Refined Request Used as Input

Implement a clarification Q&A form UI for Phase 6 of the workflow implementation pipeline, enabling users to answer structured questions during workflow execution. The clarification step should display a form that renders questions from the workflow step's `outputStructured.questions` array as form fields using the existing TanStack Form infrastructure and custom field components (TextField, TextareaField, SelectField). When users submit answers, they should be persisted to the step's `outputStructured.answers` object and the step should automatically transition to a completed state. Include a "Skip" button that allows users to bypass the clarification step entirely. Display Q&A summary in collapsed PipelineStep view.

## Discovery Approach

- Explored 12 directories (db, electron/ipc, hooks/queries, components/workflows, components/ui/form, lib/queries, lib/validations, lib/stores, lib/forms, types, app)
- Examined 52 candidate files
- Found 18 highly relevant files
- Identified 14 supporting files

## Discovered Files

### Critical Priority (Must Modify)

| File | Path | Reason |
|------|------|--------|
| pipeline-step.tsx | `components/workflows/pipeline-step.tsx` | Core UI component for displaying individual pipeline steps. Must be extended to render clarification Q&A form when step type is 'clarification' and display summary of answers in collapsed state. |
| pipeline-view.tsx | `components/workflows/pipeline-view.tsx` | Parent component that orchestrates pipeline step display. May need to handle clarification step-specific rendering and form state management. |
| use-steps.ts | `hooks/queries/use-steps.ts` | TanStack Query hooks for step operations. Must add `useUpdateStep` mutation for saving `outputStructured` answers. |
| step.handlers.ts | `electron/ipc/step.handlers.ts` | IPC handlers for step operations. Must add `step:update` handler to save `outputStructured` data. |
| channels.ts | `electron/ipc/channels.ts` | IPC channel definitions. Must add `step.update` channel for updating step structured output. |
| workflow-steps.repository.ts | `db/repositories/workflow-steps.repository.ts` | Repository for workflow step database operations. Already has `update()`, `skip()`, and `complete()` methods. May need method to update `outputStructured` specifically. |

### High Priority (Likely Modify)

| File | Path | Reason |
|------|------|--------|
| electron.d.ts | `types/electron.d.ts` | TypeScript types for Electron API. Must add step update method signature. |
| preload.ts | `electron/preload.ts` | Preload script exposing API to renderer. Must add step.update method binding. |
| use-electron.ts | `hooks/use-electron.ts` | Electron API hooks. Must add `update` method to `steps` object. |
| workflow.ts | `lib/validations/workflow.ts` | Zod validation schemas. Must add clarification Q&A schema. |
| steps.ts | `lib/queries/steps.ts` | Query key factory for steps. May need additional query key. |
| page.tsx | `app/(app)/workflows/[id]/page.tsx` | Workflow detail page that renders PipelineView. May need to handle clarification callbacks. |

### Medium Priority (Reference)

| File | Path | Reason |
|------|------|--------|
| workflow-steps.schema.ts | `db/schema/workflow-steps.schema.ts` | Schema defines `outputStructured` as JSON text field. Reference for data structure. |
| workflows.schema.ts | `db/schema/workflows.schema.ts` | Workflow schema with `skipClarification` field. Reference. |
| text-field.tsx | `components/ui/form/text-field.tsx` | TanStack Form field component. Pattern reference. |
| textarea-field.tsx | `components/ui/form/textarea-field.tsx` | TanStack Form textarea component. Pattern reference. |
| select-field.tsx | `components/ui/form/select-field.tsx` | TanStack Form select component. Pattern reference. |
| submit-button.tsx | `components/ui/form/submit-button.tsx` | Form submission button. Will be used in form. |
| field-wrapper.tsx | `components/ui/form/field-wrapper.tsx` | Field styling variants. Pattern reference. |
| tanstack-field-root.tsx | `components/ui/form/tanstack-field-root.tsx` | TanStack field root wrapper. Reference. |
| form-hook.ts | `lib/forms/form-hook.ts` | TanStack Form hook configuration. Reference for form usage. |
| create-workflow-dialog.tsx | `components/workflows/create-workflow-dialog.tsx` | Example TanStack Form usage. Pattern reference. |
| pipeline-store.ts | `lib/stores/pipeline-store.ts` | Zustand store for pipeline UI state. Reference. |

### Low Priority (Context Only)

| File | Path | Reason |
|------|------|--------|
| button.tsx | `components/ui/button.tsx` | Button component. Used for Skip button. |
| badge.tsx | `components/ui/badge.tsx` | Badge component. Used for status display. |
| pipeline-connector.tsx | `components/workflows/pipeline-connector.tsx` | Connector between steps. Context. |
| index.ts | `db/repositories/index.ts` | Repository exports. Reference. |
| index.ts | `hooks/queries/index.ts` | Query hooks exports. Will export new hook. |
| use-workflows.ts | `hooks/queries/use-workflows.ts` | Workflow hooks. Pattern reference. |
| index.ts | `electron/ipc/index.ts` | IPC handler registration. Reference. |
| workflow.handlers.ts | `electron/ipc/workflow.handlers.ts` | Workflow IPC handlers. Pattern reference. |
| workflows.ts | `lib/queries/workflows.ts` | Workflow query key factory. Pattern reference. |

## Architecture Insights

### Key Patterns Discovered

1. **Form Implementation Pattern**: TanStack Form with custom field components via `useAppForm` from `lib/forms/form-hook.ts`. Forms use Zod validation on submit.

2. **IPC Communication Pattern**: Three-layer architecture:
   - `electron/ipc/channels.ts` - channel names
   - `electron/ipc/*.handlers.ts` - handler logic with repository injection
   - `electron/preload.ts` - exposes API to renderer
   - `types/electron.d.ts` - TypeScript types
   - `hooks/use-electron.ts` - React wrapper

3. **TanStack Query Pattern**: Query key factories in `lib/queries/*.ts`, hooks in `hooks/queries/*.ts` with proper cache invalidation.

4. **Pipeline Step Component Pattern**: Base UI Collapsible for expand/collapse, CVA for variants, derives visual state from database status.

5. **Step Repository Methods**: Already has `skip()`, `update()`, and `complete()` methods with automatic timestamp management.

### Existing Similar Functionality

1. **Skip Step**: Already implemented - `useSkipStep` hook, `step.skip` IPC handler, `skip()` repository method. Directly usable for "Skip" button.

2. **Complete Step**: Already implemented - `useCompleteStep` hook. Will need enhancement or new mutation for outputStructured.

3. **Form Field Components**: All required types exist (TextField, TextareaField, SelectField) in `components/ui/form/`.

## Discovery Statistics

- **Total files discovered**: 32
- **Critical**: 6
- **High**: 6
- **Medium**: 11
- **Low**: 9

## Validation Results

- All file paths verified to exist
- Files categorized by implementation priority
- Integration points identified
- Existing patterns documented for reference
