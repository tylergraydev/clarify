# Agent Step Services Duplication Analysis Report

**Date:** 2026-02-05
**Author:** Claude Code Analysis
**Branch:** `feat/consolidate-agent-step-services`

---

## Files Analyzed

| File | Lines |
|------|-------|
| `electron/services/clarification-step.service.ts` | 973 |
| `electron/services/refinement-step.service.ts` | 730 |
| `electron/services/file-discovery.service.ts` | 1,513 |
| **Total** | **3,216** |

---

## Duplication Categories

### 1. Cancel Step Methods

**Files & Line Ranges:**
- `clarification-step.service.ts:125-168` (`cancelClarification`)
- `refinement-step.service.ts:129-172` (`cancelRefinement`)
- `file-discovery.service.ts:521-573` (`cancelDiscovery`)

**Shared Logic:**
- Check session existence, return ERROR if not found
- Log session cancel via `debugLoggerService.logSession()`
- Call `auditLogger.logStepCancelled()`
- Clear timeout if active
- Abort the SDK operation
- Set phase to 'cancelled'
- Cleanup session
- Return CANCELLED outcome

**Similarity:** Near-identical (~90%)

**Differences:**
- File discovery saves partial results before cleanup
- Return object has step-specific fields (`questions` vs `refinedText` vs `partialCount`)

**Extraction Notes:** Can extract to base class abstract method with step-specific hooks. Only ~5 lines differ per service.

---

### 2. Retry Step Methods

**Files & Line Ranges:**
- `clarification-step.service.ts:179-229` (`retryClarification`)
- `refinement-step.service.ts:183-233` (`retryRefinement`)
- `file-discovery.service.ts:594-644` (`retryDiscovery`)

**Shared Logic:**
- Check retry limit via `isRetryLimitReached()`
- Log retry limit reached via `debugLoggerService.logSdkEvent()` and `auditLogger.logRetryLimitReached()`
- Return ERROR with max retry message if limit hit
- Increment retry count via `retryTracker.incrementRetryCount()`
- Calculate backoff delay via `calculateBackoffDelay()`
- Log retry start via both loggers
- Wait for backoff delay with `setTimeout`
- Start new step session (clarification/refinement/discovery)
- Return outcome with updated retry count

**Similarity:** Identical structure (~95%)

**Differences:**
- Only the method called differs (`startClarification` vs `startRefinement` vs `startDiscovery`)

**Extraction Notes:** Perfect candidate for base class template method. Pass the "start" function as parameter or use polymorphism.

---

### 3. Start Step Methods - Initialization Block

**Files & Line Ranges:**
- `clarification-step.service.ts:306-332` (session init + logging)
- `refinement-step.service.ts:248-276` (session init + logging)
- `file-discovery.service.ts:653-686` (session init + logging)

**Shared Logic:**
- Extract workflowId and timeoutSeconds from options
- Initialize session via `createSession()`
- Store session in `activeSessions` Map
- Log session start via `debugLoggerService.logSession()`
- Log step started via `auditLogger.logStepStarted()`

**Similarity:** Structurally identical (~85%)

**Differences:**
- Metadata logged differs by step type

**Extraction Notes:** Can extract to base class with step-specific metadata hooks.

---

### 4. Start Step Methods - Agent Loading Phase

**Files & Line Ranges:**
- `clarification-step.service.ts:335-358`
- `refinement-step.service.ts:279-302`
- `file-discovery.service.ts:688-712`

**Shared Logic:**
- Set phase to 'loading_agent', emit phase change
- Load agent config via `loadAgentConfig()`
- Log agent config loaded via `debugLoggerService.logSdkEvent()`
- Log agent loaded via `auditLogger.logAgentLoaded()`

**Similarity:** Identical (~98%)

**Differences:**
- Only step name in logs differs

**Extraction Notes:** Perfect for base class extraction with no step-specific hooks needed.

---

### 5. Start Step Methods - Timeout Setup

**Files & Line Ranges:**
- `clarification-step.service.ts:363-398`
- `refinement-step.service.ts:307-342`
- `file-discovery.service.ts:717-760`

