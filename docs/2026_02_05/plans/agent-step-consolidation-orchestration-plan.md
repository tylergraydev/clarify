# Agent Step Services Consolidation - Orchestration Plan

**Date:** 2026-02-05
**Branch:** `feat/consolidate-agent-step-services`
**Orchestration Model:** Main agent as delegator, subagents as implementers

---

## Executive Summary

This plan outlines a 10-phase consolidation of three agent step services (clarification, refinement, file discovery) to eliminate ~1,210 lines of duplicate code (~62% reduction). The main Claude Code agent will orchestrate the work by delegating to specialized subagents while maintaining a clean context focused on coordination and validation.

**Target Metrics:**
- Current: 3,216 lines across 3 services
- Target: ~2,361 lines
- Savings: ~855 lines (26% reduction)

---

## Orchestration Principles

### Main Agent Responsibilities
1. **Delegate tasks** to appropriate subagents with clear instructions
2. **Review outputs** at designated checkpoints
3. **Coordinate dependencies** between phases
4. **Track progress** using TodoWrite for visibility
5. **Never write code directly** - only orchestrate

### Subagent Types to Use
| Task Type | Subagent |
|-----------|----------|
| Type definitions, interfaces | `claude-agent-sdk` |
| Base class enhancements | `claude-agent-sdk` |
| Utility extraction | `claude-agent-sdk` |
| Service refactoring | `claude-agent-sdk` |
| Code review | `Explore` agent with review prompt |
| Validation (lint/typecheck) | `Bash` agent |

### Review Checkpoints
Reviews occur after each phase to catch drift early:
- **Automated:** `pnpm lint && pnpm typecheck` after every phase
- **Manual Review:** After Phases 2, 4, 6, and 10 (major structural changes)

---

## Phase Overview

| Phase | Description | Dependencies | Review |
|-------|-------------|--------------|--------|
| 1 | Pre-flight validation | None | Auto |
| 2 | Enhance BaseActiveSession interface | Phase 1 | Manual |
| 3 | Add cancel template method to base class | Phase 2 | Auto |
| 4 | Add retry template method to base class | Phase 3 | Manual |
| 5 | Extract start method initialization block | Phase 4 | Auto |
| 6 | Extract start method error handling | Phase 5 | Manual |
| 7 | Add stream event hook to AgentSdkExecutor | Phase 6 | Auto |
| 8 | Migrate file discovery to use AgentSdkExecutor | Phase 7 | Auto |
| 9 | Consolidate outcome type definitions | Phase 8 | Auto |
| 10 | Final cleanup and validation | Phase 9 | Manual |

---

## Phase 1: Pre-flight Validation

**Objective:** Ensure codebase is in a clean state before starting

### Orchestrator Actions
1. Delegate to `Bash` agent to run validation commands
2. Verify all tests pass (if tests exist)
3. Confirm no uncommitted changes that would interfere

### Subagent Task
```
Run the following commands and report results:
1. pnpm lint
2. pnpm typecheck
3. git status (verify clean working tree)
```

### Success Criteria
- [ ] Lint passes with no errors
- [ ] TypeScript compilation succeeds
- [ ] No conflicting uncommitted changes

### Estimated Duration
Quick check - single subagent invocation

---

## Phase 2: Enhance BaseActiveSession Interface

**Objective:** Extend `step-types.ts` with additional shared fields identified in duplication analysis

### Current State
`BaseActiveSession` in `step-types.ts:32-51` already has:
- `abortController`, `activeTools`, `agentConfig`, `options`, `phase`
- `sessionId`, `streamingText`, `thinkingBlocks`, `timeoutId`

### Changes Needed
The interface is already comprehensive. This phase focuses on:
1. Adding type alias exports for outcome/pause combinations
2. Ensuring all three services correctly extend `BaseActiveSession`

### Orchestrator Actions
1. Delegate to `claude-agent-sdk` agent:
   - Add `StepOutcomeWithPause<TOutcome, TUsage>` type alias
   - Add `StepOutcomePauseInfo<TUsage>` type alias
   - Verify interface is exported from `index.ts`

