# Implementation Plan: Agent Step Service Code Deduplication

**Generated**: 2026-02-04T00:06:00Z
**Original Request**: Duplication Analysis Report identifying 60-70% code duplication (~1,800-2,000 lines) across three agent step services
**Refined Request**: Refactor by introducing six shared modules in electron/services/agent-step directory

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

Eliminate 60-70% code duplication (~1,800-2,000 lines) across three agent step services by extracting six shared modules: AgentSdkExecutor, BaseAgentStepService, StepAuditLogger, StructuredOutputValidator, AgentTimeoutManager, and OutcomeBuilder. This refactoring will improve maintainability, reduce bugs, and establish consistent patterns for future agent steps.

## Prerequisites

- [ ] All tests passing for existing agent step services
- [ ] No active feature development in agent step services
- [ ] Backup/commit current working state

## Implementation Steps

### Step 1: Create AgentSdkExecutor Class (Highest Priority)

**What**: Extract SDK options building, tool configuration, query execution, and stream processing logic into a reusable class
**Why**: This is the largest duplication point (~600-700 lines saved) and unblocks other refactoring work
**Confidence**: High

**Files to Create:**

- `electron/services/agent-step/agent-sdk-executor.ts` - SDK execution orchestrator class with generic type parameters for step-specific configurations

**Changes:**

- Create `AgentSdkExecutor<TAgentConfig, TSession, TStreamMessage>` class
- Add `buildSdkOptions()` method that constructs SDK Options from agent config (lines 868-923 pattern from clarification service)
- Add `configureTools()` method for allowedTools and disallowedTools logic (identical across all three services)
- Add `configureExtendedThinking()` method for extended thinking setup with heartbeat management
- Add `executeQuery()` method that runs SDK query with stream event processing loop
- Add `processStreamEvent()` method extracted from all three services (100% identical logic for text_delta, thinking_delta, input_json_delta, content_block_start, content_block_stop)
- Export interface `SdkExecutorConfig<TAgentConfig>` with fields: agentConfig, repositoryPath, abortController, outputFormat schema
- Export interface `StreamEventHandlers<TStreamMessage>` with callbacks for phase changes and message emission

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] AgentSdkExecutor class compiles without TypeScript errors
- [ ] Generic type parameters allow step-specific customization
- [ ] Stream event processing logic handles all event types (text_delta, thinking_delta, input_json_delta, content_block_start/stop)
- [ ] Extended thinking heartbeat management integrated
- [ ] All validation commands pass

---

### Step 2: Create BaseAgentStepService Abstract Class

**What**: Extract common session management, retry tracking, config loading, and cancellation patterns into an abstract base class
**Why**: Provides foundational abstraction for all agent step services and eliminates 400-500 lines of duplication
**Confidence**: High

**Files to Create:**

- `electron/services/agent-step/base-agent-step-service.ts` - Abstract base class with template methods for session lifecycle

**Changes:**

- Create `BaseAgentStepService<TAgentConfig, TSession, TOptions, TPhase, TOutcome, TStreamMessage>` abstract class
- Add protected `activeSessions` Map for session tracking (identical across all services)
- Add protected `retryTracker` instance (identical across all services)
- Add public `getState()` method with abstract protected `extractState()` template method for step-specific state
- Add public `getRetryCount()` method delegating to retryTracker
- Add public `isRetryLimitReached()` method delegating to retryTracker
- Add public `loadAgentConfig()` method with 4-repository pattern (100% identical across services, lines 215-259)
- Add abstract protected `buildPrompt()` method for step-specific prompt construction
- Add abstract protected `processStructuredOutput()` method for step-specific output validation
- Add abstract protected `createSession()` method for step-specific session initialization
- Add protected `emitPhaseChange()` helper method (identical across all services)
- Add protected `setupTimeout()` method that creates timeout promise with abort logic (90% identical pattern)
- Add protected `cleanupSession()` method for session deletion and retry count clearing

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Abstract class compiles with proper generic type constraints
- [ ] Template method pattern clearly defined for step-specific customization
- [ ] Session management lifecycle methods extracted (create, cleanup, state extraction)
- [ ] Agent config loading uses 4-repository pattern
- [ ] All validation commands pass

