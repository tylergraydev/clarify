# Clarifying Questions Step Implementation Plan

**Generated**: 2026-02-02T01:38:00Z
**Original Request**: "The clarifying questions step needs to be implemented. This will involve the Claude Agent SDK integration which will use streaming and tools and agents."

**Refined Request**: Implement the clarifying questions step of the planning workflow using the @anthropic-ai/claude-agent-sdk for agent orchestration, enabling real-time streaming of agent activity from the Electron main process to the renderer via SSE-style IPC events.

## Analysis Summary

- Feature request clarified through 5 questions (SDK choice, streaming approach, scope, agent interaction, UI visibility)
- Discovered 23 files across all architectural layers
- Generated 17-step implementation plan with 5 quality gates

## File Discovery Results

**Critical Priority:**
- `electron/ipc/channels.ts` - Add clarification streaming channels (modify)
- `electron/preload.ts` - Add streaming subscription methods (modify)
- `electron/ipc/clarification.handlers.ts` - Agent SDK integration (CREATE)
- `types/streaming.ts` - Streaming event types (CREATE)
- `lib/validations/clarification.ts` - Existing validation schemas (reference)
- `db/repositories/workflow-steps.repository.ts` - Step persistence (reference)

**High Priority:**
- `components/workflows/pipeline-view.tsx` - Streaming state integration (modify)
- `components/workflows/pipeline-step.tsx` - Activity display (modify)
- `hooks/queries/use-steps.ts` - Query hooks (modify)
- `hooks/use-step-streaming.ts` - Streaming subscription hook (CREATE)
- `components/workflows/clarification-streaming.tsx` - Activity display UI (CREATE)

---

## Implementation Plan

## Overview
- **Estimated Duration**: 12-16 hours
- **Complexity**: High
- **Risk Level**: Medium

## Quick Summary
Implement the clarifying questions step of the planning workflow using the @anthropic-ai/claude-agent-sdk for agent orchestration. This involves creating a new IPC handler that initializes a Claude agent with structured tools, streaming intermediate activity (tool calls, reasoning, progress) to the renderer via SSE-style webContents.send() events, and displaying real-time activity in the UI with the existing Streamdown components.

## Prerequisites
- Install `@anthropic-ai/claude-agent-sdk` package
- Anthropic API key configuration in settings or environment
- Understanding of existing IPC patterns in `electron/ipc/*.handlers.ts`
- Understanding of existing TanStack Query patterns in `hooks/queries/`

## Implementation Steps

### Step 1: Install Claude Agent SDK Dependency
- **What**: Add `@anthropic-ai/claude-agent-sdk` to package.json dependencies
- **Why**: Required for agent orchestration with structured tool support
- **Confidence**: High
- **Files**:
  - `package.json` (modify)
- **Changes**:
  - Add `"@anthropic-ai/claude-agent-sdk": "^0.1.0"` to dependencies section
  - Run `pnpm install` to install the package
- **Validation Commands**: `pnpm install && pnpm run typecheck`
- **Success Criteria**: Package installs without errors, TypeScript can import the SDK types

### Step 2: Define Streaming Event Types
- **What**: Create TypeScript types for all streaming events that flow between main and renderer processes
- **Why**: Establishes type-safe contract for SSE-style IPC communication, enabling autocomplete and compile-time safety
- **Confidence**: High
- **Files**:
  - `types/streaming.ts` (create)
- **Changes**:
  - Define `StreamingEventType` enum with values: `'thinking'`, `'toolCall'`, `'toolResult'`, `'progress'`, `'content'`, `'error'`, `'complete'`
  - Define `BaseStreamingEvent` interface with `type`, `timestamp`, `stepId` fields
  - Define specific event interfaces extending base: `ThinkingEvent`, `ToolCallEvent`, `ToolResultEvent`, `ProgressEvent`, `ContentEvent`, `ErrorEvent`, `CompleteEvent`
  - Define `ClarificationStreamingEvent` discriminated union type
  - Define `ClarificationStartInput` interface with `stepId`, `workflowId`, `featureRequest`, `projectContext` fields
  - Define `ClarificationResult` interface with `questions`, `assessment`, `rawOutput` fields
  - Export all types for use in main and renderer processes
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Types compile without errors, can be imported in both electron and renderer code

### Step 3: Add Clarification IPC Channels
- **What**: Define IPC channel constants for clarification streaming operations
- **Why**: Centralizes channel names following existing pattern, prevents typos and enables refactoring
- **Confidence**: High
- **Files**:
  - `electron/ipc/channels.ts` (modify)
  - `electron/preload.ts` (modify)
