# Step 2: File Discovery

**Started**: 2026-02-01T00:00:04Z
**Completed**: 2026-02-01T00:00:05Z
**Status**: Completed

## Refined Request Input

Implement Phase 4 of the workflow implementation phases - Workflow Steps Data Layer. Wire existing components together and implement step creation logic when workflow transitions from `created` to `running`.

## Discovery Statistics

| Metric | Value |
|--------|-------|
| Directories explored | 15+ |
| Candidate files examined | 40+ |
| Highly relevant files | 12 |
| Supporting files | 15 |
| Total discovered | 27 |

## Discovered Files

### Critical Priority (Must Modify)

| File | Reason |
|------|--------|
| `electron/ipc/workflow.handlers.ts` | The `workflow:start` handler where step creation logic must be added when workflow transitions to `running` |
| `db/repositories/workflows.repository.ts` | The `start()` method that transitions workflow status - needs to coordinate with step creation |
| `components/workflows/pipeline-view.tsx` | Uses hardcoded `ORCHESTRATION_STEPS` array - must consume real step data from `useStepsByWorkflow` |
| `hooks/queries/use-workflows.ts` | The `useStartWorkflow` mutation needs enhanced cache invalidation for step queries |

### High Priority (Likely Modify)

| File | Reason |
|------|--------|
| `db/repositories/workflow-steps.repository.ts` | May need bulk creation method for creating all four steps atomically |
| `hooks/queries/use-steps.ts` | Step query hooks - may need additional cache invalidation patterns |
| `electron/ipc/index.ts` | Central IPC handler registration - if new service class created, needs injection |
| `electron/ipc/step.handlers.ts` | Step IPC handlers - may be called from workflow start handler |
| `db/schema/workflow-steps.schema.ts` | Verify schema completeness for step state tracking |

### Medium Priority (May Reference)

| File | Reason |
|------|--------|
| `db/schema/workflows.schema.ts` | Contains `skipClarification` field to read when creating steps |
| `lib/queries/steps.ts` | Step query key factory for cache invalidation patterns |
| `lib/queries/workflows.ts` | Workflow query key factory for coordinated invalidation |
| `electron/preload.ts` | Preload script exposing ElectronAPI - update if new IPC channels added |
| `electron/ipc/channels.ts` | IPC channel constants - update if new channels added |
| `hooks/use-electron.ts` | useElectronDb hook wrapping IPC calls |
| `app/(app)/workflows/[id]/page.tsx` | WorkflowDetailPage rendering PipelineView |
| `components/workflows/pipeline-step.tsx` | PipelineStep component for individual step rendering |

### Low Priority (Context Only)

| File | Reason |
|------|--------|
| `db/schema/index.ts` | Schema barrel export |
| `db/repositories/index.ts` | Repository barrel export |
| `db/index.ts` | Database initialization and connection |
| `electron/main.ts` | Electron main process entry |
| `lib/validations/workflow.ts` | Workflow validation schemas |
| `hooks/queries/index.ts` | Query hooks barrel export |
| `components/workflows/index.ts` | Workflow components barrel |
| `lib/stores/pipeline-store.ts` | Pipeline UI state store |
| `docs/requirements/workflow-implementation-phases.md` | Phase 4 requirements |

## Architecture Insights

### Key Patterns Discovered

1. **Repository Pattern**: All database operations go through repository classes in `db/repositories/`. The workflow steps repository already has the necessary CRUD methods.

2. **IPC Bridge Pattern**: Electron IPC handlers in `electron/ipc/` call repository methods and expose them to the renderer via the preload script.

3. **TanStack Query Pattern**: Query hooks in `hooks/queries/` wrap IPC calls with caching, invalidation, and optimistic updates.

4. **Existing Step Infrastructure**:
   - Schema: `workflow_steps` table with all required fields
   - Repository: `createWorkflowStepsRepository` with create/skip/findByWorkflowId
   - IPC: `step:list`, `step:complete`, `step:skip`, etc.
   - Hooks: `useStepsByWorkflow`, `useCompleteStep`, `useSkipStep`

### Existing Similar Functionality

The `PipelineView` component already:
- Fetches steps using `useStepsByWorkflow(workflowId)`
- Has status mapping logic (`deriveStepState`)
- Has step type matching (`findStepByType`)

### Missing Pieces Identified

1. Steps are not created when workflow starts
2. PipelineView uses hardcoded step definitions rather than deriving from fetched steps

### Integration Points

1. **Workflow Start Flow**: When `workflow:start` IPC is called, it should:
   - Create 4 planning steps in the database
   - Mark clarification step as 'skipped' if `skipClarification` is true
   - Update workflow status to 'running'

2. **Cache Invalidation**: After workflow starts:
   - Invalidate `stepKeys.byWorkflow(workflowId)`
   - Invalidate `workflowKeys.detail(workflowId)`
   - Invalidate `workflowKeys.running`
   - Invalidate `workflowKeys.list`

3. **PipelineView Update**:
   - Derive step configuration from fetched steps array
   - Fall back to empty state if no steps exist yet

## File Validation Results

All discovered file paths were validated to exist in the codebase.