**Shared Logic:**
- Set phase to 'executing', emit phase change
- Create timeout promise via `createTimeoutPromise()`
- Configure `onTimeout` callback with:
  - Set phase to 'timeout'
  - Log timeout via `debugLoggerService.logSdkEvent()`
  - Log via `auditLogger.logStepTimeout()`
  - Return TIMEOUT outcome

**Similarity:** Near-identical (~90%)

**Differences:**
- File discovery has extra `partialCount` tracking

**Extraction Notes:** Can extract timeout setup factory. Pass step name and optional partial tracking.

---

### 6. Start Step Methods - Execution + Race + Outcome Building

**Files & Line Ranges:**
- `clarification-step.service.ts:400-427`
- `refinement-step.service.ts:344-371`
- `file-discovery.service.ts:762-789`

**Shared Logic:**
- Call `executeAgent()` async
- Race between execution and timeout via `Promise.race()`
- Call `cleanupTimeout()`
- Call `cleanupSession()`
- Build outcome with pause info via `buildOutcomeWithPauseInfo()`
- Log completion via `debugLoggerService.logSdkEvent()`

**Similarity:** Identical structure (~95%)

**Differences:**
- Parameters to `buildOutcomeWithPauseInfo` differ slightly

**Extraction Notes:** Straightforward base class method.

---

### 7. Start Step Methods - Error Handling Block

**Files & Line Ranges:**
- `clarification-step.service.ts:428-467`
- `refinement-step.service.ts:372-411`
- `file-discovery.service.ts:790-839`

**Shared Logic:**
- Set phase to 'error', emit phase change
- Extract error message and stack
- Get retry count via `getRetryCount()`
- Check if error is transient via `isTransientError()`
- Check retry limit via `isRetryLimitReached()`
- Log error via `debugLoggerService.logSdkEvent()`
- Log error via `auditLogger.logStepError()`
- Delete session from `activeSessions`
- Return error outcome via `buildErrorOutcomeWithRetry()`

**Similarity:** Identical (~95%)

**Differences:**
- File discovery adds partial count tracking and saves partial results

**Extraction Notes:** Can extract error handling to base class. File discovery needs optional hook for partial saving.

---

### 8. Execute Agent Methods - Prompt Building + Debug Logging

**Files & Line Ranges:**
- `clarification-step.service.ts:816-834`
- `refinement-step.service.ts:588-610`
- `file-discovery.service.ts:1036-1057`

**Shared Logic:**
- Build prompt via `buildPrompt()`
- Log start via `debugLoggerService.logSdkEvent()`
- Log exploring via `auditLogger.logStepExploring()`

**Similarity:** Identical structure (~90%)

**Differences:**
- Metadata logged differs

**Extraction Notes:** Base class can handle with step-specific logging metadata passed in.

---

### 9. Execute Agent Methods - Result Processing + Null Check

**Files & Line Ranges:**
- `clarification-step.service.ts:855-882`
- `refinement-step.service.ts:631-658`
- `file-discovery.service.ts:1155-1184`

**Shared Logic:**
- Set phase to 'processing_response', emit phase change
- Check for null result message, return CANCELLED
- Log structured output processing via `debugLoggerService.logSdkEvent()`
- Log raw output for debugging

**Similarity:** Identical (~95%)

**Differences:**
- Cancelled outcome differs slightly (`partialCount` for file discovery)

**Extraction Notes:** Easy extraction.

---

### 10. Execute Agent Methods - Usage Stats Extraction

**Files & Line Ranges:**
- `clarification-step.service.ts:949-963`
- `refinement-step.service.ts:707-725`
- `file-discovery.service.ts:1226-1237`

**Shared Logic:**
- Extract usage stats via `extractUsageStats()`
- Log usage if present via `debugLoggerService.logSdkEvent()`
- Return outcome with `sdkSessionId` and `usage`

**Similarity:** Identical (~98%)

**Extraction Notes:** Perfect for extraction.

---

### 11. Session Interface Definitions

**Files & Line Ranges:**
- `clarification-step.service.ts:75-88` (`ActiveClarificationSession`)
- `refinement-step.service.ts:79-91` (`ActiveRefinementSession`)
- `file-discovery.service.ts:471-485` (`ActiveFileDiscoverySession`)