### Subagent Task
```
File: electron/services/agent-step/step-types.ts

Add these type aliases after the existing types:

/**
 * Type alias for outcomes combined with pause information.
 * Used by all step services to create their OutcomeWithPause types.
 */
export type StepOutcomeWithPause<TOutcome, TUsage = unknown> =
  TOutcome & OutcomePauseInfo<TUsage>;

/**
 * Type alias for step-specific outcome pause info.
 * Convenience re-export for services.
 */
export type StepOutcomePauseInfo<TUsage = unknown> = OutcomePauseInfo<TUsage>;

Then update index.ts to export these new types.

Run lint and typecheck after changes.
```

### Success Criteria
- [ ] New type aliases added to `step-types.ts`
- [ ] Types exported from `index.ts`
- [ ] Lint passes
- [ ] TypeScript compilation succeeds

### Review Checkpoint: MANUAL REVIEW
Verify type definitions are correct and match the pattern used across all three services.

---

## Phase 3: Add Cancel Template Method to Base Class

**Objective:** Extract the duplicated cancel logic (~45 lines × 3 = 135 lines) into `BaseAgentStepService`

### Duplication Pattern (from analysis)
All three services have near-identical cancel methods:
- `clarification-step.service.ts:125-168` (`cancelClarification`)
- `refinement-step.service.ts:129-172` (`cancelRefinement`)
- `file-discovery.service.ts:521-573` (`cancelDiscovery`)

### Shared Logic (~90% identical)
1. Check session existence, return ERROR if not found
2. Log session cancel via `debugLoggerService.logSession()`
3. Call `auditLogger.logStepCancelled()`
4. Clear timeout if active
5. Abort the SDK operation
6. Set phase to 'cancelled'
7. Cleanup session
8. Return CANCELLED outcome

### Differences to Handle
- File discovery saves partial results before cleanup
- Return object has step-specific fields

### Orchestrator Actions
1. Delegate to `claude-agent-sdk` agent to add template method to base class
2. Delegate to update clarification service to use template method
3. Delegate to update refinement service to use template method
4. Delegate to update file discovery service to use template method

### Subagent Task (Base Class)
```
File: electron/services/agent-step/base-agent-step-service.ts

Add a protected template method for cancel operations:

/**
 * Cancel an active session with standardized cleanup.
 *
 * Template method that handles common cancel logic:
 * 1. Session existence check
 * 2. Audit logging
 * 3. Timeout cleanup
 * 4. Abort signal
 * 5. Phase update
 * 6. Session cleanup
 *
 * Subclasses implement:
 * - getStepName(): Returns step name for logging (e.g., 'clarification')
 * - buildCancelledOutcome(session): Returns step-specific cancelled outcome
 * - onBeforeCancel?(session): Optional hook for pre-cancel actions (e.g., save partial results)
 */
protected async cancelSession(
  workflowId: number,
  auditLogger: StepAuditLogger,
  onStreamMessage?: (message: TStreamMessage) => void
): Promise<TOutcome> {
  const session = this.activeSessions.get(workflowId);

  if (!session) {
    debugLoggerService.logSession(
      'unknown',
      `${this.getStepName()} cancel - no active session`,
      { workflowId }
    );
    return this.buildNotFoundErrorOutcome(workflowId);
  }

  debugLoggerService.logSession(
    session.sessionId,
    `${this.getStepName()} session cancelled`,
    { workflowId }
  );

  auditLogger.logStepCancelled(workflowId, session.sessionId);

  // Clear timeout if active
  if (session.timeoutId) {
    clearTimeout(session.timeoutId);
  }

  // Abort the SDK operation
  session.abortController.abort();

  // Allow subclass to perform pre-cancel actions
  await this.onBeforeCancel?.(session);

  // Update phase to cancelled
  session.phase = 'cancelled' as TPhase;
  this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

  // Build step-specific cancelled outcome
  const outcome = this.buildCancelledOutcome(session);

  // Cleanup
  this.cleanupSession(workflowId);

  return outcome;
}

// Abstract methods for subclasses to implement:
protected abstract getStepName(): string;
protected abstract buildCancelledOutcome(session: TSession): TOutcome;
protected abstract buildNotFoundErrorOutcome(workflowId: number): TOutcome;
protected onBeforeCancel?(session: TSession): Promise<void> | void;
```

