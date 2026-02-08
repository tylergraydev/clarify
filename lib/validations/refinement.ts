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

import type { AgentConfig } from '../../types/agent-config';

export type RefinementAgentConfig = AgentConfig;

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

import type {
  StepStreamExtendedThinkingHeartbeat,
  StepStreamPhaseChange,
  StepStreamTextDelta,
  StepStreamThinkingDelta,
  StepStreamThinkingStart,
  StepStreamToolStart,
  StepStreamToolStop,
  StepStreamToolUpdate,
} from '../../types/step-stream';

// Re-export shared types with refinement-specific names for backward compatibility
export type RefinementStreamExtendedThinkingHeartbeat = StepStreamExtendedThinkingHeartbeat;
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
export type RefinementStreamPhaseChange = StepStreamPhaseChange<RefinementServicePhase>;
export type RefinementStreamTextDelta = StepStreamTextDelta;
export type RefinementStreamThinkingDelta = StepStreamThinkingDelta;
export type RefinementStreamThinkingStart = StepStreamThinkingStart;
export type RefinementStreamToolStart = StepStreamToolStart;
export type RefinementStreamToolStop = StepStreamToolStop;

export type RefinementStreamToolUpdate = StepStreamToolUpdate;

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

export type { UsageStats as RefinementUsageStats } from '../../types/usage-stats';

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
