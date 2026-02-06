# Clarification Step UI - Implementation Plan

**Generated**: 2026-02-05
**Original Request**: Plan the implementation of the clarification step from the workflow page redesign requirements document.
**Source**: `docs/2026_02_05/workflow-page-redesign-requirements.md` - Step 1: Clarification

## Analysis Summary

- Feature request refined with project context (450 words)
- Discovered 37 files across 12+ directories (7 to modify, 30 reference)
- Generated 12-step implementation plan
- Backend is complete (service, IPC, types) - this is a frontend-only implementation

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

Implement the full Clarification step UI for the workflow detail page, replacing the current placeholder component with a dynamic, stateful implementation that handles three execution states (running, complete-no-questions, complete-with-questions), renders a heterogeneous question form (radio, checkbox, text) with "Other" support using TanStack Form, and integrates with the existing Clarification IPC backend for starting, submitting answers, skipping, and retrying the step. The data layer is built first (query keys, query hooks, Zustand state, IPC wrapper), followed by question form components, the main step content component, accordion integration with real step data, and finally streaming panel hookup.

## Prerequisites

- [ ] Existing backend is complete: `electron/services/clarification-step.service.ts`, `electron/ipc/clarification.handlers.ts`, `lib/validations/clarification.ts`, and preload script all production-ready
- [ ] Existing form components available: `RadioField`, `CheckboxGroupField`, `TextareaField`, `TextField` registered in `lib/forms/form-hook.ts`
- [ ] UI primitives available: `AccordionItem`, `Badge`, `Button`, `Select*` components, `Separator`
- [ ] Zustand store `workflow-detail-store.ts` exists with accordion expanded/collapsed state
- [ ] Query key factories pattern established in `lib/queries/`

## Implementation Steps

### Step 1: Create Clarification Query Key Factory

**What**: Create a `clarification.ts` query key factory in `lib/queries/` following the existing `refinement.ts` pattern, and register it in the merged query index.

**Why**: All data fetching in this project uses `@lukemorales/query-key-factory` for centralized, type-safe query keys. The clarification step needs its own keys for fetching step state, outcome data, and stream session data.

**Confidence**: High

**Files to Create:**
- `lib/queries/clarification.ts` - Query key factory with keys: `byWorkflow`, `byStep`, `state`

**Files to Modify:**
- `lib/queries/index.ts` - Import `clarificationKeys`, add to `mergeQueryKeys`, and add to re-exports

**Changes:**
- Create `clarificationKeys` using `createQueryKeys('clarification', {...})` with entries: `byWorkflow(workflowId)`, `byStep(stepId)`, `state(workflowId)` following the `refinementKeys` pattern
- Import `clarificationKeys` in `lib/queries/index.ts` and add to the `mergeQueryKeys` call
- Add re-export line for `clarificationKeys` in the index file

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `clarificationKeys` is importable from `@/lib/queries`
- [ ] `clarificationKeys` is included in the merged `queries` object
- [ ] All validation commands pass

---

### Step 2: Create Electron IPC Wrapper Hook for Clarification

**What**: Create `use-electron-clarification.ts` in `hooks/electron/domains/` providing a typed wrapper around `window.electronAPI.clarification` methods.

**Why**: All other IPC domains follow this pattern (see `use-electron-workflows.ts`). This hook memoizes access to the clarification API methods and provides a consistent interface for the React Query hooks to consume.

**Confidence**: High

**Files to Create:**
- `hooks/electron/domains/use-electron-clarification.ts` - Memoized wrapper for `window.electronAPI.clarification` with: `start`, `submitAnswers`, `skip`, `retry`, `getState`, `onStreamMessage`

**Files to Modify:**
- `hooks/use-electron.ts` - Import and expose clarification domain from `useElectronDb`

**Changes:**
- Create `useElectronClarification` hook following the `useElectronWorkflows` pattern using `useMemo` to wrap each clarification API method
- Include a `clarification` namespace in the returned object containing all 6 API methods
- Add `useElectronClarification` import in `use-electron.ts` and include `clarification` in the `useElectronDb` return object

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `useElectronDb().clarification` provides typed access to all 6 clarification IPC methods
- [ ] Hook is importable and properly typed
- [ ] All validation commands pass

---

### Step 3: Create Clarification React Query Hooks

**What**: Create `use-clarification.ts` in `hooks/queries/` with query and mutation hooks for clarification operations.

**Why**: All server-state interactions in this project are managed through React Query hooks that compose IPC wrappers with query key factories. These hooks provide caching, loading states, error handling, and cache invalidation that the UI components consume directly.

