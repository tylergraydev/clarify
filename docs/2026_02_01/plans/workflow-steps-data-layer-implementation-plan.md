# Workflow Steps Data Layer - Implementation Plan

Generated: 2026-02-01
Original Request: Phase 4 of the workflow-implementation-phases.md - Workflow Steps Data Layer
Refined Request: Implement the workflow steps data layer by wiring existing components and implementing step creation logic when workflow transitions from `created` to `running`.

## Analysis Summary

- Feature request refined with project context
- Discovered 27 files across 15+ directories
- Generated 6-step implementation plan

## File Discovery Results

### Critical Priority (Must Modify)
- `electron/ipc/workflow.handlers.ts` - The `workflow:start` handler where step creation logic must be added
- `db/repositories/workflows.repository.ts` - The `start()` method that transitions workflow status
- `components/workflows/pipeline-view.tsx` - Uses hardcoded `ORCHESTRATION_STEPS` - must consume real step data
- `hooks/queries/use-workflows.ts` - The `useStartWorkflow` mutation needs enhanced cache invalidation

### High Priority (Likely Modify)
- `db/repositories/workflow-steps.repository.ts` - May need bulk creation method for creating all four steps
- `hooks/queries/use-steps.ts` - Step query hooks - may need cache invalidation patterns
- `electron/ipc/index.ts` - Central IPC handler registration
- `electron/ipc/step.handlers.ts` - Step IPC handlers
- `db/schema/workflow-steps.schema.ts` - Verify schema completeness

### Medium Priority (Reference)
- `db/schema/workflows.schema.ts` - Contains `skipClarification` field
- `lib/queries/steps.ts` - Step query key factory
- `lib/queries/workflows.ts` - Workflow query key factory
- `electron/preload.ts` - Preload script for ElectronAPI
- `electron/ipc/channels.ts` - IPC channel constants
- `hooks/use-electron.ts` - useElectronDb hook
- `app/(app)/workflows/[id]/page.tsx` - WorkflowDetailPage
- `components/workflows/pipeline-step.tsx` - PipelineStep component

---

## Implementation Plan

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Medium

## Quick Summary

This phase implements the workflow steps data layer by wiring together existing infrastructure (schema, repository, IPC handlers, query hooks) and adding step creation logic that triggers when a workflow transitions from `created` to `running` status. The four planning phase steps (Clarification, Refinement, Discovery, Planning) will be created atomically in the database, with Clarification optionally marked as `skipped` based on the workflow's `skipClarification` flag. The pipeline UI will then render real step data instead of hardcoded configurations.

## Prerequisites

- [ ] Existing `workflow_steps` schema is deployed (verified present at `db/schema/workflow-steps.schema.ts`)
- [ ] Database migrations are up-to-date (`pnpm db:generate && pnpm db:migrate`)
- [ ] All existing step IPC handlers are registered (`step:list`, `step:complete`, `step:skip`, etc.)

## Implementation Steps

### Step 1: Add Bulk Step Creation Method to WorkflowStepsRepository

**What**: Add a `createPlanningSteps` method to the workflow steps repository that atomically creates all four planning phase steps for a workflow.
**Why**: Centralizes step creation logic in the repository layer, ensures atomic creation of all steps within a transaction, and handles the `skipClarification` flag logic.
**Confidence**: High

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify\db\repositories\workflow-steps.repository.ts` - Add `createPlanningSteps` method to the interface and implementation

**Changes:**
- Add `createPlanningSteps(workflowId: number, skipClarification: boolean): Array<WorkflowStep>` to the `WorkflowStepsRepository` interface
- Implement the method to create four steps in order (stepNumber 1-4) with stepTypes: `clarification`, `refinement`, `discovery`, `planning`
- Set clarification step status to `skipped` if `skipClarification` is true, otherwise `pending`
- Set all other steps to `pending` status
- Include appropriate titles and descriptions for each step type
- Use a transaction to ensure atomic creation of all four steps

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `createPlanningSteps` method exists in repository interface and implementation
- [ ] Method creates exactly 4 steps with correct stepType and stepNumber ordering
- [ ] Clarification step is created with `skipped` status when `skipClarification` is true
- [ ] All validation commands pass

---

### Step 2: Update Workflow IPC Handler to Create Steps on Start

**What**: Modify the `workflow:start` IPC handler to create planning steps atomically when starting a workflow.
**Why**: The workflow start transition is the correct trigger point for step creation, ensuring steps exist before the UI attempts to display them.
**Confidence**: High

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify\electron\ipc\workflow.handlers.ts` - Enhance the `workflow:start` handler
- `C:\Users\jasonpaff\dev\clarify\electron\ipc\index.ts` - Pass `workflowStepsRepository` to `registerWorkflowHandlers`

**Changes:**
- Update `registerWorkflowHandlers` function signature to accept `workflowStepsRepository` as an additional parameter
- In the `workflow:start` handler, after calling `workflowsRepository.start(id)`, call `workflowStepsRepository.createPlanningSteps(id, workflow.skipClarification)`
- Fetch the workflow before starting to access the `skipClarification` flag
- Handle errors appropriately - if step creation fails, consider rolling back the workflow status change
- Update `registerAllHandlers` in `index.ts` to pass both repositories to the workflow handlers

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `registerWorkflowHandlers` accepts both `workflowsRepository` and `workflowStepsRepository`
- [ ] Starting a workflow creates four planning steps in the database
- [ ] `skipClarification` flag is correctly passed to step creation
- [ ] All validation commands pass

