# Implementation Plan: Refinement Step for Planning Workflow Pipeline

**Generated**: 2026-02-04
**Original Request**: Implement the refinement step for the planning workflow pipeline
**Refined Request**: Step 2 of planning workflow (after clarification, before discovery) with streaming UI, Claude Code CLI integration, inline editing, and custom agent support

## Overview

**Estimated Duration**: 4-5 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

Implement the refinement step as Step 2 of the planning workflow pipeline (after clarification, before discovery). The refinement step takes the original feature request combined with any clarification Q&A pairs as input, uses Claude Code CLI with codebase exploration capability to produce a refined prose narrative, and stores the result in the workflow step's `outputText` field. This implementation follows the exact architectural patterns established by the clarification step, including service classes, IPC handlers, streaming UI components, Zod validation schemas, and custom agent selection support.

## Prerequisites

- [ ] Clarification step implementation is complete and functional
- [ ] Discovery step implementation is complete and functional
- [ ] Claude Agent SDK is properly configured and operational
- [ ] Understanding of existing patterns in `clarification-step.service.ts` (1666 lines)

## Analysis Summary

**File Discovery Results:**
- Files to Create: 12
- Files to Modify: 9
- Reference Files Examined: 6

## Implementation Steps

### Step 1: Create Zod Validation Schemas for Refinement

**What**: Create comprehensive Zod schemas in `lib/validations/refinement.ts` for refinement input, output, service options, streaming messages, and regeneration request types.
**Why**: Type-safe validation ensures data integrity between UI, IPC, and service layers. The schemas provide runtime validation and TypeScript type inference.
**Confidence**: High

**Files to Create:**
- `lib/validations/refinement.ts` - Validation schemas for refinement step

**Changes:**
- Define `refinementServiceOptionsSchema` for service initialization (workflowId, stepId, agentId, repositoryPath, featureRequest, clarificationContext, timeoutSeconds)
- Define `refinementAgentConfigSchema` matching `ClarificationAgentConfig` pattern
- Define `refinementOutcomeSchema` as discriminated union (SUCCESS, ERROR, TIMEOUT, CANCELLED)
- Define `refinementOutcomeWithPauseSchema` extending outcome with pause/retry information
- Define `refinementStreamMessageSchema` discriminated union for all streaming event types (phase_change, text_delta, thinking_delta, thinking_start, tool_start, tool_stop, tool_update, extended_thinking_heartbeat)
- Define `refinementRegenerateInputSchema` for regeneration with guidance feature
- Define `refinementUsageStatsSchema` for SDK usage tracking
- Define `refinementServicePhaseSchema` as enum (idle, loading_agent, executing, executing_extended_thinking, processing_response, complete, error, cancelled, timeout)
- Define `refinementServiceStateSchema` for current service state
- Export all schemas and inferred types
- Generate JSON schema for SDK structured output (refinedText string field)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All Zod schemas compile without TypeScript errors
- [ ] Schemas follow exact patterns from `lib/validations/clarification.ts`
- [ ] JSON schema generation works for SDK structured output
- [ ] All lint and typecheck validations pass

---

### Step 2: Add Refinement Agent to Built-in Agents Seed

**What**: Add a `refinement-agent` definition to the built-in agents in `db/seed/agents.seed.ts` with appropriate system prompt and tool configuration.
**Why**: The refinement agent needs a default bundled configuration that users can use out-of-the-box or customize. Following the pattern of clarification-agent ensures consistency.
**Confidence**: High

**Files to Modify:**
- `db/seed/agents.seed.ts` - Add refinement-agent definition

**Changes:**
- Add `refinement-agent` to `BUILT_IN_AGENTS` array with type `planning`
- Set color to `orange` to distinguish from clarification (yellow) and discovery (cyan)
- Create comprehensive system prompt that instructs the agent to:
  - Analyze the feature request combined with clarification context
  - Explore relevant codebase areas to understand existing patterns
  - Synthesize a comprehensive refinement document
  - Autonomously decide organizational structure based on request complexity
  - Output a prose narrative suitable for storage in `outputText`
