/**
 * File Discovery Step Service
 *
 * Orchestrates the file discovery step of the workflow pipeline.
 * This service manages the execution of the file discovery agent,
 * which analyzes the refined feature request and identifies relevant
 * files in the codebase.
 *
 * ## Responsibilities
 *
 * - Load agent configuration from database
 * - Execute file discovery agent via Claude Agent SDK
 * - Parse agent output for discovered files with metadata
 * - Handle timeout with configurable duration
 * - Manage state transitions through the discovery process
 * - Support re-discovery modes (replace vs additive)
 *
 * ## State Machine
 *
 * idle -> loading_agent -> executing -> processing_response -> complete | error
 *                                                           -> cancelled | timeout
 *
 * Extends BaseAgentStepService to leverage shared abstractions:
 * - AgentSdkExecutor for SDK query execution
 * - StepAuditLogger for consistent audit logging
 * - StructuredOutputValidator for output validation
 * - AgentTimeoutManager for timeout handling
 * - OutcomeBuilder for pause information
 *
 * @see {@link ../../lib/validations/file-discovery.ts File Discovery Types}
 */

import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

import { randomUUID } from 'crypto';
import { z } from 'zod';

import type { NewDiscoveredFile } from '../../db/schema';
import type { StepOutcomeWithPause } from './agent-step';
import type { ActiveToolInfo, ExecuteAgentResult } from './agent-step/step-types';

import { getDatabase } from '../../db';
import { createDiscoveredFilesRepository } from '../../db/repositories';
import { AgentSdkExecutor } from './agent-step/agent-sdk-executor';
import { MAX_RETRY_ATTEMPTS, STEP_TIMEOUTS } from './agent-step/agent-step-constants';
import { createTimeoutPromise } from './agent-step/agent-timeout-manager';
import { BaseAgentStepService } from './agent-step/base-agent-step-service';
import { buildOutcomeWithPauseInfo } from './agent-step/outcome-builder';
import { StepAuditLogger } from './agent-step/step-audit-logger';
import { buildErrorOutcomeFromResult, handleStepError } from './agent-step/step-error-handler';
import { StructuredOutputValidator } from './agent-step/structured-output-validator';
import { extractUsageStats } from './agent-step/usage-stats';
import { debugLoggerService } from './debug-logger.service';

// =============================================================================
// Constants
// =============================================================================

/**
 * Default timeout for file discovery operations in seconds.
 */
const DEFAULT_TIMEOUT_SECONDS = STEP_TIMEOUTS.fileDiscovery;

// =============================================================================
// Zod Schemas for Structured Output
// =============================================================================

/**
 * Schema for a single discovered file from the agent.
 */
export const discoveredFileSchema = z.object({
  action: z
    .enum(['create', 'modify', 'delete', 'reference'])
    .describe(
      'What action is needed for this file: create (new file), modify (existing file changes), delete (remove file), reference (context only)'
    ),
  filePath: z.string().min(1).describe('Relative path from repository root (e.g., "components/ui/Button.tsx")'),
  priority: z
    .enum(['high', 'medium', 'low'])
    .describe('Importance level: high (core to feature), medium (supporting), low (peripheral)'),
  relevanceExplanation: z
    .string()
    .min(1)
    .describe('Explanation of why this file is relevant to the feature implementation'),
  role: z
    .string()
    .min(1)
    .describe('The functional role of this file (e.g., "data model", "UI component", "utility", "configuration")'),
});

export type DiscoveredFileFromAgent = z.infer<typeof discoveredFileSchema>;

/**
 * Schema for the complete agent output.
 * Uses a flat structure (no oneOf) to work around Claude's structured output limitations.
 */
export const fileDiscoveryAgentOutputSchema = z.object({
  discoveredFiles: z.array(discoveredFileSchema).describe('Array of discovered files with their metadata'),
  summary: z.string().describe('Brief summary of the discovery analysis and findings'),
});

export type FileDiscoveryAgentOutput = z.infer<typeof fileDiscoveryAgentOutputSchema>;

/**
 * JSON Schema for SDK structured outputs.
 * Generated from Zod schema for maintainability.
 */
const generatedSchema = z.toJSONSchema(fileDiscoveryAgentOutputSchema) as Record<string, unknown>;
// Remove $schema property - SDK may not support draft 2020-12 declarations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { $schema, ...schemaWithoutDraft } = generatedSchema;
export const fileDiscoveryAgentOutputJSONSchema: Record<string, unknown> = schemaWithoutDraft;

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Configuration for a loaded file discovery agent.
 */