---

### Step 3: Enhance useStartWorkflow Hook with Step Cache Invalidation

**What**: Update the `useStartWorkflow` mutation to invalidate step-related query caches after a workflow starts.
**Why**: Ensures the UI immediately reflects the newly created steps without requiring a manual refresh.
**Confidence**: High

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify\hooks\queries\use-workflows.ts` - Add step cache invalidation to `useStartWorkflow`

**Changes:**
- Import `stepKeys` from `@/lib/queries/steps`
- In the `onSuccess` callback of `useStartWorkflow`, add invalidation for `stepKeys.byWorkflow(workflow.id).queryKey`
- Add invalidation for `stepKeys.list._def` to refresh any step list queries

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `useStartWorkflow` invalidates step queries on success
- [ ] Pipeline view automatically refreshes to show newly created steps
- [ ] All validation commands pass

---

### Step 4: Update PipelineView to Render Steps from Database

**What**: Refactor `PipelineView` to derive step configuration from database records instead of using the hardcoded `ORCHESTRATION_STEPS` array for rendering.
**Why**: Enables the pipeline to display real step data including actual status, output, and allows for future extensibility with different step types.
**Confidence**: Medium

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify\components\workflows\pipeline-view.tsx` - Refactor to render from database steps

**Changes:**
- Keep the icon mapping configuration (can remain static as it's presentation-only)
- Create a helper that maps step type to icon component
- Change the rendering logic to iterate over fetched `steps` data instead of `ORCHESTRATION_STEPS`
- Sort steps by `stepNumber` before rendering to ensure correct order
- Handle the empty steps case gracefully (show placeholder or loading state when workflow is in `created` status)
- Pass the actual `step.id` to `toggleStep` and `expandedStepId` comparisons instead of using config-based IDs
- Update `PipelineStep` props to use actual step data (title from `step.title`, status from `step.status`)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Pipeline renders steps from database when available
- [ ] Steps are rendered in correct order by `stepNumber`
- [ ] Empty state is handled gracefully for `created` workflows
- [ ] Step expansion still works correctly with database step IDs
- [ ] All validation commands pass

---

### Step 5: Add Start Workflow Button to WorkflowDetailPage

**What**: Wire up a functional "Start" button in the `WorkflowDetailPage` action bar that triggers the workflow start mutation.
**Why**: Enables testing the end-to-end flow from starting a workflow to seeing steps created and displayed in the pipeline.
**Confidence**: High

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify\app\(app)\workflows\[id]\page.tsx` - Add Start button functionality

**Changes:**
- Import `useStartWorkflow` from `@/hooks/queries/use-workflows`
- Add `STARTABLE_STATUSES` constant for workflows in `created` status
- Add the `useStartWorkflow` mutation hook to the component
- Add a "Start" button that appears when workflow status is `created`
- Wire button `onClick` to call `startWorkflow.mutate(workflowId)`
- Add loading state to button during mutation
- Consider adding toast notification for success/error feedback

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Start button appears for workflows in `created` status
- [ ] Clicking Start button triggers workflow start and step creation
- [ ] Button shows loading state during mutation
- [ ] Pipeline updates to show created steps after start
- [ ] All validation commands pass

---

### Step 6: Manual Integration Testing

**What**: Verify the complete flow works end-to-end by manually testing in the Electron app.
**Why**: Ensures all pieces work together correctly and the user experience is smooth.
**Confidence**: High

**Files to Create:**
- None

**Files to Modify:**
- None (testing step)

**Changes:**
- Create a new workflow via the UI
- Verify workflow starts in `created` status with no steps
- Click Start button on workflow detail page
- Verify four steps are created in the database
- Verify pipeline view displays all four steps with correct states
- Test with `skipClarification` enabled - verify clarification step shows as `skipped`
- Verify step cache invalidation works (no manual refresh needed)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] New workflows start with no steps
- [ ] Starting a workflow creates exactly 4 steps
- [ ] Steps appear in correct order: Clarification, Refinement, Discovery, Planning
- [ ] `skipClarification` correctly marks clarification step as skipped
- [ ] Pipeline UI reflects real-time step state from database
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Manual verification: Starting a workflow creates 4 planning steps
- [ ] Manual verification: Pipeline displays steps from database
- [ ] Manual verification: `skipClarification` flag works correctly

## Notes

**Architecture Decisions:**
- Step creation is handled at the IPC handler level rather than in the repository's `start()` method to maintain single responsibility principle
- Steps are created atomically to prevent partial state (all 4 steps or none)
- The `ORCHESTRATION_STEPS` constant is retained but repurposed for icon mapping only

**Edge Cases:**
- Workflow started without steps (race condition): Pipeline shows empty state gracefully
- Database errors during step creation: Transaction rollback ensures consistency
- Multiple rapid start clicks: Mutation disabled during pending state

**Future Considerations:**
- Implementation workflows will need different step types (routing, implementation, quality_gate, gemini_review)
- Step order may become dynamic in future phases
- Additional step metadata (estimated duration, agent assignment) can be added to step creation