- Configure tools: `Read`, `Glob`, `Grep` (same as clarification-agent for codebase exploration)
- Set appropriate displayName and description

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Agent definition follows the `BuiltInAgentDefinition` interface
- [ ] System prompt provides clear instructions for refinement output
- [ ] Tools are appropriately scoped for codebase exploration
- [ ] All lint and typecheck validations pass

---

### Step 3: Create RefinementStepService

**What**: Create the core service class in `electron/services/refinement-step.service.ts` that manages Claude Code CLI spawning, streaming event handling, and result persistence.
**Why**: The service encapsulates all business logic for refinement execution, following the proven patterns from `clarificationStepService`.
**Confidence**: High

**Files to Create:**
- `electron/services/refinement-step.service.ts` - Core refinement service

**Changes:**
- Create `RefinementStepService` class following `ClarificationStepService` patterns
- Implement `startRefinement(options, onStreamMessage)` method:
  - Load agent configuration from database
  - Build refinement prompt combining feature request with clarification context
  - Execute Claude Agent SDK query with structured output
  - Process streaming events and emit to callback
  - Handle timeout with configurable duration (default 180 seconds for longer exploration)
  - Return outcome with pause information and usage stats
- Implement `cancelRefinement(sessionId)` method
- Implement `retryRefinement(options, previousSessionId)` with exponential backoff
- Implement `loadAgentConfig(agentId)` method
- Implement `getState(sessionId)` method
- Implement `getRetryCount(sessionId)` and `isRetryLimitReached(sessionId)` methods
- Implement `getWorkflow(workflowId)` and `isPauseRequested(workflowId)` methods
- Add private methods for streaming event processing, phase emission, backoff calculation
- Add audit logging for all refinement events
- Export singleton instance `refinementStepService`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Service class structure mirrors `ClarificationStepService`
- [ ] All SDK integration patterns are correctly implemented
- [ ] Streaming event handling covers all message types
- [ ] Timeout, cancellation, and retry logic work correctly
- [ ] Audit logging captures all relevant events
- [ ] All lint and typecheck validations pass

---

### Step 4: Add IPC Channel Definitions

**What**: Add refinement IPC channel definitions to `electron/ipc/channels.ts` following the established naming pattern.
**Why**: Centralized channel definitions ensure type-safe IPC communication between main and renderer processes.
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add refinement channels
- `electron/preload.ts` - Duplicate channel definitions (required for sandboxed preload)

**Changes:**
- Add `refinement` object to `IpcChannels` in `channels.ts` with channels:
  - `start: 'refinement:start'`
  - `cancel: 'refinement:cancel'`
  - `getState: 'refinement:getState'`
  - `getResult: 'refinement:getResult'`
  - `retry: 'refinement:retry'`
  - `regenerate: 'refinement:regenerate'`
  - `stream: 'refinement:stream'`
- Duplicate the same channel definitions in `preload.ts` IpcChannels object

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Channel names follow `{domain}:{action}` pattern
- [ ] Channels are defined in both `channels.ts` and `preload.ts`
- [ ] Channel definitions are in alphabetical order within the refinement object
- [ ] All lint and typecheck validations pass

---

### Step 5: Create Refinement IPC Handlers

**What**: Create IPC handlers in `electron/ipc/refinement.handlers.ts` that bridge renderer requests to the RefinementStepService.
**Why**: IPC handlers provide the communication layer between the UI and the service, handling input validation and error propagation.
**Confidence**: High

**Files to Create:**
- `electron/ipc/refinement.handlers.ts` - IPC handler implementations

**Files to Modify:**
- `electron/ipc/index.ts` - Register refinement handlers

**Changes:**
- Create `registerRefinementHandlers(workflowStepsRepository, getMainWindow)` function
- Implement handler for `refinement:start`:
  - Validate input (workflowId, stepId, featureRequest, clarificationContext, repositoryPath)
  - Look up agentId from step or use default
  - Create stream message handler to forward events to renderer
  - Call `refinementStepService.startRefinement()`
  - Return outcome with pause info
- Implement handler for `refinement:cancel`:
  - Validate sessionId
  - Call `refinementStepService.cancelRefinement()`
- Implement handler for `refinement:getState`:
  - Validate sessionId
  - Return current service state
- Implement handler for `refinement:retry`:
  - Cancel existing session
  - Validate input
  - Call `refinementStepService.retryRefinement()`