**Shared Fields:**
```typescript
abortController: AbortController;
activeTools: Array<ActiveToolInfo>;
agentConfig: *AgentConfig | null;
options: *ServiceOptions;
phase: *ServicePhase;
sessionId: string;
streamingText: string;
thinkingBlocks: Array<string>;
timeoutId: null | ReturnType<typeof setTimeout>;
```

**Similarity:** Structurally identical base (~80%)

**Differences:**
- Clarification: `questions`, `skipReason`
- Refinement: `refinedText`
- File Discovery: `discoveredFiles`, `summary`

**Extraction Notes:** Extract `BaseActiveSession` interface. Step services extend with specific fields.

---

### 12. createSession Template Method Implementation

**Files & Line Ranges:**
- `clarification-step.service.ts:686-700`
- `refinement-step.service.ts:499-512`
- `file-discovery.service.ts:907-921`

**Shared Logic:**
- Return object with common session fields initialized
- Step-specific fields initialized to null/empty

**Similarity:** Structurally identical (~90%)

**Extraction Notes:** Base class could provide common fields; subclass adds specific ones.

---

### 13. Instance Variable Declarations

**Files & Line Ranges:**
- `clarification-step.service.ts:111-117`
- `refinement-step.service.ts:115-121`
- `file-discovery.service.ts:512-513`

**Shared Pattern:**
```typescript
private auditLogger = new StepAuditLogger('step_name');
private sdkExecutor = new AgentSdkExecutor<...>(); // not in file-discovery
private structuredValidator = new StructuredOutputValidator(schema);
```

**Similarity:** Identical pattern (~95%)

**Differences:**
- File discovery doesn't use `AgentSdkExecutor`

**Extraction Notes:** `auditLogger` and `structuredValidator` could be injected or created in base class.

---

### 14. Import Statements

**Files & Line Ranges:**
- `clarification-step.service.ts:24-54`
- `refinement-step.service.ts:32-57`
- `file-discovery.service.ts:33-55`

**Shared Imports:**
- `SDKResultMessage` from claude-agent-sdk
- `randomUUID` from crypto
- All `agent-step/` utilities (constants, timeout, base service, outcome builder, retry, audit logger, validator, usage stats)
- `debugLoggerService`

**Similarity:** Near-identical (~85%)

**Differences:**
- Each imports step-specific types from `lib/validations/`

**Extraction Notes:** Import consolidation is automatic once code is extracted.

---

### 15. Outcome Type Definitions

**Files & Line Ranges:**
- `clarification-step.service.ts:65-70` (type aliases)
- `refinement-step.service.ts:69-74` (type aliases)
- `file-discovery.service.ts:192-228` (inline types)

**Shared Pattern:**
```typescript
export type *OutcomePauseInfo = OutcomePauseInfo<*UsageStats>;
export type *OutcomeWithPause = *Outcome & *OutcomePauseInfo;
```

**Similarity:** Identical pattern (~100%)

**Extraction Notes:** Could define generic type once if usage stats are unified.

---

### 16. Stream Event Processing (File Discovery Only)

**Files & Line Ranges:**
- `file-discovery.service.ts:1302-1434` (`processStreamEventForFileDiscovery`)

**Comparison:**
- Clarification and Refinement use `AgentSdkExecutor.executeQuery()` which handles stream processing internally
- File Discovery has manual stream processing because it needs to emit `file_discovered` events

**Similarity:** File discovery duplicates stream processing from `AgentSdkExecutor` (~150 lines)

**Extraction Notes:** Consider adding hook capability to `AgentSdkExecutor` for custom stream event handling, or extract stream processing to standalone utility.

---

### 17. Heartbeat Logic (File Discovery Only)

**Files & Line Ranges:**
- `file-discovery.service.ts:1106-1126` (start heartbeat)
- `file-discovery.service.ts:1284-1289` (stop heartbeat)

**Comparison:**
- Only file discovery manually manages heartbeat
- Clarification and Refinement get heartbeat through `AgentSdkExecutor`

**Similarity:** N/A - unique to file discovery due to manual SDK usage

**Extraction Notes:** If file discovery used `AgentSdkExecutor`, this would be handled automatically.

---

## Summary Statistics

