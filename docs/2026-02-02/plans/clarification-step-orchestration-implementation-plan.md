# Implementation Plan: Clarification Step Orchestration Layer

Generated: 2026-02-02
Original Request: Implement the orchestration layer for the clarification step of the planning workflow
Refined Request: Implement the orchestration layer for the clarification step of the planning workflow, which represents the first integration of the Claude Agent SDK into actual workflow execution by connecting the existing AgentStreamService infrastructure with the clarification UI components...

## Analysis Summary

- Feature request refined with project context
- Discovered 28 files across 12 directories
- Generated 12-step implementation plan

## File Discovery Results

### New Files to Create:
- `electron/services/clarification-step.service.ts` - Core orchestration service
- `electron/ipc/clarification.ipc.ts` - IPC handlers for clarification channels
- `components/workflows/clarification-streaming.tsx` - Live streaming display component

### Files to Modify:
- `electron/ipc/channels.ts` - Add clarification IPC channel definitions
- `electron/preload.ts` - Add clarification API methods
- `electron/ipc/index.ts` - Register clarification handlers
- `types/electron.d.ts` - Add clarification types to ElectronAPI
- `lib/validations/clarification.ts` - Add service options and outcome types
- `components/workflows/pipeline-view.tsx` - Integrate streaming component
- `components/workflows/pipeline-step.tsx` - Handle streaming state display
- `components/workflows/create-workflow-dialog.tsx` - Verify/enhance skip toggle

---

## Overview

**Estimated Duration**: 4-5 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

This plan implements the orchestration layer for the clarification step of the planning workflow, representing the first production integration of the Claude Agent SDK into workflow execution. The implementation creates a ClarificationStepService that orchestrates the complete clarification flow: invoking the clarification-agent subagent, streaming real-time output to the renderer, intercepting tool calls to extract structured questions, managing bidirectional user interaction for question editing and answer submission, and handling workflow state machine transitions with comprehensive error handling and audit trail capture.

## Prerequisites

- [ ] Verify `@anthropic-ai/claude-agent-sdk` is properly installed and configured
- [ ] Confirm existing AgentStreamService and useAgentStream patterns are stable
- [ ] Ensure audit logging infrastructure is operational
- [ ] Review clarification-agent.md subagent definition for expected output format

## Implementation Steps

### Step 1: Extend Clarification Validation Types

**What**: Add service-level types for clarification orchestration options, outcomes, and state management to the existing validation file.
**Why**: These types define the contract between the service and UI layers, enabling type-safe communication and clear outcome handling.
**Confidence**: High
**Specialist Agent**: `tanstack-form`

**Files to Modify:**
- `lib/validations/clarification.ts` - Add service options and outcome type definitions

**Changes:**
- Add `ClarificationServiceOptions` interface with workflowId, stepId, repositoryPath, featureRequest, and timeoutSeconds fields
- Add `ClarificationOutcome` discriminated union type with variants: `SKIP_CLARIFICATION` (score >= 4), `QUESTIONS_FOR_USER`, `TIMEOUT`, `ERROR`, and `CANCELLED`
- Add `ClarificationServiceState` type for tracking exploration, question_generation, waiting_for_answers, and refinement phases
- Add `ClarificationRefinementInput` type for passing user answers back to the agent
- Export all new types

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All new types are properly exported
- [ ] Types match the clarification-agent output format (SKIP_CLARIFICATION, QUESTIONS_FOR_USER)
- [ ] All validation commands pass

---

### Step 2: Create ClarificationStepService Core

**What**: Create the core ClarificationStepService class in electron/services that orchestrates the clarification workflow lifecycle.
**Why**: This service encapsulates all clarification logic, including agent invocation, output parsing, question extraction, and state management, providing a clean API for IPC handlers.
**Confidence**: High
**Specialist Agent**: `claude-agent-sdk`

**Files to Create:**
- `electron/services/clarification-step.service.ts` - Core orchestration service

**Changes:**
- Create ClarificationStepService class following the singleton pattern like AgentStreamService
- Implement `startClarification(options)` method that:
  - Creates an AgentStreamService session with clarification-agent prompt
  - Sets up MessagePort listeners for streaming
  - Configures timeout handling with AbortController
  - Returns a session identifier for tracking
- Implement `parseAgentOutput(text)` method that:
  - Detects SKIP_CLARIFICATION with regex pattern
  - Extracts JSON questions from QUESTIONS_FOR_USER blocks
  - Parses clarity assessment score and reason
