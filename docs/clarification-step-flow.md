Comprehensive Technical Breakdown: Clarification Step in Workflow

Executive Summary

The clarification step is the first step in the Clarify workflow pipeline. It analyzes a feature request for clarity and either:
1. Generates clarifying questions for the user (if unclear)
2. Skips clarification (if sufficiently clear)

The step involves coordination across 4 layers:
- UI Layer: React components (PipelineView, ClarificationStreaming, ClarificationForm)
- IPC Bridge: Electron preload/channels (clarification:* channels)
- Handler Layer: IPC handlers (clarification.handlers.ts)
- Service Layer: Business logic (ClarificationStepService)

  ---
Architecture Overview

┌─────────────────────────────────────────────────────────────────┐
│                         RENDERER PROCESS                        │
├─────────────────────────────────────────────────────────────────┤
│  PipelineView.tsx                                               │
│    ├── useEffect (detects running clarification step)          │
│    ├── Sets up IPC stream subscription                          │
│    ├── Calls window.electronAPI.clarification.start()          │
│    └── Manages ClarificationSessionState                       │
│                                                                 │
│  ClarificationStreaming.tsx                                     │
│    ├── Displays streaming text, thinking blocks, tools         │
│    └── Shows error/retry/skip controls                         │
│                                                                 │
│  ClarificationForm.tsx                                         │
│    ├── Renders questions as radio button form                  │
│    └── Calls onSubmit/onSkip handlers                          │
└─────────────────────────────────────────────────────────────────┘
│
│ IPC (ipcRenderer.invoke / ipcRenderer.on)
▼
┌─────────────────────────────────────────────────────────────────┐
│                         PRELOAD SCRIPT                          │
├─────────────────────────────────────────────────────────────────┤
│  clarification: {                                               │
│    start(), retry(), skip(), getState(),                       │
│    submitAnswers(), submitEdits(), onStreamMessage()           │
│  }                                                              │
│  - Uses IIFE pattern for stream callback management            │
│  - Forwards clarification:stream events to registered listeners │
└─────────────────────────────────────────────────────────────────┘
│
│ IPC (ipcMain.handle / webContents.send)
▼
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN PROCESS                            │
├─────────────────────────────────────────────────────────────────┤
│  clarification.handlers.ts                                      │
│    ├── Validates input                                         │
│    ├── Looks up workflow step for agentId                      │
│    ├── Creates stream callback → webContents.send()            │
│    └── Delegates to ClarificationStepService                   │
│                                                                 │
│  clarification-step.service.ts                                  │
│    ├── State machine: idle → loading_agent → executing →       │
│    │   processing_response → waiting_for_user/complete/error   │
│    ├── Loads agent config from DB                              │
│    ├── Executes Claude Agent SDK with structured output        │
│    ├── Processes streaming events                              │
│    └── Creates audit log entries                               │
└─────────────────────────────────────────────────────────────────┘
│
│ Claude Agent SDK
▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLAUDE AGENT SDK                           │
├─────────────────────────────────────────────────────────────────┤
│  query() async generator                                        │
│    ├── stream_event messages (text_delta, thinking, tools)     │
│    └── result message with structured_output                   │
└─────────────────────────────────────────────────────────────────┘

  ---
State Machine

                       ┌──────────────────┐
                       │       idle       │
                       └────────┬─────────┘
                                │ startClarification()
                                ▼
                       ┌──────────────────┐
                       │  loading_agent   │
                       └────────┬─────────┘
                                │ Agent config loaded
                                ▼
                       ┌──────────────────┐
             ┌─────────│    executing     │─────────┐
             │         └────────┬─────────┘         │
             │                  │                   │
             │ Timeout          │ SDK complete      │ User cancel
             ▼                  ▼                   ▼
      ┌──────────┐    ┌──────────────────┐    ┌──────────┐
      │ timeout  │    │processing_response│    │cancelled │
      └──────────┘    └────────┬─────────┘    └──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
      ┌──────────────┐  ┌───────────┐  ┌──────────────────┐
      │waiting_for_  │  │  complete │  │      error       │
      │    user      │  └───────────┘  └──────────────────┘
      └──────────────┘       ▲                    │
             │               │                    │
             │ User submits  │ SKIP outcome       │ retry()
             │ answers       │                    │
             └───────────────┘                    │
                                                  ▼
                                      (loops back to idle)

  ---
