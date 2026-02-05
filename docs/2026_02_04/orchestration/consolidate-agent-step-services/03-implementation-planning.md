# Step 3: Implementation Planning

## Metadata

- **Step**: 3 - Implementation Planning
- **Started**: 2026-02-04T00:04:00Z
- **Completed**: 2026-02-04T00:06:00Z
- **Duration**: 120 seconds
- **Status**: Completed
- **Agent**: implementation-planner (sonnet)

## Input Summary

**Refined Feature Request**:
The Clarify application exhibits significant code duplication across three agent step services totaling approximately 4,149 lines with 60-70% redundancy representing ~1,800-2,000 lines of duplicated logic. Refactoring plan: Create 6 shared modules in electron/services/agent-step directory (BaseAgentStepService abstract class, AgentSdkExecutor class, StepAuditLogger utility, StructuredOutputValidator class, AgentTimeoutManager, OutcomeBuilder factory).

**File Discovery Analysis Used**:
- 3 critical files to refactor (clarification-step.service.ts 1,417 lines, refinement-step.service.ts 1,150 lines, file-discovery.service.ts 1,582 lines)
- 10 high priority infrastructure files (step-types.ts, retry-backoff.ts, audit-log.ts, 4 repositories, debug-logger.service.ts)
- 7 medium priority utilities (heartbeat.ts, agent-tools.ts, validation schemas)
- 20+ duplication patterns identified (session management, agent config loading, SDK options, stream processing, validation, retry, audit logging, tool config, timeout, cancellation)

## Agent Prompt Sent

```
Generate an implementation plan in MARKDOWN format (NOT XML) following your defined template with these sections: ## Overview (with Estimated Duration, Complexity, Risk Level), ## Quick Summary, ## Prerequisites, ## Implementation Steps (each step with What/Why/Confidence/Files/Changes/Validation Commands/Success Criteria), ## Quality Gates, ## Notes.

IMPORTANT: Include 'pnpm run lint:fix && pnpm run typecheck' validation for every step touching JS/JSX/TS/TSX files. Do NOT include code examples.

[Full feature request and file discovery results provided...]
```

## Generated Implementation Plan

The implementation planner agent generated a comprehensive 10-step implementation plan in markdown format.

### Plan Overview

- **Estimated Duration**: 3-4 days
- **Complexity**: High
- **Risk Level**: Medium
- **Total Steps**: 10 implementation steps
- **Lines to be Saved**: ~1,800-2,000 lines

### Plan Structure

**Steps 1-6**: Create 6 new shared modules
- Step 1: AgentSdkExecutor Class (~600-700 lines saved)
- Step 2: BaseAgentStepService Abstract Class (~400-500 lines saved)
- Step 3: StepAuditLogger Utility Class (~200-300 lines saved)
- Step 4: StructuredOutputValidator Utility Class (~150-200 lines saved)
- Step 5: AgentTimeoutManager Utility (~100-150 lines saved)
- Step 6: OutcomeBuilder Factory Utility (~80-100 lines saved)

**Steps 7-9**: Incrementally refactor existing services
- Step 7: Refactor Clarification Service (first validation)
- Step 8: Refactor Refinement Service (second validation)
- Step 9: Refactor File Discovery Service (final validation with most complex service)

**Step 10**: Update exports and documentation
- Update type exports in index.ts
- Create comprehensive README.md for shared module architecture

## Plan Validation Results

### Format Validation
✅ **Markdown Format**: Plan generated in proper markdown (not XML)
✅ **Required Sections Present**:
  - Overview with duration/complexity/risk
  - Quick Summary
  - Prerequisites
  - Implementation Steps (10 steps)
  - Quality Gates
  - Notes

### Template Compliance
✅ **Step Structure**: Each step includes:
  - What (clear description)
  - Why (justification)
  - Confidence level
  - Files to Create/Modify
  - Changes (detailed list)
  - Validation Commands
  - Success Criteria

### Command Validation
✅ **Validation Commands**: Every step includes `pnpm run lint:fix && pnpm run typecheck`
✅ **Success Criteria**: Each step has 4-7 measurable success criteria

### Content Quality
✅ **No Code Examples**: Plan contains instructions only, no implementation code
✅ **Actionable Steps**: All steps are concrete and executable
✅ **Complete Coverage**: Plan addresses all aspects of the refined request
✅ **Quality Gates**: Comprehensive quality gates defined for final validation

## Complexity Assessment

