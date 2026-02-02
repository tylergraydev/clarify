# Implementation Plan: Clarification Step Orchestration Layer (v2)

Generated: 2026-02-02
Updated: 2026-02-02
Original Request: Implement the orchestration layer for the clarification step of the planning workflow
Refined Request: Implement the orchestration layer for the clarification step, integrating with the existing agent infrastructure to allow users to select which planning agent performs clarification, with support for default agent configuration.

## Analysis Summary

- Feature request refined with agent infrastructure integration
- Discovered 28+ files across 12+ directories
- Generated 15-step implementation plan (expanded from 12)
- **Key Change**: Uses dynamic agent selection instead of hardcoded agent lookup

## Key Design Decisions

### Agent Selection Model

1. **User-Selectable Agent**: Users choose which planning agent to use for clarification when creating a workflow
2. **Default Agent Setting**: A global setting `defaultClarificationAgentId` pre-populates the dropdown
3. **Dynamic Configuration**: The service loads the selected agent's full configuration (tools, skills, hooks, system prompt) at runtime
4. **Step-Level Assignment**: The selected agent ID is stored on the workflow step via the existing `agentId` column

### Why This Approach?

- Leverages existing agent infrastructure (agents, agent_tools, agent_skills, agent_hooks tables)
- Allows users to customize clarification behavior by creating/modifying planning agents
- Supports project-scoped agents (different default per project in future)
- Consistent with how implementation steps use specialist agents

## File Discovery Results

### New Files to Create:
- `electron/services/clarification-step.service.ts` - Core orchestration service
- `electron/ipc/clarification.ipc.ts` - IPC handlers for clarification channels
- `components/workflows/clarification-streaming.tsx` - Live streaming display component
- `hooks/queries/use-default-clarification-agent.ts` - Hook for default agent setting

### Files to Modify:
- `db/seed/settings.seed.ts` - Add default clarification agent setting
- `electron/ipc/channels.ts` - Add clarification IPC channel definitions
- `electron/preload.ts` - Add clarification API methods
- `electron/ipc/index.ts` - Register clarification handlers
- `types/electron.d.ts` - Add clarification types to ElectronAPI
- `lib/validations/clarification.ts` - Add service options and outcome types
- `lib/validations/workflow.ts` - Add clarificationAgentId to workflow creation schema
- `components/workflows/create-workflow-dialog.tsx` - Add agent selection dropdown
- `components/workflows/pipeline-view.tsx` - Integrate streaming component
- `components/workflows/pipeline-step.tsx` - Handle streaming state display
- `components/agents/agent-card-actions.tsx` - Add "Make Default" action (if exists, else agent table)

---

## Overview

**Estimated Complexity**: High
**Risk Level**: Medium

## Quick Summary

This plan implements the orchestration layer for the clarification step of the planning workflow, with full integration into the existing agent infrastructure. Users can select which planning agent performs clarification via a dropdown in the workflow creation dialog, with a configurable default. The ClarificationStepService dynamically loads the selected agent's configuration (system prompt, tools, skills, hooks) and uses it when invoking the Claude Agent SDK.

## Prerequisites

- [ ] Verify `@anthropic-ai/claude-agent-sdk` is properly installed and configured
- [ ] Confirm existing AgentStreamService and useAgentStream patterns are stable
- [ ] Ensure audit logging infrastructure is operational
- [ ] Verify at least one planning-type agent exists in the database

---

## Implementation Steps

### Step 1: Add Default Clarification Agent Setting

**What**: Add a new setting `defaultClarificationAgentId` to store the user's preferred clarification agent.
**Why**: Enables the workflow creation dropdown to pre-select the user's preferred agent, improving UX.
**Confidence**: High
**Specialist Agent**: `database-schema`

**Files to Modify:**
- `db/seed/settings.seed.ts` - Add new setting definition

**Changes:**
- Add setting with:
  - `key`: `'defaultClarificationAgentId'`
  - `displayName`: `'Default Clarification Agent'`
  - `description`: `'The planning agent used by default for the clarification step in new workflows'`
  - `category`: `'workflow'`
  - `valueType`: `'number'`
  - `defaultValue`: `null` (no default until user sets one)
  - `value`: `null`

**Validation Commands:**
```bash
pnpm db:generate && pnpm db:migrate
```

**Success Criteria:**
- [ ] Setting exists in database after migration
- [ ] Setting appears in workflow category
- [ ] All validation commands pass

---

### Step 2: Extend Clarification Validation Types

**What**: Add service-level types for clarification orchestration, including the new `agentId` parameter.
**Why**: These types define the contract between the service and UI layers, enabling type-safe communication.
**Confidence**: High
**Specialist Agent**: `tanstack-form`

