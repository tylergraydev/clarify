import { z } from 'zod';

import type { StepOutcomeWithPause } from '../../electron/services/agent-step';
import type { UsageStats } from '../../types/usage-stats';

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

import type { AgentConfig } from '../../types/agent-config';

export type FileDiscoveryAgentConfig = AgentConfig;

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

// =============================================================================
// Extended Outcome with Pause Info
// =============================================================================

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

import type {
  StepStreamExtendedThinkingHeartbeat,
  StepStreamPhaseChange,
  StepStreamTextDelta,
  StepStreamThinkingDelta,
  StepStreamThinkingStart,
  StepStreamToolStart,
  StepStreamToolUpdate,
} from '../../types/step-stream';

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
// Re-export shared types with file-discovery-specific names for backward compatibility
export type FileDiscoveryStreamExtendedThinkingHeartbeat = StepStreamExtendedThinkingHeartbeat;
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
export type FileDiscoveryStreamPhaseChange = StepStreamPhaseChange<FileDiscoveryServicePhase>;

export type FileDiscoveryStreamTextDelta = StepStreamTextDelta;

export type FileDiscoveryStreamThinkingDelta = StepStreamThinkingDelta;

export type FileDiscoveryStreamThinkingStart = StepStreamThinkingStart;

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

export type FileDiscoveryStreamToolStart = StepStreamToolStart;

export type FileDiscoveryStreamToolUpdate = StepStreamToolUpdate;

/**
 * Usage statistics for file discovery.
 */
export type FileDiscoveryUsageStats = UsageStats;

// Re-export UsageStats for convenience
export type { UsageStats } from '../../types/usage-stats';