Data Types

Key Interfaces

// Service Options (input to start clarification)
interface ClarificationServiceOptions {
workflowId: number;
stepId: number;
agentId: number;
featureRequest: string;
repositoryPath: string;
timeoutSeconds?: number; // default: 120
}

// Discriminated Union of Outcomes
type ClarificationOutcome =
| { type: 'QUESTIONS_FOR_USER'; questions: ClarificationQuestion[]; assessment: ClarificationAssessment }
| { type: 'SKIP_CLARIFICATION'; reason: string; assessment: ClarificationAssessment }
| { type: 'ERROR'; error: string; stack?: string }
| { type: 'TIMEOUT'; error: string; elapsedSeconds: number }
| { type: 'CANCELLED'; reason?: string };

// Extended outcome with pause/retry info
type ClarificationOutcomeWithPause = ClarificationOutcome & {
pauseRequested?: boolean;
retryCount?: number;
sdkSessionId?: string;
skipFallbackAvailable?: boolean;
usage?: ClarificationUsageStats;
};

// Stream Message Types
type ClarificationStreamMessage =
| { type: 'phase_change'; phase: ClarificationServicePhase }
| { type: 'text_delta'; delta: string }
| { type: 'thinking_start'; blockIndex: number }
| { type: 'thinking_delta'; blockIndex: number; delta: string }
| { type: 'tool_start'; toolName: string; toolUseId: string; toolInput: Record<string, unknown> }
| { type: 'tool_stop'; toolUseId: string };

// UI State (PipelineView)
interface ClarificationSessionState {
sessionId: string | null;
stepId: number | null;
phase: ClarificationServicePhase;
isStreaming: boolean;
text: string;
thinking: string[];
activeTools: ActiveTool[];
outcome: ClarificationOutcome | null;
error: string | null;
agentName: string;
}

  ---
Path 1: Happy Path (QUESTIONS_FOR_USER)

Trigger

- Workflow step with stepType: 'clarification' transitions to status: 'running'
- PipelineView detects this via useStepsByWorkflow() query

Flow

1. PipelineView useEffect detects running clarification step
    - Conditions: step.stepType === 'clarification' && status === 'running'
    - Guard: clarificationStartedRef.current !== step.id (prevent double-start)
    - Guard: No existing questions in outputStructured
    - Guard: primaryRepository.path and workflow.featureRequest available

2. Set initial state
   setClarificationState({
   sessionId: null,
   stepId: activeClarificationStep.id,
   phase: 'loading_agent',
   isStreaming: true,
   text: '',
   thinking: [],
   activeTools: [],
   outcome: null,
   error: null,
   agentName: clarificationAgent?.displayName ?? 'Clarification Agent'
   })

3. Subscribe to stream events BEFORE starting
   unsubscribe = window.electronAPI.clarification.onStreamMessage((message) => {
   // Accumulate text, thinking, tools based on message.type
   })

4. Call IPC: window.electronAPI.clarification.start({
   workflowId, stepId, featureRequest, repositoryPath, timeoutSeconds: 120
   })

5. IPC Handler validates input, looks up step.agentId from DB

6. Service: startClarification()
   a. Generate sessionId (UUID)
   b. Create AbortController for timeout/cancel
   c. Initialize session in activeSessions Map
   d. Phase → 'loading_agent'
   e. Load agent config from DB (agents, tools, skills, hooks tables)
   f. Phase → 'executing'
   g. Set up timeout promise (120s default)
   h. Call executeAgent()

7. SDK Execution
   a. Configure SDK options (tools, model, systemPrompt, structured output schema)
   b. Build clarification prompt with feature request
   c. Execute: for await (const message of query({options, prompt}))
   d. For each stream_event: processStreamEvent() → emit to callback
   e. On 'result' message: capture for structured output extraction

8. Stream Events (forwarded to UI via IPC)
    - content_block_start (type: thinking) → thinking_start
    - content_block_delta (type: thinking_delta) → thinking_delta
    - content_block_delta (type: text_delta) → text_delta
    - content_block_start (type: tool_use) → tool_start
    - content_block_stop → tool_stop