**Files to Modify:**
- `lib/validations/clarification.ts` - Add service options and outcome type definitions

**Changes:**
- Add `ClarificationServiceOptions` interface:
  ```typescript
  interface ClarificationServiceOptions {
    workflowId: number;
    stepId: number;
    agentId: number;  // The selected planning agent
    repositoryPath: string;
    featureRequest: string;
    timeoutSeconds?: number;
  }
  ```
- Add `ClarificationAgentConfig` interface for loaded agent data:
  ```typescript
  interface ClarificationAgentConfig {
    id: number;
    name: string;
    systemPrompt: string;
    model: string | null;
    permissionMode: string | null;
    tools: Array<{ toolName: string; toolPattern: string }>;
    skills: Array<{ skillName: string; isRequired: boolean }>;
    hooks: Array<{ eventType: string; body: string; matcher: string | null }>;
  }
  ```
- Add `ClarificationOutcome` discriminated union type with variants: `SKIP_CLARIFICATION`, `QUESTIONS_FOR_USER`, `TIMEOUT`, `ERROR`, `CANCELLED`
- Add `ClarificationServiceState` type for phase tracking
- Add `ClarificationRefinementInput` type for user answer submission
- Export all new types

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All new types are properly exported
- [ ] `ClarificationServiceOptions` includes `agentId` field
- [ ] `ClarificationAgentConfig` captures full agent configuration
- [ ] All validation commands pass

---

### Step 3: Update Workflow Creation Validation Schema

**What**: Add `clarificationAgentId` field to the workflow creation schema.
**Why**: The workflow creation form needs to capture which agent to use for clarification.
**Confidence**: High
**Specialist Agent**: `tanstack-form`

**Files to Modify:**
- `lib/validations/workflow.ts` - Add clarificationAgentId to create workflow schema

**Changes:**
- Add `clarificationAgentId` field to `createWorkflowSchema`:
  ```typescript
  clarificationAgentId: z.number().nullable().optional()
  ```
- Field is nullable (allows no selection) and optional (backwards compatible)
- Add to the planning workflow type specifically (not implementation workflows)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Schema accepts clarificationAgentId field
- [ ] Field is optional for backwards compatibility
- [ ] All validation commands pass

---

### Step 4: Create Default Clarification Agent Hook

**What**: Create a React Query hook to fetch and update the default clarification agent setting.
**Why**: Provides a clean API for components to access and modify the default agent preference.
**Confidence**: High
**Specialist Agent**: `tanstack-query`

**Files to Create:**
- `hooks/queries/use-default-clarification-agent.ts` - Hook for default agent setting

**Changes:**
- Create `useDefaultClarificationAgent()` hook that:
  - Queries the `defaultClarificationAgentId` setting via existing settings IPC
  - Returns `{ agentId: number | null, isLoading, error }`
- Create `useSetDefaultClarificationAgent()` mutation hook that:
  - Updates the setting via settings IPC
  - Invalidates the query on success
- Export both hooks

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Hook returns current default agent ID
- [ ] Mutation updates the setting correctly
- [ ] Query invalidation works on update
- [ ] All validation commands pass

---

### Step 5: Add Agent Selection to Workflow Creation Dialog

**What**: Add a dropdown to select which planning agent performs clarification.
**Why**: Allows users to choose their preferred clarification agent per workflow.
**Confidence**: High
**Specialist Agent**: `frontend-component`

**Files to Modify:**
- `components/workflows/create-workflow-dialog.tsx` - Add agent selection dropdown

**Changes:**
- Add query for planning agents: `useAgents({ type: 'planning' })` or similar
- Add `clarificationAgentId` field to the form with a SelectField:
  ```tsx
  <form.AppField name="clarificationAgentId">
    {(field) => (
      <field.SelectField
        label="Clarification Agent"
        description="Select which planning agent analyzes your feature request"
        options={planningAgentOptions}
        placeholder="Select agent..."
      />
    )}
  </form.AppField>
  ```
- Pre-select the default agent from `useDefaultClarificationAgent()` hook
- Only show for planning workflows (not implementation)
- Conditionally hide when `skipClarification` is checked
- Pass `clarificationAgentId` to the workflow creation mutation

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dropdown shows all planning-type agents
- [ ] Default agent is pre-selected
- [ ] Field hidden when skipClarification is true
- [ ] Selected agent ID saved with workflow
- [ ] All validation commands pass

---

### Step 6: Update Workflow Step Creation to Include Agent ID

