# Feature Request: Clarification Step Orchestration

## Overview

Implement the orchestration layer for the clarification step of the planning workflow. This is the **first integration of the Claude Agent SDK into the actual workflow execution**, connecting the existing SDK infrastructure with the clarification UI components.

The clarification step uses the `clarification-agent` to assess feature request clarity, explore the codebase for context, and generate targeted clarifying questions when needed.

## Background

### What Already Exists

1. **Claude Agent SDK Integration** (100% complete):
   - `electron/services/agent-stream.service.ts` - Full SDK integration with MessagePort streaming
   - `types/agent-stream.d.ts` - Comprehensive type definitions
   - `hooks/use-agent-stream.ts` - React hook for state management
   - `electron/ipc/agent-stream.handlers.ts` - IPC handlers for start/cancel/getSession

2. **Clarification UI Components** (100% complete):
   - `components/workflows/clarification-form.tsx` - Question/answer form with skip support
   - `components/workflows/pipeline-step.tsx` - Clarification step type rendering
   - `components/workflows/pipeline-view.tsx` - Metrics and handlers for clarification

3. **Type System & Validation** (100% complete):
   - `lib/validations/clarification.ts` - Zod schemas for ClarificationStepOutput
   - `clarification-agent` subagent definition in `.claude/agents/clarification-agent.md`

### What's Missing

The **orchestration service** that:
1. Invokes the clarification-agent when a workflow enters CLARIFYING status
2. Streams real-time output to the UI during codebase exploration
3. Handles the `ask_clarifying_questions` tool call with structured response flow
4. Parses SKIP_CLARIFICATION vs QUESTIONS_FOR_USER outcomes
5. Manages user question editing and answer submission
6. Transitions to the refinement step

## Detailed Requirements

### 1. Clarification Step Service

Create `electron/services/clarification-step.service.ts` that orchestrates the clarification workflow.

**Core Responsibilities:**
- Start clarification agent session with appropriate configuration
- Handle streaming events and forward to renderer
- Process `ask_clarifying_questions` tool calls
- Handle SKIP_CLARIFICATION responses
- Manage step state transitions
- Capture full audit trail

**Agent Configuration:**
```typescript
{
  prompt: buildClarificationPrompt(featureRequest, workflowContext),
  cwd: repositoryPath,
  allowedTools: ['Read', 'Glob', 'Grep'],  // Read-only exploration only
  permissionMode: 'bypassPermissions',      // No permission prompts for read-only tools
  maxTurns: configurable,                   // Based on timeout setting
  systemPrompt: clarificationAgentPrompt,   // From clarification-agent.md
  hooks: {
    // Log all events to audit trail
  }
}
```

### 2. Tool Flow: ask_clarifying_questions

The clarification agent uses a custom tool `ask_clarifying_questions` to present questions to the user.

**Flow:**
1. Agent calls `ask_clarifying_questions` tool with questions payload
2. Service pauses the agent stream
3. Service sends questions to renderer via MessagePort
4. Renderer displays ClarificationForm
5. User can:
   - Edit questions (text, options, add/remove)
   - Answer questions
   - Skip clarification entirely
6. User submits answers (or skip)
7. Service sends answers back as tool result
8. Agent receives result and completes

**Tool Input Schema:**
```typescript
{
  assessment: {
    score: 1-5,
    reason: string
  },
  questions: [
    {
      header: string,        // Short label (max 12 chars)
      question: string,      // Full question text
      options: [
        { label: string, description: string }
      ]
    }
  ]
}
```

**Tool Result Schema (sent back to agent):**
```typescript
{
  action: 'answered' | 'skipped' | 'cancelled',
  answers?: Record<string, string>,  // questionIndex -> selectedOption
  skipReason?: string
}
```

### 3. Auto-Skip Detection

When the clarification agent determines the feature request is already clear (score >= 4), it returns `SKIP_CLARIFICATION` instead of calling the tool.

