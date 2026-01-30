# Implementation Setup - Routing Table

## Step-to-Specialist Routing

| Step | Title                                 | Specialist           | Files                                                                                              |
| ---- | ------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| 1    | Verify Backend Agent Creation Handler | `ipc-handler`        | electron/ipc/agent.handlers.ts                                                                     |
| 2    | Add Duplicate IPC Handler             | `ipc-handler`        | electron/ipc/channels.ts, electron/preload.ts, types/electron.d.ts, electron/ipc/agent.handlers.ts |
| 3    | Add useDuplicateAgent Mutation        | `tanstack-query`     | hooks/queries/use-agents.ts                                                                        |
| 4    | Create createAgentFormSchema          | `general-purpose`    | lib/validations/agent.ts                                                                           |
| 5    | Extend AgentEditorDialog              | `frontend-component` | components/agents/agent-editor-dialog.tsx                                                          |
| 6    | Add Create Agent Button               | `frontend-component` | app/(app)/agents/page.tsx                                                                          |
| 7    | Create ConfirmDeleteAgentDialog       | `frontend-component` | components/agents/confirm-delete-agent-dialog.tsx (new)                                            |
| 8    | Add Duplicate/Delete to AgentCard     | `frontend-component` | components/agents/agent-card.tsx                                                                   |
| 9    | Integrate Delete/Duplicate in Page    | `frontend-component` | app/(app)/agents/page.tsx                                                                          |
| 10   | Add Visual Distinction                | `frontend-component` | components/agents/agent-card.tsx, components/agents/agent-editor-dialog.tsx                        |
| 11   | Add Result Count & Empty State        | `frontend-component` | app/(app)/agents/page.tsx                                                                          |

## Specialist Summary

| Specialist           | Steps                 |
| -------------------- | --------------------- |
| `ipc-handler`        | 1, 2                  |
| `tanstack-query`     | 3                     |
| `general-purpose`    | 4                     |
| `frontend-component` | 5, 6, 7, 8, 9, 10, 11 |

## Execution Order

Steps will be executed in numerical order (1-11) as there are dependencies:

- Step 2 depends on Step 1 (verify before adding new handler)
- Step 3 depends on Step 2 (hook needs IPC handler)
- Step 5 depends on Step 4 (dialog needs form schema)
- Steps 6-11 depend on Step 5 (UI integrations need the dialog)
- Steps 9 depends on Steps 7, 8 (page integration needs child components)

## Status: COMPLETE

Routing table created. Ready to begin step execution.