9. Process Structured Output
   a. Validate with clarificationAgentOutputFlatSchema (Zod)
   b. Transform flat schema to discriminated union
   c. For QUESTIONS_FOR_USER: extract questions array
   d. Phase → 'waiting_for_user'

10. Return outcome to PipelineView
    outcome = {
    type: 'QUESTIONS_FOR_USER',
    questions: [...],
    assessment: { score: 3, reason: '...' },
    pauseRequested: boolean,
    usage: { inputTokens, outputTokens, costUsd, durationMs }
    }

11. PipelineView receives outcome
    a. Stop streaming state
    b. Update step.outputStructured with questions
    c. TanStack Query mutation: updateStep.mutateAsync({
    id: activeClarificationStep.id,
    data: { outputStructured: { questions } }
    })
    d. Phase → 'waiting_for_user'

12. ClarificationForm renders (questions now in outputStructured)

Data Flow
┌───────────┬────────────────────────────────────────────────┬────────────────────────────────────────┐
│   Stage   │                  Data Source                   │               Data Shape               │
├───────────┼────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Input     │ TanStack Query (workflow, steps, repositories) │ Workflow, WorkflowStep[], Repository[] │
├───────────┼────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Streaming │ IPC stream events                              │ ClarificationStreamMessage             │
├───────────┼────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Output    │ SDK structured_output                          │ ClarificationAgentOutputFlat           │
├───────────┼────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Storage   │ DB via updateStep mutation                     │ WorkflowStep.outputStructured          │
└───────────┴────────────────────────────────────────────────┴────────────────────────────────────────┘
State Transitions

1. ClarificationSessionState.phase: idle → loading_agent → executing → waiting_for_user
2. ClarificationSessionState.isStreaming: true → false
3. WorkflowStep.outputStructured: null → { questions: [...] }

Side Effects

1. Audit Logs Created:
   - clarification_started
   - clarification_agent_loaded
   - clarification_exploring
   - clarification_questions_generated
2. SDK Call: One call to Claude Agent SDK query() function
3. Database Updates: workflow_steps.outputStructured updated via IPC

  ---
Path 2: Happy Path (SKIP_CLARIFICATION)

Trigger

Same as Path 1, but agent determines feature request is clear (score ≥ 4)

Flow

Steps 1-9 same as Path 1, then:

10. Process Structured Output
    outcome = {
    type: 'SKIP_CLARIFICATION',
    reason: 'Feature request is clear and specific...',
    assessment: { score: 5, reason: '...' }
    }

11. PipelineView receives outcome
    a. Update step.outputStructured with skip info
    b. updateStep.mutateAsync({
    id: step.id,
    data: { outputStructured: { questions: [], skipped: true, skipReason: reason } }
    })
    c. skipStep.mutateAsync(step.id)  // Transitions step status to 'skipped'
    d. Reset clarificationState to INITIAL_CLARIFICATION_STATE

12. Step marked as skipped, workflow continues to next step

Terminal State

- WorkflowStep.status: 'skipped'
- WorkflowStep.outputStructured: { questions: [], skipped: true, skipReason: string }

  ---
Path 3: User Submits Answers

Trigger

User selects options in ClarificationForm and clicks "Submit Answers"

Flow

1. ClarificationForm: form.handleSubmit()
    - Collects answers: Record<string, string> (index → selected label)

2. PipelineView: handleSubmitClarification(stepId, currentOutput, answers)
   a. Set submittingStepId for loading state
   b. Merge answers into outputStructured
   updatedOutput = { ...currentOutput, answers }
   c. updateStep.mutateAsync({ id: stepId, data: { outputStructured: updatedOutput } })
   d. completeStep.mutateAsync({ id: stepId })

3. IPC Handler: step:update
    - Updates workflow_steps.outputStructured

4. IPC Handler: step:complete
    - Updates workflow_steps.status to 'completed'
    - Sets workflow_steps.completedAt timestamp

5. Workflow advances to next step

Data Flow
┌───────────┬─────────────────────┬───────────────────────────────────────────┐
│   Stage   │        Data         │                   Shape                   │
├───────────┼─────────────────────┼───────────────────────────────────────────┤
│ Input     │ Form values         │ Record<string, string>                    │
├───────────┼─────────────────────┼───────────────────────────────────────────┤
│ Transform │ Merge with existing │ ClarificationStepOutput                   │
├───────────┼─────────────────────┼───────────────────────────────────────────┤
│ Storage   │ DB update           │ { outputStructured, status: 'completed' } │
└───────────┴─────────────────────┴───────────────────────────────────────────┘
Side Effects

