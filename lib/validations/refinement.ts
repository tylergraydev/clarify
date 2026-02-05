import { z } from 'zod';

import {
  type ClarificationAnswer,
  clarificationAnswersSchema,
  type ClarificationAssessment,
  clarificationAssessmentSchema,
  type ClarificationQuestion,
  clarificationQuestionsArraySchema,
} from './clarification';

// =============================================================================
// Refinement Service Configuration
// =============================================================================

/**
 * Options for initializing the refinement service.
 * Defines the contract between the UI and service layers.
 */
export const refinementServiceOptionsSchema = z.object({
  /** The selected planning agent to use for refinement */
  agentId: z.number().int().positive('Agent ID must be a positive integer'),
  /** Context from previous clarification step (questions and answers) */
  clarificationContext: z.object({
    /** Answers provided by the user for each question */
    answers: clarificationAnswersSchema,
    /** Assessment from the clarification step */
    assessment: clarificationAssessmentSchema.optional(),
    /** Questions that were presented to the user */
    questions: clarificationQuestionsArraySchema,
  }),
  /** The original feature request text */
  featureRequest: z.string().min(1, 'Feature request is required'),
  /** The path to the repository being analyzed */
  repositoryPath: z.string().min(1, 'Repository path is required'),
  /** The ID of the current workflow step */
  stepId: z.number().int().positive('Step ID must be a positive integer'),
  /** Optional timeout in seconds for agent operations */
  timeoutSeconds: z.number().int().positive().optional(),
  /** The ID of the workflow this refinement belongs to */
  workflowId: z.number().int().positive('Workflow ID must be a positive integer'),
});

/**
 * Configuration for a loaded refinement agent.
 * Captures the full agent configuration needed for execution.
 */
