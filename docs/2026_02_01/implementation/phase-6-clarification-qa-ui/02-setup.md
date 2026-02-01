# Phase 6: Clarification Q&A UI - Routing Table

**Created**: 2026-02-01

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Define Clarification Q&A Zod Schemas and Types | `tanstack-form` | `lib/validations/clarification.ts` (new) |
| 2 | Add IPC Channel and Handler for Step Update | `ipc-handler` | `electron/ipc/channels.ts`, `electron/preload.ts`, `electron/ipc/step.handlers.ts`, `types/electron.d.ts` |
| 3 | Add Electron Hook Method and Query Mutation | `tanstack-query` | `hooks/use-electron.ts`, `hooks/queries/use-steps.ts` |
| 4 | Create ClarificationForm Component | `frontend-component` | `components/workflows/clarification-form.tsx` (new) |
| 5 | Update PipelineStep for Clarification Step Type | `frontend-component` | `components/workflows/pipeline-step.tsx` |
| 6 | Update PipelineView to Handle Clarification Submissions | `frontend-component` | `components/workflows/pipeline-view.tsx` |
| 7 | Export Components and Integration Testing | `general-purpose` | `components/workflows/index.ts`, `lib/validations/index.ts` |

## Specialist Agent Mapping

- **tanstack-form**: Step 1 (validation schemas for form)
- **ipc-handler**: Step 2 (IPC channels, handlers, preload, types)
- **tanstack-query**: Step 3 (mutation hooks, cache invalidation)
- **frontend-component**: Steps 4, 5, 6 (React components with Base UI + CVA)
- **general-purpose**: Step 7 (exports, barrel files)

## Dependencies

```
Step 1 (schemas) ─┬─► Step 4 (form component)
                  │
Step 2 (IPC) ─────┼─► Step 3 (hooks) ─► Step 6 (PipelineView)
                  │
                  └─► Step 5 (PipelineStep) ─► Step 6
```

Steps 1 and 2 can run in parallel. Step 3 depends on Step 2. Steps 4 and 5 depend on Step 1. Step 6 depends on Steps 3, 4, 5. Step 7 is final.

## Execution Order

Sequential execution for clarity:
1. Step 1 (schemas)
2. Step 2 (IPC)
3. Step 3 (hooks)
4. Step 4 (form component)
5. Step 5 (PipelineStep)
6. Step 6 (PipelineView)
7. Step 7 (exports)
