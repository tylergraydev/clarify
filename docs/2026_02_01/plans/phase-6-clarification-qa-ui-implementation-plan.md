# Phase 6: Clarification Q&A UI - Implementation Plan

**Generated**: 2026-02-01
**Original Request**: Phase 6 of workflow-implementation-phases.md - Clarification Step Q&A UI
**Refined Request**: Implement a clarification Q&A form UI for Phase 6 of the workflow implementation pipeline, enabling users to answer structured questions during workflow execution. The clarification step should display a form that renders questions from the workflow step's `outputStructured.questions` array as form fields using the existing TanStack Form infrastructure and custom field components (TextField, TextareaField, SelectField). When users submit answers, they should be persisted to the step's `outputStructured.answers` object and the step should automatically transition to a completed state. Include a "Skip" button that allows users to bypass the clarification step entirely, triggering the skip workflow on the repository. Display Q&A summary in collapsed PipelineStep view (e.g., "8 questions answered").

## Analysis Summary

- Feature request refined with project context
- Discovered 32 files across 12 directories
- Generated 7-step implementation plan

## File Discovery Results

### Critical Priority (Must Modify)
- `components/workflows/pipeline-step.tsx` - Core UI component. Must render clarification form and collapsed summary.
- `components/workflows/pipeline-view.tsx` - Parent component. Handle clarification callbacks.
- `hooks/queries/use-steps.ts` - Add `useUpdateStep` mutation for saving answers.
- `electron/ipc/step.handlers.ts` - Add `step:update` handler for outputStructured.
- `electron/ipc/channels.ts` - Add `step.update` channel.
- `db/repositories/workflow-steps.repository.ts` - Has existing update(), skip(), complete() methods.

### High Priority (Likely Modify)
- `types/electron.d.ts` - Add step update method signature.
- `electron/preload.ts` - Add step.update method binding.
- `hooks/use-electron.ts` - Add update method to steps object.
- `lib/validations/workflow.ts` - Add clarification Q&A Zod schema.
- `app/(app)/workflows/[id]/page.tsx` - Handle clarification callbacks.

### Medium Priority (Reference)
- `db/schema/workflow-steps.schema.ts` - Schema reference for `outputStructured` field
- Form components: text-field.tsx, textarea-field.tsx, select-field.tsx
- `lib/forms/form-hook.ts` - TanStack Form hook configuration
- `lib/stores/pipeline-store.ts` - Pipeline UI state management

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This plan implements a clarification Q&A form UI that renders questions from the workflow step's `outputStructured.questions` array as form fields. Users can answer questions using the existing TanStack Form infrastructure (TextField, TextareaField, SelectField), submit answers which persist to the step's `outputStructured.answers` object, and skip the step entirely. The collapsed PipelineStep view will display a summary like "8 questions answered".

## Prerequisites

- [ ] Existing repository method `update()` already supports updating `outputStructured` field
- [ ] `useSkipStep` mutation hook already implemented and functional
- [ ] TanStack Form infrastructure with `useAppForm` and field components available

## Implementation Steps

### Step 1: Define Clarification Q&A Zod Schemas and Types

**What**: Create Zod validation schemas for the clarification questions and answers data structures.
**Why**: Provides type-safe validation for the structured Q&A data stored in `outputStructured` and enables form validation.
**Confidence**: High

**Files to Create**:
- `lib/validations/clarification.ts` - Define schemas for question types, questions array, and answers object

**Changes**:
- Define `clarificationQuestionSchema` for individual question structure (id, text, type, options, required)
- Define `clarificationQuestionsArraySchema` for the questions array from `outputStructured.questions`
- Define `clarificationAnswersSchema` for the answers object mapped to `outputStructured.answers`
- Define `clarificationFormSchema` for dynamic form validation based on question structure
- Export types: `ClarificationQuestion`, `ClarificationAnswer`, `ClarificationFormValues`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Schemas compile without TypeScript errors
- [ ] Types correctly infer from schemas
- [ ] All validation commands pass

---

### Step 2: Add IPC Channel and Handler for Step Update with Structured Output

**What**: Add `step:update` IPC channel and handler to update a step's `outputStructured` field.
**Why**: Enables the renderer to save clarification answers to the step's structured output field via IPC.
**Confidence**: High

**Files to Modify**:
- `electron/ipc/channels.ts` - Add `update: 'step:update'` to step channels
- `electron/preload.ts` - Add `update` channel to duplicated IpcChannels and add `update` method to step API
- `electron/ipc/step.handlers.ts` - Add handler for `step:update` that calls repository's `update()` method
- `types/electron.d.ts` - Add `update` method signature to step API interface

**Changes**:
- Add `update: 'step:update'` channel constant in both channels.ts and preload.ts
- Register IPC handler that accepts `(id: number, data: Partial<NewWorkflowStep>)` and calls `workflowStepsRepository.update()`
- Add type definition for update method: `update(id: number, data: Partial<import('../db/schema').NewWorkflowStep>): Promise<WorkflowStep | undefined>`
- Add preload binding: `update: (id, data) => ipcRenderer.invoke(IpcChannels.step.update, id, data)`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] IPC channel constant added to both files (synchronized)
- [ ] Handler registered and calls repository update method
- [ ] Type definition added to ElectronAPI interface
- [ ] Preload binding added to step object
- [ ] All validation commands pass

---

### Step 3: Add Electron Hook Method and Query Mutation for Step Update

**What**: Add the `update` method to `useElectronDb().steps` and create `useUpdateStep` mutation hook.
**Why**: Provides React access to update step data via TanStack Query with proper cache invalidation.
**Confidence**: High