- **Changes**:
  - Add `clarification` object to `IpcChannels` with channels: `start`, `cancel`, `stream` (for SSE events)
  - Duplicate channel definitions in preload.ts (required due to sandbox restrictions)
  - Follow existing alphabetical ordering within the channels object
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Channels defined consistently in both files, TypeScript infers correct types

### Step 4: Create Clarification Agent Tool Definitions
- **What**: Define the structured tools the Claude agent will use to return clarifying questions
- **Why**: Structured tools enable the agent to return typed JSON data that matches the existing `clarificationQuestionSchema`
- **Confidence**: Medium
- **Files**:
  - `electron/ipc/clarification.tools.ts` (create)
- **Changes**:
  - Define `submitQuestionsToolDefinition` with JSON schema matching `ClarificationQuestion` array structure
  - Define `assessClarityToolDefinition` for agent to assess feature request clarity score (1-5)
  - Define `requestMoreContextToolDefinition` for agent to request additional project context if needed
  - Export tool definitions array for use in agent initialization
  - Include tool descriptions that guide the agent on when/how to use each tool
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Tool definitions compile, JSON schemas match Zod schemas in `lib/validations/clarification.ts`

### Step 5: Create Clarification IPC Handler
- **What**: Implement the main IPC handler that initializes Claude agent and streams events to renderer
- **Why**: Core business logic for clarification step - orchestrates agent execution and database updates
- **Confidence**: Medium
- **Files**:
  - `electron/ipc/clarification.handlers.ts` (create)
- **Changes**:
  - Import Claude Agent SDK, streaming types, tool definitions, and repositories
  - Create `registerClarificationHandlers(workflowStepsRepository, getMainWindow)` function
  - Implement `clarification:start` handler that:
    - Validates input parameters (stepId, workflowId, featureRequest)
    - Updates step status to 'running' via repository
    - Initializes Claude agent with clarification tools and system prompt
    - Streams events to renderer via `webContents.send(IpcChannels.clarification.stream, event)`
    - Handles tool calls by parsing structured output and emitting appropriate events
    - On completion, persists `outputStructured` to step via repository
    - Updates step status to 'completed' or 'failed'
  - Implement `clarification:cancel` handler to abort running agent
  - Store active agent sessions in WeakMap keyed by stepId for cancellation support
  - Include comprehensive error handling with proper cleanup
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Handler compiles, follows existing handler patterns, properly typed

### Step 6: Register Clarification Handlers in IPC Index
- **What**: Wire up clarification handlers in the central IPC registration
- **Why**: Enables handler to be called from renderer, follows existing dependency injection pattern
- **Confidence**: High
- **Files**:
  - `electron/ipc/index.ts` (modify)
- **Changes**:
  - Import `registerClarificationHandlers` from `./clarification.handlers`
  - Add handler registration call after workflow handlers section
  - Pass required dependencies: `workflowStepsRepository`, `getMainWindow`
  - Add comment explaining handler purpose in registration section
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: No circular dependencies, handlers registered at app startup

### Step 7: Add Streaming Subscription Methods to Preload
- **What**: Expose streaming event subscription and unsubscription methods to renderer via context bridge
- **Why**: Renderer needs to subscribe to SSE-style events from main process without direct IPC access
- **Confidence**: High
- **Files**:
  - `electron/preload.ts` (modify)
  - `types/electron.d.ts` (modify)
- **Changes**:
  - Add `clarification` namespace to `ElectronAPI` interface with:
    - `start(input: ClarificationStartInput): Promise<void>` - initiates clarification
    - `cancel(stepId: number): Promise<void>` - cancels running clarification
    - `onStreamEvent(callback: (event: ClarificationStreamingEvent) => void): () => void` - subscribes to events, returns unsubscribe function
  - Implement preload methods using `ipcRenderer.invoke()` for start/cancel
  - Implement `onStreamEvent` using `ipcRenderer.on()` with cleanup function that calls `ipcRenderer.removeListener()`
  - Update `types/electron.d.ts` with matching type definitions
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Type-safe API exposed to renderer, cleanup prevents memory leaks

### Step 8: Create Streaming Subscription Hook
- **What**: Create a React hook that manages streaming event subscription lifecycle and state
- **Why**: Encapsulates subscription/unsubscription logic, integrates with React lifecycle, provides typed state
- **Confidence**: High
- **Files**:
  - `hooks/use-step-streaming.ts` (create)