export interface FileDiscoveryAgentConfig {
  /** Whether extended thinking is enabled */
  extendedThinkingEnabled: boolean;
  /** Array of hooks for agent events */
  hooks: Array<{
    body: string;
    eventType: string;
    matcher: null | string;
  }>;
  /** The unique identifier of the agent */
  id: number;
  /** Maximum thinking tokens budget for extended thinking */
  maxThinkingTokens: null | number;
  /** The model to use (e.g., 'claude-sonnet-4-20250514') */
  model: null | string;
  /** The display name of the agent */
  name: string;
  /** The permission mode for the agent */
  permissionMode: null | string;
  /** Array of skills the agent can use */
  skills: Array<{
    isRequired: boolean;
    skillName: string;
  }>;
  /** The system prompt that defines agent behavior */
  systemPrompt: string;
  /** Array of tools the agent can use */
  tools: Array<{
    toolName: string;
    toolPattern: string;
  }>;
}

/**
 * Discriminated union of all possible file discovery outcomes.
 */
export type FileDiscoveryOutcome =
  | FileDiscoveryOutcomeCancelled
  | FileDiscoveryOutcomeError
  | FileDiscoveryOutcomeSuccess
  | FileDiscoveryOutcomeTimeout;

/**
 * Outcome when discovery is cancelled by the user.
 */
export interface FileDiscoveryOutcomeCancelled {
  /** Count of files discovered before cancellation */
  partialCount: number;
  /** Reason for cancellation */
  reason?: string;
  type: 'CANCELLED';
}

/**
 * Outcome when an error occurs during discovery.
 */
export interface FileDiscoveryOutcomeError {
  /** Error message describing what went wrong */
  error: string;
  /** Count of files discovered before error (if any) */
  partialCount?: number;
  /** Optional stack trace for debugging */
  stack?: string;
  type: 'ERROR';
}

// =============================================================================
// Outcome Types (Discriminated Union)
// =============================================================================

/**
 * Outcome when discovery completes successfully.
 */
export interface FileDiscoveryOutcomeSuccess {
  /** Array of discovered file records saved to database */
  discoveredFiles: Array<{ filePath: string; id: number; priority: string }>;
  /** Summary of the discovery analysis */
  summary: string;
  /** Total count of files discovered */
  totalCount: number;
  type: 'SUCCESS';
}

/**
 * Outcome when the discovery process times out.
 */
export interface FileDiscoveryOutcomeTimeout {
  /** How long the process ran before timing out (in seconds) */
  elapsedSeconds: number;
  /** Error message describing the timeout */
  error: string;
  /** Count of files discovered before timeout (if any) */
  partialCount?: number;
  type: 'TIMEOUT';
}

/**
 * Extended outcome that includes pause information.
 * Uses generic StepOutcomeWithPause to combine file discovery outcome with pause/retry fields.
 */
export type FileDiscoveryOutcomeWithPause = StepOutcomeWithPause<FileDiscoveryOutcome, FileDiscoveryUsageStats>;

/**
 * Options for initializing the file discovery service.
 */
export interface FileDiscoveryServiceOptions {
  /** The selected agent to use for file discovery */
  agentId: number;
  /** Mode for re-discovery: 'replace' clears existing, 'additive' merges */
  rediscoveryMode?: 'additive' | 'replace';
  /** The refined feature request text to analyze */
  refinedFeatureRequest: string;
  /** The path to the repository being analyzed */
  repositoryPath: string;
  /** The ID of the current workflow step */
  stepId: number;
  /** Optional timeout in seconds for agent operations */
  timeoutSeconds?: number;
  /** The ID of the workflow this discovery belongs to */
  workflowId: number;
}

// =============================================================================
// Extended Outcome with Pause Info
// =============================================================================

/**
 * Phases of the file discovery service execution.
 */
export type FileDiscoveryServicePhase =
  | 'cancelled'
  | 'complete'
  | 'error'
  | 'executing'
  | 'executing_extended_thinking'
  | 'idle'
  | 'loading_agent'
  | 'processing_response'
  | 'saving_results'
  | 'timeout';

/**
 * State of the file discovery service during execution.
 */
export interface FileDiscoveryServiceState {
  /** Agent configuration after loading (null before loading) */
  agentConfig: FileDiscoveryAgentConfig | null;
  /** Count of discovered files so far */
  discoveredCount: number;
  /** Current execution phase */
  phase: FileDiscoveryServicePhase;
  /** Summary of discovery analysis (if complete) */
  summary: null | string;
}

/**
 * Stream message indicating discovery completed.
 */
export interface FileDiscoveryStreamComplete extends FileDiscoveryStreamMessageBase {
  /** The discovery outcome */
  outcome: FileDiscoveryOutcome;
  type: 'complete';
}

// =============================================================================
// Streaming Message Types
// =============================================================================

/**
 * Stream message indicating an error occurred.
 */
export interface FileDiscoveryStreamError extends FileDiscoveryStreamMessageBase {
  /** Error message */
  error: string;
  /** Optional stack trace */
  stack?: string;
  type: 'error';
}

/**
 * Heartbeat message during extended thinking execution.
 */