- Implement `submitAnswers(sessionId, answers)` method for user response handling
- Implement `submitEdits(sessionId, editedQuestions)` method for question modification
- Implement `skipClarification(sessionId)` method for user-initiated skip
- Implement `cancelClarification(sessionId)` method for cancellation
- Implement timeout handling that gracefully degrades to skip with audit logging
- Implement internal state machine tracking (exploring -> question_generation -> waiting -> refinement)
- Export singleton instance

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Service follows existing AgentStreamService patterns
- [ ] Timeout handling implemented with configurable duration
- [ ] Output parsing correctly identifies both SKIP_CLARIFICATION and QUESTIONS_FOR_USER outcomes
- [ ] All validation commands pass

---

### Step 3: Add Clarification IPC Channel Definitions

**What**: Define new IPC channel constants for clarification operations in both channels.ts and preload.ts.
**Why**: Following the existing pattern, IPC channels must be defined in both locations to enable communication between main and renderer processes.
**Confidence**: High
**Specialist Agent**: `ipc-handler`

**Files to Modify:**
- `electron/ipc/channels.ts` - Add clarification channel definitions
- `electron/preload.ts` - Duplicate clarification channel definitions

**Changes:**
- Add `clarification` domain to IpcChannels object with:
  - `start: 'clarification:start'`
  - `submitAnswers: 'clarification:submitAnswers'`
  - `submitEdits: 'clarification:submitEdits'`
  - `skip: 'clarification:skip'`
  - `retry: 'clarification:retry'`
  - `getState: 'clarification:getState'`
- Ensure alphabetical ordering within the clarification object
- Duplicate the same channels in preload.ts IpcChannels constant

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Channel names follow `{domain}:{action}` pattern
- [ ] Both files have identical channel definitions
- [ ] All validation commands pass

---

### Step 4: Create Clarification IPC Handlers

**What**: Implement IPC handlers that bridge renderer requests to the ClarificationStepService.
**Why**: Handlers validate input, delegate to the service, and return typed responses following the established pattern.
**Confidence**: High
**Specialist Agent**: `ipc-handler`

**Files to Create:**
- `electron/ipc/clarification.ipc.ts` - IPC handlers for clarification channels

**Changes:**
- Create `registerClarificationHandlers(getMainWindow)` function
- Implement handler for `clarification:start`:
  - Validate workflowId, stepId, repositoryPath, featureRequest parameters
  - Call clarificationStepService.startClarification()
  - Return session identifier
- Implement handler for `clarification:submitAnswers`:
  - Validate sessionId and answers parameters
  - Call clarificationStepService.submitAnswers()
  - Return updated state
- Implement handler for `clarification:submitEdits`:
  - Validate sessionId and editedQuestions parameters
  - Call clarificationStepService.submitEdits()
- Implement handler for `clarification:skip`:
  - Validate sessionId
  - Call clarificationStepService.skipClarification()
- Implement handler for `clarification:retry`:
  - Validate sessionId
  - Call clarificationStepService.startClarification() with retry flag
- Implement handler for `clarification:getState`:
  - Return current service state for a session
- Add comprehensive error handling with try/catch and console logging

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Handlers follow the pattern in agent-stream.handlers.ts
- [ ] All parameters are validated before service calls
- [ ] Error handling matches existing handler patterns
- [ ] All validation commands pass

---

### Step 5: Register Clarification Handlers and Update Types

**What**: Register the new handlers in the central handler registration and update TypeScript types for the ElectronAPI.
**Why**: Handlers must be registered at startup and types must be declared for the renderer to access the API.
**Confidence**: High
**Specialist Agent**: `ipc-handler`

**Files to Modify:**
- `electron/ipc/index.ts` - Register clarification handlers
- `electron/preload.ts` - Add clarification API methods
- `types/electron.d.ts` - Add clarification types to ElectronAPI

**Changes:**
- In index.ts:
  - Import `registerClarificationHandlers` from `./clarification.ipc`
  - Call `registerClarificationHandlers(getMainWindow)` in the window-dependent section (after agentStream)
- In preload.ts:
  - Add `clarification` object to electronAPI with methods:
    - `start(options)` calling ipcRenderer.invoke
    - `submitAnswers(sessionId, answers)`
    - `submitEdits(sessionId, questions)`
    - `skip(sessionId)`
    - `retry(sessionId)`
    - `getState(sessionId)`
- In electron.d.ts:
  - Add `ClarificationStartOptions` interface
  - Add `ClarificationState` interface
  - Add `clarification` property to ElectronAPI interface with method signatures

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Handlers registered in correct order (after agentStream due to window dependency)
- [ ] Preload API matches handler signatures
- [ ] TypeScript types enable full IntelliSense in renderer
- [ ] All validation commands pass

---

### Step 6: Add Audit Trail Integration

**What**: Integrate audit logging throughout the ClarificationStepService for all significant events.
**Why**: The design document requires comprehensive audit trails for all workflow events to enable traceability and debugging.
**Confidence**: High
**Specialist Agent**: `claude-agent-sdk`

