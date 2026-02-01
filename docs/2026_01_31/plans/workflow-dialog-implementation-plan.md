# Implementation Plan: Create Workflow Dialog

**Generated**: 2026-01-31
**Original Request**: "create/edit workflow dialog on the workflows tab of the project page"
**Refined Request**: Implement a create workflow dialog component for the workflows tab on the project detail page that allows users to create new planning or implementation workflows within a project context.

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Create a workflow creation dialog component that allows users to create planning or implementation workflows from the project detail workflows tab. The dialog follows established patterns from CreateProjectDialog, uses TanStack Form with existing Zod validation, and integrates with templates, repositories, and workflow creation APIs.

## Analysis Summary

- Feature request refined with project context and user clarifications
- Discovered 14 highly relevant files across 12 directories
- Generated 6-step implementation plan with quality gates

## User Clarifications

| Question | Answer |
|----------|--------|
| Dialog Scope | Create only - no edit functionality |
| Edit Capabilities | No edit functionality - workflows immutable after creation |
| Repository Selection | Simple multi-select with primary designation |
| Template Integration | Yes - template selector with auto-populate |

## File Discovery Results

### Files to Create
| File | Purpose |
|------|---------|
| `components/workflows/create-workflow-dialog.tsx` | Main dialog component |
| `components/workflows/repository-selection-field.tsx` | Custom multi-select with primary designation |

### Files to Modify
| File | Purpose |
|------|---------|
| `components/workflows/workflows-tab-content.tsx` | Integrate dialog into Create Workflow button |
| `lib/validations/workflow.ts` | Review/extend if needed |
| `components/workflows/index.ts` | Export new components |

### Key Reference Files
| File | Pattern |
|------|---------|
| `components/projects/create-project-dialog.tsx` | Dialog structure pattern |
| `components/agents/confirm-discard-dialog.tsx` | Unsaved changes handling |
| `hooks/queries/use-workflows.ts` | useCreateWorkflow mutation |
| `hooks/queries/use-repositories.ts` | useRepositoriesByProject hook |
| `hooks/queries/use-templates.ts` | useActiveTemplates hook |
| `lib/forms/form-hook.ts` | useAppForm hook |
| `db/schema/workflows.schema.ts` | pauseBehaviors, workflowTypes constants |

## Prerequisites

- [ ] Verify existing validation schema in `lib/validations/workflow.ts` matches dialog requirements
- [ ] Confirm `useCreateWorkflow` mutation is functional and handles workflow creation properly
- [ ] Confirm `useRepositoriesByProject` hook returns proper repository data for the given project
- [ ] Confirm `useActiveTemplates` hook returns templates with `templateText` field

## Implementation Steps

### Step 1: Extend Validation Schema if Needed

**What**: Review and potentially extend the existing `createWorkflowSchema` in `lib/validations/workflow.ts` to ensure it covers all form field requirements.
**Why**: The existing schema already has most fields but may need adjustment for default values or form-specific transformations.
**Confidence**: High

**Files to Modify:**
- `lib/validations/workflow.ts` - Review and potentially add form-specific type exports

**Changes:**
- Verify `CreateWorkflowFormValues` type includes all fields needed for form defaults
- Ensure `primaryRepositoryId` and `templateId` transforms work correctly with string-based form values
- Export any additional utility types needed for the dialog component

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Schema supports all required form fields
- [ ] Type exports are properly defined for form usage
- [ ] All validation commands pass

---

### Step 2: Create Repository Selection Custom Component

**What**: Create a custom repository selection component that combines multi-select checkboxes with radio-button-style primary repository selection.
**Why**: The existing MultiSelectField does not support the pattern of selecting multiple repositories while also designating one as primary. This requires a custom compound component.
**Confidence**: Medium

**Files to Create:**
- `components/workflows/repository-selection-field.tsx` - Custom field component

**Changes:**
- Create a new field component that displays repositories as checkboxes for selection
- Add a radio button mechanism to designate the primary repository (only from selected)
- Integrate with TanStack Form field context for both `repositoryIds` and `primaryRepositoryId`
- Follow Base UI + CVA patterns from existing form field components
- Include proper accessibility labels and ARIA attributes

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Component renders list of repositories with checkboxes
- [ ] Selected repositories show primary designation option
- [ ] Primary selection is cleared when a repository is deselected
- [ ] Component integrates properly with TanStack Form state
- [ ] All validation commands pass

---

### Step 3: Create CreateWorkflowDialog Component

**What**: Build the main dialog component following the CreateProjectDialog pattern with all form fields, template auto-population, and unsaved changes handling.
**Why**: This is the core feature component that provides the user interface for workflow creation.
**Confidence**: High

**Files to Create:**
- `components/workflows/create-workflow-dialog.tsx` - Main dialog component

**Changes:**
- Create component with props: `projectId`, `trigger`, `onSuccess?`
- Set up dialog state management with `isOpen` and `isDiscardDialogOpen` states
- Initialize TanStack Form via `useAppForm` hook with `createWorkflowSchema` validator
- Implement form fields:
  - Workflow type select (planning/implementation) using `SelectField`
  - Feature name text input using `TextField`
  - Template selector dropdown using `SelectField` with templates from `useActiveTemplates`
  - Feature request textarea using `TextareaField`
  - Repository selection using custom `RepositorySelectionField` component
  - Pause behavior select using `SelectField` with options from `pauseBehaviors`
  - Skip clarification switch using `SwitchField` (conditionally shown for planning workflows)