| Duplication Category | Files Affected | Lines per Service | Total Duplicate Lines |
|---------------------|----------------|-------------------|----------------------|
| Cancel methods | 3 | ~45 | ~135 |
| Retry methods | 3 | ~50 | ~150 |
| Start - initialization | 3 | ~30 | ~90 |
| Start - agent loading | 3 | ~25 | ~75 |
| Start - timeout setup | 3 | ~40 | ~120 |
| Start - execution race | 3 | ~30 | ~90 |
| Start - error handling | 3 | ~40 | ~120 |
| Execute - prompt/logging | 3 | ~25 | ~75 |
| Execute - result processing | 3 | ~30 | ~90 |
| Execute - usage extraction | 3 | ~15 | ~45 |
| Session interfaces | 3 | ~15 | ~45 |
| createSession method | 3 | ~15 | ~45 |
| Stream processing (FD manual) | 1 | ~130 | ~130 |
| **Total** | | | **~1,210 lines** |

---

## Recommended Shared Modules/Classes

### 1. `AgentStepOrchestrator` (Base Class Enhancement)

Consolidate the start/retry/cancel orchestration logic.

**Responsibilities:**
- Move `retry*()` template to base class with polymorphic `start*()` call
- Move `cancel*()` template to base class with optional partial save hook
- Move `start*()` common phases (init, agent load, timeout, race, error) to base class

**Estimated Lines Saved:** 400-500

---

### 2. `BaseActiveSession` Interface

Extract common session fields into reusable interface.

```typescript
interface BaseActiveSession<TPhase, TOptions, TConfig> {
  abortController: AbortController;
  activeTools: Array<ActiveToolInfo>;
  agentConfig: TConfig | null;
  options: TOptions;
  phase: TPhase;
  sessionId: string;
  streamingText: string;
  thinkingBlocks: Array<string>;
  timeoutId: null | ReturnType<typeof setTimeout>;
}
```

**Estimated Lines Saved:** 30

---

### 3. `AgentExecutionPipeline` Utility

Extract the common execution flow: prompt → execute → process result → extract usage.

**Responsibilities:**
- Accepts: session, agentConfig, prompt, callbacks
- Returns: `ExecuteAgentResult`
- Can have hooks for custom stream event handling (solving file discovery's unique needs)

**Estimated Lines Saved:** 150

---

### 4. `StepErrorHandler` Utility

Extract catch block logic.

**Responsibilities:**
- Error extraction
- Retry state gathering
- Audit logging
- Outcome building

**Estimated Lines Saved:** 80

---

### 5. `StepOutcomeTypes<T>` Generic

Unify outcome type definitions.

```typescript
type StepOutcomePauseInfo<TUsage> = OutcomePauseInfo<TUsage>;
type StepOutcomeWithPause<TOutcome, TUsage> = TOutcome & StepOutcomePauseInfo<TUsage>;
```

**Estimated Lines Saved:** 15

---

### 6. `StreamEventProcessor` (Enhanced `AgentSdkExecutor`)

Add hook capability to existing executor for custom event handling.

```typescript
onCustomStreamEvent?: (event: StreamEvent, session: TSession) => void
```

This would allow file discovery to use `AgentSdkExecutor` instead of manual SDK calls.

**Estimated Lines Saved:** 130

---

## Final Consolidation Estimate

| Module | Estimated Lines Saved |
|--------|----------------------|
| AgentStepOrchestrator (enhanced base) | 450 |
| BaseActiveSession interface | 30 |
| AgentExecutionPipeline | 150 |
| StepErrorHandler | 80 |
| StepOutcomeTypes generic | 15 |
| StreamEventProcessor enhancement | 130 |
| **Total** | **~855 lines** |

### Impact Summary

| Metric | Value |
|--------|-------|
| Current combined size | 3,216 lines |
| After consolidation | ~2,361 lines |
| **Lines reduced** | **~855** |
| **Percentage reduction** | **~26%** |
| **Duplicate code eliminated** | **~62%** |

---

## Next Steps

1. **Phase 1:** Extract `BaseActiveSession` interface to `agent-step/step-types.ts`
2. **Phase 2:** Enhance `BaseAgentStepService` with retry/cancel template methods
3. **Phase 3:** Add hook capability to `AgentSdkExecutor` for custom stream events
4. **Phase 4:** Migrate file discovery to use enhanced `AgentSdkExecutor`
5. **Phase 5:** Extract `StepErrorHandler` utility
6. **Phase 6:** Consolidate outcome type definitions
