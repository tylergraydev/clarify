# Persistent Agent Activity Tracking - Implementation Plan

**Generated**: 2026-02-06
**Original Request**: Add persistent agent activity tracking to workflow steps by creating a database schema and persistence layer that captures all tool call events (tool name, input parameters, tool use ID, start/stop timestamps, duration) along with token usage metrics (input tokens, output tokens, cache read/write tokens, estimated cost) from the Claude Agent SDK stream during workflow step execution.

**Refined Request**: Add persistent agent activity tracking to workflow steps by creating a new `agent_activity` table in `db/schema/` following the existing Drizzle ORM conventions (snake_case columns, mandatory `id`, `createdAt`, `updatedAt` fields) with a foreign key referencing the `workflow_steps` table's `id` column, storing individual tool call events with columns for tool name, JSON-serialized input parameters, tool use ID, start and stop timestamps (integer Unix milliseconds matching the project's timestamp pattern), computed duration, and token usage metrics (input tokens, output tokens, cache creation input tokens, cache read input tokens, and estimated cost as a real column), along with an event type discriminator to distinguish tool calls from text deltas and thinking content. A corresponding `agent-activity.repository.ts` in `db/repositories/` should expose `create()`, `getByStepId()`, and `getByWorkflowId()` methods following the factory-function repository pattern used by `workflows.repository.ts` and `steps.repository.ts`. On the Electron main process side, the `AgentSdkExecutor.processStreamEvent()` method in `electron/services/agent-step/agent-sdk-executor.ts` and the step-specific services (`clarification-step.service.ts`, `refinement-step.service.ts`, and the file discovery and planning step services) must be updated to intercept `StreamEvent` objects and persist them to SQLite via the new repository through IPC handlers registered in `electron/ipc/`. New query keys should be added to the existing query key factory in `lib/queries/`, and a `use-agent-activity.ts` hook in `hooks/queries/` should wrap `useQuery` calls that fetch historical activity by step ID through a new `window.electron.agentActivity.getByStepId()` IPC channel. The `workflow-streaming-panel.tsx` component and its per-phase tab contents should be updated to check whether a step is actively streaming and, if not, fall back to loading persisted activity from the database using the new React Query hook.

## Analysis Summary

- Feature request refined with project context
- Discovered 39 files across 12 directories (14 critical, 7 high, 12 medium, 6 low)
- Generated 10-step implementation plan

## File Discovery Results

### Critical Priority (Must Modify)
1. `db/schema/workflow-steps.schema.ts` - Parent table for FK, schema conventions reference
2. `db/schema/index.ts` - Must export new schema
3. `db/repositories/workflow-steps.repository.ts` - Repository pattern reference
4. `db/repositories/index.ts` - Must export new repository
5. `electron/ipc/channels.ts` - Must add agentActivity channel constants
6. `electron/ipc/index.ts` - Must register new handlers
7. `electron/preload.ts` - Must add agentActivity namespace
8. `types/electron.d.ts` - Must add AgentActivity types
9. `lib/queries/index.ts` - Must merge agentActivityKeys
10. `lib/queries/steps.ts` - Query key factory pattern reference
11. `hooks/queries/index.ts` - Must export new hook
12. `electron/services/agent-step/agent-sdk-executor.ts` - Core interception point
13. `electron/services/agent-step/usage-stats.ts` - Token usage extraction
14. `components/workflows/detail/workflow-streaming-panel.tsx` - Core UI modification

### High Priority (Likely Modify)
15. `electron/services/clarification-step.service.ts` - Pass activity persistence context
16. `electron/services/refinement-step.service.ts` - Same pattern
17. `electron/services/file-discovery.service.ts` - Same pattern
18. `hooks/use-clarification-stream.ts` - Must remain unchanged; interface reference
19. `components/workflows/detail/clarification-stream-provider.tsx` - isStreaming state
20. `hooks/use-electron.ts` - Must add agentActivity domain
21. `types/workflow-stream.ts` - StreamToolEvent types

