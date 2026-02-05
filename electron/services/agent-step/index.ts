/**
 * Agent Step Shared Module Exports
 *
 * This module provides reusable abstractions for agent step services
 * (clarification, refinement, file discovery) to eliminate code duplication
 * and establish consistent patterns across the workflow pipeline.
 *
 * ## Architecture
 *
 * The shared module consists of six core utilities:
 *
 * 1. **BaseAgentStepService**: Abstract base class using template method pattern
 * 2. **AgentSdkExecutor**: SDK query execution with tool configuration
 * 3. **StepAuditLogger**: Standardized audit logging with event types
 * 4. **StructuredOutputValidator**: Output validation with Zod schemas
 * 5. **AgentTimeoutManager**: Timeout promise creation and cleanup
 * 6. **OutcomeBuilder**: Outcome construction with pause information
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   BaseAgentStepService,
 *   AgentSdkExecutor,
 *   StepAuditLogger,
 *   StructuredOutputValidator,
 *   createTimeoutPromise,
 *   buildOutcomeWithPauseInfo,
 * } from './agent-step';
 *
 * class MyStepService extends BaseAgentStepService<...> {
 *   private auditLogger = new StepAuditLogger('my_step');
 *   private sdkExecutor = new AgentSdkExecutor<...>();
 *   private validator = new StructuredOutputValidator(mySchema);
 *
 *   protected buildPrompt(options: MyOptions): string { ... }
 *   protected processStructuredOutput(result: SDKResultMessage): MyOutcome { ... }
 *   protected createSession(workflowId: number, options: MyOptions): MySession { ... }
 *   protected extractState(session: MySession): MyState { ... }
 * }
 * ```
 */

// =============================================================================
// Base Classes
// =============================================================================

export { AgentSdkExecutor } from './agent-sdk-executor';
export type { BaseAgentConfig, BaseSession, SdkExecutorConfig, StreamEventHandlers } from './agent-sdk-executor';

// =============================================================================
// SDK Execution
// =============================================================================

export { BASE_RETRY_DELAY_MS, MAX_RETRY_ATTEMPTS, STEP_TIMEOUTS } from './agent-step-constants';
export { clearTimeoutSafely, createTimeoutPromise } from './agent-timeout-manager';

// =============================================================================
// Audit Logging
// =============================================================================

export type { TimeoutPromiseConfig, TimeoutPromiseResult } from './agent-timeout-manager';

// =============================================================================
// Structured Output Validation
// =============================================================================

export { BaseAgentStepService } from './base-agent-step-service';
export type { BaseServiceOptions, BaseSessionFields } from './base-agent-step-service';

// =============================================================================
// Timeout Management
// =============================================================================

export { buildErrorOutcomeWithRetry, buildOutcomeWithPauseInfo } from './outcome-builder';
export { calculateBackoffDelay, isTransientError, RetryTracker } from './retry-backoff';

// =============================================================================
// Outcome Building
// =============================================================================

export { StepAuditLogger } from './step-audit-logger';

// =============================================================================
// Shared Types
// =============================================================================

export type {
  ActiveToolInfo,
  BaseActiveSession,
  ExecuteAgentResult,
  OutcomePauseInfo,
  PauseBehavior,
  SessionState,
} from './step-types';

// =============================================================================
// Retry and Backoff
// =============================================================================

export { StructuredOutputValidator } from './structured-output-validator';

// =============================================================================
// Constants
// =============================================================================

export type { ValidationFailure, ValidationResult, ValidationSuccess } from './structured-output-validator';