- Implement handler for `refinement:regenerate`:
  - Accept user guidance text
  - Call service with regeneration mode
- Register handlers in `electron/ipc/index.ts`:
  - Import `registerRefinementHandlers`
  - Call after clarification handlers registration

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Handler patterns match `clarification.handlers.ts`
- [ ] All handlers have proper input validation
- [ ] Stream message forwarding works correctly
- [ ] Handlers are registered in the correct order in index.ts
- [ ] All lint and typecheck validations pass

---

### Step 6: Update Preload Script and Type Definitions

**What**: Expose refinement IPC methods on the `window.electronAPI` bridge and add corresponding TypeScript type definitions.
**Why**: The preload script and type definitions enable type-safe access to refinement APIs from the renderer process.
**Confidence**: High

**Files to Modify:**
- `electron/preload.ts` - Add refinement API methods
- `types/electron.d.ts` - Add type definitions

**Changes:**
- In `preload.ts`:
  - Add `refinement` IIFE pattern (matching clarification pattern) with:
    - Private state for stream callbacks
    - `ipcRenderer.on` listener for `refinement:stream` events
    - `start(input)` method returning Promise
    - `cancel(sessionId)` method
    - `getState(sessionId)` method
    - `retry(sessionId, input)` method
    - `regenerate(input)` method
    - `onStreamMessage(callback)` method returning unsubscribe function
- In `types/electron.d.ts`:
  - Add `RefinementAgentConfig` interface
  - Add `RefinementOutcome` discriminated union type
  - Add `RefinementOutcomeWithPause` type
  - Add `RefinementServicePhase` type
  - Add `RefinementServiceState` interface
  - Add `RefinementStartInput` interface
  - Add `RefinementRegenerateInput` interface
  - Add `RefinementStreamMessage` discriminated union
  - Add `RefinementUsageStats` interface
  - Add `RefinementAPI` interface
  - Add `refinement: RefinementAPI` to `ElectronAPI` interface

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] API methods follow exact patterns from clarification
- [ ] Stream callback pattern with IIFE for private state
- [ ] All TypeScript types are properly defined
- [ ] Types match the Zod schemas from Step 1
- [ ] All lint and typecheck validations pass

---

### Step 7: Create Query Key Factory and Hooks

**What**: Create TanStack Query infrastructure for refinement including query key factory and React hooks.
**Why**: Query keys enable proper cache management, and hooks provide the React interface for refinement operations.
**Confidence**: High

**Files to Create:**
- `lib/queries/refinement.ts` - Query key factory
- `hooks/queries/use-refinement.ts` - Query and mutation hooks
- `hooks/queries/use-default-refinement-agent.ts` - Default agent hook

**Files to Modify:**
- `lib/queries/index.ts` - Export refinement keys

**Changes:**
- In `lib/queries/refinement.ts`:
  - Create `refinementKeys` using `createQueryKeys`
  - Define keys for: `byStep`, `byWorkflow`, `detail`
- In `hooks/queries/use-refinement.ts`:
  - Create `useStartRefinement` mutation hook
  - Create `useCancelRefinement` mutation hook
  - Create `useRetryRefinement` mutation hook
  - Create `useRegenerateRefinement` mutation hook
- In `hooks/queries/use-default-refinement-agent.ts`:
  - Create `useDefaultRefinementAgent` hook (pattern from use-default-clarification-agent.ts)
  - Create `useSetDefaultRefinementAgent` mutation
- In `lib/queries/index.ts`:
  - Import and merge `refinementKeys`
  - Export `refinementKeys`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Query keys follow project patterns
- [ ] Hooks use `useElectronDb` pattern
- [ ] Mutations include proper cache invalidation
- [ ] Default agent hook follows clarification pattern
- [ ] All lint and typecheck validations pass

---

### Step 8: Create Zustand Store for Refinement UI State

**What**: Create a Zustand store in `lib/stores/refinement-store.ts` for managing refinement UI state during streaming.
**Why**: UI state needs to be managed separately from server state for real-time streaming updates and local interactions.
**Confidence**: High

**Files to Create:**
- `lib/stores/refinement-store.ts` - Zustand store for refinement UI state