### Medium Priority (Reference)
22. `db/repositories/base.repository.ts` - Base repository factory
23. `db/repositories/workflows.repository.ts` - Complex query patterns
24. `db/schema/workflows.schema.ts` - Schema conventions
25. `db/index.ts` - DB initialization
26. `electron/services/agent-stream.service.ts` - Lower-level streaming
27. `electron/services/agent-step/step-types.ts` - Type definitions
28. `electron/ipc/clarification.handlers.ts` - Handler registration pattern
29. `electron/ipc/step.handlers.ts` - Step handler patterns
30. `hooks/queries/use-clarification.ts` - React Query hook patterns
31. `hooks/queries/use-workflows.ts` - Cache invalidation patterns
32. `lib/stores/workflow-detail-store.ts` - Streaming panel UI state
33. `drizzle.config.ts` - Migration generation config

---

## Implementation Plan

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

This feature adds a new `agent_activity` SQLite table to persist individual agent stream events (tool calls, text deltas, thinking content, usage metadata) during workflow step execution. A full data stack -- schema, repository, IPC handlers, preload bindings, query keys, and React Query hooks -- enables the UI to reconstruct historical agent activity from the database when a step is no longer actively streaming. The `WorkflowStreamingPanel` gains the ability to fall back to persisted activity data for completed steps, while the existing live streaming behavior remains completely unchanged.

## Prerequisites

- [ ] Ensure `pnpm install` has been run and dependencies are up to date
- [ ] Verify the current codebase passes `pnpm lint && pnpm typecheck` before starting
- [ ] Confirm familiarity with the Claude Agent SDK `StreamEvent` types (`content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`)

## Implementation Steps

### Step 1: Create the `agent_activity` Database Schema

**What**: Define the `agent_activity` table in a new schema file following Drizzle ORM conventions.
**Why**: This table is the foundation for persisting every stream event (tool calls, text deltas, thinking content, usage metadata) that occurs during agent step execution.
**Confidence**: High

**Files to Create:**

- `db/schema/agent-activity.schema.ts` - New Drizzle table definition with FK to `workflow_steps`

**Files to Modify:**

- `db/schema/index.ts` - Add barrel export for the new schema

**Changes:**

- Define `agentActivityEventTypes` const array: `['tool_start', 'tool_stop', 'tool_update', 'text_delta', 'thinking_start', 'thinking_delta', 'phase_change', 'usage']`
- Define `agentActivity` table using `sqliteTable('agent_activity', ...)` with columns:
  - `id`: integer PK auto-increment
  - `workflowStepId`: integer, FK to `workflowSteps.id` with `onDelete: 'cascade'`, not null
  - `eventType`: text, not null (discriminator for the event kind)
  - `toolName`: text, nullable (for tool events only)
  - `toolUseId`: text, nullable (for tool events only)
  - `toolInput`: text with `{ mode: 'json' }`, nullable (JSON-serialized input params)
  - `textDelta`: text, nullable (for text_delta and thinking_delta events)
  - `thinkingBlockIndex`: integer, nullable (for thinking events)
  - `phase`: text, nullable (for phase_change events)
  - `startedAt`: integer, nullable (Unix ms timestamp when event started)
  - `stoppedAt`: integer, nullable (Unix ms timestamp when event ended)
  - `durationMs`: integer, nullable (computed duration for tool events)
  - `inputTokens`: integer, nullable (from usage metadata)
  - `outputTokens`: integer, nullable (from usage metadata)
  - `cacheCreationInputTokens`: integer, nullable
  - `cacheReadInputTokens`: integer, nullable
  - `estimatedCost`: real, nullable (cost in USD)
  - `createdAt`: text, default `sql(CURRENT_TIMESTAMP)`, not null
  - `updatedAt`: text, default `sql(CURRENT_TIMESTAMP)`, not null
- Add indexes on `workflowStepId`, `eventType`, and a composite `(workflowStepId, eventType)` index
- Export `AgentActivity` and `NewAgentActivity` inferred types
- Add `export * from './agent-activity.schema'` to `db/schema/index.ts`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Schema file compiles without TypeScript errors
- [ ] `AgentActivity` and `NewAgentActivity` types are available from the barrel export
- [ ] All validation commands pass