**Confidence**: High

**Files to Create:**
- `hooks/queries/use-clarification.ts` - Query hooks: `useClarificationStep`, `useClarificationState`. Mutation hooks: `useStartClarification`, `useSubmitClarificationAnswers`, `useSkipClarification`, `useRetryClarification`

**Files to Modify:**
- `hooks/queries/index.ts` - Add barrel exports for all new clarification hooks

**Changes:**
- `useClarificationStep(workflowId)` - Query hook using `stepKeys.byWorkflow(workflowId)` that fetches steps and filters to find the clarification step, returning the step record with parsed `outputStructured`
- `useClarificationState(workflowId)` - Query hook using `clarificationKeys.state(workflowId)` that calls `clarification.getState(workflowId)` to get live service phase
- `useStartClarification` - Mutation hook calling `clarification.start()` with cache invalidation
- `useSubmitClarificationAnswers` - Mutation hook calling `clarification.submitAnswers()` with cache invalidation
- `useSkipClarification` - Mutation hook calling `clarification.skip()` with cache invalidation
- `useRetryClarification` - Mutation hook calling `clarification.retry()` with cache invalidation
- All mutations should invalidate `stepKeys.byWorkflow`, `clarificationKeys.state`, and `workflowKeys.detail`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All 6 hooks export correctly from `@/hooks/queries`
- [ ] Mutations properly invalidate related query caches
- [ ] Query hooks use correct query key factories
- [ ] All validation commands pass

---

### Step 4: Extend Workflow Detail Zustand Store with Clarification State

**What**: Add clarification-specific ephemeral UI state to `workflow-detail-store.ts` including draft answers, selected agent override, and current version index.

**Why**: The clarification form needs to track in-progress answer drafts (before submission), which agent is selected for re-runs, and which version of questions is displayed. This is UI-only state that should not be persisted to the database until submission.

**Confidence**: High

**Files to Modify:**
- `lib/stores/workflow-detail-store.ts` - Add clarification slice to existing store

**Changes:**
- Add to `WorkflowDetailState`: `clarificationDraftAnswers`, `clarificationSelectedAgentId`, `clarificationActiveVersion`
- Add to `WorkflowDetailActions`: `setClarificationDraftAnswer`, `clearClarificationDraftAnswers`, `setClarificationSelectedAgentId`, `setClarificationActiveVersion`
- Implement new actions in the store creator
- Add new fields to `initialState` with defaults (empty answers, null agent, version 0)
- Update `reset()` to clear clarification state
- Import `ClarificationAnswer` type from `@/lib/validations/clarification`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `useWorkflowDetailStore` provides clarification draft state
- [ ] Draft answers can be set and cleared per question
- [ ] Reset clears all clarification state
- [ ] All validation commands pass

---

### Step 5: Create Clarification Streaming Hook

**What**: Create `use-clarification-stream.ts` in `hooks/` that subscribes to clarification stream messages and accumulates them into structured state.

**Why**: The streaming panel needs real-time data from the clarification agent. The `onStreamMessage` IPC bridge sends `ClarificationStreamMessage` events that must be accumulated and exposed as reactive state.

**Confidence**: Medium (subscription lifecycle management with `useEffect`)

**Files to Create:**
- `hooks/use-clarification-stream.ts` - Hook returning: `textContent`, `thinkingContent`, `currentPhase`, `toolEvents`, `isStreaming`, and `reset`

**Changes:**
- Use `useEffect` to call `window.electronAPI.clarification.onStreamMessage(callback)` and return unsubscribe as cleanup
- Accumulate `text_delta` messages into `textContent` string
- Track `phase_change` messages for `currentPhase`
- Track `tool_start`/`tool_stop` messages as tool event pairs
- Track `thinking_delta` for thinking content
- Provide `reset` function to clear accumulated state (used on re-run)
- Accept `enabled` boolean parameter to conditionally subscribe

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Hook properly subscribes and unsubscribes to stream messages
- [ ] Text deltas accumulate into readable content
- [ ] Phase changes update the current phase state
- [ ] Hook cleans up on unmount
- [ ] All validation commands pass

---

### Step 6: Create Clarification Question Form Component

**What**: Create `clarification-question-form.tsx` in `components/workflows/detail/steps/` that dynamically renders a stacked list of clarification questions using TanStack Form.

**Why**: Core interactive element of the clarification step. Each question from the AI agent has a different type (radio, checkbox, text) and may include `allowOther` requiring additional text input.