- **Changes**:
  - Create `useStepStreaming(stepId: number)` hook that returns `{ events, isStreaming, error, startStreaming, cancelStreaming }`
  - Manage events array in local state with reducer pattern for performance
  - Subscribe to streaming events on mount, unsubscribe on unmount or stepId change
  - Track streaming state (idle, streaming, complete, error)
  - Integrate with TanStack Query for step data invalidation on completion
  - Export hook and related types
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Hook compiles, follows existing hooks patterns, properly handles cleanup

### Step 9: Create Clarification Streaming Display Component
- **What**: Build UI component that renders streaming activity (thinking, tool calls, progress) in real-time
- **Why**: Displays intermediate agent activity to users, enhancing transparency and UX
- **Confidence**: Medium
- **Files**:
  - `components/workflows/clarification-streaming.tsx` (create)
- **Changes**:
  - Create `ClarificationStreaming` component accepting `stepId` and `onComplete` props
  - Use `useStepStreaming` hook for event subscription
  - Render event timeline with appropriate visual treatment for each event type:
    - `thinking`: Brain icon with Shimmer animation, streamed text via Streamdown
    - `toolCall`: Wrench/tool icon with tool name badge
    - `toolResult`: Check icon with collapsible result preview
    - `progress`: Progress indicator with percentage/phase text
    - `content`: Standard text rendering
    - `error`: Red alert styling with error message
  - Use existing `Reasoning`, `ReasoningContent`, `ReasoningTrigger` components for collapsible thinking sections
  - Apply `use-stick-to-bottom` for auto-scrolling during stream
  - Include loading state before first event arrives
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Component renders all event types appropriately, auto-scrolls during streaming

### Step 10: Integrate Streaming into Pipeline Step Component
- **What**: Modify PipelineStep to display streaming activity when clarification step is running
- **Why**: Connects new streaming UI to existing pipeline view, shows real-time progress
- **Confidence**: Medium
- **Files**:
  - `components/workflows/pipeline-step.tsx` (modify)
- **Changes**:
  - Import `ClarificationStreaming` component
  - Add `onStartClarification` prop for triggering clarification execution
  - Render `ClarificationStreaming` component when:
    - `stepType === 'clarification'`
    - `status === 'running'`
    - `outputStructured` does not yet have questions
  - Add "Generate Questions" button visible when step is pending/ready
  - Pass `stepId` to streaming component for event subscription
  - Handle transition from streaming to form display when questions are ready
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Streaming displays during execution, transitions to form when complete

### Step 11: Update Pipeline View with Streaming Controls
- **What**: Add clarification execution trigger and state management to PipelineView
- **Why**: Orchestrates when clarification starts, manages loading states, handles completion
- **Confidence**: Medium
- **Files**:
  - `components/workflows/pipeline-view.tsx` (modify)
- **Changes**:
  - Import streaming hook and types
  - Add `handleStartClarification` callback that calls `electronAPI.clarification.start()`
  - Track which step is currently streaming with local state
  - Pass `onStartClarification` handler to relevant PipelineStep
  - Add mutation for starting clarification that updates step status
  - Handle TanStack Query invalidation when streaming completes
  - Add error toast display for streaming failures
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Clicking "Generate Questions" triggers agent, progress displays, questions appear when done

### Step 12: Add Query Key for Streaming State
- **What**: Add query key factory entry for streaming-related queries if needed
- **Why**: Enables proper cache invalidation when streaming completes
- **Confidence**: High
- **Files**:
  - `lib/queries/steps.ts` (modify - if exists, otherwise reference existing pattern)
  - `hooks/queries/use-steps.ts` (modify)
- **Changes**:
  - Review if streaming state needs query caching (likely not - local state is sufficient)
  - Ensure `stepKeys.byWorkflow()` and `stepKeys.detail()` are invalidated on streaming completion
  - Add `useStartClarification` mutation hook that wraps `electronAPI.clarification.start()`
  - Ensure proper error handling and query invalidation in mutation
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Query cache stays in sync with database state after streaming operations

### Step 13: Enhance Workflow Step Repository for Structured Output
- **What**: Ensure repository properly handles `outputStructured` JSON field updates
- **Why**: Structured output must be persisted correctly for questions, assessment, and answers
- **Confidence**: High
- **Files**:
  - `db/repositories/workflow-steps.repository.ts` (modify)
- **Changes**:
  - Verify `update()` method correctly handles `outputStructured` field
  - Add `completeWithStructuredOutput(id, outputText, outputStructured, durationMs)` method for atomic completion
  - Ensure JSON serialization/deserialization works correctly with better-sqlite3
  - Add validation that outputStructured matches expected schema before persistence
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Structured output persists correctly, can be retrieved with proper types