---

### Step 2: Generate the Database Migration

**What**: Generate a Drizzle migration for the new `agent_activity` table and apply it.
**Why**: The migration creates the actual SQLite table so the repository can read/write data.
**Confidence**: High

**Files to Create:**

- `drizzle/XXXX_*.sql` - Auto-generated migration file

**Changes:**

- Run `pnpm db:generate` to produce the SQL migration from the schema diff

**Validation Commands:**

```bash
pnpm db:generatex
```

**Success Criteria:**

- [ ] Migration file is generated in `drizzle/` directory
- [ ] The `agent_activity` table exists in the SQLite database

---

### Step 3: Create the Agent Activity Repository

**What**: Implement a repository with `create`, `createMany`, `getByStepId`, and `getByWorkflowId` methods.
**Why**: Provides the data access layer for persisting and retrieving agent activity records, following the project's factory-function repository pattern.
**Confidence**: High

**Files to Create:**

- `db/repositories/agent-activity.repository.ts` - Repository implementation

**Files to Modify:**

- `db/repositories/index.ts` - Add barrel export

**Changes:**

- Define `AgentActivityRepository` interface with methods:
  - `create(data: NewAgentActivity): AgentActivity`
  - `createMany(data: Array<NewAgentActivity>): Array<AgentActivity>`
  - `findByStepId(stepId: number): Array<AgentActivity>`
  - `findByWorkflowId(workflowId: number): Array<AgentActivity>` (join through `workflowSteps` table)
  - `deleteByStepId(stepId: number): number`
  - `findById(id: number): AgentActivity | undefined`
  - `delete(id: number): boolean`
  - `update(id: number, data: Partial<NewAgentActivity>): AgentActivity | undefined`
- Implement `createAgentActivityRepository(db: DrizzleDatabase)` factory function using `createBaseRepository` as the base
- The `findByWorkflowId` method should join `agentActivity` with `workflowSteps` on `workflowStepId` and filter by `workflowSteps.workflowId`, ordering results by `agentActivity.createdAt` ascending
- The `findByStepId` method should query directly on the `workflowStepId` column, ordered by `createdAt` ascending
- The `createMany` method should handle empty arrays gracefully (return empty array)
- Add `export * from './agent-activity.repository'` to `db/repositories/index.ts`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Repository factory compiles and exports correctly
- [ ] `createAgentActivityRepository` is available from the barrel export
- [ ] All validation commands pass

---

### Step 4: Add IPC Channels, Handlers, and Preload Bindings

**What**: Wire up the full IPC communication layer for agent activity data.
**Why**: Enables the renderer process to fetch persisted agent activity through the typed `window.electronAPI` bridge.
**Confidence**: High

**Files to Create:**

- `electron/ipc/agent-activity.handlers.ts` - IPC handler registration

**Files to Modify:**

- `electron/ipc/channels.ts` - Add `agentActivity` channel group
- `electron/ipc/index.ts` - Create repository instance and register handlers
- `electron/preload.ts` - Add `agentActivity` namespace and IPC bindings
- `types/electron.d.ts` - Add `AgentActivityAPI` interface and type declarations

**Changes:**

- In `channels.ts`: Add `agentActivity` group with channels: `getByStepId` (`agentActivity:getByStepId`), `getByWorkflowId` (`agentActivity:getByWorkflowId`)
- In `agent-activity.handlers.ts`: Create `registerAgentActivityHandlers(agentActivityRepository)` function that registers two `ipcMain.handle` calls for the two read channels
- In `index.ts`: Import `createAgentActivityRepository`, instantiate it with `db`, import and call `registerAgentActivityHandlers` in the database handlers section
- In `types/electron.d.ts`: Add `AgentActivityAPI` interface with `getByStepId(stepId: number): Promise<Array<AgentActivity>>` and `getByWorkflowId(workflowId: number): Promise<Array<AgentActivity>>`; add `agentActivity: AgentActivityAPI` to `ElectronAPI`
- In `preload.ts`: Add `agentActivity` namespace to the `electronAPI` object with `getByStepId` and `getByWorkflowId` methods that call `ipcRenderer.invoke` with the new channel constants

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] IPC channels are registered and accessible through `IpcChannels.agentActivity.*`
- [ ] Preload bindings are type-safe and match the `ElectronAPI` interface
- [ ] Handler registration integrates cleanly in `registerAllHandlers`
- [ ] All validation commands pass