**Files to Modify:**
- `electron/services/clarification-step.service.ts` - Add audit logging calls

**Changes:**
- Import audit log repository or use IPC to create audit entries
- Add audit logging for:
  - `clarification_started` - When clarification begins (includes workflowId, stepId, featureRequest preview)
  - `clarification_exploring` - When agent starts codebase exploration
  - `clarification_questions_generated` - When questions are extracted (includes question count, clarity score)
  - `clarification_questions_edited` - When user modifies questions (includes diff summary)
  - `clarification_answers_submitted` - When user submits answers (includes answer count)
  - `clarification_skipped` - When clarification is skipped (includes reason: user_initiated, auto_skip, timeout)
  - `clarification_timeout` - When timeout occurs (includes configured timeout, actual duration)
  - `clarification_error` - When errors occur (includes error message, stack trace preview)
  - `clarification_completed` - When clarification finishes (includes outcome type, duration)
- Use eventCategory: 'step' for all clarification events
- Include workflowId and workflowStepId in all entries
- Set appropriate severity levels (info for normal events, warning for skips/timeouts, error for failures)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All clarification actions logged with appropriate event types
- [ ] Audit entries include sufficient context for debugging
- [ ] Severity levels appropriate for each event type
- [ ] All validation commands pass

---

### Step 7: Create ClarificationStreaming Component

**What**: Create a React component that consumes useAgentStream to display live agent output during the exploration phase.
**Why**: Users need real-time feedback during codebase exploration to understand what the agent is analyzing.
**Confidence**: High
**Specialist Agent**: `frontend-component`

**Files to Create:**
- `components/workflows/clarification-streaming.tsx` - Live streaming display component

**Changes:**
- Create ClarificationStreaming component that:
  - Accepts sessionId, onQuestionsReady, onSkipReady, onError callbacks
  - Uses useAgentStream hook for state management
  - Displays streaming text output in a scrollable container with auto-scroll
  - Shows thinking blocks in collapsible sections
  - Displays tool use indicators (Read, Grep, Glob) with file paths
  - Shows progress phases: "Exploring codebase...", "Analyzing request...", "Generating questions..."
  - Handles the transition when QUESTIONS_FOR_USER or SKIP_CLARIFICATION is detected
- Add loading spinner during initialization
- Add error display with retry button
- Add cancel button that calls the IPC skip/cancel method
- Follow CVA patterns for styling variants (exploring, questioning, completed, error)
- Use existing Badge, Button, and typography components

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Component displays real-time streaming text
- [ ] Tool use (file reads) are visually indicated
- [ ] Auto-scroll works correctly with use-stick-to-bottom
- [ ] Error and loading states handled appropriately
- [ ] All validation commands pass

---

### Step 8: Integrate Streaming Component into Pipeline

**What**: Integrate ClarificationStreaming into PipelineView and PipelineStep for the clarification step type.
**Why**: The streaming component needs to display within the existing pipeline structure when a clarification step is running.
**Confidence**: Medium
**Specialist Agent**: `frontend-component`

**Files to Modify:**
- `components/workflows/pipeline-view.tsx` - Add streaming state management
- `components/workflows/pipeline-step.tsx` - Handle streaming state display

**Changes:**
- In pipeline-view.tsx:
  - Add state for active clarification session ID
  - Add handler for starting clarification when step becomes active
  - Add handler for questions ready callback that updates step outputStructured
  - Add handler for skip ready callback
  - Add handler for error with retry capability
  - Pass clarification session state to PipelineStep
- In pipeline-step.tsx:
  - Add props for clarification session state (isStreaming, sessionId)
  - Add conditional rendering: show ClarificationStreaming when streaming, ClarificationForm when questions ready
  - Update status indicator to show "Exploring..." during streaming phase
  - Handle transition animation between streaming and form states

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Streaming component displays during exploration phase
- [ ] Smooth transition to ClarificationForm when questions are ready
- [ ] Skip transition handled correctly (moves to next step)
- [ ] Error state shows retry option
- [ ] All validation commands pass

---

### Step 9: Update Create Workflow Dialog

**What**: Verify skip clarification toggle is working and add any missing timeout configuration if needed.
**Why**: The create-workflow-dialog already has skipClarification toggle; ensure it integrates properly with the new orchestration layer.
**Confidence**: High
**Specialist Agent**: `frontend-component`

**Files to Modify:**
- `components/workflows/create-workflow-dialog.tsx` - Verify/enhance skip clarification behavior

**Changes:**
- Verify skipClarification field is properly passed to workflow creation
- Add tooltip explaining when skip clarification is useful (detailed requests, follow-up workflows)
- Ensure skipClarification default is false (already in place)
- Verify the field only shows for planning workflows (already conditional)
- Add visual indicator that clarification can still be skipped during execution

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Skip clarification toggle works correctly
- [ ] Tooltip provides clear guidance
- [ ] Planning workflow conditional display works
- [ ] All validation commands pass