**Changes:**
- Define store interface with:
  - `sessionId: string | null`
  - `phase: RefinementServicePhase`
  - `isStreaming: boolean`
  - `text: string`
  - `thinking: Array<string>`
  - `activeTools: Array<ActiveTool>`
  - `toolHistory: Array<ActiveTool>`
  - `error: string | null`
  - `agentName: string`
  - `extendedThinkingElapsedMs: number | undefined`
  - `maxThinkingTokens: number | null`
  - `outcome: RefinementOutcome | null`
- Define actions: `startSession`, `updatePhase`, `appendText`, `appendThinking`, `addTool`, `removeTool`, `setError`, `reset`
- Create store with `create` from zustand
- Export `useRefinementStore` hook

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Store follows project zustand patterns
- [ ] All state fields are properly typed
- [ ] Actions handle all streaming event types
- [ ] Reset action clears all state
- [ ] All lint and typecheck validations pass

---

### Step 9: Create RefinementStreaming Component

**What**: Create the streaming display component in `components/workflows/refinement-streaming.tsx` that shows real-time agent output.
**Why**: The streaming component provides visual feedback during refinement execution, showing thinking blocks, text deltas, and tool call visualization.
**Confidence**: High

**Files to Create:**
- `components/workflows/refinement-streaming.tsx` - Streaming UI component

**Changes:**
- Create `RefinementStreaming` component following `ClarificationStreaming` patterns
- Define props interface matching streaming component needs:
  - activeTools, agentName, error, extendedThinkingElapsedMs, isRetrying, isStreaming
  - maxThinkingTokens, onCancel, onRefinementError, outcome, phase, retryCount, sessionId
  - text, thinking, toolHistory
- Create CVA variants for layout (primary/summary) and status (default/running/error/success)
- Implement sections:
  - Header with agent name, phase label, and cancel button
  - Extended thinking banner (when applicable)
  - Active tools section with tool indicators
  - Tool history collapsible section
  - Thinking blocks collapsible section
  - Main streaming content with StickToBottom scrolling
  - Error state with retry/skip options
  - Session info footer
- Reuse `ToolIndicator` helper component pattern
- Use `memo` for performance optimization

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Component structure mirrors `ClarificationStreaming`
- [ ] All streaming states are properly rendered
- [ ] Extended thinking mode displays correctly
- [ ] Tool visualization works for all tool types
- [ ] Error handling with retry/skip options
- [ ] All lint and typecheck validations pass

---

### Step 10: Create RefinementEditor Component

**What**: Create the editor component in `components/workflows/refinement-editor.tsx` for inline editing with save/revert and regeneration features.
**Why**: The editor allows users to review and modify the refined output, with character count warnings and regeneration capability.
**Confidence**: High

**Files to Create:**
- `components/workflows/refinement-editor.tsx` - Editor component with regeneration

**Changes:**
- Create `RefinementEditor` component with props:
  - `initialText: string`
  - `onSave: (text: string) => void`
  - `onRevert: () => void`
  - `onRegenerate: (guidance: string) => void`
  - `isRegenerating: boolean`
  - `isDisabled: boolean`
- Implement features:
  - Plain textarea for editing with proper sizing
  - Character count display with soft warning threshold (10K characters)
  - Save button (enabled when text differs from initial)
  - Revert button (enabled when text differs from initial)
  - Regenerate section with guidance textarea
  - "Regenerate with guidance" button
- Style with project conventions (rounded-2xl, border-border/60, etc.)
- Handle loading states during save and regenerate

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Textarea properly displays and edits refinement text
- [ ] Character count shows with warning at 10K+ characters
- [ ] Save/revert functionality works correctly
- [ ] Regeneration with guidance input works
- [ ] Loading states display appropriately
- [ ] All lint and typecheck validations pass

---

### Step 11: Create RefinementWorkspace Component

**What**: Create the main workspace component in `components/workflows/refinement-workspace.tsx` that combines streaming, editing, and controls.
**Why**: The workspace orchestrates the refinement UI, managing the flow between streaming execution and editing modes.
**Confidence**: High

**Files to Create:**
- `components/workflows/refinement-workspace.tsx` - Main workspace component