---

### Step 5: Add Query Keys and React Query Hook

**What**: Create query key factory and React Query hook for fetching agent activity data.
**Why**: Provides the client-side data fetching layer that components use to load persisted activity from SQLite via IPC.
**Confidence**: High

**Files to Create:**

- `lib/queries/agent-activity.ts` - Query key factory
- `hooks/queries/use-agent-activity.ts` - React Query hook

**Files to Modify:**

- `lib/queries/index.ts` - Import and merge `agentActivityKeys`
- `hooks/queries/index.ts` - Export new hook and re-export keys
- `hooks/use-electron.ts` - Add `agentActivity` to `useElectronDb()`

**Changes:**

- In `agent-activity.ts` query keys: Use `createQueryKeys('agentActivity', { byStepId: (stepId: number) => [stepId], byWorkflowId: (workflowId: number) => [workflowId] })`
- In `lib/queries/index.ts`: Import `agentActivityKeys`, add to `mergeQueryKeys` call, re-export
- In `use-agent-activity.ts`: Create `useAgentActivityByStepId(stepId: number, options?: { enabled?: boolean })` hook that calls `window.electronAPI.agentActivity.getByStepId()` via `useElectronDb()`, using `agentActivityKeys.byStepId(stepId)` as the query key; include `enabled: isElectron && stepId > 0 && (options?.enabled ?? true)` guard
- In `hooks/queries/index.ts`: Export `useAgentActivityByStepId` and re-export `agentActivityKeys`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `agentActivityKeys` is merged into the global query key factory
- [ ] `useAgentActivityByStepId` hook compiles and is available from barrel exports
- [ ] `useElectronDb()` includes `agentActivity` in its return type
- [ ] All validation commands pass

---

### Step 6: Intercept Stream Events in AgentSdkExecutor and Persist to SQLite

**What**: Modify `processStreamEvent` in `AgentSdkExecutor` to persist each stream event to the `agent_activity` table via the repository.
**Why**: This is the core data capture point -- every tool call, text delta, and thinking event during agent execution gets written to SQLite for later retrieval.
**Confidence**: Medium

**Files to Modify:**

- `electron/services/agent-step/agent-sdk-executor.ts` - Add activity persistence to `processStreamEvent` and `executeQuery`
- `electron/services/agent-step/usage-stats.ts` - Extend `extractUsageStats` to include cache token fields

**Changes:**

- Add an optional `activityRepository` field to `SdkExecutorConfig` (typed as `AgentActivityRepository | undefined`) and a required `stepId` field (typed as `number`)
- In `processStreamEvent`, after each event is processed and emitted to the UI, persist the event to SQLite if `activityRepository` is present:
  - For `content_block_start` with `tool_use` type: Insert a record with `eventType: 'tool_start'`, `toolName`, `toolUseId`, empty `toolInput`, `startedAt: Date.now()`
  - For `content_block_delta` with `text_delta`: Insert a record with `eventType: 'text_delta'`, `textDelta` containing the delta text
  - For `content_block_delta` with `thinking_delta`: Insert a record with `eventType: 'thinking_delta'`, `textDelta` containing the thinking text, `thinkingBlockIndex`
  - For `content_block_delta` with `input_json_delta`: Update the most recent `tool_start` record's `toolInput` with the accumulated parsed JSON
  - For `content_block_stop`: Update the matching `tool_start` record to set `stoppedAt: Date.now()` and compute `durationMs`
- In `executeQuery`, after the query completes and a `result` message is captured:
  - If `activityRepository` is present and `resultMessage` is a success, persist a `usage` event type record with `inputTokens`, `outputTokens`, `estimatedCost`, and cache token fields