### Subagent Task (Service Updates)
For each service, replace the cancel method with a call to the base class:
```
Example for clarification-step.service.ts:

// Replace the entire cancelClarification method body with:
async cancelClarification(
  workflowId: number,
  onStreamMessage?: (message: ClarificationStreamMessage) => void
): Promise<ClarificationOutcome> {
  return this.cancelSession(workflowId, this.auditLogger, onStreamMessage);
}

// Implement the abstract methods:
protected getStepName(): string {
  return 'clarification';
}

protected buildCancelledOutcome(session: ActiveClarificationSession): ClarificationOutcome {
  return {
    questions: session.questions ?? [],
    skipReason: null,
    type: 'CANCELLED',
  };
}

protected buildNotFoundErrorOutcome(workflowId: number): ClarificationOutcome {
  return {
    errorMessage: `No active clarification session for workflow ${workflowId}`,
    type: 'ERROR',
  };
}
```

### Success Criteria
- [ ] Template method added to `BaseAgentStepService`
- [ ] All three services updated to use template method
- [ ] Abstract methods implemented in each service
- [ ] Lint passes
- [ ] TypeScript compilation succeeds

---

## Phase 4: Add Retry Template Method to Base Class

**Objective:** Extract the duplicated retry logic (~50 lines × 3 = 150 lines) into `BaseAgentStepService`

### Duplication Pattern (from analysis)
All three services have identical retry structure (~95% similar):
- `clarification-step.service.ts:179-229` (`retryClarification`)
- `refinement-step.service.ts:183-233` (`retryRefinement`)
- `file-discovery.service.ts:594-644` (`retryDiscovery`)

### Shared Logic
1. Check retry limit via `isRetryLimitReached()`
2. Log retry limit reached if hit
3. Return ERROR with max retry message if limit hit
4. Increment retry count
5. Calculate backoff delay
6. Log retry start
7. Wait for backoff delay
8. Call start method (polymorphic)
9. Return outcome with updated retry count

### Orchestrator Actions
1. Delegate to `claude-agent-sdk` agent to add retry template method to base class
2. Delegate to update each service to use the template method

### Subagent Task (Base Class)
```
File: electron/services/agent-step/base-agent-step-service.ts

Add protected retry template method:

/**
 * Retry an agent step with exponential backoff.
 *
 * Template method implementing common retry logic:
 * 1. Check retry limit
 * 2. Increment retry count
 * 3. Calculate and wait for backoff delay
 * 4. Call step's start method
 *
 * @param workflowId - The workflow ID
 * @param options - Service options for the retry
 * @param startMethod - The start method to call (bound to this)
 * @param auditLogger - The step's audit logger
 * @param onStreamMessage - Optional stream callback
 * @returns The outcome with retry count
 */
protected async retrySession<TOutcomeWithPause extends TOutcome & { retryCount?: number }>(
  workflowId: number,
  options: TOptions,
  startMethod: (options: TOptions, onStreamMessage?: (message: TStreamMessage) => void) => Promise<TOutcomeWithPause>,
  auditLogger: StepAuditLogger,
  onStreamMessage?: (message: TStreamMessage) => void
): Promise<TOutcomeWithPause> {
  const stepName = this.getStepName();

  // Check retry limit
  if (this.isRetryLimitReached(workflowId)) {
    debugLoggerService.logSdkEvent('system', `${stepName} retry limit reached`, {
      currentRetries: this.getRetryCount(workflowId),
      maxRetries: MAX_RETRY_ATTEMPTS,
      workflowId,
    });

    auditLogger.logRetryLimitReached(workflowId, MAX_RETRY_ATTEMPTS);

    return this.buildMaxRetryErrorOutcome(workflowId) as TOutcomeWithPause;
  }

  // Increment retry count
  this.retryTracker.incrementRetryCount(workflowId.toString());
  const retryCount = this.getRetryCount(workflowId);

  // Calculate backoff delay
  const backoffDelay = calculateBackoffDelay(retryCount);

  debugLoggerService.logSdkEvent('system', `${stepName} retry starting`, {
    backoffDelayMs: backoffDelay,
    retryCount,
    workflowId,
  });

  auditLogger.logRetryStarted(workflowId, retryCount, backoffDelay);

  // Wait for backoff
  await new Promise((resolve) => setTimeout(resolve, backoffDelay));

  // Call the start method
  const outcome = await startMethod(options, onStreamMessage);

  // Add retry count to outcome
  return {
    ...outcome,
    retryCount,
  };
}

// Add abstract method for max retry error outcome
protected abstract buildMaxRetryErrorOutcome(workflowId: number): TOutcome;
```

