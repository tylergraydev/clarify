# Step 16: Create TanStack Query Hooks for Steps

**Status**: SUCCESS

## Files Created

- `hooks/queries/use-steps.ts` - Step query and mutation hooks

## Validation Results

- pnpm lint --fix: PASS
- pnpm typecheck: PASS

## Query Hooks Created

| Hook                             | Purpose                 | Query Key                         |
| -------------------------------- | ----------------------- | --------------------------------- |
| `useStep(id)`                    | Fetch single step       | `stepKeys.detail(id)`             |
| `useStepsByWorkflow(workflowId)` | Fetch steps by workflow | `stepKeys.byWorkflow(workflowId)` |

## Mutation Hooks Created

| Hook                  | Purpose          | Invalidates                        |
| --------------------- | ---------------- | ---------------------------------- |
| `useEditStep()`       | Edit step output | step detail/list, workflow         |
| `useRegenerateStep()` | Regenerate step  | step detail/list, workflow         |
| `useCompleteStep()`   | Complete step    | step detail/list, workflow running |
| `useFailStep()`       | Fail step        | step detail/list, workflow         |

## Success Criteria

- [x] All step query hooks implemented
- [x] Edit mutation updates cache correctly
- [x] Workflow queries invalidated on step changes
- [x] All validation commands pass