- Wrap all persistence calls in try/catch to avoid disrupting the streaming flow if a write fails (log the error via `debugLoggerService`)
- In `usage-stats.ts`: Add `cacheCreationInputTokens` and `cacheReadInputTokens` optional fields to the `UsageStats` interface

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `processStreamEvent` persists events to SQLite without breaking existing streaming behavior
- [ ] Persistence errors are caught and logged, never thrown
- [ ] Usage metadata (including cache tokens) is captured from result messages
- [ ] All validation commands pass

---

### Step 7: Pass Activity Repository Through Step Services

**What**: Update the step services (clarification, refinement, file discovery, planning) to pass the `agentActivityRepository` and `stepId` into the `SdkExecutorConfig`.
**Why**: The AgentSdkExecutor needs the repository reference and step ID to persist events. Each step service already has access to step IDs and can receive the repository via dependency injection.
**Confidence**: Medium

**Files to Modify:**

- `electron/services/clarification-step.service.ts` - Pass activity repository and stepId to executor config
- `electron/services/refinement-step.service.ts` - Same changes
- `electron/services/file-discovery.service.ts` - Same changes
- `electron/ipc/index.ts` - Pass `agentActivityRepository` to step services

**Changes:**

- Add a `setAgentActivityRepository(repo: AgentActivityRepository)` method to each step service, called during `registerAllHandlers` after repository creation
- In each step service's agent execution method, include `activityRepository` and `stepId` in the `SdkExecutorConfig` object
- In `electron/ipc/index.ts`: After creating `agentActivityRepository`, call the setter on each step service singleton to inject the repository reference
- Verify that the planning step service also receives the repository

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] All four step services pass the activity repository to the executor
- [ ] The `stepId` is correctly threaded through to `SdkExecutorConfig`
- [ ] Existing streaming and step execution behavior is preserved
- [ ] All validation commands pass

---

### Step 8: Transform Persisted Activity into StreamToolEvent Format

**What**: Create a utility function that transforms `AgentActivity[]` records from the database into the `StreamToolEvent[]` format consumed by `StepStreamContent`.
**Why**: The UI component `StepStreamContent` expects `StreamToolEvent[]` for rendering tool events. Persisted data must be transformed into this shape for the historical fallback to work seamlessly.
**Confidence**: High

**Files to Create:**

- `lib/utils/agent-activity-transform.ts` - Transform function

**Changes:**

- Create `transformActivityToStreamState(activities: Array<AgentActivity>): { textContent: string; thinkingContent: string; toolEvents: Array<StreamToolEvent>; usageSummary: ActivityUsageSummary | null }` function
- The function processes activities in creation order:
  - `tool_start` events create a new `StreamToolEvent` with `startedAt`, `toolName`, `toolUseId`, and `input`
  - `tool_stop` events find the matching `StreamToolEvent` by `toolUseId` and set `stoppedAt`
  - `tool_update` events find the matching `StreamToolEvent` by `toolUseId` and update `input`
  - `text_delta` events are concatenated into a `textContent` string
  - `thinking_delta` events are concatenated into a `thinkingContent` string
  - `usage` events extract token counts and cost into `ActivityUsageSummary`
- Define `ActivityUsageSummary` interface with `inputTokens`, `outputTokens`, `cacheCreationInputTokens`, `cacheReadInputTokens`, `estimatedCost`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Transform function correctly pairs tool_start/tool_stop events
- [ ] Text and thinking content is properly concatenated
- [ ] Usage summary is extracted from usage-type records
- [ ] All validation commands pass

---

### Step 9: Update WorkflowStreamingPanel for Historical Fallback

**What**: Modify the streaming panel and its tab panels to check whether a step is actively streaming and, if not, load persisted activity from the database and render it using the existing `StepStreamContent` component.
**Why**: This is the user-facing integration that closes the loop -- completed or previously-navigated-away-from steps now reconstruct their full agent activity history from SQLite.
**Confidence**: Medium

**Files to Modify:**

- `components/workflows/detail/workflow-streaming-panel.tsx` - Replace placeholder tab panels with historical fallback logic

**Changes:**