---

### Step 3: Create StepAuditLogger Utility Class

**What**: Centralize audit logging calls into a dedicated utility class with step-specific event type mapping
**Why**: Eliminates 200-300 lines of repetitive audit logging code (8-10 calls per service)
**Confidence**: High

**Files to Create:**

- `electron/services/agent-step/step-audit-logger.ts` - Utility class for standardized audit logging

**Changes:**

- Create `StepAuditLogger` class with constructor accepting `stepName` parameter (e.g., 'clarification', 'refinement', 'file_discovery')
- Add `logStepStarted()` method with standard parameters (workflowId, stepId, agentId, eventData)
- Add `logAgentLoaded()` method for agent configuration load events
- Add `logStepExploring()` method for agent execution start events
- Add `logStepCompleted()` method for successful completion with outcome-specific data
- Add `logStepCancelled()` method for user cancellation events
- Add `logStepTimeout()` method for timeout events
- Add `logStepError()` method for error events with retry context
- Add `logRetryStarted()` method for retry attempt logging
- Add `logRetryLimitReached()` method for max retry warnings
- Each method should internally call `logAuditEntry()` from existing audit-log utility with consistent event type naming pattern (`${stepName}_${eventSuffix}`)

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] StepAuditLogger class compiles without errors
- [ ] All 10 standard audit event types covered
- [ ] Event type naming follows consistent pattern (stepName prefix)
- [ ] Integrates with existing `logAuditEntry()` from audit-log.ts
- [ ] All validation commands pass

---

### Step 4: Create StructuredOutputValidator Utility Class

**What**: Extract structured output validation logic into a reusable validator with Zod schema support
**Why**: Eliminates 150-200 lines of duplicate validation code and standardizes error handling
**Confidence**: High

**Files to Create:**

- `electron/services/agent-step/structured-output-validator.ts` - Generic validator for SDK structured outputs

**Changes:**

- Create `StructuredOutputValidator<TSchema>` class with constructor accepting Zod schema
- Add `validate()` method that takes `SDKResultMessage` and returns validated result or error
- Add error handling for `error_max_structured_output_retries` subtype (identical across services)
- Add error handling for non-success subtypes with error message extraction
- Add null check for missing structured_output field
- Add Zod schema validation using `safeParse()`
- Add debug logging integration for validation failures (uses sessionId parameter)
- Return discriminated union type: `{ success: true, data: TSchema } | { success: false, error: string }`
- Add optional `validateField()` helper for checking required fields on validated data

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] StructuredOutputValidator compiles with generic Zod schema support
- [ ] Handles all SDK result subtypes (success, error_max_structured_output_retries, other errors)
- [ ] Integrates with debug logger for validation failures
- [ ] Returns type-safe discriminated union
- [ ] All validation commands pass

---

### Step 5: Create AgentTimeoutManager Utility

**What**: Extract timeout promise creation and cleanup logic into a dedicated utility
**Why**: Eliminates 100-150 lines of timeout management code and standardizes timeout handling
**Confidence**: Medium

**Files to Create:**

- `electron/services/agent-step/agent-timeout-manager.ts` - Timeout promise orchestration utility

**Changes:**