### Step 14: Create Agent System Prompt for Clarification
- **What**: Define the system prompt that guides the clarification agent behavior
- **Why**: System prompt determines agent effectiveness at generating useful clarifying questions
- **Confidence**: Medium
- **Files**:
  - `electron/ipc/clarification.prompts.ts` (create)
- **Changes**:
  - Create `CLARIFICATION_SYSTEM_PROMPT` constant with detailed instructions:
    - Role: Expert requirements analyst for software features
    - Goal: Generate 3-5 clarifying questions that resolve ambiguity
    - Question categories: scope, technical constraints, edge cases, user experience, integration points
    - Output format: Use `submitQuestions` tool with structured JSON
    - Assessment: Use `assessClarity` tool to rate initial request clarity
  - Export prompt for use in handler
  - Include example questions for common scenarios in prompt
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Prompt compiles as valid string, follows agent prompting best practices

### Step 15: Add Settings for API Configuration
- **What**: Ensure Anthropic API key and model configuration are available via settings
- **Why**: Agent SDK requires API key, model selection affects cost/quality tradeoff
- **Confidence**: High
- **Files**:
  - `db/seed/settings.seed.ts` (modify - if exists, otherwise identify correct location)
  - `electron/ipc/clarification.handlers.ts` (modify)
- **Changes**:
  - Add `anthropic.apiKey` setting (stored securely, not displayed in plain text)
  - Add `anthropic.model` setting with default value (e.g., `claude-sonnet-4-20250514`)
  - Add `clarification.maxQuestions` setting with default of 5
  - Update handler to read settings from repository before agent initialization
  - Add validation that API key is configured before starting clarification
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Settings exist in database, handler reads them correctly

### Step 16: Add Error Handling and Recovery
- **What**: Implement comprehensive error handling for streaming failures
- **Why**: Network issues, API errors, and timeouts must be handled gracefully without leaving step in bad state
- **Confidence**: Medium
- **Files**:
  - `electron/ipc/clarification.handlers.ts` (modify)
  - `components/workflows/clarification-streaming.tsx` (modify)
  - `hooks/use-step-streaming.ts` (modify)
- **Changes**:
  - Add try/catch around agent execution with proper cleanup
  - Emit `error` event with user-friendly message on failure
  - Update step status to `failed` with error message on unrecoverable errors
  - Add retry capability - step can return to `pending` for retry
  - Handle API rate limits with exponential backoff indication
  - Display error state in UI with retry button
  - Add timeout handling (configurable via settings)
- **Validation Commands**: `pnpm run lint:fix && pnpm run typecheck`
- **Success Criteria**: Errors display in UI, step can be retried, no orphaned states

### Step 17: Integration Testing via Manual Workflow
- **What**: Test complete clarification flow end-to-end
- **Why**: Validates all components work together correctly
- **Confidence**: High
- **Files**:
  - No file changes - manual testing
- **Changes**:
  - Start Electron dev mode: `pnpm electron:dev`
  - Create new workflow with feature request
  - Start workflow to create planning steps
  - Verify clarification step shows "Generate Questions" button
  - Click button, verify streaming activity displays
  - Verify questions appear when agent completes
  - Verify questions persist to database (check SQLite)
  - Submit answers via ClarificationForm
  - Verify answers persist to outputStructured
- **Validation Commands**: `pnpm electron:dev`
- **Success Criteria**: Full flow works: start → stream → questions → answers → complete

## Quality Gates

1. **After Step 2**: Streaming types compile, can be used in both main and renderer
2. **After Step 6**: Electron main process can initialize agent (test with console.log)
3. **After Step 8**: React hook can subscribe to mock events (test with fake events)
4. **After Step 11**: UI displays streaming activity (test with stubbed handler)
5. **After Step 17**: Full end-to-end flow works with real Claude agent

## Notes

- **API Key Security**: The Anthropic API key should be stored securely, not in plain text in the database. Consider using Electron's safeStorage API or electron-store encryption.

- **Rate Limiting**: The Claude API has rate limits. Consider adding request queuing if multiple workflows might run simultaneously.

- **Streaming Cleanup**: Critical to properly clean up IPC listeners on component unmount to prevent memory leaks and duplicate event handling.

- **Fallback Behavior**: If streaming fails mid-way, the step should fail gracefully with the partial output preserved for debugging.

- **Model Selection**: Using claude-sonnet-4 balances quality and cost for clarification. Consider allowing user override via settings.

- **Testing Strategy**: Due to agent non-determinism, focus on testing:
  - IPC event flow (can use mock events)
  - UI state transitions
  - Database persistence
  - Error handling paths

- **Future Extensibility**: The streaming infrastructure built here (types, hooks, IPC patterns) should be reusable for refinement, discovery, and planning steps.