- For the clarification tab: Keep the existing live streaming behavior exactly as-is, with historical fallback when `isStreaming` is false and `toolEvents` is empty
- For refinement, discovery, and planning tabs: Replace the `PLACEHOLDER_LOGS` rendering with a `HistoricalStepContent` component pattern:
  - Accept a `stepId` prop (obtained from workflow steps query)
  - Accept an `isStreaming` boolean prop
  - When `isStreaming` is false and `stepId` is defined: call `useAgentActivityByStepId(stepId)` to fetch persisted data, transform it with `transformActivityToStreamState()`, and pass the result into `StepStreamContent`
  - When `isStreaming` is false and no data is available: show a "No activity recorded" empty state
- Add the usage summary display below tool events when `usageSummary` is non-null
- Remove the `PLACEHOLDER_LOGS` constant entirely

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Clarification tab's live streaming behavior is completely unchanged
- [ ] Completed steps show historical tool call timeline from persisted data
- [ ] In-progress steps continue to show live streaming data
- [ ] Empty state is shown when no activity data exists
- [ ] Usage summary (tokens, cost) is displayed for completed steps
- [ ] Placeholder logs are removed
- [ ] All validation commands pass

---

### Step 10: End-to-End Verification and Manual Testing

**What**: Verify the complete data flow from stream event capture through persistence to UI rendering.
**Why**: Ensures all layers work together correctly and that the existing live streaming behavior is completely unaffected.
**Confidence**: High

**Changes:**

- Run the full lint and typecheck suite
- Verify Electron compilation succeeds
- Run a workflow through the clarification step and verify:
  - Live streaming still works in real-time (unchanged behavior)
  - After completion, navigating away and back shows historical activity from SQLite
  - The tool call timeline matches what was shown during live streaming
  - Usage metrics (tokens, cost) are displayed for completed steps
- Verify the same behavior for refinement, discovery, and planning steps
- Confirm that the `agent_activity` table has data after a workflow run

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck && pnpm electron:compile
```

**Success Criteria:**

- [ ] All lint rules pass
- [ ] All TypeScript types resolve correctly
- [ ] Electron main process compiles without errors
- [ ] Live streaming behavior is unchanged for all step types
- [ ] Historical activity loads correctly from SQLite for completed steps
- [ ] No console errors or unhandled promise rejections

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Electron main process compiles via `pnpm electron:compile`
- [ ] Database migration applies cleanly to a fresh database
- [ ] Live streaming behavior for all four step types is completely unchanged
- [ ] Persisted activity data renders identically to live streaming data
- [ ] No performance degradation during streaming (persistence is non-blocking, errors are caught)

## Notes

- **Persistence is fire-and-forget**: All `agentActivityRepository` writes in `processStreamEvent` are wrapped in try/catch to prevent database errors from disrupting the real-time streaming flow. `better-sqlite3` is synchronous, so writes are fast and safe from within the async stream processing context, but errors should never propagate to the UI.

- **Schema design trade-off**: Storing individual `text_delta` and `thinking_delta` events creates many rows per step execution. An alternative would be to only persist tool events and the final aggregated text. The per-event approach was chosen because it enables full timeline reconstruction and future features like replay. If row count becomes a concern, a future optimization could batch deltas or store only tool events plus final text.

- **Step ID threading**: The `stepId` must flow from the IPC handler layer through the step service and into the `SdkExecutorConfig`. Each step service already has access to the step ID through its session/options objects, so this is a matter of passing it through to the executor config rather than introducing new state.

- **Planning step service**: The planning step may use a different execution pattern than clarification/refinement/discovery. During implementation, verify whether it uses `AgentSdkExecutor` or a different mechanism, and adapt accordingly.

- **Usage metadata**: Usage stats are currently extracted from the final `SDKResultMessage` (in `usage-stats.ts`), not from incremental `message_delta` events. The implementation captures usage from the result message rather than mid-stream deltas. If mid-stream usage events are desired, the SDK event types would need further investigation.

- **Tab-to-step mapping**: The streaming panel tabs (clarification, refinement, discovery, planning) need to be mapped to their corresponding workflow step IDs. This mapping can be derived from the existing workflow steps query by matching on `stepType` field values.