**Confidence**: Medium (heterogeneous field types with conditional "Other" inputs)

**Files to Create:**
- `components/workflows/detail/steps/clarification-question-form.tsx` - Form component accepting `questions`, `onSubmit`, `isSubmitting`, and `draftAnswers`

**Changes:**
- Use `useAppForm` to create form instance with defaults from Zustand draft
- For each question, render a card with:
  - For `radio` type: `RadioField` with options + conditional "Other" TextField
  - For `checkbox` type: `CheckboxGroupField` with options + conditional "Other" TextField
  - For `text` type: `TextareaField` for open-ended response
- Sync form values to Zustand draft on changes
- Add Zod validation per field using `clarificationAnswerSchema`
- Include "Submit Answers" button
- Mark as `'use client'`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Radio questions render with radio group and optional "Other" input
- [ ] Checkbox questions render with checkbox group and optional "Other" input
- [ ] Text questions render with textarea
- [ ] Form validates each answer against schema
- [ ] Submit triggers onSubmit with properly typed answers
- [ ] Draft values persist in Zustand store
- [ ] All validation commands pass

---

### Step 7: Create Agent Selector Dropdown Component

**What**: Create `clarification-agent-selector.tsx` in `components/workflows/detail/steps/` using the Select UI primitive.

**Why**: The action bar includes an agent selector dropdown allowing users to change which agent runs clarification.

**Confidence**: High

**Files to Create:**
- `components/workflows/detail/steps/clarification-agent-selector.tsx`

**Changes:**
- Use `useAgents` or `useAgentsByType` to fetch clarification-capable agents
- Use `useDefaultClarificationAgent` for default agent ID
- Use `useWorkflowDetailStore` for `clarificationSelectedAgentId`
- Render Select component with agents as options
- Update Zustand on selection change

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dropdown lists available clarification agents
- [ ] Current selection is visually indicated
- [ ] Selection changes update Zustand state
- [ ] All validation commands pass

---

### Step 8: Rewrite Clarification Step Content Component

**What**: Completely replace the placeholder `clarification-step-content.tsx` with a stateful component handling three execution states and all actions.

**Why**: Main deliverable. Must handle the complete lifecycle: pending, running, complete-with-questions, complete-no-questions, and error states. Connects all previously built pieces.

**Confidence**: Medium (complex state machine with multiple UI states and action handlers)

**Files to Modify:**
- `components/workflows/detail/steps/clarification-step-content.tsx` - Complete rewrite

**Changes:**
- Accept `workflowId` and `stepId` as props
- Use `useClarificationStep(workflowId)` to fetch step data
- Parse `outputStructured` to extract questions, assessment, answers
- Determine UI phase from step status + outputStructured:
  - `pending` = "Not started" indicator
  - `running` = loading/spinner with phase text from stream hook
  - `completed` + questions + no answers = render `ClarificationQuestionForm`
  - `completed` + questions + answers = render answered Q&A summary
  - `completed` + skipped/no questions = render success message
  - `skipped` = skip reason
  - `failed` = error with retry option
- Wire action buttons to mutations
- Handle auto-advance for SKIP_CLARIFICATION outcome
- Show `Separator` between form and action bar

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Running state shows loading indicator with phase information
- [ ] Complete-with-questions state renders dynamic question form
- [ ] Complete-no-questions state shows skip summary message
- [ ] All 5 action buttons wired to IPC mutations
- [ ] Agent selector dropdown works
- [ ] Error and loading states handled gracefully
- [ ] All validation commands pass

---

### Step 9: Wire Accordion to Real Step Data

**What**: Modify `workflow-step-accordion.tsx` to derive clarification step status from real workflow step data instead of hardcoded values.

**Why**: Accordion currently has hardcoded `status={'completed'}` and `"3 questions answered"`. Needs to reflect actual step status and computed summary.

**Confidence**: High

**Files to Modify:**
- `components/workflows/detail/workflow-step-accordion.tsx`

**Changes:**
- Accept `workflowId` as a prop
- Fetch/receive steps data
- Find clarification step by type
- Map step status to `AccordionItem` status prop
- Map step status to `Badge` variant
- Compute summary text dynamically
- Pass `workflowId` and `stepId` to `ClarificationStepContent`
- Only modify clarification `AccordionItem`; leave other steps hardcoded

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Clarification accordion item shows correct status badge from real data
- [ ] Summary text reflects actual step state
- [ ] Step content receives correct props
- [ ] Other step accordion items unchanged
- [ ] All validation commands pass

---