export interface RefinementAgentConfig {
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
 * Discriminated union of all possible refinement outcomes.
 * Used to communicate the result of the refinement service to the UI.
 */
export type RefinementOutcome =
  | RefinementOutcomeCancelled
  | RefinementOutcomeError
  | RefinementOutcomeSuccess
  | RefinementOutcomeTimeout;

// =============================================================================
// Refinement Outcome Types
// =============================================================================

/**
 * Outcome when the refinement process is cancelled by the user.
 */
export interface RefinementOutcomeCancelled {
  /** Reason for cancellation (if provided) */
  reason?: string;
  type: 'CANCELLED';
}

/**
 * Outcome when an error occurs during refinement.
 */
export interface RefinementOutcomeError {
  /** Error message describing what went wrong */
  error: string;
  /** Optional stack trace for debugging */
  stack?: string;
  type: 'ERROR';
}

/**
 * Outcome when the refinement process completes successfully.
 */
export interface RefinementOutcomeSuccess {
  /** The refined feature request text */
  refinedText: string;
  type: 'SUCCESS';
}

/**
 * Outcome when the refinement process times out.
 */
export interface RefinementOutcomeTimeout {
  /** How long the process ran before timing out (in seconds) */
  elapsedSeconds: number;
  /** Error message describing the timeout */
  error: string;
  type: 'TIMEOUT';
}

export type RefinementServiceOptions = z.infer<typeof refinementServiceOptionsSchema>;

/**
 * Zod schema for refinement outcome discriminated union.
 */
export const refinementOutcomeSchema = z.discriminatedUnion('type', [
  z.object({
    reason: z.string().optional(),
    type: z.literal('CANCELLED'),
  }),
  z.object({
    error: z.string(),
    stack: z.string().optional(),
    type: z.literal('ERROR'),
  }),
  z.object({
    refinedText: z.string().min(1, 'Refined text is required'),
    type: z.literal('SUCCESS'),
  }),
  z.object({
    elapsedSeconds: z.number().nonnegative(),
    error: z.string(),
    type: z.literal('TIMEOUT'),
  }),
]);

/**
 * Extended outcome with pause/retry information.
 * Used when the workflow needs to track pause points and retry state.
 */
export interface RefinementOutcomeWithPause {
  /** Whether the workflow is paused waiting for user action */
  isPaused: boolean;
  /** The underlying outcome result */
  outcome: RefinementOutcome;
  /** Number of retry attempts made */
  retryCount: number;
}

export const refinementOutcomeWithPauseSchema = z.object({
  isPaused: z.boolean(),
  outcome: refinementOutcomeSchema,
  retryCount: z.number().int().nonnegative(),
});

export type RefinementOutcomeWithPauseType = z.infer<typeof refinementOutcomeWithPauseSchema>;

// =============================================================================
// Refinement Service State
// =============================================================================

/**
 * Phases of the refinement service execution.
 */
export type RefinementServicePhase =
  | 'cancelled'
  | 'complete'
  | 'error'
  | 'executing'
  | 'executing_extended_thinking'
  | 'idle'
  | 'loading_agent'
  | 'processing_response'
  | 'timeout';

export const refinementServicePhaseSchema = z.enum([
  'idle',
  'loading_agent',
  'executing',
  'executing_extended_thinking',
  'processing_response',
  'complete',
  'error',
  'cancelled',
  'timeout',
]);

/**
 * State of the refinement service during execution.
 */
export interface RefinementServiceState {
  /** Agent configuration after loading (null before loading) */
  agentConfig: null | RefinementAgentConfig;
  /** Current execution phase */
  phase: RefinementServicePhase;
  /** Refined text output (if complete) */
  refinedText: null | string;
}

export const refinementServiceStateSchema = z.object({
  agentConfig: z
    .object({
      extendedThinkingEnabled: z.boolean(),
      hooks: z.array(
        z.object({
          body: z.string(),
          eventType: z.string(),
          matcher: z.string().nullable(),
        })
      ),
      id: z.number().int().positive(),
      maxThinkingTokens: z.number().int().positive().nullable(),
      model: z.string().nullable(),
      name: z.string(),
      permissionMode: z.string().nullable(),
      skills: z.array(
        z.object({
          isRequired: z.boolean(),
          skillName: z.string(),
        })
      ),
      systemPrompt: z.string(),
      tools: z.array(
        z.object({
          toolName: z.string(),
          toolPattern: z.string(),
        })
      ),
    })
    .nullable(),
  phase: refinementServicePhaseSchema,
  refinedText: z.string().nullable(),
});

// =============================================================================
// Streaming Message Types
// =============================================================================

/**
 * Type discriminator for refinement stream messages.
 */
export type RefinementStreamMessageType =
  | 'extended_thinking_heartbeat'
  | 'phase_change'
  | 'text_delta'
  | 'thinking_delta'
  | 'thinking_start'
  | 'tool_start'
  | 'tool_stop'
  | 'tool_update';

export const refinementStreamMessageTypeSchema = z.enum([
  'phase_change',
  'text_delta',
  'thinking_delta',
  'thinking_start',
  'tool_start',
  'tool_stop',
  'tool_update',
  'extended_thinking_heartbeat',
]);

/**
 * Base interface for all refinement stream messages.
 * All messages include session identification and timing.
 */
export interface RefinementStreamMessageBase {
  /** The session ID this message belongs to */
  sessionId: string;
  /** Timestamp when the message was generated */
  timestamp: number;
  /** Message type discriminator */
  type: RefinementStreamMessageType;
}

const refinementStreamMessageBaseSchema = z.object({
  sessionId: z.string(),
  timestamp: z.number(),
  type: refinementStreamMessageTypeSchema,
});

/**
 * Heartbeat message during extended thinking execution.
 * Sent periodically to indicate progress when streaming is disabled.
 */
export interface RefinementStreamExtendedThinkingHeartbeat extends RefinementStreamMessageBase {
  /** Elapsed time in milliseconds since execution started */
  elapsedMs: number;
  /** Estimated completion percentage (0-100, null if unknown) */
  estimatedProgress: null | number;
  /** Maximum thinking tokens budget */
  maxThinkingTokens: number;
  type: 'extended_thinking_heartbeat';
}

/**
 * Discriminated union of all refinement stream message types.
 * Used for type-safe handling of streaming events in the renderer.
 */
export type RefinementStreamMessage =
  | RefinementStreamExtendedThinkingHeartbeat
  | RefinementStreamPhaseChange
  | RefinementStreamTextDelta
  | RefinementStreamThinkingDelta
  | RefinementStreamThinkingStart
  | RefinementStreamToolStart
  | RefinementStreamToolStop
  | RefinementStreamToolUpdate;

/**
 * Stream message for phase transitions during refinement.
 */
export interface RefinementStreamPhaseChange extends RefinementStreamMessageBase {
  /** The new phase the service has transitioned to */
  phase: RefinementServicePhase;
  type: 'phase_change';
}

/**
 * Stream message for text delta (incremental text output).
 */
export interface RefinementStreamTextDelta extends RefinementStreamMessageBase {
  /** The incremental text content */
  delta: string;
  type: 'text_delta';
}

/**
 * Stream message for thinking delta (incremental thinking output).
 */
export interface RefinementStreamThinkingDelta extends RefinementStreamMessageBase {
  /** Index of the thinking block being updated */
  blockIndex: number;
  /** The incremental thinking content */
  delta: string;
  type: 'thinking_delta';
}

/**
 * Stream message indicating a new thinking block has started.
 */
export interface RefinementStreamThinkingStart extends RefinementStreamMessageBase {
  /** Index of the thinking block being started */
  blockIndex: number;
  type: 'thinking_start';
}

/**
 * Stream message indicating a tool has started executing.
 */
export interface RefinementStreamToolStart extends RefinementStreamMessageBase {
  /** Input parameters passed to the tool */
  toolInput: Record<string, unknown>;
  /** Name of the tool being executed */
  toolName: string;
  /** Unique identifier for this tool invocation */
  toolUseId: string;
  type: 'tool_start';
}

/**
 * Stream message indicating a tool has finished executing.
 */
export interface RefinementStreamToolStop extends RefinementStreamMessageBase {
  /** Unique identifier of the tool invocation that completed */
  toolUseId: string;
  type: 'tool_stop';
}

/**
 * Stream message indicating a tool input payload has been updated.
 */
export interface RefinementStreamToolUpdate extends RefinementStreamMessageBase {
  /** Input parameters passed to the tool */
  toolInput: Record<string, unknown>;
  /** Name of the tool being executed */
  toolName: string;
  /** Unique identifier for this tool invocation */
  toolUseId: string;
  type: 'tool_update';
}

/**
 * Zod schema for refinement stream messages (discriminated union).
 */
export const refinementStreamMessageSchema = z.discriminatedUnion('type', [
  refinementStreamMessageBaseSchema.extend({
    phase: refinementServicePhaseSchema,
    type: z.literal('phase_change'),
  }),
  refinementStreamMessageBaseSchema.extend({
    delta: z.string(),
    type: z.literal('text_delta'),
  }),
  refinementStreamMessageBaseSchema.extend({
    blockIndex: z.number().int().nonnegative(),
    delta: z.string(),
    type: z.literal('thinking_delta'),
  }),
  refinementStreamMessageBaseSchema.extend({
    blockIndex: z.number().int().nonnegative(),
    type: z.literal('thinking_start'),
  }),
  refinementStreamMessageBaseSchema.extend({
    toolInput: z.record(z.string(), z.unknown()),
    toolName: z.string(),
    toolUseId: z.string(),
    type: z.literal('tool_start'),
  }),
  refinementStreamMessageBaseSchema.extend({
    toolUseId: z.string(),
    type: z.literal('tool_stop'),
  }),
  refinementStreamMessageBaseSchema.extend({
    toolInput: z.record(z.string(), z.unknown()),
    toolName: z.string(),
    toolUseId: z.string(),
    type: z.literal('tool_update'),
  }),
  refinementStreamMessageBaseSchema.extend({
    elapsedMs: z.number().nonnegative(),
    estimatedProgress: z.number().min(0).max(100).nullable(),
    maxThinkingTokens: z.number().int().positive(),
    type: z.literal('extended_thinking_heartbeat'),
  }),
]);

// =============================================================================
// Regeneration Input Types
// =============================================================================

/**
 * Input for regenerating the refined feature request with additional guidance.
 */
export interface RefinementRegenerateInput {
  /** Additional guidance or context for the regeneration */
  guidance: string;
  /** The workflow step ID */
  stepId: number;
  /** The workflow ID */
  workflowId: number;
}

export const refinementRegenerateInputSchema = z.object({
  guidance: z.string().min(1, 'Guidance is required for regeneration'),
  stepId: z.number().int().positive('Step ID must be a positive integer'),
  workflowId: z.number().int().positive('Workflow ID must be a positive integer'),
});

// =============================================================================
// Usage Tracking Types
// =============================================================================

/**
 * Usage statistics from SDK result.
 * Tracks token usage, cost, and execution metrics.
 */
export interface RefinementUsageStats {
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

export const refinementUsageStatsSchema = z.object({
  costUsd: z.number().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative(),
  numTurns: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
});

// =============================================================================
// Agent Structured Output Schemas
// =============================================================================

/**
 * Schema for the agent's structured output when refinement completes.
 * Contains only the refined feature request text.
 */
export const refinementAgentOutputSchema = z.object({
  refinedText: z.string().min(1, 'Refined text is required'),
});

export type RefinementAgentOutput = z.infer<typeof refinementAgentOutputSchema>;

/**
 * Flat schema for SDK structured outputs.
 *
 * IMPORTANT: The Claude Agent SDK does NOT support `oneOf`, `anyOf`, or `allOf`
 * at the top level of JSON schemas. Using z.discriminatedUnion() generates
 * a `oneOf` which causes structured_output to be null even on success.
 *
 * For refinement, the output is simple enough that we don't need a
 * discriminated union - we just need the refined text.
 */
export const refinementAgentOutputFlatSchema = z.object({
  refinedText: z
    .string()
    .min(1)
    .describe('The refined and enhanced feature request text incorporating user clarification answers.'),
});

export type RefinementAgentOutputFlat = z.infer<typeof refinementAgentOutputFlatSchema>;

/**
 * JSON Schema for SDK structured outputs.
 *
 * Generated from the Zod schema using z.toJSONSchema() for maintainability.
 * This ensures the JSON schema stays in sync with the Zod schema automatically.
 *
 * Note: We strip the $schema property because the Claude Agent SDK may not
 * support JSON Schema draft 2020-12 declarations at the top level.
 *
 * @see https://zod.dev/?id=tojsonschema for Zod JSON Schema generation
 */
const generatedSchema = z.toJSONSchema(refinementAgentOutputFlatSchema) as Record<string, unknown>;

// Remove $schema property - SDK may not support draft 2020-12 declarations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { $schema, ...schemaWithoutDraft } = generatedSchema;

export const refinementAgentOutputJSONSchema: Record<string, unknown> = schemaWithoutDraft;

// =============================================================================
// Step Output Types
// =============================================================================

/**
 * Schema for the complete refinement step output structure.
 * This matches the outputStructured field in workflow steps for refinement.
 */
export const refinementStepOutputSchema = z.object({
  /** Original clarification context used for refinement */
  clarificationContext: z
    .object({
      answers: clarificationAnswersSchema,
      assessment: clarificationAssessmentSchema.optional(),
      questions: clarificationQuestionsArraySchema,
    })
    .optional(),
  /** Raw output from the agent (for debugging) */
  rawOutput: z.string().optional(),
  /** The refined feature request text */
  refinedText: z.string().optional(),
  /** Usage statistics from the agent execution */
  usageStats: refinementUsageStatsSchema.optional(),
});

export type RefinementStepOutput = z.infer<typeof refinementStepOutputSchema>;

// =============================================================================
// Re-export clarification types for convenience
// =============================================================================

export type { ClarificationAnswer, ClarificationAssessment, ClarificationQuestion };