export interface FileDiscoveryStreamExtendedThinkingHeartbeat extends FileDiscoveryStreamMessageBase {
  /** Elapsed time in milliseconds since execution started */
  elapsedMs: number;
  /** Estimated completion percentage (0-100, null if unknown) */
  estimatedProgress: null | number;
  /** Maximum thinking tokens budget */
  maxThinkingTokens: number;
  type: 'extended_thinking_heartbeat';
}

/**
 * Stream message for a single file discovered during execution.
 */
export interface FileDiscoveryStreamFileDiscovered extends FileDiscoveryStreamMessageBase {
  /** The discovered file metadata */
  file: DiscoveredFileFromAgent;
  type: 'file_discovered';
}

/**
 * Discriminated union of all file discovery stream message types.
 */
export type FileDiscoveryStreamMessage =
  | FileDiscoveryStreamComplete
  | FileDiscoveryStreamError
  | FileDiscoveryStreamExtendedThinkingHeartbeat
  | FileDiscoveryStreamFileDiscovered
  | FileDiscoveryStreamPhaseChange
  | FileDiscoveryStreamTextDelta
  | FileDiscoveryStreamThinkingDelta
  | FileDiscoveryStreamThinkingStart
  | FileDiscoveryStreamToolFinish
  | FileDiscoveryStreamToolStart
  | FileDiscoveryStreamToolUpdate;

/**
 * Base interface for all file discovery stream messages.
 */
export interface FileDiscoveryStreamMessageBase {
  /** The session ID this message belongs to */
  sessionId: string;
  /** Timestamp when the message was generated */
  timestamp: number;
  /** Message type discriminator */
  type: FileDiscoveryStreamMessageType;
}

/**
 * Type discriminator for file discovery stream messages.
 */
export type FileDiscoveryStreamMessageType =
  | 'complete'
  | 'error'
  | 'extended_thinking_heartbeat'
  | 'file_discovered'
  | 'phase_change'
  | 'text_delta'
  | 'thinking_delta'
  | 'thinking_start'
  | 'tool_finish'
  | 'tool_start'
  | 'tool_update';

/**
 * Stream message for phase transitions.
 */
export interface FileDiscoveryStreamPhaseChange extends FileDiscoveryStreamMessageBase {
  /** The new phase the service has transitioned to */
  phase: FileDiscoveryServicePhase;
  type: 'phase_change';
}

/**
 * Stream message for text delta (incremental text output).
 */
export interface FileDiscoveryStreamTextDelta extends FileDiscoveryStreamMessageBase {
  /** The incremental text content */
  delta: string;
  type: 'text_delta';
}

/**
 * Stream message for thinking delta (incremental thinking output).
 */
export interface FileDiscoveryStreamThinkingDelta extends FileDiscoveryStreamMessageBase {
  /** Index of the thinking block being updated */
  blockIndex: number;
  /** The incremental thinking content */
  delta: string;
  type: 'thinking_delta';
}

/**
 * Stream message indicating a new thinking block has started.
 */
export interface FileDiscoveryStreamThinkingStart extends FileDiscoveryStreamMessageBase {
  /** Index of the thinking block being started */
  blockIndex: number;
  type: 'thinking_start';
}

/**
 * Stream message indicating a tool has finished executing.
 */
export interface FileDiscoveryStreamToolFinish extends FileDiscoveryStreamMessageBase {
  /** Output from the tool execution */
  toolOutput?: unknown;
  /** Unique identifier of the tool invocation that completed */
  toolUseId: string;
  type: 'tool_finish';
}

/**
 * Stream message indicating a tool has started executing.
 */
export interface FileDiscoveryStreamToolStart extends FileDiscoveryStreamMessageBase {
  /** Input parameters passed to the tool */
  toolInput: Record<string, unknown>;
  /** Name of the tool being executed */
  toolName: string;
  /** Unique identifier for this tool invocation */
  toolUseId: string;
  type: 'tool_start';
}

/**
 * Stream message indicating a tool input payload has been updated.
 */
export interface FileDiscoveryStreamToolUpdate extends FileDiscoveryStreamMessageBase {
  /** Input parameters passed to the tool */
  toolInput: Record<string, unknown>;
  /** Name of the tool being executed */
  toolName: string;
  /** Unique identifier for this tool invocation */
  toolUseId: string;
  type: 'tool_update';
}

/**
 * Usage statistics from SDK result.
 */
export interface FileDiscoveryUsageStats {
  /** Total cost in USD */
  costUsd: number;
  /** Total duration in milliseconds */
  durationMs: number;
  /** Input tokens consumed */
  inputTokens: number;
  /** Number of conversation turns */
  numTurns: number;
  /** Output tokens generated */
  outputTokens: number;
}

// =============================================================================
// Internal Types
// =============================================================================

/**
 * Active file discovery session tracking.
 */