- Create `TimeoutPromiseConfig<TOutcome>` interface with fields: timeoutSeconds, abortController, onTimeout callback returning TOutcome
- Create `createTimeoutPromise<TOutcome>()` function accepting TimeoutPromiseConfig
- Function creates Promise<TOutcome> that resolves after timeout with outcome from onTimeout callback
- Function checks `abortController.signal.aborted` before resolving to avoid race conditions
- Function stores timeout ID and provides cleanup mechanism
- Return object with structure: `{ promise: Promise<TOutcome>, timeoutId: ReturnType<typeof setTimeout>, cleanup: () => void }`
- Add `clearTimeoutSafely()` helper that accepts timeoutId and clears if not null

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] createTimeoutPromise function compiles with generic outcome type
- [ ] Handles abort signal checking to prevent duplicate timeout resolutions
- [ ] Provides cleanup mechanism for timeout cancellation
- [ ] Returns structured result with promise, timeoutId, and cleanup function
- [ ] All validation commands pass

---

### Step 6: Create OutcomeBuilder Factory Utility

**What**: Extract pause request checking and outcome augmentation logic into a factory function
**Why**: Eliminates 80-100 lines of outcome building code and standardizes pause info attachment
**Confidence**: High

**Files to Create:**

- `electron/services/agent-step/outcome-builder.ts` - Factory for building outcomes with pause information

**Changes:**

- Create `buildOutcomeWithPauseInfo<TOutcome, TUsage>()` function
- Function parameters: baseOutcome (TOutcome), workflowId (number), isGateStep (boolean), executeResult ({ sdkSessionId?: string, usage?: TUsage })
- Function calls `isPauseRequested(workflowId, isGateStep)` from workflow-pause utility
- Function merges baseOutcome with OutcomePauseInfo fields: pauseRequested, retryCount (0 for new executions), sdkSessionId, usage, skipFallbackAvailable
- Return type: `TOutcome & OutcomePauseInfo<TUsage>`
- Add `buildErrorOutcomeWithRetry<TOutcome>()` helper for error outcomes with retry context

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] buildOutcomeWithPauseInfo function compiles with generic outcome and usage types
- [ ] Integrates isPauseRequested logic correctly
- [ ] Attaches all OutcomePauseInfo fields to base outcome
- [ ] Provides helper for error outcomes with retry information
- [ ] All validation commands pass

---

### Step 7: Refactor Clarification Service to Use Shared Abstractions

**What**: Incrementally refactor clarification-step.service.ts to use the new shared modules
**Why**: Validates shared abstractions work correctly with first concrete implementation
**Confidence**: Medium

**Files to Modify:**

- `electron/services/clarification-step.service.ts` - Refactor to extend BaseAgentStepService and use shared utilities

**Changes:**

- Modify `ClarificationStepService` to extend `BaseAgentStepService<ClarificationAgentConfig, ActiveClarificationSession, ClarificationServiceOptions, ClarificationServicePhase, ClarificationOutcome, ClarificationStreamMessage>`
- Remove `activeSessions` and `retryTracker` fields (inherited from base)
- Remove `loadAgentConfig()` method (inherited from base)
- Remove `getRetryCount()` and `isRetryLimitReached()` methods (inherited from base)
- Implement abstract `buildPrompt()` method with existing `buildClarificationPrompt()` logic
- Implement abstract `processStructuredOutput()` using `StructuredOutputValidator` with clarificationAgentOutputFlatSchema
- Implement abstract `createSession()` method with clarification-specific session initialization
- Implement abstract `extractState()` method returning ClarificationServiceState
- Refactor `executeAgent()` to use `AgentSdkExecutor` for SDK options building and query execution
- Replace direct `processStreamEvent()` calls with AgentSdkExecutor delegation
- Replace audit logging calls with `StepAuditLogger` instance (created in constructor with 'clarification' step name)
- Replace timeout promise creation with `createTimeoutPromise()` from AgentTimeoutManager
- Replace outcome building logic with `buildOutcomeWithPauseInfo()` from OutcomeBuilder
- Keep `cancelClarification()`, `skipClarification()`, `retryClarification()`, `submitAnswers()`, and `submitEdits()` as clarification-specific public methods

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Service extends BaseAgentStepService successfully
- [ ] All abstract methods implemented with clarification-specific logic
- [ ] Shared utilities integrated (AgentSdkExecutor, StepAuditLogger, StructuredOutputValidator, AgentTimeoutManager, OutcomeBuilder)
- [ ] Existing public API unchanged (backwards compatible)
- [ ] Line count reduced by approximately 400-500 lines
- [ ] All validation commands pass