**What**: Ensure the clarification step is created with the selected agent ID.
**Why**: The step's `agentId` column stores which agent will execute this step.
**Confidence**: High
**Specialist Agent**: `database-schema`

**Files to Modify:**
- `db/repositories/workflow-steps.repository.ts` or relevant IPC handler - Ensure agentId is set on clarification step

**Changes:**
- When creating a clarification workflow step, include the `agentId` from the workflow creation data
- If no agent selected, fall back to:
  1. The default clarification agent setting
  2. Any active planning agent (first one found)
  3. Log warning if no planning agent available
- Ensure the step creation logic handles this for the `clarification` step type

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Clarification step created with correct agentId
- [ ] Fallback logic works when no explicit selection
- [ ] All validation commands pass

---

### Step 7: Create ClarificationStepService Core

**What**: Create the core service that orchestrates clarification, loading agent configuration dynamically.
**Why**: This service encapsulates all clarification logic with proper agent integration.
**Confidence**: High
**Specialist Agent**: `claude-agent-sdk`

**Files to Create:**
- `electron/services/clarification-step.service.ts` - Core orchestration service

**Changes:**
- Create ClarificationStepService class following singleton pattern
- Implement `loadAgentConfig(agentId)` method that:
  ```typescript
  async loadAgentConfig(agentId: number): Promise<ClarificationAgentConfig> {
    const agent = await agentsRepo.findById(agentId);
    const tools = await agentToolsRepo.findByAgentId(agentId);
    const skills = await agentSkillsRepo.findByAgentId(agentId);
    const hooks = await agentHooksRepo.findByAgentId(agentId);

    return {
      id: agent.id,
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      model: agent.model,
      permissionMode: agent.permissionMode,
      tools: tools.filter(t => !t.disallowedAt).map(t => ({
        toolName: t.toolName,
        toolPattern: t.toolPattern
      })),
      skills: skills.map(s => ({
        skillName: s.skillName,
        isRequired: s.requiredAt !== null
      })),
      hooks: hooks.map(h => ({
        eventType: h.eventType,
        body: h.body,
        matcher: h.matcher
      }))
    };
  }
  ```
- Implement `startClarification(options: ClarificationServiceOptions)` method that:
  - Loads agent config via `loadAgentConfig(options.agentId)`
  - Creates an AgentStreamService session using the agent's system prompt
  - Configures tools based on agent's allowed tools
  - Sets up MessagePort listeners for streaming
  - Configures timeout handling with AbortController
  - Returns a session identifier
- Implement `parseAgentOutput(text)` method for SKIP/QUESTIONS detection
- Implement `submitAnswers()`, `submitEdits()`, `skipClarification()`, `cancelClarification()` methods
- Implement internal state machine (exploring -> question_generation -> waiting -> refinement)
- Export singleton instance

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Service loads full agent configuration from database
- [ ] Agent's system prompt is used for the session
- [ ] Agent's tools are respected (only allowed tools enabled)
- [ ] Timeout handling implemented with configurable duration
- [ ] Output parsing correctly identifies both outcomes
- [ ] All validation commands pass

---

### Step 8: Add Clarification IPC Channel Definitions

**What**: Define new IPC channel constants for clarification operations.
**Why**: IPC channels must be defined in both channels.ts and preload.ts for main/renderer communication.
**Confidence**: High
**Specialist Agent**: `ipc-handler`

**Files to Modify:**
- `electron/ipc/channels.ts` - Add clarification channel definitions
- `electron/preload.ts` - Duplicate clarification channel definitions

**Changes:**
- Add `clarification` domain to IpcChannels object:
  ```typescript
  clarification: {
    getState: 'clarification:getState',
    retry: 'clarification:retry',
    skip: 'clarification:skip',
    start: 'clarification:start',
    submitAnswers: 'clarification:submitAnswers',
    submitEdits: 'clarification:submitEdits',
  }
  ```
- Duplicate in preload.ts IpcChannels constant

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Channel names follow `{domain}:{action}` pattern
- [ ] Both files have identical channel definitions
- [ ] Alphabetical ordering maintained
- [ ] All validation commands pass

---

### Step 9: Create Clarification IPC Handlers

**What**: Implement IPC handlers that bridge renderer requests to the ClarificationStepService.
**Why**: Handlers validate input, delegate to the service, and return typed responses.
**Confidence**: High
**Specialist Agent**: `ipc-handler`

**Files to Create:**
- `electron/ipc/clarification.ipc.ts` - IPC handlers for clarification channels

**Changes:**
- Create `registerClarificationHandlers(getMainWindow)` function
- Implement handler for `clarification:start`:
  - Validate workflowId, stepId parameters
  - **Look up the workflow step to get the agentId**
  - Call `clarificationStepService.startClarification()` with agentId
  - Return session identifier