1. Audit Log: clarification_answers_submitted
2. TanStack Query Cache: Invalidated for steps query
3. Step Status: 'running' → 'completed'

  ---
Path 4: User Skips Clarification

Trigger

User clicks "Skip" button in ClarificationForm

Flow

1. ClarificationForm: onSkip()

2. PipelineView: handleSkipClarification(stepId)
   a. Set submittingStepId
   b. skipStep.mutateAsync(stepId)

3. IPC Handler: step:skip
    - Updates workflow_steps.status to 'skipped'
    - Sets skippedAt timestamp

4. Workflow advances to next step

  ---
Path 5: Timeout

Trigger

SDK execution exceeds timeoutSeconds (default: 120s)

Flow

1. Service: setTimeout in startClarification()
    - After timeoutSeconds * 1000 ms:
      a. abortController.abort()
      b. Phase → 'timeout'
      c. Emit phase_change event
      d. Resolve timeout promise

2. Promise.race([executionPromise, timeoutPromise])
    - Timeout promise wins

3. Return outcome:
   {
   type: 'TIMEOUT',
   error: `Clarification timed out after ${timeoutSeconds} seconds`,
   elapsedSeconds: timeoutSeconds
   }

4. PipelineView receives outcome
    - Sets error state
    - ClarificationStreaming shows timeout error
    - Shows Retry and Skip buttons

5. Audit Log: clarification_timeout

Terminal UI State

- ClarificationStreamingProps.status: 'error'
- Error message displayed with retry/skip options

  ---
Path 6: User Cancellation

Trigger

User clicks "Cancel" button in ClarificationStreaming

Flow

1. ClarificationStreaming: onCancel()

2. PipelineView: handleClarificationCancel()
   a. Check for sessionId
   b. Call window.electronAPI.clarification.skip(sessionId, 'User cancelled')

3. IPC Handler: clarification:skip
    - Calls service.skipClarification(sessionId, reason)

4. Service: skipClarification()
   a. Look up session in activeSessions
   b. Clear timeout if active
   c. Abort SDK via abortController.abort()
   d. Phase → 'complete'
   e. Clean up session
   f. Return: { type: 'SKIP_CLARIFICATION', reason, assessment }

5. PipelineView resets state
    - setClarificationState(INITIAL_CLARIFICATION_STATE)
    - clarificationStartedRef.current = null

Audit Log

- clarification_cancelled with phase and reason

  ---
Path 7: Transient Error with Retry

Trigger

SDK throws error that matches transient error patterns:
- Timeout, Network, Connection, ECONNRESET, ETIMEDOUT
- Rate limit, 502, 503, Overloaded, Temporarily unavailable

Flow

1. Service: catch block in startClarification()
   a. Detect transient error via isTransientError()
   b. Return outcome:
   {
   type: 'ERROR',
   error: errorMessage,
   stack: errorStack,
   retryCount: 0,
   skipFallbackAvailable: true
   }

2. PipelineView sets error state
    - ClarificationStreaming shows error with Retry button

3. User clicks Retry

4. PipelineView: (not yet implemented in UI)
    - Would call window.electronAPI.clarification.retry()

5. IPC Handler: clarification:retry
   a. Cancel existing session
   b. Validate input
   c. Call service.retryClarification(options, previousSessionId)

6. Service: retryClarification()
   a. Check retry limit (max 3 attempts)
   b. If limit reached:
    - Return ERROR with skipFallbackAvailable: true
      c. Increment retry count
      d. Calculate backoff: 1s × 2^(retryCount-1)
      e. Wait for backoff delay
      f. Call startClarification() again
      g. Return outcome with updated retryCount

7. Audit Logs:
    - clarification_error (initial)
    - clarification_retry_started (on retry)
    - If limit reached: clarification_retry_limit_reached

