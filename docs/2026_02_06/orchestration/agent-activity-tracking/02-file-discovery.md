# Step 2: File Discovery

**Status**: Completed
**Timestamp**: 2026-02-06

## Discovery Statistics

- Directories explored: 12
- Candidate files examined: 58
- Highly relevant files: 21
- Supporting files: 14
- Total discovered: 39

## Critical Priority (Must Modify)

| # | File | Reason |
|---|------|--------|
| 1 | `db/schema/workflow-steps.schema.ts` | Reference for new agent_activity schema; parent table for FK |
| 2 | `db/schema/index.ts` | Must add export for new agent-activity.schema |
| 3 | `db/repositories/workflow-steps.repository.ts` | Pattern reference for new repository |
| 4 | `db/repositories/index.ts` | Must add export for new repository |
| 5 | `electron/ipc/channels.ts` | Must add agentActivity IPC channel constants |
| 6 | `electron/ipc/index.ts` | Must register new agentActivity handlers |
| 7 | `electron/preload.ts` | Must add agentActivity namespace to ElectronAPI |
| 8 | `types/electron.d.ts` | Must add AgentActivity types to ElectronAPI interface |
| 9 | `lib/queries/index.ts` | Must merge new agentActivityKeys |
| 10 | `lib/queries/steps.ts` | Pattern reference for query key factory |
| 11 | `hooks/queries/index.ts` | Must export new use-agent-activity hook |
| 12 | `electron/services/agent-step/agent-sdk-executor.ts` | Core interception point - processStreamEvent() |
| 13 | `electron/services/agent-step/usage-stats.ts` | Token usage extraction utilities |
| 14 | `components/workflows/detail/workflow-streaming-panel.tsx` | Core UI modification for historical fallback |

## High Priority (Likely Modify)

| # | File | Reason |
|---|------|--------|
| 15 | `electron/services/clarification-step.service.ts` | Step service must pass context for activity persistence |
| 16 | `electron/services/refinement-step.service.ts` | Same pattern as clarification |
| 17 | `electron/services/file-discovery.service.ts` | Same pattern for file discovery step |
| 18 | `hooks/use-clarification-stream.ts` | Must remain unchanged but understand interface for fallback design |
| 19 | `components/workflows/detail/clarification-stream-provider.tsx` | Provides isStreaming state for conditional logic |
| 20 | `hooks/use-electron.ts` | Must add agentActivity domain to useElectronDb() |
| 21 | `types/workflow-stream.ts` | StreamToolEvent types may need extension |

## Medium Priority (Supporting/Reference)

| # | File | Reason |
|---|------|--------|
| 22 | `db/repositories/base.repository.ts` | Base repository factory used by all repositories |
| 23 | `db/repositories/workflows.repository.ts` | Complex query method patterns |
| 24 | `db/schema/workflows.schema.ts` | Schema conventions reference |
| 25 | `db/index.ts` | Database initialization (auto-includes new schema) |
| 26 | `electron/services/agent-stream.service.ts` | Lower-level streaming; message_delta usage events |
| 27 | `electron/services/agent-step/step-types.ts` | ActiveToolInfo, BaseActiveSession types |
| 28 | `electron/ipc/clarification.handlers.ts` | IPC handler registration pattern |
| 29 | `electron/ipc/step.handlers.ts` | Step-related IPC handler patterns |
| 30 | `hooks/queries/use-clarification.ts` | React Query hook patterns |
| 31 | `hooks/queries/use-workflows.ts` | Cache invalidation patterns |
| 32 | `lib/stores/workflow-detail-store.ts` | Streaming panel UI state |
| 33 | `drizzle.config.ts` | Migration generation config |

## Low Priority (Context Only)

| # | File | Reason |
|---|------|--------|
| 34 | `components/workflows/detail/steps/clarification-step-content.tsx` | UI phase determination |
| 35 | `components/workflows/detail/steps/refinement-step-content.tsx` | Placeholder - needs historical activity |
| 36 | `components/workflows/detail/steps/file-discovery-step-content.tsx` | Placeholder - needs historical activity |
| 37 | `components/workflows/detail/steps/implementation-planning-step-content.tsx` | Placeholder - needs historical activity |
| 38 | `types/agent-stream.d.ts` | Agent stream type definitions |
| 39 | `electron/services/agent-step/index.ts` | Agent step barrel export |

## Architecture Insights

### Key Patterns

1. **Schema Convention**: All schemas use `sqliteTable()` with snake_case columns, mandatory `id` (integer PK auto-increment), `createdAt`/`updatedAt` (text with `sql(CURRENT_TIMESTAMP)`)
2. **Repository Factory Pattern**: `createXxxRepository(db)` calls `createBaseRepository()` then extends with domain methods
3. **Two-Layer Streaming**: Low-level MessagePort (`AgentStreamService`) + High-level typed IPC (`AgentSdkExecutor`) - intercept at high level
4. **Ephemeral vs Persisted**: Stream data in React state via hooks; feature adds SQLite persistence with UI fallback
5. **IPC Registration Order**: Stateless -> window-dependent -> database handlers in `registerAllHandlers()`
6. **Query Key Factory**: `createQueryKeys()` merged via `mergeQueryKeys()` in `lib/queries/index.ts`

### Best Template Entity

The **discovered-files** entity is the closest analog - it has FK to `workflow_steps`, repository with `findByWorkflowStepId()`, IPC handlers, query keys, and React Query hooks traversing all layers.

### Integration Challenges

1. **Message Delta Usage**: `extractUsageStats()` only reads from final `SDKResultMessage`; per-event token tracking needs `message_delta` interception
2. **Synchronous SQLite**: `better-sqlite3` is sync but stream processing is async; repository writes are sync-safe
3. **Tab Placeholders**: Refinement/Discovery/Planning tabs currently show static text; need same `StepStreamContent` pattern