**Changes:**
- Create `RefinementWorkspace` component following `ClarificationWorkspace` patterns
- Define props interface:
  - `featureRequest: string | null`
  - `clarificationContext: string | null` (formatted Q&A pairs)
  - `isStreaming: boolean`
  - `isSubmitting: boolean`
  - `phase: RefinementServicePhase`
  - `refinedText: string | null`
  - `streamingProps: RefinementStreamingProps`
  - `onSave: (text: string) => void`
  - `onRevert: () => void`
  - `onRegenerate: (guidance: string) => void`
  - `onSkip: () => void`
- Implement layout:
  - Header card with title, phase badge, and elapsed time
  - Feature request collapsible (showing original request + clarification context)
  - Split view grid with responsive column layout
  - Left: RefinementStreaming component
  - Right: RefinementEditor (when text available) or waiting state
- Handle layout transitions based on streaming state

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Layout follows ClarificationWorkspace patterns
- [ ] Header displays phase and progress correctly
- [ ] Split view transitions between streaming/editing modes
- [ ] Feature request with clarification context displays properly
- [ ] All callback props are wired correctly
- [ ] All lint and typecheck validations pass

---

### Step 12: Integrate Refinement Step into PipelineView

**What**: Update the PipelineView component to integrate the refinement step with proper flow control and state management.
**Why**: PipelineView orchestrates the workflow pipeline and must handle refinement step execution, respecting pause behavior settings.
**Confidence**: Medium

**Files to Modify:**
- `components/workflows/pipeline-view.tsx` - Integrate refinement workspace

**Changes:**
- Add refinement session state interface and initial state (similar to clarification)
- Add `useDefaultRefinementAgent` hook import
- Find active refinement step using same pattern as clarification/discovery
- Get refinement agent details from step.agentId or default
- Build clarification context by formatting Q&A pairs from completed clarification step
- Implement refinement streaming subscription effect:
  - Subscribe to `window.electronAPI.refinement.onStreamMessage`
  - Update state based on message types
  - Start refinement when step becomes active and not already started
  - Handle auto-start for continuous mode, manual start for auto-pause mode
- Implement refinement handlers:
  - `handleSaveRefinement` - save edited text to step.outputText
  - `handleRevertRefinement` - revert to original refined text
  - `handleRegenerateRefinement` - trigger regeneration with guidance
  - `handleSkipRefinement` - skip refinement step
  - `handleRefinementComplete` - transition step to completed
- Add `RefinementWorkspace` to render conditionally when refinement step is active
- Wire up the `refinementUpdatedAt` timestamp mechanism:
  - When refinement outputText is edited, update step's `updatedAt`
  - Discovery step should check if refinementUpdatedAt > discoveryStartedAt to show stale indicator
- Update `visibleSteps` to exclude active refinement step from accordion

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Refinement workspace renders when refinement step is active
- [ ] Streaming events update UI in real-time
- [ ] Pause behavior settings are respected (continuous vs auto-pause)
- [ ] Save/revert/regenerate handlers work correctly
- [ ] Refinement edit marks discovery as stale
- [ ] Step transitions work correctly
- [ ] All lint and typecheck validations pass

---

### Step 13: Implement Error Handling and Retry Logic

**What**: Ensure comprehensive error handling with automatic retry logic for transient errors across service, handlers, and UI.
**Why**: Robust error handling improves reliability and user experience when encountering network issues or service disruptions.
**Confidence**: High

**Files to Modify:**
- `electron/services/refinement-step.service.ts` - Error classification and retry
- `components/workflows/refinement-streaming.tsx` - Error UI with retry
- `components/workflows/refinement-workspace.tsx` - Skip fallback

**Changes:**
- In refinement-step.service.ts:
  - Implement `isTransientError(error)` method with patterns: timeout, network, connection, rate limit, 502/503
  - Implement exponential backoff: 1s, 2s, 4s (max 3 attempts)
  - Return `skipFallbackAvailable: true` in error outcomes
- In refinement-streaming.tsx:
  - Display error state with error message
  - Show retry button when `canRetry` (retryCount < maxRetries)
  - Show skip button when `skipFallbackAvailable`
  - Display "Maximum retry attempts reached" when limit hit