**High Complexity Factors**:
1. Generic type parameters across 6 type variables in BaseAgentStepService
2. Template method pattern with abstract methods for customization
3. Incremental refactoring of 3 large services (4,149 lines total)
4. Preservation of existing public APIs (backwards compatibility)
5. Multiple integration points (repositories, logging, SDK, validation)

**Medium Risk Factors**:
1. Potential breaking changes if public APIs modified incorrectly
2. Generic type constraints may be challenging to get right initially
3. Stream event processing requires careful testing
4. Timeout/cancellation race conditions need validation

**Mitigation Strategies**:
1. Incremental approach (validate each service refactoring separately)
2. Maintain existing public APIs unchanged
3. Template method pattern provides safe extension points
4. Each step includes validation commands

## Time Estimates by Step

| Step | Module | Estimated Time | Lines Saved |
|------|--------|----------------|-------------|
| 1 | AgentSdkExecutor | 6-8 hours | ~600-700 |
| 2 | BaseAgentStepService | 6-8 hours | ~400-500 |
| 3 | StepAuditLogger | 3-4 hours | ~200-300 |
| 4 | StructuredOutputValidator | 2-3 hours | ~150-200 |
| 5 | AgentTimeoutManager | 2-3 hours | ~100-150 |
| 6 | OutcomeBuilder | 2-3 hours | ~80-100 |
| 7 | Refactor Clarification | 4-6 hours | N/A |
| 8 | Refactor Refinement | 3-4 hours | N/A |
| 9 | Refactor File Discovery | 4-6 hours | N/A |
| 10 | Documentation | 2-3 hours | N/A |
| **Total** | | **34-48 hours (3-4 days)** | **~1,800-2,000** |

## Quality Gate Summary

The plan includes 9 comprehensive quality gates:

1. ✅ All TypeScript files pass typecheck
2. ✅ All files pass lint with auto-fix
3. ✅ Existing agent step service tests still pass
4. ✅ Line count reduced by ~1,800-2,000 lines
5. ✅ No breaking changes to public APIs
6. ✅ Manual testing: End-to-end workflow execution
7. ✅ Manual testing: Retry logic validation
8. ✅ Manual testing: Timeout behavior validation
9. ✅ Manual testing: Cancellation behavior validation

## Critical Success Factors

**Must Preserve**:
- Public APIs of all three services (backwards compatibility)
- Existing behavior for retry logic, timeout handling, cancellation
- Session management patterns (Map-based tracking)
- Audit logging patterns and event types
- Stream event processing for real-time UI updates

**Must Improve**:
- Code reusability (eliminate 1,800-2,000 duplicate lines)
- Maintainability (centralize shared logic)
- Consistency (standardize patterns across services)
- Extensibility (template for future agent steps)

## Architecture Insights from Planning

**Template Method Pattern**:
The plan correctly identifies template method pattern as the solution for BaseAgentStepService, allowing:
- Shared base implementation for common operations
- Abstract methods for step-specific customization
- Protected helper methods for internal operations
- Type-safe contracts enforced by TypeScript generics

**Composition Over Inheritance for Utilities**:
Most shared modules (AgentSdkExecutor, StepAuditLogger, StructuredOutputValidator, timeouts, outcomes) use composition rather than inheritance:
- Services compose utilities rather than inheriting from multiple bases
- Each utility has single responsibility
- Utilities can be tested independently

**Incremental Migration Strategy**:
The plan's phased approach (create all shared modules first, then incrementally refactor services) minimizes risk:
- All shared code validated before refactoring begins
- Each service refactoring is independent validation
- Rollback is possible at service level
- Clarification → Refinement → File Discovery order increases in complexity

## Notes from Planner

**Critical Assumptions**:
- The three services share 60-70% code duplication (validated by file analysis)
- No other services depend on internal implementation details
- TypeScript strict mode enabled
- All agent step services will eventually follow this pattern

**Future Extensibility**:
- New agent steps can extend BaseAgentStepService with minimal boilerplate
- AgentSdkExecutor can be enhanced with additional stream event types
- StepAuditLogger can add new event types without changing existing services
- StructuredOutputValidator supports any Zod schema

**Performance Considerations**:
- Query function caching already implemented (no regression)
- Session management remains in-memory Map (unchanged)
- Audit logging errors already non-blocking (unchanged)
- No new asynchronous operations introduced

---

**Next Step**: Save final implementation plan to `docs/{YYYY_MM_DD}/plans/` directory.
