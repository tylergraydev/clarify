# Phase 6: Clarification Q&A UI - Implementation Plan

**Generated**: 2026-02-01
**Updated**: 2026-02-01 (aligned with Claude Agent SDK and clarification-agent output format)
**Original Request**: Phase 6 of workflow-implementation-phases.md - Clarification Step Q&A UI
**Refined Request**: Implement a clarification Q&A form UI for Phase 6 of the workflow implementation pipeline, enabling users to answer structured questions during workflow execution. The clarification step should display a form that renders questions from the workflow step's `outputStructured.questions` array as form fields using the existing TanStack Form infrastructure. When users submit answers, they should be persisted to the step's `outputStructured.answers` object and the step should automatically transition to a completed state. Include a "Skip" button that allows users to bypass the clarification step entirely, triggering the skip workflow on the repository. Display Q&A summary in collapsed PipelineStep view (e.g., "3 questions answered").

## Analysis Summary

- Feature request refined with project context
- Discovered 32 files across 12 directories
- Generated 7-step implementation plan
- **Updated**: Schema aligned with clarification-agent output format from `.claude/agents/clarification-agent.md`

## Claude Agent SDK Context

### Data Flow Overview

This phase implements the **user-facing Q&A UI** portion of the clarification workflow. The complete data flow is:

```
1. Workflow starts → SDK executes clarification-agent via query()
2. Agent returns markdown with QUESTIONS_FOR_USER JSON block
3. App parses agent output, extracts questions JSON
4. App stores questions in workflowStep.outputStructured
5. Step status set to 'running' (waiting for user input)
6. [THIS PHASE] Form renders questions, user answers
7. [THIS PHASE] Answers saved to outputStructured.answers
8. [THIS PHASE] Step marked complete → workflow continues
```

**Dependency Note**: Steps 1-5 require Claude Agent SDK execution which is not yet implemented. For testing this phase, mock question data can be used until the SDK orchestration engine is built.

### Clarification Agent Output Format

The clarification-agent (`.claude/agents/clarification-agent.md`) produces questions in this exact format:

```json
{
  "questions": [
    {
      "question": "How should this feature store data?",
      "header": "Storage",
      "options": [
        {
          "label": "SQLite database",
          "description": "Use Drizzle ORM like existing projects/repositories features"
        },
        {
          "label": "Electron Store",
          "description": "Use key-value storage like app settings"
        }
      ]
    }
  ]
}
```

**Important**: All questions from the clarification-agent are **option-based** (select/radio). The agent does not produce free-text questions.

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
- `lib/validations/clarification.ts` - New file for clarification Q&A Zod schemas.
- `app/(app)/workflows/[id]/page.tsx` - Handle clarification callbacks.

### Medium Priority (Reference)
- `db/schema/workflow-steps.schema.ts` - Schema reference for `outputStructured` field
- Form components: `select-field.tsx`, `radio-group-field.tsx` (if exists)
- `lib/forms/form-hook.ts` - TanStack Form hook configuration
- `lib/stores/pipeline-store.ts` - Pipeline UI state management
- `.claude/agents/clarification-agent.md` - Reference for question output format

---

## Overview

**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This plan implements a clarification Q&A form UI that renders questions from the workflow step's `outputStructured.questions` array. Questions are option-based (matching the clarification-agent's output format), rendered as radio groups or select fields. Users select answers, which persist to the step's `outputStructured.answers` object. The collapsed PipelineStep view displays a summary like "3 questions answered".

## Prerequisites

- [ ] Existing repository method `update()` already supports updating `outputStructured` field
- [ ] `useSkipStep` mutation hook already implemented and functional
- [ ] TanStack Form infrastructure with `useAppForm` and field components available
- [ ] SelectField or RadioGroupField component available in `components/ui/form/`

## Implementation Steps

### Step 1: Define Clarification Q&A Zod Schemas and Types

**What**: Create Zod validation schemas matching the clarification-agent's output format.
**Why**: Provides type-safe validation for the structured Q&A data stored in `outputStructured` and enables form validation.
**Confidence**: High

**Files to Create**:
- `lib/validations/clarification.ts` - Define schemas matching clarification-agent output