Retry Backoff Schedule
┌─────────┬─────────────────────────────────────────┐
│ Attempt │                  Delay                  │
├─────────┼─────────────────────────────────────────┤
│ 1       │ 1 second                                │
├─────────┼─────────────────────────────────────────┤
│ 2       │ 2 seconds                               │
├─────────┼─────────────────────────────────────────┤
│ 3       │ 4 seconds                               │
├─────────┼─────────────────────────────────────────┤
│ 4+      │ Error: "Maximum retry attempts reached" │
└─────────┴─────────────────────────────────────────┘
  ---
Path 8: Non-Transient Error

Trigger

SDK throws error that doesn't match transient patterns (e.g., validation error, schema error)

Flow

1. Service: catch block
    - isTransientError() returns false

2. Return outcome:
   {
   type: 'ERROR',
   error: errorMessage,
   stack: errorStack,
   retryCount: 0,
   skipFallbackAvailable: true
   }

3. ClarificationStreaming shows error
    - Skip button available (no retry option shown if !canRetry)

4. User clicks Skip
    - Calls handleSkipClick → onSkipClarification(reason)

  ---
Path 9: Structured Output Validation Failure

Trigger

Agent completes but structured output doesn't match schema

Flow

1. SDK returns result with subtype: 'error_max_structured_output_retries'
   OR structured_output doesn't validate

2. Service: processStructuredOutput()
   a. Check for error subtypes
   b. Validate with clarificationAgentOutputFlatSchema
   c. If validation fails:
   return { type: 'ERROR', error: 'Structured output validation failed: ...' }

3. Specific validation checks:
    - SKIP_CLARIFICATION missing 'reason' field
    - QUESTIONS_FOR_USER missing 'questions' array
    - Questions array empty
    - Schema mismatch

4. Audit Log: clarification_error with validation details

  ---
Path 10: Missing Prerequisites

Trigger

Required data not available when step becomes running

Flow (Early Return)

1. PipelineView useEffect runs

2. Condition checks fail:
    - !primaryRepository?.path → return (no repository)
    - !workflow?.featureRequest → return (no feature request)
    - step.outputStructured?.questions?.length → return (already has questions)
    - clarificationStartedRef.current === step.id → return (already started)

3. Clarification does not start
    - Step remains in 'running' status
    - UI shows step as running but no streaming

4. **AMBIGUITY**: What triggers eventual retry?
    - Likely requires manual intervention or page refresh
    - No automatic retry mechanism for missing prerequisites

  ---
Path 11: Agent Not Found

Trigger

agentId from step doesn't exist in agents table

Flow

1. IPC Handler looks up step
    - step.agentId is present

2. Service: loadAgentConfig(agentId)
    - agentsRepo.findById() returns undefined
    - Throws: Error(`Agent with ID ${agentId} not found`)

3. Caught in startClarification() catch block
    - Returns ERROR outcome

4. UI shows error message

  ---
Path 12: IPC Window Destroyed

Trigger

Main window closed/destroyed while clarification is running

Flow

1. Stream callback checks: mainWindow.isDestroyed()

2. If destroyed:
    - Stream messages silently dropped
    - SDK continues execution
    - Result returned but not forwarded to UI

3. **AMBIGUITY**: Session cleanup behavior unclear
    - ActiveSession may remain in memory
    - Timeout eventually fires or SDK completes

  ---
Edge Cases

Empty State

- Condition: Workflow created but step.status === 'pending'
- Behavior: Clarification step visible but not started
- UI: "Workflow is ready. Start the workflow to create pipeline steps."

Concurrent Requests

- Prevention: clarificationStartedRef.current tracks started step ID
- Behavior: Second request short-circuits in useEffect
- Risk: Race condition if ref update delayed relative to render

Missing Agent Assignment

- Condition: step.agentId is null
- Detection: IPC handler throws: "No agent assigned to clarification step"
- Resolution: Use default clarification agent from settings

SDK Not Installed

- Detection: Dynamic import fails in getQueryFunction()
- Error: "Claude Agent SDK not available. Ensure @anthropic-ai/claude-agent-sdk is installed."

  ---
Summary Flowchart (Mermaid)

