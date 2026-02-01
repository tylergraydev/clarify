# Setup and Routing Table

**Feature**: Workflow Steps Data Layer (Phase 4)

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Add bulk step creation method to WorkflowStepsRepository | `database-schema` | `db/repositories/workflow-steps.repository.ts` |
| 2 | Update Workflow IPC Handler to create steps on start | `ipc-handler` | `electron/ipc/workflow.handlers.ts`, `electron/ipc/index.ts` |
| 3 | Enhance useStartWorkflow hook with step cache invalidation | `tanstack-query` | `hooks/queries/use-workflows.ts` |
| 4 | Update PipelineView to render steps from database | `frontend-component` | `components/workflows/pipeline-view.tsx` |
| 5 | Add Start Workflow button to WorkflowDetailPage | `page-route` | `app/(app)/workflows/[id]/page.tsx` |
| 6 | Manual integration testing | `general-purpose` | None (testing step) |

## Step Details

### Step 1: database-schema
- Add `createPlanningSteps(workflowId: number, skipClarification: boolean)` method
- Creates 4 planning steps atomically: clarification, refinement, discovery, planning
- Handle skipClarification flag for clarification step status

### Step 2: ipc-handler
- Update `registerWorkflowHandlers` to accept `workflowStepsRepository`
- Modify `workflow:start` handler to create steps after starting workflow
- Update `registerAllHandlers` in index.ts

### Step 3: tanstack-query
- Import stepKeys from `@/lib/queries/steps`
- Add step cache invalidation to `useStartWorkflow` onSuccess

### Step 4: frontend-component
- Refactor PipelineView to render from database steps
- Keep icon mapping, change iteration to use fetched steps
- Handle empty steps case gracefully

### Step 5: page-route
- Add `useStartWorkflow` mutation hook
- Add Start button for workflows in `created` status
- Wire button onClick to start mutation with loading state

### Step 6: general-purpose
- Manual testing of end-to-end flow
- Verify step creation and display

## MILESTONE: PHASE_2_COMPLETE