**Detection Flow:**
1. Agent analyzes feature request
2. If clarity score >= 4, agent outputs structured skip response
3. Service detects SKIP_CLARIFICATION in output
4. Step is marked as skipped with reason
5. Workflow transitions to refinement automatically

**Skip Response Format:**
```
SKIP_CLARIFICATION
{
  "assessment": {
    "score": 4,
    "reason": "Feature request is well-specified with clear scope, technical approach, and references to existing patterns."
  }
}
```

### 4. Create Workflow Dialog Integration

The existing create workflow dialog should include a toggle for clarification:

**UI Element:**
- Switch labeled "Skip Clarification"
- Default: OFF (clarification runs)
- Description: "Skip the clarification step and proceed directly to refinement"

**Behavior:**
- When ON: Workflow is created with clarification step pre-skipped
- When OFF: Workflow starts with clarification step in pending state

### 5. Live Streaming Display

While the clarification agent explores the codebase, show real-time output in the pipeline step.

**Display Elements:**
- Streaming text output showing agent's exploration
- Thinking blocks (collapsible/expandable)
- Tool usage indicators (files being read, globs executed)
- Progress indicator for codebase exploration phase

**UI States:**
1. **Pending**: "Ready to start clarification"
2. **Running - Exploring**: "Exploring codebase..." with live streaming
3. **Running - Questions**: Agent is waiting for user answers
4. **Paused - Questions**: ClarificationForm displayed, awaiting input
5. **Completed**: Summary of questions/answers or skip reason
6. **Skipped**: Display skip reason
7. **Failed**: Error message with retry/skip options

### 6. Question Editing

Users can fully edit the generated questions before answering.

**Edit Capabilities:**
- Edit question text
- Edit option labels and descriptions
- Add new options to a question
- Remove options from a question
- Add new questions
- Remove questions
- Reorder questions

**Data Handling:**
- User edits replace the original questions entirely
- Only the final edited version is stored in `outputStructured`
- Original agent output is preserved in audit trail

### 7. Error Handling

When the clarification agent fails or times out:

**Error UI:**
- Display error message explaining what went wrong
- Show two action buttons:
  - "Retry" - Restart the clarification agent
  - "Skip Clarification" - Proceed to refinement without clarification

**Error Types to Handle:**
- Agent timeout (configurable limit exceeded)
- SDK connection errors
- Tool execution failures
- Agent returned invalid output format
- User cancelled the operation

### 8. Timeout Configuration

Add clarification timeout to global app settings.

**Setting Location:** Settings → Workflow → Clarification Timeout

**Configuration:**
- Type: Number input with unit selector (seconds)
- Default: 60 seconds
- Range: 30-300 seconds
- Description: "Maximum time for the clarification agent to explore the codebase"

**Schema Addition:**
```typescript
// In settings schema
clarificationTimeout: z.number().min(30).max(300).default(60)
```

### 9. Audit Trail Capture

Capture complete audit trail for the clarification step.

**Events to Log:**
- Step started (timestamp, workflow context)
- Agent session created (sessionId, configuration)
- Streaming text (accumulated)
- Thinking blocks (each block)
- Tool calls (tool name, input, output)
- Questions generated (full question payload)
- User edits (before/after if different - or just final)
- User answers submitted
- Skip decisions (auto-skip or user-skip with reason)
- Errors (error type, message, stack)
- Step completed (duration, outcome)

**Storage:**
- Use existing `workflow_events` table
- Event payload stored as JSON
- Link to workflow step via `stepId`

### 10. Workflow Transition Logic

After clarification completes, transition to the next step based on pause mode.

