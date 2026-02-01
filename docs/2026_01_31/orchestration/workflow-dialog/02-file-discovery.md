# Step 2: AI-Powered File Discovery

**Started**: 2026-01-31
**Status**: Completed
**Duration**: ~45 seconds

## Refined Request Input

Implement a create workflow dialog component for the workflows tab on the project detail page that allows users to create new planning or implementation workflows within a project context. The dialog should be triggered by the existing "Create Workflow" button in the WorkflowsTabContent component (currently a placeholder with an empty handler) and should follow the established dialog patterns used throughout the codebase.

## Analysis Summary

- Explored 12 directories
- Examined 58 candidate files
- Found 14 highly relevant files
- Identified 17 supporting files

## Discovered Files by Priority

### Critical - Must Create

| File | Action | Reasoning |
|------|--------|-----------|
| `components/workflows/create-workflow-dialog.tsx` | CREATE | Main dialog component with TanStack Form, template selection, repository multi-select with primary designation |

### Critical - Must Modify

| File | Action | Reasoning |
|------|--------|-----------|
| `components/workflows/workflows-tab-content.tsx` | MODIFY | Integrate CreateWorkflowDialog into handleCreateWorkflow callback |

### High - Reference Heavily

| File | Action | Reasoning |
|------|--------|-----------|
| `lib/validations/workflow.ts` | REFERENCE | Already has complete `createWorkflowSchema` with all fields |
| `components/projects/create-project-dialog.tsx` | REFERENCE | Primary dialog pattern reference |
| `components/agents/confirm-discard-dialog.tsx` | REFERENCE | Unsaved changes handling |
| `components/ui/dialog.tsx` | REFERENCE | Dialog primitives |
| `hooks/queries/use-workflows.ts` | REFERENCE | `useCreateWorkflow` mutation |
| `hooks/queries/use-repositories.ts` | REFERENCE | `useRepositoriesByProject` hook |
| `hooks/queries/use-templates.ts` | REFERENCE | `useActiveTemplates` hook |
| `lib/forms/form-hook.ts` | REFERENCE | `useAppForm` hook with field components |
| `db/schema/workflows.schema.ts` | REFERENCE | `pauseBehaviors`, `workflowTypes` constants |

### Medium - Reference

| File | Action | Reasoning |
|------|--------|-----------|
| `db/schema/workflow-repositories.schema.ts` | REFERENCE | `setPrimaryAt` field pattern |
| `db/schema/templates.schema.ts` | REFERENCE | `templateText` field for auto-populate |
| `components/ui/form/select-field.tsx` | REFERENCE | SelectField for dropdowns |
| `components/ui/form/textarea-field.tsx` | REFERENCE | TextareaField for feature request |
| `components/ui/form/text-field.tsx` | REFERENCE | TextField for feature name |
| `components/ui/form/switch-field.tsx` | REFERENCE | SwitchField for skipClarification |
| `components/ui/form/multi-select-field.tsx` | REFERENCE | MultiSelectField for repositories |

### Low - Optional Reference

| File | Action | Reasoning |
|------|--------|-----------|
| `components/projects/edit-project-dialog.tsx` | REFERENCE | Alternative dialog pattern |
| `components/repositories/add-repository-dialog.tsx` | REFERENCE | ProjectId context passing |
| `types/electron.d.ts` | REFERENCE | Type definitions |
| `lib/queries/workflows.ts` | REFERENCE | Query key factory |
| `electron/ipc/workflow-repositories.handlers.ts` | REFERENCE | `addMultiple` IPC method |
| `db/repositories/workflow-repositories.repository.ts` | REFERENCE | `addMultipleToWorkflow` signature |
| `.claude/skills/component-conventions/` | REFERENCE | Component conventions |

## Key Patterns Discovered

### 1. Dialog Pattern
Dialogs use consistent structure:
- `DialogRoot` with controlled `open`/`onOpenChange`
- Optional `DialogTrigger`
- `DialogPortal` containing `DialogBackdrop` and `DialogPopup`
- `DialogHeader` with `DialogTitle` and `DialogDescription`
- Form content with `useAppForm` hook
- `DialogFooter` with Cancel and submit buttons

### 2. Form Management
Uses TanStack Form via `useAppForm`:
- Zod schema passed to `validators.onSubmit`
- Field components via `form.AppField` render prop
- `form.SubmitButton` component
- Built-in dirty state tracking

### 3. Unsaved Changes Handling
`ConfirmDiscardDialog` when `form.state.isDirty` is true

### 4. Validation Schema Already Exists
`createWorkflowSchema` in `lib/validations/workflow.ts` already defines:
- featureName, featureRequest (required)
- type, pauseBehavior
- repositoryIds, primaryRepositoryId
- skipClarification
- templateId, projectId

### 5. Workflow Creation Flow
1. Create workflow via `useCreateWorkflow` mutation
2. Associate repositories via `api.workflowRepository.addMultiple`
3. Cache invalidation automatic

## File Validation Results

All discovered file paths validated to exist in the codebase.

## Milestone

`MILESTONE:STEP_2_COMPLETE`