flowchart TB
subgraph Trigger["Trigger"]
A[Step status → 'running'] --> B{Prerequisites?}
B -->|Missing| Z1[No-op / Wait]
B -->|Present| C[Subscribe to stream]
end

      subgraph Execution["Execution"]
          C --> D[IPC: clarification:start]
          D --> E[Validate Input]
          E --> F[Load Agent Config]
          F --> G{Agent Found?}
          G -->|No| Z2[ERROR: Agent not found]
          G -->|Yes| H[Execute SDK]
          H --> I{Streaming}
          I -->|Events| J[Forward to UI]
          J --> I
          I -->|Result| K{Timeout?}
          K -->|Yes| L[TIMEOUT outcome]
          K -->|No| M{Cancelled?}
          M -->|Yes| N[CANCELLED outcome]
          M -->|No| O[Process Output]
      end

      subgraph Output["Output Processing"]
          O --> P{Valid Schema?}
          P -->|No| Q[ERROR: Validation failed]
          P -->|Yes| R{Outcome Type}
          R -->|SKIP| S[SKIP_CLARIFICATION]
          R -->|QUESTIONS| T[QUESTIONS_FOR_USER]
      end

      subgraph UserAction["User Actions"]
          T --> U[ClarificationForm]
          U -->|Submit| V[Merge answers]
          U -->|Skip| W[Skip step]
          V --> X[Complete step]
          S --> W
      end

      subgraph ErrorHandling["Error Handling"]
          Z2 --> Y{Transient?}
          Q --> Y
          L --> Y
          Y -->|Yes| AA{Retry < 3?}
          AA -->|Yes| AB[Backoff + Retry]
          AB --> D
          AA -->|No| AC[Show Skip option]
          Y -->|No| AC
          N --> AD[Reset state]
      end

      X --> AE[Workflow continues]
      W --> AE
      AD --> AE
      AC -->|User skips| W

  ---
Ambiguities and Undetermined Behavior
┌────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────┐
│             Issue              │                                  Description                                  │                  Recommendation                   │
├────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ Missing prerequisites recovery │ If repository/feature request missing, step stalls with no automatic recovery │ Add polling or user notification                  │
├────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ Window destroyed during stream │ Stream messages dropped silently                                              │ Add session cleanup on window close               │
├────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ Concurrent useEffect race      │ Ref update may not prevent all races                                          │ Use AbortController in useEffect                  │
├────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ Retry not wired in UI          │ handleRetryClick references onRetry but not implemented in PipelineView       │ Complete retry integration                        │
├────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ Session cleanup on error       │ Session may persist in activeSessions after some errors                       │ Ensure cleanup in all error paths                 │
├────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ Pause behavior interaction     │ pauseRequested returned but not acted upon                                    │ Implement pause handling in workflow orchestrator │
└────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
  ---
Files Referenced
┌──────────────────────────────────────────────────┬───────┬─────────────────────────────┐
│                       File                       │ Lines │           Purpose           │
├──────────────────────────────────────────────────┼───────┼─────────────────────────────┤
│ electron/services/clarification-step.service.ts  │ 1528  │ Core service logic          │
├──────────────────────────────────────────────────┼───────┼─────────────────────────────┤
│ electron/ipc/clarification.handlers.ts           │ 347   │ IPC request handling        │
├──────────────────────────────────────────────────┼───────┼─────────────────────────────┤
│ electron/ipc/channels.ts                         │ 201   │ Channel constants           │
├──────────────────────────────────────────────────┼───────┼─────────────────────────────┤
│ electron/preload.ts                              │ 1249  │ IPC bridge to renderer      │
├──────────────────────────────────────────────────┼───────┼─────────────────────────────┤
│ lib/validations/clarification.ts                 │ 448   │ Zod schemas and types       │
├──────────────────────────────────────────────────┼───────┼─────────────────────────────┤
│ components/workflows/pipeline-view.tsx           │ 701   │ Main orchestrator component │
├──────────────────────────────────────────────────┼───────┼─────────────────────────────┤
│ components/workflows/clarification-streaming.tsx │ 503   │ Streaming UI component      │
├──────────────────────────────────────────────────┼───────┼─────────────────────────────┤
│ components/workflows/clarification-form.tsx      │ 127   │ Question form component     │
├──────────────────────────────────────────────────┼───────┼─────────────────────────────┤
│ types/electron.d.ts                              │ 924+  │ TypeScript declarations     │
└──────────────────────────────────────────────────┴───────┴─────────────────────────────┘