**Pause Mode Behavior:**
- **Continuous Mode**: Auto-start refinement step immediately
- **Auto-Pause Mode**: Show "Continue to Refinement" button, wait for user
- **Gates-Only Mode**: Auto-start refinement (clarification answers aren't a gate)

**Important:** Regardless of pause mode, always pause to wait for user answers. The pause mode only affects the *transition* after answers are submitted.

**Transition Data:**
The refinement step receives:
```typescript
{
  originalRequest: string,           // User's original feature request
  clarificationAnswers: {
    questions: ClarificationQuestion[],
    answers: ClarificationAnswers
  } | null,                          // null if skipped
  wasSkipped: boolean,
  skipReason?: string
}
```

### 11. IPC Channels

Add new IPC channels for clarification step control:

```typescript
// New channels in electron/ipc/channels.ts
'clarification:start': (workflowId: string, stepId: string) => Promise<{ sessionId: string }>
'clarification:submitAnswers': (sessionId: string, answers: ClarificationAnswers) => Promise<void>
'clarification:submitEdits': (sessionId: string, editedQuestions: ClarificationQuestion[]) => Promise<void>
'clarification:skip': (sessionId: string, reason?: string) => Promise<void>
'clarification:retry': (workflowId: string, stepId: string) => Promise<{ sessionId: string }>
```

### 12. Context-Aware Questions

The clarification agent should reference specific files discovered during exploration.

**Example Questions:**
- "Should this feature follow the pattern in `components/auth/login-form.tsx`, or use a different approach?"
- "I found existing validation in `lib/validations/user.ts`. Should this feature extend those schemas or create new ones?"
- "The codebase uses TanStack Query for data fetching. Should this feature include server-side caching?"

**Agent Instruction:**
Include in the clarification agent prompt that questions should reference concrete files/patterns discovered during the 30-second exploration phase.

## Technical Implementation Notes

### File Structure

```
electron/
├── services/
│   └── clarification-step.service.ts    # NEW: Orchestration service
├── ipc/
│   └── clarification.handlers.ts        # NEW: IPC handlers
│   └── channels.ts                      # UPDATE: Add clarification channels

lib/
├── validations/
│   └── settings.ts                      # UPDATE: Add clarificationTimeout

components/
├── workflows/
│   └── create-workflow-dialog.tsx       # UPDATE: Add skip clarification toggle
│   └── clarification-streaming.tsx      # NEW: Streaming display component
```

### Dependencies

- Existing `AgentStreamService` for SDK communication
- Existing `useAgentStream` hook for React state
- Existing `ClarificationForm` component for question UI
- Existing `clarification-agent.md` subagent definition

### Integration Points

1. **Workflow Creation**: Create workflow dialog triggers clarification start
2. **Pipeline View**: Displays streaming output and form
3. **Settings Panel**: Timeout configuration
4. **Audit Log**: Event storage and retrieval

## Acceptance Criteria

1. [ ] Creating a workflow with "Skip Clarification" OFF starts the clarification agent
2. [ ] Creating a workflow with "Skip Clarification" ON skips to refinement
3. [ ] Live streaming output displays during codebase exploration
4. [ ] Questions are displayed in ClarificationForm when agent calls tool
5. [ ] Users can edit questions before answering
6. [ ] User answers are sent back to agent as tool result
7. [ ] Auto-skip works when agent returns SKIP_CLARIFICATION (score >= 4)
8. [ ] Errors display retry/skip options
9. [ ] Timeout is configurable in settings (default 60s)
10. [ ] Full audit trail is captured for all events
11. [ ] Transition to refinement respects pause mode setting
12. [ ] Questions reference specific files found during exploration

## Out of Scope

- Refinement step orchestration (separate feature)
- File discovery step orchestration (separate feature)
- Planning step orchestration (separate feature)
- Multi-workflow concurrent execution
- Worktree management

## Related Files

- `.claude/agents/clarification-agent.md` - Agent definition
- `lib/validations/clarification.ts` - Type schemas
- `components/workflows/clarification-form.tsx` - Question form
- `components/workflows/pipeline-step.tsx` - Step rendering
- `hooks/use-agent-stream.ts` - SDK hook
- `electron/services/agent-stream.service.ts` - SDK service