interface ActiveFileDiscoverySession {
  abortController: AbortController;
  activeTools: Array<ActiveToolInfo>;
  agentConfig: FileDiscoveryAgentConfig | null;
  /** Files discovered during execution (before final save) */
  discoveredFiles: Array<DiscoveredFileFromAgent>;
  options: FileDiscoveryServiceOptions;
  phase: FileDiscoveryServicePhase;
  sessionId: string;
  streamingText: string;
  summary: null | string;
  thinkingBlocks: Array<string>;
  timeoutId: null | ReturnType<typeof setTimeout>;
}

// =============================================================================
// Service Class
// =============================================================================

/**
 * File Discovery Step Service
 *
 * Manages the file discovery step of workflow pipelines.
 * Loads agent configuration from the database and executes
 * the file discovery agent to identify relevant files.
 *
 * Extends BaseAgentStepService to leverage shared abstractions:
 * - AgentSdkExecutor for SDK query execution
 * - StepAuditLogger for consistent audit logging
 * - StructuredOutputValidator for output validation
 * - AgentTimeoutManager for timeout handling
 * - OutcomeBuilder for pause information
 */
class FileDiscoveryStepService extends BaseAgentStepService<
  FileDiscoveryAgentConfig,
  ActiveFileDiscoverySession,
  FileDiscoveryServiceOptions,
  FileDiscoveryServicePhase,
  FileDiscoveryOutcome,
  FileDiscoveryStreamMessage