---

### Step 10: Add Settings Panel Integration for Timeout Configuration

**What**: Verify timeout configuration in settings panel and ensure it's accessible to the ClarificationStepService.
**Why**: The settings panel already has clarificationTimeoutSeconds; ensure the service reads this value.
**Confidence**: High
**Specialist Agent**: `claude-agent-sdk`

**Files to Modify:**
- `electron/services/clarification-step.service.ts` - Read timeout from settings

**Changes:**
- Add method to read clarificationTimeoutSeconds from settings via IPC or direct repository access
- Default to 60 seconds if setting not found
- Use the timeout value when starting clarification sessions
- Add logging for timeout configuration being used

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Service reads timeout from settings
- [ ] Default fallback works correctly
- [ ] Timeout is logged in debug output
- [ ] All validation commands pass

---

### Step 11: Implement Error Handling and Retry Logic

**What**: Add comprehensive error handling with retry capability and skip fallback for persistent errors.
**Why**: Users should never be blocked by transient failures; they need clear recovery paths.
**Confidence**: High
**Specialist Agent**: `claude-agent-sdk`

**Files to Modify:**
- `electron/services/clarification-step.service.ts` - Add error handling and retry
- `components/workflows/clarification-streaming.tsx` - Add retry UI

**Changes:**
- In service:
  - Track retry count per session
  - Implement exponential backoff for retries (max 3 attempts)
  - Categorize errors: transient (network, timeout), persistent (parse error, agent error)
  - Auto-retry transient errors once before surfacing to user
  - Provide skip fallback when retry limit reached
  - Log all error recovery attempts
- In component:
  - Display error message with context
  - Show "Retry" button for retriable errors
  - Show "Skip Clarification" button as fallback
  - Display retry count if multiple attempts made
  - Clear error state when retry succeeds

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Transient errors auto-retry once
- [ ] Users can manually retry up to configured limit
- [ ] Skip fallback always available
- [ ] Error messages are user-friendly
- [ ] All validation commands pass

---

### Step 12: Add Pause Mode Support

**What**: Implement pause behavior support for clarification step boundaries.
**Why**: The workflow system supports AUTO_PAUSE and GATES_ONLY modes that should pause at clarification completion.
**Confidence**: Medium
**Specialist Agent**: `claude-agent-sdk`

**Files to Modify:**
- `electron/services/clarification-step.service.ts` - Add pause mode handling
- `components/workflows/pipeline-view.tsx` - Handle pause state

**Changes:**
- In service:
  - Read workflow's pauseBehavior from database
  - After clarification completes, check if pause is needed:
    - AUTO_PAUSE: Always pause after clarification
    - GATES_ONLY: No pause (clarification is not a quality gate)
    - CONTINUOUS: No pause
  - Return pause_requested flag in completion response
- In pipeline-view:
  - Handle pause_requested by updating workflow status to 'paused'
  - Show "Continue" button when paused
  - Log pause events to audit trail

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] AUTO_PAUSE mode pauses after clarification
- [ ] GATES_ONLY and CONTINUOUS modes continue automatically
- [ ] Paused state is visually indicated
- [ ] Continue button resumes workflow
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] ClarificationStepService correctly parses both SKIP_CLARIFICATION and QUESTIONS_FOR_USER outputs
- [ ] Streaming display shows real-time agent output with tool indicators
- [ ] Timeout handling gracefully degrades to skip with audit logging
- [ ] Error handling provides retry and skip fallback
- [ ] Audit trail captures all clarification events
- [ ] Pause mode configuration is respected
- [ ] Manual testing: Create workflow, observe streaming, answer questions, complete clarification

## Notes

**Architectural Decisions:**
- ClarificationStepService is a singleton to manage session state consistently
- Uses existing AgentStreamService for SDK communication rather than direct SDK calls
- Timeout handling uses AbortController pattern established in agent-stream.service.ts
- Audit logging uses existing repository pattern via IPC

**Assumptions Needing Confirmation:**
- clarification-agent subagent is properly configured in .claude/agents/
- AgentStreamService can invoke subagents via prompt (not direct subagent calls)
- Settings repository is accessible from main process services

**Risk Mitigation:**
- Output parsing has fallback to raw text display if JSON parsing fails
- Timeout always provides skip fallback to prevent blocking
- Multiple retry attempts before requiring user intervention
- All errors logged to audit trail for debugging

**Testing Recommendations:**
- Test with very short timeout (10s) to verify timeout handling
- Test with malformed feature requests to verify question generation
- Test network interruption scenarios for retry logic
- Verify pause modes with each configuration option