### Step 10: Integrate Clarification Stream into Streaming Panel

**What**: Replace the clarification tab's placeholder logs in `workflow-streaming-panel.tsx` with real streamed content.

**Why**: The streaming panel currently shows hardcoded log lines. The clarification tab should display real-time agent output.

**Confidence**: Medium (rendering incremental streaming content requires careful auto-scroll)

**Files to Modify:**
- `components/workflows/detail/workflow-streaming-panel.tsx`

**Changes:**
- Import and use `useClarificationStream` hook
- Replace clarification `PLACEHOLDER_LOGS` with dynamic stream content
- Render phase indicator, streamed text, tool events, thinking content
- Use `use-stick-to-bottom` for auto-scrolling
- Show "No activity yet" when empty
- Keep other tabs with placeholder content

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Clarification tab shows real streamed text when agent is running
- [ ] Phase changes displayed as status indicators
- [ ] Tool events formatted and shown
- [ ] Auto-scroll works
- [ ] Empty state shows placeholder
- [ ] Other tabs unchanged
- [ ] All validation commands pass

---

### Step 11: Wire Workflow Detail Page to Pass Data to Accordion

**What**: Update workflow detail page to fetch real workflow data and pass `workflowId` to child components.

**Why**: The page currently uses hardcoded `useState<WorkflowStatus>('running')`. Needs real data fetching to enable data-driven child components.

**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/[id]/page.tsx`

**Changes:**
- Use `useWorkflow(workflowId)` hook to fetch workflow record
- Derive `workflowStatus` from `workflow.data?.status` instead of `useState`
- Pass `workflowId` as prop to `WorkflowStepAccordion` and `WorkflowStreamingPanel`
- Handle loading with `WorkflowDetailSkeleton`
- Handle error (not found) with redirect
- Remove hardcoded `useState<WorkflowStatus>('running')`
- Update child component signatures to accept `workflowId` prop

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Page fetches real workflow data by ID
- [ ] Loading shows skeleton
- [ ] workflowId passed to child components
- [ ] Pre-start form still shows for `created` status
- [ ] All validation commands pass

---

### Step 12: Update Barrel Exports

**What**: Ensure all new components are properly exported through barrel index files.

**Why**: Project uses barrel exports for clean import paths.

**Confidence**: High

**Files to Modify:**
- `components/workflows/detail/index.ts` - Add exports if needed
- `hooks/queries/index.ts` - Verify clarification hook exports

**Changes:**
- Review whether new components need barrel exports (likely internal-only)
- Verify all existing exports still resolve after modifications
- Add `useClarificationStream` export if needed from hooks index

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All imports resolve correctly
- [ ] No circular dependency issues
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Clarification step renders correctly in all three states (running, complete-with-questions, complete-no-questions)
- [ ] Question form handles all three question types (radio, checkbox, text) with "Other" inputs
- [ ] Submit, Skip, Re-run, and Ask More actions invoke correct IPC channels
- [ ] Agent selector dropdown populates and updates selection
- [ ] Streaming panel shows real-time agent activity for the clarification tab
- [ ] Accordion badge and summary text update dynamically based on step status
- [ ] Form draft state persists in Zustand between accordion collapse/expand
- [ ] Auto-advance works when clarification completes with SKIP_CLARIFICATION

## Notes

- **Type Alignment Issue**: `types/electron.d.ts` `ClarificationQuestion` (lines 244-248) may be missing `questionType` and `allowOther` fields that exist in `lib/validations/clarification.ts`. The validation file should be treated as source of truth. `types/electron.d.ts` may need updating. (Risk: Medium)

- **ClarificationRefinementInput Type Mismatch**: `types/electron.d.ts` uses `answers: Record<string, string>` (old format) while `lib/validations/clarification.ts` uses `answers: ClarificationAnswers` (new discriminated union). The IPC handler imports from validations. Update `types/electron.d.ts` to match. (Risk: Medium)

- **ClarificationSubmitAnswersResult Shape**: Return type from `submitAnswers` in `types/electron.d.ts` may not match actual handler return. Verify before building mutation hook. (Risk: Low)

- **No Existing Step Query Hook**: Consider creating reusable `useWorkflowSteps(workflowId)` hook that other step UIs can also use. (Risk: Low, architectural preference)

- **Form Value Type Complexity**: TanStack Form default values need to accommodate heterogeneous answer types. Use `useAppForm` with registered field components. (Risk: Medium)

- **Auto-advance Behavior**: Depends on workflow's `pauseBehavior` setting. Check before expanding next step. (Risk: Low)