- In refinement-workspace.tsx:
  - Wire `onRetry` callback to retry mutation
  - Wire `onSkip` to skip handler (proceeds to discovery with original feature request)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Transient errors trigger automatic retry with backoff
- [ ] Retry count is tracked and limited to 3 attempts
- [ ] UI shows retry/skip options appropriately
- [ ] Skip proceeds to discovery with original feature request as fallback
- [ ] Non-transient errors display with skip option
- [ ] All lint and typecheck validations pass

---

### Step 14: Wire Up Stale Discovery Indicator

**What**: Implement the mechanism where editing refinement output marks the discovery step as stale.
**Why**: When refinement output changes, previously discovered files may no longer be relevant, so users should be notified.
**Confidence**: High

**Files to Modify:**
- `components/workflows/pipeline-view.tsx` - Track refinement timestamp
- `components/workflows/discovery-workspace.tsx` - Show stale indicator

**Changes:**
- In pipeline-view.tsx:
  - Pass `refinementUpdatedAt` timestamp to DiscoveryWorkspace
  - Update refinement step's `updatedAt` when outputText is edited
- In discovery-workspace.tsx:
  - Add `refinementUpdatedAt` prop
  - Compare with discovery step's `startedAt` or completion timestamp
  - Display stale indicator banner when refinement is newer than discovery
  - Provide "Re-run discovery" action in stale indicator

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Editing refinement updates the step's timestamp
- [ ] Discovery workspace receives refinement timestamp
- [ ] Stale indicator appears when refinement is newer
- [ ] Re-run discovery action is available
- [ ] All lint and typecheck validations pass

---

### Step 15: Add Custom Agent Selection Support

**What**: Enable users to select custom refinement agents instead of the built-in default.
**Why**: Users may want to customize the refinement process with different prompts or tool configurations.
**Confidence**: Medium

**Files to Modify:**
- `components/workflows/pipeline-view.tsx` - Agent selection for refinement
- `hooks/queries/use-refinement.ts` - Include agentId in start options

**Changes:**
- Use the existing pattern from clarification:
  - Step has an `agentId` field that can be set during workflow creation
  - If step.agentId is null, fall back to `defaultRefinementAgentId` setting
  - If setting is also null, fall back to finding agent by name `refinement-agent`
- Ensure refinement start options include the resolved agentId
- The agent selection UI (in workflow creation) already handles assigning agents to steps

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Custom agent can be selected during workflow creation
- [ ] Step-level agentId is used when set
- [ ] Fallback to default setting works
- [ ] Fallback to built-in agent by name works
- [ ] All lint and typecheck validations pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Refinement step integrates seamlessly into pipeline workflow
- [ ] Streaming UI displays all event types correctly
- [ ] Error handling with retry/skip works as expected
- [ ] Pause behavior settings are respected
- [ ] Stale discovery indicator functions correctly
- [ ] Custom agent selection works
- [ ] Manual testing of complete refinement flow passes

## Notes

**Architectural Considerations:**
- The refinement step produces prose output (stored in `outputText`), not structured data (unlike clarification which uses `outputStructured` for questions)
- The agent autonomously determines output structure based on feature complexity - this is enforced through the system prompt rather than SDK structured output constraints
- Extended thinking mode may be beneficial for complex feature requests requiring deep reasoning

**Key Patterns to Follow:**
- Service class pattern from `clarification-step.service.ts` (1666 lines)
- IPC handler pattern from `clarification.handlers.ts` (420 lines)
- Streaming component pattern from `clarification-streaming.tsx` (1015 lines)
- Workspace component pattern from `clarification-workspace.tsx` (276 lines)
- Preload IIFE pattern for stream callbacks

**Risk Mitigation:**
- Start with service layer and validation schemas to establish type contracts early
- Implement IPC layer before UI to enable testing via Electron DevTools
- Add comprehensive audit logging for debugging production issues
- Ensure timeout is sufficient for codebase exploration (180s recommended vs 120s for clarification)

**Dependencies Between Steps:**
- Steps 1-2 (schemas + agent seed) have no dependencies
- Steps 3-6 (service + IPC + preload) must be done in sequence
- Steps 7-8 (query hooks + store) can be done in parallel
- Steps 9-11 (UI components) depend on Steps 1-8
- Steps 12-15 (integration) depend on all previous steps
