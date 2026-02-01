# Step 1: Feature Refinement

**Started**: 2026-02-01T00:00:02Z
**Completed**: 2026-02-01T00:00:03Z
**Status**: Completed

## Original Request

Phase 4 of the workflow-implementation-phases.md - Workflow Steps Data Layer

**Goal**: Workflow steps are created and tracked in the database.

## Context Provided

- Existing infrastructure discovered in Step 0a
- Project tech stack (Electron, Next.js 16, TanStack Query, Drizzle ORM, SQLite)
- IPC bridge pattern and repository pattern conventions

## Agent Prompt

```
Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections):

[Full feature request with deliverables, validation criteria, and existing infrastructure]

Using the project context, expand this request with relevant technical details while maintaining its core intent. Output ONLY the refined paragraph (200-500 words), nothing else. Focus on what needs to be implemented given the existing infrastructure.
```

## Agent Response

Implement Phase 4 of the workflow implementation phases, which establishes the workflow steps data layer so that steps are created and tracked in the database rather than being hardcoded in the UI. The existing infrastructure includes the `workflow_steps` schema at `db/schema/workflow-steps.schema.ts`, the `WorkflowStepsRepository` at `db/repositories/workflow-steps.repository.ts` with methods like `findByWorkflowId()`, `create()`, and `skip()`, step IPC handlers at `electron/ipc/step.handlers.ts` with `step:list` and `step:update` channels, and the `useStepsByWorkflow` hook at `hooks/queries/use-steps.ts`. The primary task is to wire these existing components together and implement the step creation logic that triggers when a workflow transitions from `created` to `running` status. This transition should automatically create four planning phase steps in order: Step 1 for Clarification (which should be marked as 'skipped' if the workflow's `skipClarification` field is true), Step 2 for Refinement, Step 3 for File Discovery, and Step 4 for Planning. Verify that the `workflow_steps` schema contains all necessary fields for tracking step state, including status (pending, running, completed, skipped, failed), step type/name, step order, input/output data, timestamps, and any error information. The step creation logic should be implemented in the workflow repository or a dedicated service that handles the status transition, ensuring steps are created atomically when the workflow starts. Update the `WorkflowDetailPage` pipeline visualization at `app/(app)/workflows/[id]/page.tsx` to consume real step data from the `useStepsByWorkflow` hook instead of any hardcoded step definitions, ensuring the pipeline component renders the correct state for each step based on the database records. The IPC handlers should support listing all steps for a given workflow ID and updating individual step status and output fields as the workflow progresses. Ensure proper TanStack Query cache invalidation when steps are created or updated, using the existing query key factory pattern in `lib/queries/`. Validation requires that starting a workflow creates exactly four steps in the database with correct ordering and initial statuses, that the `skipClarification` flag properly marks the clarification step as skipped rather than pending, and that the pipeline UI accurately reflects the real-time state of each step from the database.

## Validation Results

| Check | Result |
|-------|--------|
| Format | Single paragraph ✓ |
| Length | ~400 words (within 200-500 range) ✓ |
| Intent preserved | Yes ✓ |
| Technical context added | Yes ✓ |
| No feature creep | Yes ✓ |

## Refined Request (Extracted)

Implement Phase 4 of the workflow implementation phases, which establishes the workflow steps data layer so that steps are created and tracked in the database rather than being hardcoded in the UI. The existing infrastructure includes the `workflow_steps` schema at `db/schema/workflow-steps.schema.ts`, the `WorkflowStepsRepository` at `db/repositories/workflow-steps.repository.ts` with methods like `findByWorkflowId()`, `create()`, and `skip()`, step IPC handlers at `electron/ipc/step.handlers.ts` with `step:list` and `step:update` channels, and the `useStepsByWorkflow` hook at `hooks/queries/use-steps.ts`. The primary task is to wire these existing components together and implement the step creation logic that triggers when a workflow transitions from `created` to `running` status. This transition should automatically create four planning phase steps in order: Step 1 for Clarification (which should be marked as 'skipped' if the workflow's `skipClarification` field is true), Step 2 for Refinement, Step 3 for File Discovery, and Step 4 for Planning. Verify that the `workflow_steps` schema contains all necessary fields for tracking step state, including status (pending, running, completed, skipped, failed), step type/name, step order, input/output data, timestamps, and any error information. The step creation logic should be implemented in the workflow repository or a dedicated service that handles the status transition, ensuring steps are created atomically when the workflow starts. Update the `WorkflowDetailPage` pipeline visualization at `app/(app)/workflows/[id]/page.tsx` to consume real step data from the `useStepsByWorkflow` hook instead of any hardcoded step definitions, ensuring the pipeline component renders the correct state for each step based on the database records. The IPC handlers should support listing all steps for a given workflow ID and updating individual step status and output fields as the workflow progresses. Ensure proper TanStack Query cache invalidation when steps are created or updated, using the existing query key factory pattern in `lib/queries/`. Validation requires that starting a workflow creates exactly four steps in the database with correct ordering and initial statuses, that the `skipClarification` flag properly marks the clarification step as skipped rather than pending, and that the pipeline UI accurately reflects the real-time state of each step from the database.