### Success Criteria
- [ ] Template method added to `BaseAgentStepService`
- [ ] All three services updated to use template method
- [ ] Lint passes
- [ ] TypeScript compilation succeeds

### Review Checkpoint: MANUAL REVIEW
Verify retry logic is correctly extracted and services are properly delegating.

---

## Phase 5: Extract Start Method Initialization Block

**Objective:** Extract the common initialization logic from start methods (~30 lines × 3 = 90 lines)

### Duplication Pattern
All three services have identical initialization blocks:
- `clarification-step.service.ts:306-332`
- `refinement-step.service.ts:248-276`
- `file-discovery.service.ts:653-686`

### Shared Logic
1. Extract workflowId and timeoutSeconds from options
2. Initialize session via `createSession()`
3. Store session in `activeSessions` Map
4. Log session start
5. Log step started via audit logger

### Orchestrator Actions
1. Delegate to `claude-agent-sdk` agent to add initialization helper to base class
2. Delegate to update services to use the helper

### Subagent Task
```
File: electron/services/agent-step/base-agent-step-service.ts

Add protected initialization helper:

/**
 * Initialize a new session for a step operation.
 *
 * Common initialization logic:
 * 1. Create session via template method
 * 2. Store in activeSessions
 * 3. Log session start
 * 4. Log step started audit event
 *
 * @returns The initialized session and extracted options
 */
protected initializeSession(
  options: TOptions,
  auditLogger: StepAuditLogger,
  metadata?: Record<string, unknown>
): { session: TSession; sessionId: string; timeoutSeconds: number; workflowId: number } {
  const { workflowId, timeoutSeconds = STEP_TIMEOUTS[this.getStepName() as keyof typeof STEP_TIMEOUTS] ?? 300 } = options;

  const session = this.createSession(workflowId, options);
  this.activeSessions.set(workflowId, session);

  debugLoggerService.logSession(session.sessionId, `${this.getStepName()} session started`, {
    workflowId,
    ...metadata,
  });

  auditLogger.logStepStarted(workflowId, session.sessionId, metadata);

  return {
    session,
    sessionId: session.sessionId,
    timeoutSeconds,
    workflowId,
  };
}
```

### Success Criteria
- [ ] Helper method added to `BaseAgentStepService`
- [ ] All three services updated to use helper
- [ ] Lint passes
- [ ] TypeScript compilation succeeds

---

## Phase 6: Extract Start Method Error Handling

**Objective:** Extract the common error handling logic from start method catch blocks (~40 lines × 3 = 120 lines)

### Duplication Pattern
All three services have identical error handling:
- `clarification-step.service.ts:428-467`
- `refinement-step.service.ts:372-411`
- `file-discovery.service.ts:790-839`

### Shared Logic
1. Set phase to 'error', emit phase change
2. Extract error message and stack
3. Get retry count
4. Check if error is transient
5. Check retry limit
6. Log error via debug logger and audit logger
7. Delete session from activeSessions
8. Return error outcome via `buildErrorOutcomeWithRetry()`

### Orchestrator Actions
1. Delegate to `claude-agent-sdk` agent to add error handler utility
2. Delegate to update services to use utility