- Implement handlers for `submitAnswers`, `submitEdits`, `skip`, `retry`, `getState`
- Add comprehensive error handling with try/catch and console logging

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Handlers follow existing patterns (agent-stream.handlers.ts)
- [ ] Start handler retrieves agentId from workflow step
- [ ] All parameters validated before service calls
- [ ] Error handling matches existing patterns
- [ ] All validation commands pass

---

### Step 10: Register Clarification Handlers and Update Types

**What**: Register handlers in central registration and update TypeScript types for ElectronAPI.
**Why**: Handlers must be registered at startup and types declared for renderer access.
**Confidence**: High
**Specialist Agent**: `ipc-handler`

**Files to Modify:**
- `electron/ipc/index.ts` - Register clarification handlers
- `electron/preload.ts` - Add clarification API methods
- `types/electron.d.ts` - Add clarification types to ElectronAPI

**Changes:**
- In index.ts: Import and call `registerClarificationHandlers(getMainWindow)`
- In preload.ts: Add `clarification` object to electronAPI with methods
- In electron.d.ts: Add interfaces and clarification property to ElectronAPI

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Handlers registered in correct order
- [ ] Preload API matches handler signatures
- [ ] TypeScript types enable full IntelliSense
- [ ] All validation commands pass

---

### Step 11: Add Audit Trail Integration

**What**: Integrate audit logging throughout the ClarificationStepService.
**Why**: Design document requires comprehensive audit trails for workflow traceability.
**Confidence**: High
**Specialist Agent**: `claude-agent-sdk`

**Files to Modify:**
- `electron/services/clarification-step.service.ts` - Add audit logging calls

**Changes:**
- Add audit logging for all significant events:
  - `clarification_started` - Include agentId, agent name, workflowId
  - `clarification_agent_loaded` - Log which agent config was loaded
  - `clarification_exploring`, `clarification_questions_generated`
  - `clarification_questions_edited`, `clarification_answers_submitted`
  - `clarification_skipped`, `clarification_timeout`, `clarification_error`
  - `clarification_completed` - Include outcome type, duration, agent used
- Use eventCategory: 'step' for all clarification events
- Include workflowId, workflowStepId, and agentId in all entries

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All clarification actions logged with agent context
- [ ] Audit entries include sufficient context for debugging
- [ ] Agent name and ID logged for traceability
- [ ] All validation commands pass

---

### Step 12: Create ClarificationStreaming Component

**What**: Create a React component that displays live agent output during exploration.
**Why**: Users need real-time feedback during codebase exploration.
**Confidence**: High
**Specialist Agent**: `frontend-component`

**Files to Create:**
- `components/workflows/clarification-streaming.tsx` - Live streaming display component

**Changes:**
- Create ClarificationStreaming component that:
  - Accepts sessionId, agentName, onQuestionsReady, onSkipReady, onError callbacks
  - Displays the agent name being used (e.g., "Clarification Agent is analyzing...")
  - Uses useAgentStream hook for state management
  - Displays streaming text output with auto-scroll
  - Shows thinking blocks in collapsible sections
  - Displays tool use indicators (Read, Grep, Glob) with file paths
  - Shows progress phases
  - Handles QUESTIONS_FOR_USER / SKIP_CLARIFICATION transitions
- Add loading, error, and cancel UI
- Follow CVA patterns for styling variants

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Component displays agent name being used
- [ ] Real-time streaming text displayed
- [ ] Tool use visually indicated
- [ ] Auto-scroll works correctly
- [ ] All validation commands pass

---

### Step 13: Integrate Streaming Component into Pipeline

**What**: Integrate ClarificationStreaming into PipelineView and PipelineStep.
**Why**: The streaming component displays within the pipeline when clarification runs.
**Confidence**: Medium
**Specialist Agent**: `frontend-component`

**Files to Modify:**
- `components/workflows/pipeline-view.tsx` - Add streaming state management
- `components/workflows/pipeline-step.tsx` - Handle streaming state display

