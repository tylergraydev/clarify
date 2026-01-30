# Setup and Routing Table

**Feature**: Project-Specific Agents
**Total Steps**: 14

## Routing Table

| Step | Title                                  | Specialist         | Files                                                                                                 |
| ---- | -------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| 1    | Update Agent List Filters Type         | general-purpose    | `types/electron.d.ts`, `electron/ipc/agent.handlers.ts`                                               |
| 2    | Update Repository for Scope Queries    | database-schema    | `db/repositories/agents.repository.ts`                                                                |
| 3    | Update IPC Handler for Scope Filtering | ipc-handler        | `electron/ipc/agent.handlers.ts`                                                                      |
| 4    | Add Query Key Factories                | tanstack-query     | `lib/queries/agents.ts`                                                                               |
| 5    | Create Query Hooks                     | tanstack-query     | `hooks/queries/use-agents.ts`                                                                         |
| 6    | Update Validation Schemas              | tanstack-form      | `lib/validations/agent.ts`                                                                            |
| 7    | Update Agent Card Badge                | frontend-component | `components/agents/agent-card.tsx`                                                                    |
| 8    | Update Agent Editor Dialog             | frontend-component | `components/agents/agent-editor-dialog.tsx`                                                           |
| 9    | Create Tab Content Components          | frontend-component | `components/agents/global-agents-tab-content.tsx`, `components/agents/project-agents-tab-content.tsx` |
| 10   | Refactor Agents Page with Tabs         | frontend-component | `app/(app)/agents/page.tsx`                                                                           |
| 11   | Add Project Override Support           | frontend-component | `components/agents/agent-card.tsx`, `electron/ipc/agent.handlers.ts`, `hooks/queries/use-agents.ts`   |
| 12   | Update Cache Invalidation              | tanstack-query     | `hooks/queries/use-agents.ts`                                                                         |
| 13   | Add Project Context to Header          | frontend-component | `app/(app)/agents/page.tsx`                                                                           |
| 14   | Integration Testing and Edge Cases     | frontend-component | `app/(app)/agents/page.tsx`, `components/agents/project-agents-tab-content.tsx`                       |

## Specialist Summary

| Specialist         | Steps                   |
| ------------------ | ----------------------- |
| general-purpose    | 1                       |
| database-schema    | 2                       |
| ipc-handler        | 3                       |
| tanstack-query     | 4, 5, 12                |
| tanstack-form      | 6                       |
| frontend-component | 7, 8, 9, 10, 11, 13, 14 |

## Worktree Info

- **Path**: `.worktrees/project-specific-agents`
- **Branch**: `feat/project-specific-agents`

## Status

Routing table complete. Ready to proceed with Step 1.

---

MILESTONE:PHASE_2_COMPLETE