### Subagent Task
```
File: electron/services/agent-step/step-error-handler.ts (NEW FILE)

Create a new utility for handling step errors:

/**
 * Step Error Handler
 *
 * Standardized error handling for agent step services.
 * Extracts common error processing logic from catch blocks.
 */

import { debugLoggerService } from '../debug-logger.service';
import { buildErrorOutcomeWithRetry } from './outcome-builder';
import { isTransientError } from './retry-backoff';
import type { StepAuditLogger } from './step-audit-logger';

export interface StepErrorContext {
  auditLogger: StepAuditLogger;
  error: unknown;
  getRetryCount: () => number;
  isRetryLimitReached: () => boolean;
  sessionId: string;
  stepName: string;
  workflowId: number;
}

export interface StepErrorResult<TOutcome> {
  errorMessage: string;
  errorStack?: string;
  outcome: TOutcome;
}

/**
 * Handle an error in a step operation.
 *
 * Performs standardized error processing:
 * 1. Extract error message and stack
 * 2. Check retry eligibility
 * 3. Log error details
 * 4. Build error outcome with retry info
 */
export function handleStepError<TOutcome extends { type: string }>(
  context: StepErrorContext,
  buildOutcome: (params: {
    canRetry: boolean;
    errorMessage: string;
    errorStack?: string;
    retryCount: number;
  }) => TOutcome
): StepErrorResult<TOutcome> {
  const { auditLogger, error, getRetryCount, isRetryLimitReached, sessionId, stepName, workflowId } = context;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const retryCount = getRetryCount();
  const transientError = isTransientError(error);
  const canRetry = transientError && !isRetryLimitReached();

  debugLoggerService.logSdkEvent(sessionId, `${stepName} error occurred`, {
    canRetry,
    errorMessage,
    errorStack,
    isTransient: transientError,
    retryCount,
    workflowId,
  });

  auditLogger.logStepError(workflowId, sessionId, errorMessage, {
    canRetry,
    retryCount,
    stack: errorStack,
  });

  const outcome = buildOutcome({
    canRetry,
    errorMessage,
    errorStack,
    retryCount,
  });

  return { errorMessage, errorStack, outcome };
}

Update index.ts to export the new utility.
```

### Success Criteria
- [ ] New `step-error-handler.ts` utility created
- [ ] Utility exported from `index.ts`
- [ ] All three services updated to use utility
- [ ] Lint passes
- [ ] TypeScript compilation succeeds

### Review Checkpoint: MANUAL REVIEW
Verify error handling is correctly centralized and no edge cases are lost.

---

## Phase 7: Add Stream Event Hook to AgentSdkExecutor

**Objective:** Enable custom stream event handling for file discovery's `file_discovered` events (~130 lines)

### Current State
- `AgentSdkExecutor` handles stream events internally
- File discovery duplicates stream processing because it needs to emit custom `file_discovered` events
- This prevents file discovery from using `AgentSdkExecutor`

### Changes Needed
Add a hook callback to `StreamEventHandlers` for custom event processing:

```typescript
interface StreamEventHandlers<TStreamMessage> {
  onMessageEmit?: (message: TStreamMessage) => void;
  onPhaseChange?: (phase: string) => void;
  // NEW: Hook for custom stream event processing
  onCustomStreamEvent?: (event: Record<string, unknown>, session: TSession) => void;
}
```

### Orchestrator Actions
1. Delegate to `claude-agent-sdk` agent to enhance `AgentSdkExecutor`

### Subagent Task
```
File: electron/services/agent-step/agent-sdk-executor.ts

1. Add onCustomStreamEvent to StreamEventHandlers interface:

export interface StreamEventHandlers<TStreamMessage, TSession extends BaseSession = BaseSession> {
  onCustomStreamEvent?: (event: Record<string, unknown>, session: TSession) => void;
  onMessageEmit?: (message: TStreamMessage) => void;
  onPhaseChange?: (phase: string) => void;
}

2. Update processStreamEvent to call the hook:

processStreamEvent(
  session: TSession,
  message: { event: Record<string, unknown>; type: 'stream_event' },
  handlers: StreamEventHandlers<TStreamMessage, TSession>
): void {
  const event = message.event;

  // Call custom handler first to allow custom processing
  if (handlers.onCustomStreamEvent) {
    handlers.onCustomStreamEvent(event, session);
  }

  // ... rest of existing processing
}

3. Update executeQuery signature to pass full handlers to processStreamEvent.

Run lint and typecheck after changes.
```

