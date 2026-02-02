# Setup and Routing Table

**Date**: 2026-02-02
**Phase**: 2

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Add default clarification agent setting | `database-schema` | `db/seed/settings.seed.ts` |
| 2 | Extend clarification validation types | `tanstack-form` | `lib/validations/clarification.ts` |
| 3 | Update workflow creation validation schema | `tanstack-form` | `lib/validations/workflow.ts` |
| 4 | Create default clarification agent hook | `tanstack-query` | `hooks/queries/use-default-clarification-agent.ts` |
| 5 | Add agent selection to workflow creation dialog | `frontend-component` | `components/workflows/create-workflow-dialog.tsx` |
| 6 | Update workflow step creation to include agent ID | `database-schema` | `db/repositories/workflow-steps.repository.ts` or IPC handler |
| 7 | Create ClarificationStepService core | `claude-agent-sdk` | `electron/services/clarification-step.service.ts` |
| 8 | Add clarification IPC channel definitions | `ipc-handler` | `electron/ipc/channels.ts`, `electron/preload.ts` |
| 9 | Create clarification IPC handlers | `ipc-handler` | `electron/ipc/clarification.ipc.ts` |
| 10 | Register clarification handlers and update types | `ipc-handler` | `electron/ipc/index.ts`, `electron/preload.ts`, `types/electron.d.ts` |
| 11 | Add audit trail integration | `claude-agent-sdk` | `electron/services/clarification-step.service.ts` |
| 12 | Create ClarificationStreaming component | `frontend-component` | `components/workflows/clarification-streaming.tsx` |
| 13 | Integrate streaming component into pipeline | `frontend-component` | `components/workflows/pipeline-view.tsx`, `components/workflows/pipeline-step.tsx` |
| 14 | Add Make Default action to agents page | `frontend-component` | `components/agents/agent-card-actions.tsx` |
| 15 | Add pause mode and error handling | `claude-agent-sdk` | `electron/services/clarification-step.service.ts`, `components/workflows/clarification-streaming.tsx` |

## Execution Order

Steps will be executed in order 1-15 as specified in the plan, respecting dependencies:
- Steps 1-4: Foundation (types, validation, query hooks)
- Steps 5-6: UI and data layer integration
- Steps 7-11: Core service and IPC infrastructure
- Steps 12-15: UI components and polish

## Agent Summary

| Agent | Steps |
|-------|-------|
| `database-schema` | 1, 6 |
| `tanstack-form` | 2, 3 |
| `tanstack-query` | 4 |
| `frontend-component` | 5, 12, 13, 14 |
| `claude-agent-sdk` | 7, 11, 15 |
| `ipc-handler` | 8, 9, 10 |

## MILESTONE: PHASE_2_COMPLETE