> {
  private auditLogger = new StepAuditLogger('file_discovery');
  private sdkExecutor = new AgentSdkExecutor<
    FileDiscoveryAgentConfig,
    ActiveFileDiscoverySession,
    FileDiscoveryStreamMessage
  >();
  private structuredValidator = new StructuredOutputValidator(fileDiscoveryAgentOutputSchema);

  /**
   * Cancel an active file discovery session.
   *
   * Uses the template method from BaseAgentStepService for standardized cleanup.
   * File discovery overrides onBeforeCancel to save partial results.
   *
   * @param workflowId - The workflow ID to cancel
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the cancelled outcome
   */
  async cancelDiscovery(
    workflowId: number,
    onStreamMessage?: (message: FileDiscoveryStreamMessage) => void
  ): Promise<FileDiscoveryOutcome> {
    return this.cancelSession(workflowId, this.auditLogger, onStreamMessage);
  }

  /**
   * Get the current state of a file discovery session.
   *
   * @param workflowId - The workflow ID to query
   * @returns The current service state, or null if not found
   */
  getState(workflowId: number): FileDiscoveryServiceState | null {
    const session = this.activeSessions.get(workflowId);
    if (!session) return null;

    return this.extractState(session);
  }

  /**
   * Retry a failed file discovery with exponential backoff.
   *
   * Uses the template method from BaseAgentStepService for standardized retry logic.
   *
   * @param options - The file discovery service options
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the discovery outcome
   */
  async retryDiscovery(
    options: FileDiscoveryServiceOptions,
    onStreamMessage?: (message: FileDiscoveryStreamMessage) => void
  ): Promise<FileDiscoveryOutcomeWithPause> {
    return this.retrySession(
      options.workflowId,
      options,
      this.startDiscovery.bind(this),
      this.auditLogger,
      onStreamMessage
    );
  }

  /**
   * Start the file discovery process.
   *
   * @param options - The file discovery service options
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the discovery outcome with pause information
   */
  async startDiscovery(
    options: FileDiscoveryServiceOptions,
    onStreamMessage?: (message: FileDiscoveryStreamMessage) => void
  ): Promise<FileDiscoveryOutcomeWithPause> {
    // Handle re-discovery mode: clear existing files if replace mode
    if (options.rediscoveryMode === 'replace') {
      await this.clearExistingDiscoveredFiles(options.stepId);
    }

    // Initialize session using base class helper
    const { session, timeoutSeconds, workflowId } = this.initializeSession(options, this.auditLogger, {
      agentId: options.agentId,
      rediscoveryMode: options.rediscoveryMode ?? 'none',
      refinedFeatureRequestLength: options.refinedFeatureRequest.length,
      repositoryPath: options.repositoryPath,
      stepId: options.stepId,
      timeoutSeconds: options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS,
    });

    try {
      // Phase: Loading agent
      session.phase = 'loading_agent';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      const agentConfig = await this.loadAgentConfig(workflowId, options.agentId);
      session.agentConfig = agentConfig;

      debugLoggerService.logSdkEvent(session.sessionId, 'Agent configuration loaded', {
        agentName: agentConfig.name,
        hooksCount: agentConfig.hooks.length,
        model: agentConfig.model,
        skillsCount: agentConfig.skills.length,
        toolsCount: agentConfig.tools.length,
      });

      // Audit log: agent configuration loaded
      this.auditLogger.logAgentLoaded(workflowId, options.stepId, agentConfig.id, agentConfig.name, {
        hooksCount: agentConfig.hooks.length,
        model: agentConfig.model,
        permissionMode: agentConfig.permissionMode,
        sessionId: session.sessionId,
        skillsCount: agentConfig.skills.length,
        toolsCount: agentConfig.tools.length,
      });

      // Phase: Executing
      session.phase = 'executing';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      // Set up timeout using AgentTimeoutManager
      const { cleanup: cleanupTimeout, promise: timeoutPromise } = createTimeoutPromise<
        ExecuteAgentResult<FileDiscoveryOutcome, FileDiscoveryUsageStats>
      >({
        abortController: session.abortController,
        onTimeout: () => {
          session.phase = 'timeout';
          this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

          debugLoggerService.logSdkEvent(session.sessionId, 'File discovery timed out', {
            discoveredCount: session.discoveredFiles.length,
            elapsedSeconds: timeoutSeconds,
          });

          // Audit log: file discovery timeout
          this.auditLogger.logStepTimeout(
            workflowId,
            options.stepId,
            agentConfig.id,
            agentConfig.name,
            timeoutSeconds,
            {
              discoveredCount: session.discoveredFiles.length,
              sessionId: session.sessionId,
            }
          );

          // Save partial results on timeout
          if (session.discoveredFiles.length > 0) {
            void this.saveDiscoveredFiles(session);
          }

          return {
            outcome: {
              elapsedSeconds: timeoutSeconds,
              error: `File discovery timed out after ${timeoutSeconds} seconds`,
              partialCount: session.discoveredFiles.length,
              type: 'TIMEOUT',
            },
          };
        },
        timeoutSeconds,
      });

      // Execute the agent
      const executionPromise = this.executeAgent(session, agentConfig, onStreamMessage);

      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // Clear timeout if execution completed first
      cleanupTimeout();

      // Clean up session on success
      this.cleanupSession(workflowId);

      // Add pause information and usage to successful outcomes using OutcomeBuilder
      const outcomeWithPause = buildOutcomeWithPauseInfo(
        result.outcome,
        workflowId,
        false, // file discovery is not a gate step
        result,
        true // skipFallbackAvailable
      );

      debugLoggerService.logSdkEvent(session.sessionId, 'File discovery completed with pause info', {
        hasSdkSessionId: !!result.sdkSessionId,
        hasUsage: !!result.usage,
        outcomeType: result.outcome.type,
        pauseRequested: outcomeWithPause.pauseRequested,
      });

      return outcomeWithPause;
    } catch (error) {
      session.phase = 'error';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      // Use centralized error handler for consistent logging
      // Include discoveredCount in extra event data for file discovery
      const errorResult = handleStepError({
        agentId: session.agentConfig?.id,
        agentName: session.agentConfig?.name,
        auditLogger: this.auditLogger,
        error,
        extraEventData: { discoveredCount: session.discoveredFiles.length },
        getRetryCount: () => this.getRetryCount(workflowId),
        isRetryLimitReached: () => this.isRetryLimitReached(workflowId),
        sessionId: session.sessionId,
        stepId: options.stepId,
        stepName: 'File discovery',
        workflowId,
      });

      // Save partial results if any files were discovered before error
      if (session.discoveredFiles.length > 0) {
        await this.saveDiscoveredFiles(session);
      }

      // Clean up session (but keep retry count for potential retry)
      this.activeSessions.delete(workflowId);

      // Return extended outcome with retry information and partial count
      return {
        ...buildErrorOutcomeFromResult(errorResult, true),
        partialCount: session.discoveredFiles.length,
      } as FileDiscoveryOutcomeWithPause;
    }
  }

  // ===========================================================================
  // Protected Template Method Implementations
  // ===========================================================================

  /**
   * Build cancelled outcome specific to file discovery step.
   *
   * File discovery includes partial count in the cancelled outcome.
   *
   * @param session - The active session with discoveredFiles
   * @returns The file discovery cancelled outcome
   */
  protected buildCancelledOutcome(session: ActiveFileDiscoverySession): FileDiscoveryOutcome {
    return {
      partialCount: session.discoveredFiles.length,
      reason: 'User cancelled file discovery',
      type: 'CANCELLED',
    };
  }

  /**
   * Build error outcome when maximum retry attempts are reached.
   *
   * Note: retryCount and skipFallbackAvailable are added by the base class
   * template method to avoid duplicating intersection type fields.
   *
   * @param _workflowId - The workflow ID (unused)
   * @returns The file discovery error outcome
   */
  protected buildMaxRetryErrorOutcome(_workflowId: number): FileDiscoveryOutcome {
    return {
      error: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Please try again later.`,
      type: 'ERROR',
    };
  }

  /**
   * Build error outcome when no active session found.
   *
   * @param _workflowId - The workflow ID (unused)
   * @returns The file discovery error outcome
   */
  protected buildNotFoundErrorOutcome(_workflowId: number): FileDiscoveryOutcome {
    return {
      error: 'Session not found',
      type: 'ERROR',
    };
  }

  /**
   * Build the file discovery prompt for the agent.
   *
   * @param options - The file discovery service options
   * @returns The formatted prompt
   */
  protected buildPrompt(options: FileDiscoveryServiceOptions): string {
    const refinedFeatureRequest = options.refinedFeatureRequest;
    return `Analyze the following refined feature request and discover all files in this codebase that are relevant to implementing it.

## Refined Feature Request

${refinedFeatureRequest}

## Your Task

1. **Explore the Codebase**: Use the available tools (Read, Grep, Glob) to understand the project structure and identify files relevant to this feature.

2. **Discover Relevant Files**: For each file you identify as relevant, determine:
   - **Path**: The relative path from the repository root (e.g., "components/ui/Button.tsx")
   - **Priority**: How important is this file to the feature?
     - high: Core files essential to the feature implementation
     - medium: Supporting files that contribute to the feature
     - low: Peripheral files with minor relevance
   - **Action**: What needs to happen with this file?
     - create: File does not exist and needs to be created
     - modify: Existing file that requires changes
     - delete: Existing file that should be removed
     - reference: Existing file needed for context but not directly changed
   - **Role**: The functional purpose (e.g., "data model", "UI component", "utility", "test file", "configuration")
   - **Relevance**: A clear explanation of why this file matters for the feature

3. **Be Thorough**: Consider all layers of the implementation:
   - Database schemas and repositories
   - API/IPC handlers
   - React components and pages
   - Hooks and utilities
   - Validation schemas
   - Type definitions
   - Test files
   - Configuration files

4. **Follow Existing Patterns**: Look at similar features in the codebase to understand:
   - File naming conventions
   - Directory structure
   - Common dependencies

5. **Provide a Summary**: After listing all files, provide a brief summary of your analysis and the scope of changes needed.

Focus on actionable discovery that will help create a comprehensive implementation plan.`;
  }

  /**
   * Create a new session for the given options.
   *
   * Initializes file-discovery-specific session state (discoveredFiles array, summary).
   *
   * @param _workflowId - The workflow ID (unused in this implementation)
   * @param options - The service options
   * @returns The initialized session
   */
  protected createSession(_workflowId: number, options: FileDiscoveryServiceOptions): ActiveFileDiscoverySession {
    return {
      abortController: new AbortController(),
      activeTools: [],
      agentConfig: null,
      discoveredFiles: [],
      options,
      phase: 'idle',
      sessionId: randomUUID(),
      streamingText: '',
      summary: null,
      thinkingBlocks: [],
      timeoutId: null,
    };
  }

  /**
   * Extract step-specific state from a session.
   *
   * Returns only the relevant state fields for the file discovery state type,
   * excluding internal tracking fields like abortController.
   *
   * @param session - The active session
   * @returns The extracted state object
   */
  protected extractState(session: ActiveFileDiscoverySession): FileDiscoveryServiceState {
    return {
      agentConfig: session.agentConfig,
      discoveredCount: session.discoveredFiles.length,
      phase: session.phase,
      summary: session.summary,
    };
  }

  /**
   * Return the step name for logging.
   *
   * @returns The step name 'discovery'
   */
  protected getStepName(): string {
    return 'discovery';
  }

  /**
   * Hook called before cancel completes to save partial results.
   *
   * File discovery saves any discovered files before cleanup to preserve work.
   *
   * @param session - The active session being cancelled
   */
  protected override async onBeforeCancel(session: ActiveFileDiscoverySession): Promise<void> {
    // Save partial results if any files were discovered
    if (session.discoveredFiles.length > 0) {
      await this.saveDiscoveredFiles(session);
    }
  }

  /**
   * Process structured output from the SDK result message.
   *
   * For file discovery, the output includes an array of discovered files with metadata.
   * This method validates the output and transforms it to the proper outcome type.
   *
   * @param result - The SDK result message
   * @param sessionId - The session ID for logging
   * @returns The file discovery outcome
   */
  protected processStructuredOutput(result: SDKResultMessage, sessionId: string): FileDiscoveryOutcome {
    // Use StructuredOutputValidator to validate with the schema
    const validationResult = this.structuredValidator.validate(result, sessionId);

    if (!validationResult.success) {
      return {
        error: validationResult.error,
        type: 'ERROR',
      };
    }

    const output = validationResult.data;

    // Validate that discoveredFiles is present
    const filesCheck = this.structuredValidator.validateField(output, 'discoveredFiles', sessionId);
    if (!filesCheck.success) {
      return {
        error: 'Agent output missing required "discoveredFiles" field or field is empty',
        type: 'ERROR',
      };
    }

    // Validate that summary is present
    const summaryCheck = this.structuredValidator.validateField(output, 'summary', sessionId);
    if (!summaryCheck.success) {
      return {
        error: 'Agent output missing required "summary" field or field is empty',
        type: 'ERROR',
      };
    }

    // Return placeholder SUCCESS outcome (actual files saved separately)
    // This is different from other steps since we need to save to DB
    return {
      discoveredFiles: [], // Will be populated by saveDiscoveredFiles
      summary: output.summary!,
      totalCount: output.discoveredFiles!.length,
      type: 'SUCCESS',
    };
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Clear existing discovered files for a workflow step (replace mode).
   *
   * @param stepId - The workflow step ID
   */
  private async clearExistingDiscoveredFiles(stepId: number): Promise<void> {
    const db = getDatabase();
    const discoveredFilesRepo = createDiscoveredFilesRepository(db);

    try {
      discoveredFilesRepo.clearByWorkflowStep(stepId);
      debugLoggerService.logSdkEvent('system', 'Cleared existing discovered files for re-discovery', {
        stepId,
      });
    } catch (error) {
      debugLoggerService.logSdkEvent('system', 'Failed to clear discovered files', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stepId,
      });
    }
  }

  /**
   * Execute the file discovery agent and collect output.
   *
   * Uses AgentSdkExecutor for stream processing and SDK options building.
   * The custom stream event handler hook is available for future file_discovered
   * events if needed.
   *
   * @param session - The active session
   * @param agentConfig - The loaded agent configuration
   * @param onStreamMessage - Optional callback for streaming events
   * @returns The discovery outcome with usage metadata
   */
  private async executeAgent(
    session: ActiveFileDiscoverySession,
    agentConfig: FileDiscoveryAgentConfig,
    onStreamMessage?: (message: FileDiscoveryStreamMessage) => void
  ): Promise<ExecuteAgentResult<FileDiscoveryOutcome, FileDiscoveryUsageStats>> {
    // Build the prompt using template method
    const prompt = this.buildPrompt(session.options);

    debugLoggerService.logSdkEvent(session.sessionId, 'Starting file discovery agent', {
      promptLength: prompt.length,
    });

    // Audit log: file discovery exploring
    this.auditLogger.logStepExploring(
      session.options.workflowId,
      session.options.stepId,
      agentConfig.id,
      agentConfig.name,
      {
        model: agentConfig.model,
        promptLength: prompt.length,
        sessionId: session.sessionId,
        toolsCount: agentConfig.tools.length,
      }
    );

    // Execute the query using AgentSdkExecutor
    const resultMessage = await this.sdkExecutor.executeQuery(
      session,
      {
        abortController: session.abortController,
        agentConfig,
        outputFormatSchema: fileDiscoveryAgentOutputJSONSchema,
        repositoryPath: session.options.repositoryPath,
      },
      prompt,
      {
        // Custom stream event handler for file_discovered events (if implemented in future)
        onCustomStreamEvent: (event, sess) => {
          this.handleCustomStreamEvent(event, sess, onStreamMessage);
        },
        onMessageEmit: onStreamMessage,
        onPhaseChange: (phase) => {
          session.phase = phase as FileDiscoveryServicePhase;
          this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
        },
      }
    );

    // Phase: Processing response
    session.phase = 'processing_response';
    this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

    // Handle missing result message (cancelled or null)
    if (!resultMessage) {
      return {
        outcome: {
          partialCount: session.discoveredFiles.length,
          reason: 'File discovery was cancelled',
          type: 'CANCELLED',
        },
      };
    }

    debugLoggerService.logSdkEvent(session.sessionId, 'Processing structured output', {
      hasStructuredOutput: resultMessage.subtype === 'success' ? !!resultMessage.structured_output : false,
      resultSubtype: resultMessage.subtype,
    });

    // Log raw agent text for debugging structured output issues
    debugLoggerService.logSdkEvent(session.sessionId, 'Raw agent output for debugging', {
      streamingTextLength: session.streamingText.length,
      streamingTextPreview: session.streamingText.slice(0, 500),
      thinkingBlockCount: session.thinkingBlocks.length,
    });

    // Extract and validate structured output using template method
    const outcome = this.processStructuredOutput(resultMessage, session.sessionId);

    // Update session state based on outcome and save files
    if (outcome.type === 'SUCCESS') {
      // Extract files from structured output for saving
      const validationResult = this.structuredValidator.validate(resultMessage, session.sessionId);
      if (validationResult.success && validationResult.data.discoveredFiles) {
        session.discoveredFiles = validationResult.data.discoveredFiles;
        session.summary = validationResult.data.summary;
      }

      // Phase: Saving results
      session.phase = 'saving_results';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      // Save discovered files to database
      const savedFiles = await this.saveDiscoveredFiles(session);

      session.phase = 'complete';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      debugLoggerService.logSdkEvent(session.sessionId, 'File discovery outcome determined', {
        fileCount: savedFiles.length,
        outcomeType: 'SUCCESS',
        phase: session.phase,
      });

      // Audit log: file discovery completed
      this.auditLogger.logStepCompleted(
        session.options.workflowId,
        session.options.stepId,
        agentConfig.id,
        agentConfig.name,
        `File discovery completed: discovered ${savedFiles.length} files`,
        {
          fileCount: savedFiles.length,
          sessionId: session.sessionId,
          summary: session.summary,
        },
        { discoveredCount: savedFiles.length, phase: 'complete' }
      );

      // Extract usage statistics
      const usage = extractUsageStats(resultMessage);

      return {
        outcome: {
          discoveredFiles: savedFiles,
          summary: session.summary ?? 'Discovery completed',
          totalCount: savedFiles.length,
          type: 'SUCCESS',
        },
        sdkSessionId: resultMessage.session_id,
        usage,
      };
    } else {
      session.phase = outcome.type === 'ERROR' ? 'error' : 'complete';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      // Audit log: file discovery error
      if (outcome.type === 'ERROR') {
        this.auditLogger.logStepError(
          session.options.workflowId,
          session.options.stepId,
          agentConfig.id,
          agentConfig.name,
          outcome.error ?? 'Unknown error',
          {
            error: outcome.error,
            outcomeType: outcome.type,
            sessionId: session.sessionId,
          }
        );
      }

      // Extract usage statistics
      const usage = extractUsageStats(resultMessage);

      return {
        outcome: {
          ...outcome,
          partialCount: session.discoveredFiles.length,
        },
        sdkSessionId: resultMessage.session_id,
        usage,
      };
    }
  }

  /**
   * Custom stream event handler for file discovery events.
   *
   * Processes tool results to detect file_discovered events and emit them
   * to the stream callback. This hook is called by AgentSdkExecutor for each
   * stream event before standard processing.
   *
   * Currently a placeholder for future file_discovered event handling.
   * Files are discovered from structured output at the end of execution.
   *
   * @param event - The raw stream event object
   * @param _session - The current session (unused)
   * @param _onStreamMessage - Optional callback for streaming events (unused)
   */
  private handleCustomStreamEvent(
    event: Record<string, unknown>,
    _session: ActiveFileDiscoverySession,
    _onStreamMessage?: (message: FileDiscoveryStreamMessage) => void
  ): void {
    // Future: Check for tool_result events that might contain file discoveries
    // For now, files are discovered from structured output at the end
    const eventType = event.type as string;

    // Log any tool_result events for potential future file_discovered handling
    if (eventType === 'tool_result') {
      debugLoggerService.logSdkEvent(_session.sessionId, 'Tool result event (for future file_discovered)', {
        hasContent: !!event.content,
        toolUseId: event.tool_use_id,
      });
    }
  }

  /**
   * Save discovered files to the database.
   *
   * @param session - The active session with discovered files
   * @returns Array of saved file records with IDs
   */
  private async saveDiscoveredFiles(
    session: ActiveFileDiscoverySession
  ): Promise<Array<{ filePath: string; id: number; priority: string }>> {
    const db = getDatabase();
    const discoveredFilesRepo = createDiscoveredFilesRepository(db);

    const savedFiles: Array<{ filePath: string; id: number; priority: string }> = [];

    // Handle additive mode: check for existing files by path
    const existingFilesByPath = new Map<string, number>();
    if (session.options.rediscoveryMode === 'additive') {
      const existing = await discoveredFilesRepo.findByWorkflowStepId(session.options.stepId);
      for (const file of existing) {
        existingFilesByPath.set(file.filePath, file.id);
      }
    }

    for (const [index, file] of session.discoveredFiles.entries()) {
      // Check if file already exists (additive mode)
      const existingId = existingFilesByPath.get(file.filePath);

      if (existingId) {
        // Update existing file with new metadata
        discoveredFilesRepo.update(existingId, {
          action: file.action,
          priority: file.priority,
          relevanceExplanation: file.relevanceExplanation,
          role: file.role,
          updatedAt: new Date().toISOString(),
        });
        savedFiles.push({
          filePath: file.filePath,
          id: existingId,
          priority: file.priority,
        });
      } else {
        // Create new file record
        const newFile: NewDiscoveredFile = {
          action: file.action,
          filePath: file.filePath,
          includedAt: new Date().toISOString(), // All discovered files included by default
          orderIndex: index,
          originalPriority: file.priority,
          priority: file.priority,
          relevanceExplanation: file.relevanceExplanation,
          role: file.role,
          workflowStepId: session.options.stepId,
        };

        const created = discoveredFilesRepo.create(newFile);
        savedFiles.push({
          filePath: created.filePath,
          id: created.id,
          priority: created.priority,
        });
      }
    }

    debugLoggerService.logSdkEvent(session.sessionId, 'Saved discovered files to database', {
      mode: session.options.rediscoveryMode ?? 'initial',
      newCount: savedFiles.length - existingFilesByPath.size,
      totalCount: savedFiles.length,
      updatedCount: existingFilesByPath.size,
    });

    return savedFiles;
  }
}

// Export singleton instance
export const fileDiscoveryStepService = new FileDiscoveryStepService();