**Changes**:
```typescript
import { z } from 'zod';

/**
 * Schema for a single option within a clarification question.
 * Matches the clarification-agent output format.
 */
export const clarificationOptionSchema = z.object({
  label: z.string().min(1),
  description: z.string(),
});

/**
 * Schema for a single clarification question.
 * Matches the clarification-agent output format from QUESTIONS_FOR_USER block.
 */
export const clarificationQuestionSchema = z.object({
  question: z.string().min(1),  // The full question text
  header: z.string().min(1),     // Short label (e.g., "Storage", "Scope")
  options: z.array(clarificationOptionSchema).min(2).max(4),
});

/**
 * Schema for the questions array from outputStructured.questions
 */
export const clarificationQuestionsArraySchema = z.array(clarificationQuestionSchema);

/**
 * Schema for user answers - keyed by question index (e.g., "0", "1", "2")
 * Value is the selected option label
 */
export const clarificationAnswersSchema = z.record(z.string(), z.string());

/**
 * Complete outputStructured shape for clarification steps
 */
export const clarificationStepOutputSchema = z.object({
  // Raw markdown output from clarification agent (optional, for reference)
  rawOutput: z.string().optional(),

  // Parsed questions from QUESTIONS_FOR_USER block
  questions: clarificationQuestionsArraySchema,

  // User answers keyed by question index
  answers: clarificationAnswersSchema.optional(),

  // Assessment metadata from agent (optional)
  assessment: z.object({
    score: z.number().min(1).max(5),
    reason: z.string(),
  }).optional(),

  // If agent returned SKIP_CLARIFICATION
  skipped: z.boolean().optional(),
  skipReason: z.string().optional(),
});

// Export inferred types
export type ClarificationOption = z.infer<typeof clarificationOptionSchema>;
export type ClarificationQuestion = z.infer<typeof clarificationQuestionSchema>;
export type ClarificationAnswers = z.infer<typeof clarificationAnswersSchema>;
export type ClarificationStepOutput = z.infer<typeof clarificationStepOutputSchema>;
```

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Schemas compile without TypeScript errors
- [ ] Types correctly infer from schemas
- [ ] Schema matches clarification-agent output format exactly
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

**What**: Create the clarification Q&A form component that renders questions dynamically as option-based fields.
**Why**: Core UI component that displays questions and captures user answers using TanStack Form conventions.
**Confidence**: High

**Files to Create**:
- `components/workflows/clarification-form.tsx` - Form component for Q&A

**Changes**:
```typescript
import type { ClarificationQuestion, ClarificationAnswers } from '@/lib/validations/clarification';

interface ClarificationFormProps {
  /** Questions array from outputStructured.questions */
  questions: ClarificationQuestion[];
  /** Existing answers (for pre-populating if user returns to form) */
  existingAnswers?: ClarificationAnswers;
  /** Callback when user submits answers */
  onSubmit: (answers: ClarificationAnswers) => void;
  /** Callback when user clicks Skip */
  onSkip: () => void;
  /** Loading state during submission */
  isSubmitting?: boolean;
}
```

- Use `useAppForm` hook with dynamic defaultValues based on questions array
- **All questions render as SelectField or RadioGroup** (option-based only):
  ```tsx
  questions.map((q, index) => (
    <form.AppField name={`${index}`} key={index}>
      {(field) => (
        <SelectField
          label={q.question}
          description={`Select an option for: ${q.header}`}
          options={q.options.map(opt => ({
            value: opt.label,
            label: opt.label,
            description: opt.description,
          }))}
          {...field}
        />
      )}
    </form.AppField>
  ))
  ```
- Include Submit and Skip buttons in action bar
- Handle form submission - transform form values to `ClarificationAnswers` format
- Handle skip with `onSkip` callback
- Show question count and progress indicator

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Form renders questions dynamically based on props
- [ ] All questions render as SelectField (option-based)
- [ ] Option descriptions are visible to help user choose
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
- Add optional props for clarification data:
  ```typescript
  interface PipelineStepProps {
    // ... existing props
    /** Structured output containing questions and answers */
    outputStructured?: ClarificationStepOutput | null;
    /** Callback when clarification form is submitted */
    onSubmitClarification?: (answers: ClarificationAnswers) => void;
    /** Callback when user skips clarification */
    onSkipStep?: () => void;
    /** Whether form submission is in progress */
    isSubmitting?: boolean;
  }
  ```
- Parse `outputStructured` to extract questions and answers
- In expanded panel content, conditionally render ClarificationForm when:
  - `stepType === 'clarification'`
  - `status === 'running'`
  - `outputStructured?.questions` exists and has items