- Implement template auto-populate: when template selected, populate `featureRequest` with `templateText`
- Use `useCreateWorkflow` mutation for submission
- After workflow creation, call `api.workflowRepository.addMultiple` to associate repositories
- Implement unsaved changes detection via `form.state.isDirty`
- Include `ConfirmDiscardDialog` for unsaved changes handling
- Structure dialog with `DialogRoot`, `DialogPortal`, `DialogBackdrop`, `DialogPopup`, `DialogHeader`, `DialogBody`, `DialogFooter`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Dialog opens when trigger is clicked
- [ ] All form fields render correctly with proper labels and validation
- [ ] Template selection auto-populates feature request field
- [ ] Form validation displays errors for required fields
- [ ] Skip clarification toggle only shows for planning workflows
- [ ] Dialog handles unsaved changes with confirmation prompt
- [ ] All validation commands pass

---

### Step 4: Implement Workflow Creation Submission Logic

**What**: Complete the form submission handler with proper workflow creation and repository association flow.
**Why**: The submission requires a two-step process: create the workflow, then associate selected repositories with primary designation.
**Confidence**: High

**Files to Modify:**
- `components/workflows/create-workflow-dialog.tsx` - Add complete submission logic

**Changes:**
- Implement `onSubmit` handler in `useAppForm` configuration
- Call `createWorkflowMutation.mutateAsync` with workflow data
- After workflow creation, call `electronAPI.workflowRepository.addMultiple` with workflow ID, repository IDs, and primary repository ID
- Handle errors with try/catch and user-friendly messages
- Call `handleClose` to reset form and close dialog on success
- Invoke `onSuccess` callback if provided
- Use `useIncrementTemplateUsage` mutation to track template usage

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Workflow is created in database with correct data
- [ ] Repositories are associated with workflow via `addMultiple`
- [ ] Primary repository is correctly designated
- [ ] Template usage count is incremented when template is used
- [ ] Dialog closes and form resets on success
- [ ] Error messages are displayed for failed submissions
- [ ] All validation commands pass

---

### Step 5: Integrate Dialog into WorkflowsTabContent

**What**: Connect the CreateWorkflowDialog to the existing placeholder handler in WorkflowsTabContent component.
**Why**: The `handleCreateWorkflow` callback is currently empty and needs to trigger the dialog.
**Confidence**: High

**Files to Modify:**
- `components/workflows/workflows-tab-content.tsx` - Replace placeholder with dialog integration

**Changes:**
- Import `CreateWorkflowDialog` component
- Remove the placeholder `handleCreateWorkflow` callback
- Replace "Create Workflow" Button components (in both empty state and header) with `CreateWorkflowDialog` trigger pattern
- Pass `projectId` prop to the dialog component
- Optionally add `onSuccess` callback for post-creation feedback

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Create Workflow button in header opens the dialog
- [ ] Create Workflow button in empty state opens the dialog
- [ ] Dialog receives correct `projectId` from parent component
- [ ] Workflow list refreshes after successful creation
- [ ] All validation commands pass

---

### Step 6: Add Component Export to Workflows Barrel File

**What**: Export the new dialog component from the workflows component barrel file.
**Why**: Ensures consistent import patterns across the codebase.
**Confidence**: High

**Files to Modify:**
- `components/workflows/index.ts` (if exists) - Add export for new components

**Changes:**
- Export `CreateWorkflowDialog` component
- Export `RepositorySelectionField` component if reusable
- Verify import paths are consistent with project conventions

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] New components are properly exported
- [ ] Imports work correctly throughout the application
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Dialog opens and closes correctly
- [ ] Form validation works for all required fields
- [ ] Template auto-population works
- [ ] Repository selection with primary designation works
- [ ] Workflow creation persists to database
- [ ] Repository associations are created correctly
- [ ] Unsaved changes prompt works when form is dirty
- [ ] Query caches are properly invalidated after creation

## Notes

**Architecture Decisions:**
- Using a controlled dialog pattern (same as CreateProjectDialog) rather than uncontrolled for better state management
- Creating a custom `RepositorySelectionField` component rather than trying to compose existing fields because the multi-select-with-primary pattern is unique
- The submission flow is two-step (create workflow, then associate repositories) because the workflow ID is needed for repository association

**Assumptions:**
- The existing `useElectron` hook provides access to `electronAPI.workflowRepository.addMultiple`
- Templates fetched via `useActiveTemplates` include the `templateText` field needed for auto-population
- The `pauseBehaviors` constant from `workflows.schema.ts` can be imported and used directly

**Potential Risks:**
- If template placeholder support is needed (replacing `{{placeholder}}` tokens), additional logic may be required beyond simple auto-population
- The repository selection component complexity depends on how many repositories a project typically has; if the list is very long, virtualization may be needed in a future iteration