---

### Step 8: Refactor Refinement Service to Use Shared Abstractions

**What**: Refactor refinement-step.service.ts to use the new shared modules (second validation)
**Why**: Confirms shared abstractions work for different step types with different outcome structures
**Confidence**: Medium

**Files to Modify:**

- `electron/services/refinement-step.service.ts` - Refactor to extend BaseAgentStepService and use shared utilities

**Changes:**

- Modify `RefinementStepService` to extend `BaseAgentStepService<RefinementAgentConfig, ActiveRefinementSession, RefinementServiceOptions, RefinementServicePhase, RefinementOutcome, RefinementStreamMessage>`
- Remove duplicated base class methods (same pattern as Step 7)
- Implement abstract methods with refinement-specific logic (buildPrompt, processStructuredOutput, createSession, extractState)
- Refactor `executeAgent()` to use `AgentSdkExecutor`
- Replace audit logging with `StepAuditLogger('refinement')`
- Replace timeout and outcome building with shared utilities
- Keep `cancelRefinement()` and `retryRefinement()` as refinement-specific public methods
- Update `processStructuredOutput()` to use `StructuredOutputValidator` with refinementAgentOutputFlatSchema

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Service extends BaseAgentStepService successfully
- [ ] Refinement-specific prompt building preserves clarificationContext formatting
- [ ] SUCCESS outcome type handled correctly (different from clarification's SKIP_CLARIFICATION/QUESTIONS_FOR_USER)
- [ ] Line count reduced by approximately 400-500 lines
- [ ] Existing public API unchanged
- [ ] All validation commands pass

---

### Step 9: Refactor File Discovery Service to Use Shared Abstractions

**What**: Refactor file-discovery.service.ts to use the new shared modules (final validation with most complex service)
**Why**: Confirms abstractions handle additional features like re-discovery modes and partial results saving
**Confidence**: Medium

**Files to Modify:**

- `electron/services/file-discovery.service.ts` - Refactor to extend BaseAgentStepService and use shared utilities

**Changes:**

- Modify `FileDiscoveryStepService` to extend `BaseAgentStepService<FileDiscoveryAgentConfig, ActiveFileDiscoverySession, FileDiscoveryServiceOptions, FileDiscoveryServicePhase, FileDiscoveryOutcome, FileDiscoveryStreamMessage>`
- Remove duplicated base class methods (same pattern as Steps 7-8)
- Implement abstract methods with file-discovery-specific logic
- Refactor `executeAgent()` to use `AgentSdkExecutor`
- Replace audit logging with `StepAuditLogger('file_discovery')`
- Replace timeout and outcome building with shared utilities
- Keep file-discovery-specific methods: `cancelDiscovery()`, `retryDiscovery()`, `clearExistingDiscoveredFiles()`, `saveDiscoveredFiles()`
- Update `processStructuredOutput()` to use `StructuredOutputValidator` with fileDiscoveryAgentOutputSchema
- Preserve rediscoveryMode logic and partial result saving on timeout/cancellation

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Service extends BaseAgentStepService successfully
- [ ] Re-discovery modes (replace/additive) continue working correctly
- [ ] Partial results saving on timeout/cancellation preserved
- [ ] File discovered stream messages still emitted during execution
- [ ] Line count reduced by approximately 400-500 lines
- [ ] Existing public API unchanged
- [ ] All validation commands pass

---

### Step 10: Update Type Exports and Documentation

**What**: Update type exports and add comprehensive documentation for the new shared module architecture
**Why**: Ensures other developers understand the new patterns and can create new agent steps consistently
**Confidence**: High

**Files to Modify:**

- `electron/services/agent-step/index.ts` - Add exports for all new shared modules
- `electron/services/agent-step/README.md` - Create documentation for shared module architecture

**Files to Create:**

- `electron/services/agent-step/README.md` - Architecture documentation

**Changes:**

- Update `index.ts` to export: BaseAgentStepService, AgentSdkExecutor, StepAuditLogger, StructuredOutputValidator, createTimeoutPromise, buildOutcomeWithPauseInfo
- Create `README.md` with sections: Architecture Overview, BaseAgentStepService Usage, Creating New Agent Steps, Shared Utilities Reference, Migration Guide
- Document template method pattern for BaseAgentStepService
- Document AgentSdkExecutor configuration options
- Document StepAuditLogger event types
- Provide code examples for creating new agent step services using the abstractions
- Add migration notes explaining the refactoring and benefits

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All new modules exported from index.ts
- [ ] README.md includes architecture diagrams (text-based)
- [ ] Code examples for creating new agent steps provided
- [ ] Migration guide explains changes and benefits
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Existing agent step service tests still pass (if tests exist)
- [ ] Line count reduced by approximately 1,800-2,000 lines across the three services
- [ ] No breaking changes to public APIs of the three services
- [ ] Manual testing: Run workflow with clarification, refinement, and file discovery steps end-to-end
- [ ] Manual testing: Test retry logic with simulated failures
- [ ] Manual testing: Test timeout behavior
- [ ] Manual testing: Test cancellation during agent execution

## Notes

**Critical Assumptions:**

- The three services share 60-70% code duplication as stated (validated by file analysis)
- No other services currently depend on internal implementation details of these services
- TypeScript strict mode is enabled (inferred from codebase patterns)
- All agent step services will eventually follow this pattern (extensibility goal)

**Risk Mitigation:**

- Incremental refactoring (Steps 7-9) allows validation at each stage
- Existing public APIs remain unchanged to prevent breaking changes
- BaseAgentStepService uses template method pattern for safe extensibility
- Each step includes validation commands to catch type errors early

**Future Extensibility:**

- New agent steps can extend BaseAgentStepService with minimal boilerplate
- AgentSdkExecutor can be enhanced with additional stream event types
- StepAuditLogger can add new event types without changing existing services
- StructuredOutputValidator supports any Zod schema for new output formats

**Performance Considerations:**

- Query function caching already implemented in agent-sdk.ts (no performance regression)
- Session management remains in-memory Map (unchanged)
- Audit logging errors already non-blocking (unchanged)
- No new asynchronous operations introduced

---

## File Discovery Results Summary

**Critical Files (3)**:
- electron/services/clarification-step.service.ts (1,417 lines)
- electron/services/refinement-step.service.ts (1,150 lines)
- electron/services/file-discovery.service.ts (1,582 lines)

**Infrastructure Files (10)**:
- electron/services/agent-step/step-types.ts
- electron/services/agent-step/retry-backoff.ts
- electron/services/agent-step/audit-log.ts
- electron/services/agent-step/agent-sdk.ts
- electron/services/agent-step/usage-stats.ts
- electron/services/agent-step/workflow-pause.ts
- db/repositories/agents.repository.ts
- db/repositories/agent-tools.repository.ts
- db/repositories/agent-skills.repository.ts
- db/repositories/agent-hooks.repository.ts

**Key Duplication Patterns (20+)**:
1. Session management (Map, AbortController, timeout) - 100% identical
2. Agent config loading (4 repositories) - 100% identical
3. SDK options building - 95% match
4. Stream event processing - 100% identical
5. Structured output validation - 95% match
6. Retry with backoff - 100% identical
7. Audit logging - 90% match
8. Tool configuration - 100% identical
9. Timeout promise - 90% match
10. Cancellation logic - 90% match
...and 10 more patterns

---

**Generated with /plan-feature workflow**
**Orchestration logs**: docs/2026_02_04/orchestration/consolidate-agent-step-services/
