# Setup and Routing Table

**Phase**: 2
**Generated**: 2026-02-03

## Routing Table

This table maps each implementation step to the correct specialist subagent based on file patterns and domain expertise.

| Step | Title | Specialist | Rationale |
|------|-------|------------|-----------|
| 1 | Add Extended Thinking Columns to Database Schema | `database-schema` | Modifies `db/schema/agents.schema.ts` |
| 2 | Add Zod Validation Schemas for Extended Thinking Fields | `tanstack-form` | Modifies `lib/validations/agent.ts` |
| 3 | Update Agent Import/Export Types | `general-purpose` | Modifies `types/electron.d.ts` (utility types) |
| 4 | Update AgentStreamOptions Type | `claude-agent-sdk` | Modifies `types/agent-stream.d.ts` (SDK-related) |
| 5 | Update Agent Editor Form Hook with Default Values | `tanstack-form` | Modifies `hooks/agents/use-agent-editor-form.ts` |
| 6 | Add Extended Thinking UI Fields to Agent Editor Dialog | `frontend-component` | Modifies `components/agents/agent-editor-dialog.tsx` |
| 7 | Pass maxThinkingTokens to Agent SDK and Handle Streaming Mode | `claude-agent-sdk` | Modifies `electron/services/agent-stream.service.ts` |
| 8 | Synchronize Preload Script Type Definitions | `general-purpose` | Modifies `electron/preload.ts` (utility types) |
| 9 | Manual Integration Testing | Orchestrator | No code changes, testing only |

## Todo List Created

All steps have been added to the todo list with their assigned specialists.

## Next Phase

Proceeding to Phase 3: Step Execution (delegation to subagents)