- Calculate answered questions count from `outputStructured.answers`
- Display summary badge in collapsed header:
  - Completed with answers: "3 questions answered"
  - Completed via skip: "Skipped"
  - Running (waiting): "Awaiting answers"
- Show summary badge only when step is completed or running with questions

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Clarification form renders in expanded panel for clarification step type
- [ ] Summary displays in collapsed view showing answer count
- [ ] Form callbacks properly typed and passed through
- [ ] Handles missing outputStructured gracefully
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
- Import `ClarificationStepOutput`, `ClarificationAnswers` types
- Create `handleSubmitClarification` callback:
  ```typescript
  const handleSubmitClarification = useCallback(async (
    stepId: number,
    currentOutput: ClarificationStepOutput,
    answers: ClarificationAnswers
  ) => {
    // Merge answers into existing outputStructured
    const updatedOutput: ClarificationStepOutput = {
      ...currentOutput,
      answers,
    };

    // Update step with answers
    await updateStep.mutateAsync({
      id: stepId,
      data: { outputStructured: updatedOutput },
    });

    // Transition step to completed
    await completeStep.mutateAsync(stepId);
  }, [updateStep, completeStep]);
  ```
- Create `handleSkipClarification` callback that calls `skipStep.mutate()`
- Pass handlers and submission state to PipelineStep components
- Track which step is being submitted via `submittingStepId` state

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
- Create mock data for testing until SDK execution is implemented:
  ```typescript
  // For testing - mock clarification step output
  const mockClarificationOutput: ClarificationStepOutput = {
    questions: [
      {
        question: "How should this feature store data?",
        header: "Storage",
        options: [
          { label: "SQLite database", description: "Use Drizzle ORM" },
          { label: "Electron Store", description: "Key-value storage" },
        ],
      },
      {
        question: "What scope should this feature have?",
        header: "Scope",
        options: [
          { label: "Minimal", description: "Core functionality only" },
          { label: "Standard", description: "Core plus common use cases" },
        ],
      },
    ],
  };
  ```

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] ClarificationForm exported from components/workflows
- [ ] Clarification types exported from lib/validations
- [ ] No circular dependency issues
- [ ] Manual testing with mock data works end-to-end
- [ ] All validation commands pass

---

## Quality Gates

### After Step 3 (Data Layer Complete)
- [ ] `pnpm lint && pnpm typecheck` passes
- [ ] IPC channel properly synchronized between channels.ts and preload.ts
- [ ] Mutation hook correctly invalidates relevant queries

### After Step 5 (UI Components Complete)
- [ ] `pnpm lint && pnpm typecheck` passes
- [ ] Form renders correctly with mock questions
- [ ] Collapsed summary shows answer count
- [ ] Option descriptions are visible and helpful

### After Step 7 (Integration Complete)
- [ ] `pnpm lint && pnpm typecheck` passes
- [ ] Full flow works: form submit -> update step -> complete step
- [ ] Skip flow works: skip button -> skip mutation -> step skipped
- [ ] Form pre-populates with existing answers when returning to step

---

## Notes

### Database Schema
- The `outputStructured` field in the database schema is already typed as `text('output_structured', { mode: 'json' })` which will automatically serialize/deserialize JSON objects
- The existing repository `update()` method already supports partial updates including `outputStructured`, so no repository changes are needed

### Clarification Agent Integration
- Questions are generated by the clarification-agent via Claude Agent SDK (future implementation)
- The agent outputs a `QUESTIONS_FOR_USER` JSON block within markdown
- All questions are **option-based** - the agent does not generate free-text questions
- Questions have 2-4 options each with labels and descriptions
- The `header` field provides a short category label (e.g., "Storage", "Scope")

### UI Behavior
- The clarification step uses status 'running' when waiting for user input, which maps to the visual 'running' state in the pipeline
- Users can skip clarification entirely - this should be supported even if questions exist
- Option descriptions should be prominently displayed to help users make informed choices

### Future Considerations
- If free-text questions are needed in the future, add a `type` field to the question schema and update ClarificationForm to conditionally render TextField/TextareaField
- Consider adding a "back" capability to allow users to change answers before final submission
- The clarification-agent may return `SKIP_CLARIFICATION` for well-specified requests - handle this case by auto-completing the step

### Testing Without SDK
Until the Claude Agent SDK orchestration is implemented, test this phase by:
1. Manually inserting mock `outputStructured` data into the clarification step via database
2. Or creating a temporary "populate mock questions" button in the UI for development
