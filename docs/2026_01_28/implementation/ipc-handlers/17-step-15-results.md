# Step 15: Create TanStack Query Hooks for Workflows

**Status**: SUCCESS

## Files Created
- `hooks/queries/use-workflows.ts` - Workflow query and mutation hooks

## Validation Results
- pnpm lint --fix: PASS
- pnpm typecheck: PASS

## Query Hooks Created
| Hook | Purpose | Query Key |
|------|---------|-----------|
| `useWorkflows()` | Fetch all workflows | `workflowKeys.list()` |
| `useWorkflow(id)` | Fetch single workflow | `workflowKeys.detail(id)` |
| `useWorkflowsByProject(projectId)` | Filter by project | `workflowKeys.byProject(projectId)` |

## Mutation Hooks Created
| Hook | Purpose | Invalidates |
|------|---------|-------------|
| `useCreateWorkflow()` | Create workflow | list, byProject |
| `useStartWorkflow()` | Start workflow | list, running, byProject |
| `usePauseWorkflow()` | Pause workflow | list, running, byProject |
| `useResumeWorkflow()` | Resume workflow | list, running, byProject |
| `useCancelWorkflow()` | Cancel workflow | list, running, byProject |

## Success Criteria
- [x] All workflow query hooks use correct query keys
- [x] Mutations invalidate correct queries
- [x] `enabled: isElectron` on all queries
- [x] All validation commands pass