### Success Criteria
- [ ] `StreamEventHandlers` interface updated with hook
- [ ] `processStreamEvent` calls the hook
- [ ] `executeQuery` passes handlers correctly
- [ ] Lint passes
- [ ] TypeScript compilation succeeds

---

## Phase 8: Migrate File Discovery to Use AgentSdkExecutor

**Objective:** Replace manual SDK usage in file discovery with `AgentSdkExecutor` (~150 lines saved)

### Current State
- File discovery has manual stream processing in `processStreamEventForFileDiscovery`
- It manually manages heartbeat, tool tracking, etc.
- This duplicates functionality already in `AgentSdkExecutor`

### Migration Strategy
1. Create a custom stream event handler for `file_discovered` events
2. Replace manual SDK calls with `AgentSdkExecutor.executeQuery()`
3. Remove duplicated stream processing code
4. Remove manual heartbeat management (handled by executor)

### Orchestrator Actions
1. Delegate to `claude-agent-sdk` agent to refactor file discovery service

### Subagent Task
```
File: electron/services/file-discovery.service.ts

1. Add instance variable for AgentSdkExecutor:
   private sdkExecutor = new AgentSdkExecutor<FileDiscoveryAgentConfig, ActiveFileDiscoverySession, FileDiscoveryStreamMessage>();

2. Create custom stream event handler for file_discovered events:
   private handleCustomStreamEvent(
     event: Record<string, unknown>,
     session: ActiveFileDiscoverySession,
     onStreamMessage?: (message: FileDiscoveryStreamMessage) => void
   ): void {
     // Check for file_discovered events in tool results
     // This is the unique logic file discovery needs
     // ... extract file discovery logic from processStreamEventForFileDiscovery
   }

3. Replace executeAgent's manual SDK calls with:
   const result = await this.sdkExecutor.executeQuery(
     session,
     config,
     prompt,
     {
       onCustomStreamEvent: (event, sess) =>
         this.handleCustomStreamEvent(event, sess, onStreamMessage),
       onMessageEmit: onStreamMessage,
       onPhaseChange: (phase) => {
         session.phase = phase as FileDiscoveryServicePhase;
       },
     }
   );

4. Remove:
   - processStreamEventForFileDiscovery method (most of it)
   - Manual heartbeat start/stop code
   - Duplicated stream event processing

Run lint and typecheck after changes.
```

### Success Criteria
- [ ] File discovery uses `AgentSdkExecutor`
- [ ] Custom stream event handler for file_discovered events
- [ ] Manual stream processing removed
- [ ] Manual heartbeat management removed
- [ ] All functionality preserved
- [ ] Lint passes
- [ ] TypeScript compilation succeeds

---

## Phase 9: Consolidate Outcome Type Definitions

**Objective:** Unify the outcome type patterns across services (~15 lines × 3 = 45 lines)

### Current State
Each service defines its own type aliases:
```typescript
// clarification-step.service.ts:65-70
export type ClarificationOutcomePauseInfo = OutcomePauseInfo<ClarificationUsageStats>;
export type ClarificationOutcomeWithPause = ClarificationOutcome & ClarificationOutcomePauseInfo;

// refinement-step.service.ts:69-74
export type RefinementOutcomePauseInfo = OutcomePauseInfo<RefinementUsageStats>;
export type RefinementOutcomeWithPause = RefinementOutcome & RefinementOutcomePauseInfo;

// file-discovery.service.ts:192-228
// Similar pattern
```