**Changes:**
- In pipeline-view.tsx:
  - Add state for active clarification session
  - Start clarification when step becomes active (uses step's agentId automatically)
  - Handle questions ready / skip ready callbacks
  - Pass session state to PipelineStep
- In pipeline-step.tsx:
  - Add props for clarification session state
  - Conditional rendering: ClarificationStreaming when streaming, ClarificationForm when questions ready
  - Display agent name in status indicator

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Streaming component displays during exploration
- [ ] Smooth transition to ClarificationForm
- [ ] Agent name visible in step display
- [ ] All validation commands pass

---

### Step 14: Add "Make Default" Action to Agents Page

**What**: Add an action to set a planning agent as the default clarification agent.
**Why**: Provides a convenient way to set the default without navigating to settings.
**Confidence**: High
**Specialist Agent**: `frontend-component`

**Files to Modify:**
- `components/agents/agent-card-actions.tsx` or relevant agent actions component

**Changes:**
- Add "Make Default for Clarification" dropdown action:
  - Only visible for planning-type agents
  - Uses `useSetDefaultClarificationAgent()` mutation
  - Shows success toast on completion
  - Visual indicator if agent is currently the default (checkmark or badge)
- Consider adding to agent table row actions as well

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Action only appears for planning agents
- [ ] Setting updates correctly when clicked
- [ ] Current default is visually indicated
- [ ] Success feedback shown to user
- [ ] All validation commands pass

---

### Step 15: Add Pause Mode and Error Handling

**What**: Implement pause behavior support and comprehensive error handling with retry.
**Why**: Workflow system supports pause modes; users need clear recovery paths for errors.
**Confidence**: Medium
**Specialist Agent**: `claude-agent-sdk`

**Files to Modify:**
- `electron/services/clarification-step.service.ts` - Add pause mode and error handling
- `components/workflows/clarification-streaming.tsx` - Add retry UI

**Changes:**
- In service:
  - Read workflow's pauseBehavior from database
  - After completion, check if pause needed (AUTO_PAUSE pauses, others continue)
  - Return pause_requested flag in completion response
  - Track retry count per session
  - Implement exponential backoff for retries (max 3 attempts)
  - Provide skip fallback when retry limit reached
- In component:
  - Display error message with context
  - Show "Retry" and "Skip Clarification" buttons
  - Clear error state when retry succeeds

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Pause modes respected
- [ ] Transient errors auto-retry once
- [ ] Skip fallback always available
- [ ] Error messages are user-friendly
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Default clarification agent setting created and queryable
- [ ] Agent selection dropdown appears in workflow creation for planning workflows
- [ ] Selected agent's configuration (tools, skills, prompt) loaded at runtime
- [ ] ClarificationStepService correctly parses both SKIP_CLARIFICATION and QUESTIONS_FOR_USER
- [ ] Streaming display shows agent name and real-time output
- [ ] "Make Default" action works on agents page
- [ ] Timeout handling gracefully degrades to skip with audit logging
- [ ] Audit trail captures agent ID/name for all clarification events
- [ ] Manual testing: Create workflow with different agents, observe behavior differences

---

## Architectural Notes

### Agent Configuration Flow

```
1. User creates workflow, selects planning agent in dropdown
   └─> clarificationAgentId stored on workflow creation

2. Clarification step created with agentId from selection
   └─> workflow_steps.agentId = selected agent

3. When step runs, service loads full agent config:
   └─> agents table: systemPrompt, model, permissionMode
   └─> agent_tools table: allowed tools and patterns
   └─> agent_skills table: referenced skills
   └─> agent_hooks table: hook configurations

4. Service invokes Agent SDK with loaded configuration
   └─> Uses agent's system prompt
   └─> Respects agent's tool restrictions
   └─> Applies agent's permission mode
```

### Default Agent Resolution

```
Priority order when no explicit selection:
1. User's defaultClarificationAgentId setting
2. First active planning agent (by name, alphabetically)
3. Error state (no planning agents available)
```

### Key Differences from v1

| Aspect | v1 (Original) | v2 (This Plan) |
|--------|---------------|----------------|
| Agent Selection | Hardcoded `findByName('clarification-agent')` | User selects from dropdown |
| Configuration | Static, assumed | Dynamically loaded from DB |
| Default Agent | None | `defaultClarificationAgentId` setting |
| UI Integration | None | Dropdown in workflow creation |
| Audit Context | Basic | Includes agent ID and name |
| Agents Page | No changes | "Make Default" action added |

---

## Risk Mitigation

- **No Planning Agents**: Show warning in workflow creation if no planning agents exist
- **Agent Deleted**: If assigned agent is deleted, fall back to default or show error
- **Migration**: Existing workflows without agentId will use default resolution
- **Output Parsing**: Fallback to raw text display if JSON parsing fails
- **Timeout**: Always provides skip fallback to prevent blocking

---

## Testing Recommendations

1. Create multiple planning agents with different configurations
2. Set default agent, create workflow, verify pre-selection
3. Select different agent, verify its prompt/tools are used
4. Test "Make Default" action from agents page
5. Test fallback when no agent explicitly selected
6. Verify audit logs include agent information
7. Test with very short timeout (10s) to verify timeout handling