**Files to Modify**:
- `hooks/use-electron.ts` - Add `update` method to steps object in `useElectronDb`
- `hooks/queries/use-steps.ts` - Add `useUpdateStep` mutation hook

**Changes**:
- Add `update` method to steps useMemo in use-electron.ts following existing pattern (throwIfNoApi for write operations)
- Create `useUpdateStep` mutation that accepts `{ id: number; data: Partial<NewWorkflowStep> }` and calls `steps.update()`
- Add cache invalidation for step detail, step list, and byWorkflow queries (follow useCompleteStep pattern)

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] update method added to useElectronDb steps object
- [ ] useUpdateStep mutation hook created with proper cache invalidation
- [ ] All validation commands pass

---

### Step 4: Create ClarificationForm Component

**What**: Create the clarification Q&A form component that renders questions dynamically as form fields.
**Why**: Core UI component that displays questions and captures user answers using TanStack Form conventions.
**Confidence**: High

**Files to Create**:
- `components/workflows/clarification-form.tsx` - Form component for Q&A

**Changes**:
- Create `ClarificationFormProps` interface with `questions`, `onSubmit`, `onSkip`, `isSubmitting` props
- Use `useAppForm` hook with dynamic defaultValues based on questions array
- Map question types to appropriate field components:
  - `text` -> TextField
  - `textarea` -> TextareaField
  - `select` -> SelectField with options from question
- Render each question using `form.AppField` with render function pattern
- Include Submit and Skip buttons in action bar
- Handle form submission with `onSubmit` callback
- Handle skip with `onSkip` callback

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Form renders questions dynamically based on props
- [ ] Field types correctly map to appropriate field components
- [ ] Submit button wrapped in form.AppForm
- [ ] Skip button calls onSkip callback
- [ ] All validation commands pass

---

### Step 5: Update PipelineStep Component for Clarification Step Type

**What**: Modify PipelineStep to render clarification form when step type is 'clarification' and show Q&A summary when collapsed.
**Why**: Integrates the clarification form into the pipeline visualization with appropriate expanded/collapsed states.
**Confidence**: High

**Files to Modify**:
- `components/workflows/pipeline-step.tsx` - Add clarification form rendering and summary display

**Changes**:
- Add optional props for clarification data: `outputStructured`, `onSubmitClarification`, `onSkipStep`, `isSubmitting`
- Parse `outputStructured` to extract questions and answers arrays
- In expanded panel content, conditionally render ClarificationForm when stepType is 'clarification' and status is 'running'
- Calculate answered questions count from answers object
- Display summary in collapsed header (e.g., "8 questions answered" or "No questions answered")
- Show summary badge only when step is completed and has answers

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Clarification form renders in expanded panel for clarification step type
- [ ] Summary displays in collapsed view showing answer count
- [ ] Form callbacks properly typed and passed through
- [ ] All validation commands pass

---

### Step 6: Update PipelineView to Handle Clarification Submissions

**What**: Add clarification submission and skip handlers in PipelineView that call the appropriate mutations.
**Why**: Orchestrates the data flow between the form submission and the database update via mutations.
**Confidence**: High

**Files to Modify**:
- `components/workflows/pipeline-view.tsx` - Add handlers for clarification form actions

**Changes**:
- Import `useUpdateStep`, `useCompleteStep`, and `useSkipStep` hooks
- Create `handleSubmitClarification` callback that:
  - Constructs updated `outputStructured` with answers merged in
  - Calls `updateStep.mutate()` with the structured data
  - Calls `completeStep.mutate()` to transition step to completed
- Create `handleSkipClarification` callback that calls `skipStep.mutate()`
- Pass handlers and submission state to PipelineStep components
- Track which step is being submitted to show loading state

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Clarification submission updates outputStructured with answers
- [ ] Step transitions to completed after submission
- [ ] Skip functionality calls skip mutation
- [ ] Loading states properly tracked and passed to form
- [ ] All validation commands pass

---

### Step 7: Export Components and Integration Testing

**What**: Export new components from barrel files and verify end-to-end functionality.
**Why**: Ensures new components are properly exported and the complete flow works from form submission to database update.
**Confidence**: High

**Files to Modify**:
- `components/workflows/index.ts` - Add ClarificationForm export
- `lib/validations/index.ts` - Add clarification schema exports (if barrel exists)

**Changes**:
- Export `ClarificationForm` from workflows barrel file
- Export clarification schemas and types from validations

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] ClarificationForm exported from components/workflows
- [ ] Clarification types exported from lib/validations
- [ ] No circular dependency issues
- [ ] All validation commands pass

---

## Quality Gates

### After Step 3 (Data Layer Complete)
- [ ] `pnpm lint && pnpm typecheck` passes
- [ ] IPC channel properly synchronized between channels.ts and preload.ts
- [ ] Mutation hook correctly invalidates relevant queries

### After Step 5 (UI Components Complete)
- [ ] `pnpm lint && pnpm typecheck` passes
- [ ] Form renders correctly with dynamic questions
- [ ] Collapsed summary shows answer count

### After Step 7 (Integration Complete)
- [ ] `pnpm lint && pnpm typecheck` passes
- [ ] Full flow works: form submit -> update step -> complete step
- [ ] Skip flow works: skip button -> skip mutation -> step skipped

## Notes

- The `outputStructured` field in the database schema is already typed as `text('output_structured', { mode: 'json' })` which will automatically serialize/deserialize JSON objects
- The existing repository `update()` method already supports partial updates including `outputStructured`, so no repository changes are needed
- Question types should initially support: `text`, `textarea`, `select` (matching available TanStack Form field components)
- The clarification step uses status 'running' when waiting for user input, which maps to the visual 'running' state in the pipeline
- Consider future extensibility for additional question types (checkbox, number, radio) but keep initial implementation focused