### Changes Needed
Use the generic types from Phase 2:
```typescript
import { StepOutcomeWithPause } from './agent-step';

export type ClarificationOutcomeWithPause = StepOutcomeWithPause<ClarificationOutcome, ClarificationUsageStats>;
```

### Orchestrator Actions
1. Delegate to `claude-agent-sdk` agent to update type definitions in all three services

### Subagent Task
```
For each service file:

1. Import the generic type:
   import { StepOutcomeWithPause } from './agent-step';

2. Replace the two type aliases with single generic usage:
   // Before:
   export type ClarificationOutcomePauseInfo = OutcomePauseInfo<ClarificationUsageStats>;
   export type ClarificationOutcomeWithPause = ClarificationOutcome & ClarificationOutcomePauseInfo;

   // After:
   export type ClarificationOutcomeWithPause = StepOutcomeWithPause<ClarificationOutcome, ClarificationUsageStats>;

Run lint and typecheck after changes.
```

### Success Criteria
- [ ] All three services use generic type alias
- [ ] Redundant type definitions removed
- [ ] Lint passes
- [ ] TypeScript compilation succeeds

---

## Phase 10: Final Cleanup and Validation

**Objective:** Ensure all changes are complete, code is clean, and metrics are met

### Orchestrator Actions

1. **Run full validation suite:**
   ```
   Delegate to Bash agent:
   pnpm lint && pnpm typecheck
   ```

2. **Verify line count reduction:**
   ```
   Delegate to Bash agent:
   wc -l electron/services/clarification-step.service.ts
   wc -l electron/services/refinement-step.service.ts
   wc -l electron/services/file-discovery.service.ts
   ```

3. **Code review for consistency:**
   ```
   Delegate to Explore agent:
   Review the three service files for:
   - Consistent use of base class methods
   - No remaining duplicated code blocks
   - Proper error handling
   - Correct type usage
   ```

4. **Update imports:**
   Ensure all new exports from `agent-step/index.ts` are properly organized.

5. **Clean up unused code:**
   Remove any methods, imports, or types that are now unused after consolidation.

### Success Criteria
- [ ] Lint passes with no errors
- [ ] TypeScript compilation succeeds
- [ ] Combined line count reduced by ~25% (target: ~2,400 lines)
- [ ] No duplicate code blocks remain
- [ ] All services use base class template methods
- [ ] File discovery uses `AgentSdkExecutor`

### Review Checkpoint: FINAL MANUAL REVIEW
Full review of all changes before committing.

---

## Post-Implementation

### Commit Strategy
After Phase 10 passes review:
```
Commit message:
refactor(agent-step): consolidate agent step services, eliminate 62% code duplication

- Add cancel/retry template methods to BaseAgentStepService
- Extract session initialization and error handling utilities
- Add stream event hook to AgentSdkExecutor
- Migrate file discovery to use AgentSdkExecutor
- Consolidate outcome type definitions

Lines reduced: ~855 (26% reduction)
Duplicate code eliminated: ~62%

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Documentation Updates
- Update CLAUDE.md if architecture section needs changes
- Archive the duplication analysis report as completed

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Run validation after every phase |
| Type errors cascade | Fix errors immediately, don't proceed until clean |
| File discovery migration complexity | Keep the custom stream handler simple, test thoroughly |
| Review fatigue | Space out manual reviews, focus on critical phases |

---

## Orchestrator Checklist

Use this checklist to track overall progress:

- [ ] Phase 1: Pre-flight validation ✓
- [ ] Phase 2: Enhance BaseActiveSession interface ✓ + REVIEW
- [ ] Phase 3: Add cancel template method ✓
- [ ] Phase 4: Add retry template method ✓ + REVIEW
- [ ] Phase 5: Extract start method initialization ✓
- [ ] Phase 6: Extract start method error handling ✓ + REVIEW
- [ ] Phase 7: Add stream event hook ✓
- [ ] Phase 8: Migrate file discovery ✓
- [ ] Phase 9: Consolidate outcome types ✓
- [ ] Phase 10: Final cleanup ✓ + FINAL REVIEW
- [ ] Commit changes
