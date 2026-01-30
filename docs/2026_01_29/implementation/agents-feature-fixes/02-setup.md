# Setup and Routing Table

**Generated:** 2026-01-29

## Routing Table

| Step | Title                                                                   | Specialist Agent     | Files                                                                                                  |
| ---- | ----------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| 1    | Add agent list filter types and channel definitions                     | `ipc-handler`        | `electron/ipc/channels.ts`                                                                             |
| 2    | Update type definitions with filter interface and new method signatures | `ipc-handler`        | `types/electron.d.ts`                                                                                  |
| 3    | Update preload API to pass filters and add create/delete methods        | `ipc-handler`        | `electron/preload.ts`                                                                                  |
| 4    | Update agents repository with version increment and input validation    | `database-schema`    | `db/repositories/agents.repository.ts`, `lib/validations/agent.ts`                                     |
| 5    | Add Zod validation to agent tools and skills repositories               | `database-schema`    | `db/repositories/agent-tools.repository.ts`, `db/repositories/agent-skills.repository.ts`              |
| 6    | Add create, delete, and reset cascade handlers to agent IPC             | `ipc-handler`        | `electron/ipc/agent.handlers.ts`                                                                       |
| 7    | Update query hooks with server-side filtering and toast integration     | `tanstack-query`     | `hooks/queries/use-agents.ts`, `hooks/queries/use-agent-tools.ts`, `hooks/queries/use-agent-skills.ts` |
| 8    | Fix AgentEditorDialog useEffect dependencies and add error toasts       | `frontend-component` | `components/agents/agent-editor-dialog.tsx`                                                            |
| 9    | Add explicit color fallback logic in AgentCard                          | `frontend-component` | `components/agents/agent-card.tsx`                                                                     |
| 10   | Add input validation to agent tools and skills manager components       | `frontend-component` | `components/agents/agent-tools-manager.tsx`, `components/agents/agent-skills-manager.tsx`              |
| 11   | Update agents page to use server-side filtering                         | `frontend-component` | `app/(app)/agents/page.tsx`                                                                            |
| 12   | Clean up unused query key definitions                                   | `tanstack-query`     | `lib/queries/agents.ts`, `lib/queries/agent-tools.ts`, `lib/queries/agent-skills.ts`                   |
| 13   | Add built-in agent protection in IPC layer                              | `ipc-handler`        | `electron/ipc/agent.handlers.ts`                                                                       |

## Specialist Agent Distribution

- **ipc-handler**: Steps 1, 2, 3, 6, 13 (5 steps)
- **database-schema**: Steps 4, 5 (2 steps)
- **tanstack-query**: Steps 7, 12 (2 steps)
- **frontend-component**: Steps 8, 9, 10, 11 (4 steps)

## Dependency Order

1. **Phase A (IPC Foundation)**: Steps 1-3 (sequential)
2. **Phase B (Validation Schemas)**: Step 4 (depends on Phase A conceptually, but can start validation schemas)
3. **Phase C (Repository Validation)**: Step 5 (depends on Step 4)
4. **Phase D (Handlers and Hooks)**: Steps 6-7 (depends on Steps 1-3)
5. **Phase E (UI Components)**: Steps 8-11 (depends on Steps 4, 7)
6. **Phase F (Cleanup)**: Steps 12-13 (can run after core work)

## MILESTONE: PHASE_2_COMPLETE
