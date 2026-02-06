import { z } from 'zod';

/**
 * Schema for a single clarification option.
 * Each option has a label and description that the user can select.
 */
export const clarificationOptionSchema = z.object({
  description: z.string(),
  label: z.string().min(1, 'Option label is required'),
});

export type ClarificationOption = z.infer<typeof clarificationOptionSchema>;

/**
 * Schema for a single clarification question.
 * Each question has:
 * - question: The full question text to display
 * - header: Short label for the question (e.g., "Storage", "Scope")
 * - options: Array of 2-4 selectable options (optional for text questions)
 * - questionType: Type of question (radio, checkbox, or text)
 * - allowOther: Whether to show "Other" text input (for radio/checkbox only, ignored for text)
 */
export const clarificationQuestionSchema = z.object({
  allowOther: z
    .boolean()
    .default(true)
    .describe('Whether to show "Other" text input for radio/checkbox questions (ignored for text)'),
  header: z.string().min(1, 'Question header is required'),
  options: z
    .array(clarificationOptionSchema)
    .min(2, 'At least 2 options are required')
    .max(4, 'Maximum 4 options allowed')
    .optional()
    .describe('Array of selectable options (required for radio/checkbox, not needed for text)'),
  question: z.string().min(1, 'Question text is required'),
  questionType: z
    .enum(['radio', 'checkbox', 'text'])
    .default('radio')
    .describe('Type of question: radio (single select), checkbox (multi-select), or text (open-ended)'),
});

export type ClarificationQuestion = z.infer<typeof clarificationQuestionSchema>;

/**
 * Schema for an array of clarification questions.
 */
export const clarificationQuestionsArraySchema = z.array(clarificationQuestionSchema);

export type ClarificationQuestions = z.infer<typeof clarificationQuestionsArraySchema>;

/**
 * Schema for a single clarification answer.
 * Supports three answer formats based on question type:
 * - Radio: Single selection with optional "Other" text
 * - Checkbox: Multiple selections with optional "Other" text
 * - Text: Open-ended text response
 */
export const clarificationAnswerSchema = z.discriminatedUnion('type', [
  z.object({
    other: z.string().optional().describe('Custom "Other" text provided by user'),
    selected: z.string().min(1, 'Selection is required'),
    type: z.literal('radio'),
  }),
  z.object({
    other: z.string().optional().describe('Custom "Other" text provided by user'),
    selected: z.array(z.string()).min(1, 'At least one selection is required'),
    type: z.literal('checkbox'),
  }),
  z.object({
    text: z.string().min(1, 'Text is required'),
    type: z.literal('text'),
  }),
]);

export type ClarificationAnswer = z.infer<typeof clarificationAnswerSchema>;

/**
 * Schema for clarification answers.
 * Maps question index (as string "0", "1", etc.) to the answer object.
 */
export const clarificationAnswersSchema = z.record(z.string(), clarificationAnswerSchema);

export type ClarificationAnswers = z.infer<typeof clarificationAnswersSchema>;

/**
 * Schema for the assessment object in clarification output.
 * Contains a clarity score (1-5) and reason for the assessment.
 */
export const clarificationAssessmentSchema = z.object({
  reason: z.string(),
  score: z.number().int().min(1, 'Score must be at least 1').max(5, 'Score must be at most 5'),
});

export type ClarificationAssessment = z.infer<typeof clarificationAssessmentSchema>;

/**
 * Schema for the complete clarification step output structure.
 * This matches the outputStructured field in workflow steps for clarification.
 */
export const clarificationStepOutputSchema = z.object({
  answers: clarificationAnswersSchema.optional(),
  assessment: clarificationAssessmentSchema.optional(),
  questions: clarificationQuestionsArraySchema,
  rawOutput: z.string().optional(),
  skipped: z.boolean().optional(),
  skipReason: z.string().optional(),
});

/**
 * Configuration for a loaded clarification agent.
 * Captures the full agent configuration needed for execution.
 */
export interface ClarificationAgentConfig {
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

// =============================================================================
// Service-Level Types for Clarification Orchestration
// =============================================================================

/**
 * Discriminated union of all possible clarification outcomes.
 * Used to communicate the result of the clarification service to the UI.
 */
export type ClarificationOutcome =
  | ClarificationOutcomeCancelled
  | ClarificationOutcomeError
  | ClarificationOutcomeQuestions
  | ClarificationOutcomeSkip
  | ClarificationOutcomeTimeout;

/**
 * Outcome when the clarification process is cancelled by the user.
 */
export interface ClarificationOutcomeCancelled {
  /** Reason for cancellation (if provided) */
  reason?: string;
  type: 'CANCELLED';
}

/**
 * Outcome when an error occurs during clarification.
 */
export interface ClarificationOutcomeError {
  /** Error message describing what went wrong */
  error: string;
  /** Optional stack trace for debugging */
  stack?: string;
  type: 'ERROR';
}

/**
 * Outcome when the agent generates clarification questions.
 */
export interface ClarificationOutcomeQuestions {
  /** Assessment of the feature clarity */
  assessment: ClarificationAssessment;
  /** Array of questions for the user */
  questions: Array<ClarificationQuestion>;
  type: 'QUESTIONS_FOR_USER';
}

/**
 * Outcome when clarification determines the feature is clear enough.
 */
export interface ClarificationOutcomeSkip {
  /** Assessment of why the feature is clear */
  assessment: ClarificationAssessment;
  /** The reason clarification was skipped */
  reason: string;
  type: 'SKIP_CLARIFICATION';
}

/**
 * Outcome when the clarification process times out.
 */
export interface ClarificationOutcomeTimeout {
  /** How long the process ran before timing out (in seconds) */
  elapsedSeconds: number;
  /** Error message describing the timeout */
  error: string;
  type: 'TIMEOUT';
}

/**
 * Input for submitting user answers to refine the feature request.
 */
export interface ClarificationRefinementInput {
  /** Map of question index to selected option label */
  answers: ClarificationAnswers;
  /** Original questions that were answered */
  questions: Array<ClarificationQuestion>;
  /** The workflow step ID */
  stepId: number;
  /** The workflow ID */
  workflowId: number;
}

/**
 * Options for initializing the clarification service.
 * Defines the contract between the UI and service layers.
 */
export interface ClarificationServiceOptions {
  /** The selected planning agent to use for clarification */
  agentId: number;
  /** Existing questions to include in the prompt context (for keep-existing mode) */
  existingQuestions?: Array<ClarificationQuestion>;
  /** The feature request text to analyze for clarity */
  featureRequest: string;
  /** Whether to keep existing questions and append new ones instead of replacing */
  keepExistingQuestions?: boolean;
  /** The path to the repository being analyzed */
  repositoryPath: string;
  /** Optional guidance text from the user to influence a rerun */
  rerunGuidance?: string;
  /** The ID of the current workflow step */
  stepId: number;
  /** Optional timeout in seconds for agent operations */
  timeoutSeconds?: number;
  /** The ID of the workflow this clarification belongs to */
  workflowId: number;
}

/**
 * Phases of the clarification service execution.
 */
export type ClarificationServicePhase =
  | 'cancelled'
  | 'complete'
  | 'error'
  | 'executing'
  | 'executing_extended_thinking'
  | 'idle'
  | 'loading_agent'
  | 'processing_response'
  | 'timeout'
  | 'waiting_for_user';

/**
 * State of the clarification service during execution.
 */
export interface ClarificationServiceState {
  /** Agent configuration after loading (null before loading) */
  agentConfig: ClarificationAgentConfig | null;
  /** Current execution phase */
  phase: ClarificationServicePhase;
  /** Questions generated by the agent (if any) */
  questions: Array<ClarificationQuestion> | null;
  /** Skip reason if clarification was skipped */
  skipReason: null | string;
}

export type ClarificationStepOutput = z.infer<typeof clarificationStepOutputSchema>;

// =============================================================================
// Agent Structured Output Schemas
// =============================================================================

/**
 * Schema for the agent's structured output when it determines
 * the feature request is clear enough to skip clarification.
 */
export const clarificationAgentSkipOutputSchema = z.object({
  assessment: clarificationAssessmentSchema,
  reason: z.string().min(1, 'Skip reason is required'),
  type: z.literal('SKIP_CLARIFICATION'),
});

export type ClarificationAgentSkipOutput = z.infer<typeof clarificationAgentSkipOutputSchema>;

/**
 * Schema for the agent's structured output when it generates
 * clarifying questions for the user.
 */
export const clarificationAgentQuestionsOutputSchema = z.object({
  assessment: clarificationAssessmentSchema,
  questions: z
    .array(clarificationQuestionSchema)
    .min(1, 'At least 1 question is required')
    .max(5, 'Maximum 5 questions allowed'),
  type: z.literal('QUESTIONS_FOR_USER'),
});

export type ClarificationAgentQuestionsOutput = z.infer<typeof clarificationAgentQuestionsOutputSchema>;

/**
 * Discriminated union of all valid agent outputs.
 * Used for runtime validation after receiving structured output.
 */
export const clarificationAgentOutputSchema = z.discriminatedUnion('type', [
  clarificationAgentSkipOutputSchema,
  clarificationAgentQuestionsOutputSchema,
]);

export type ClarificationAgentOutput = z.infer<typeof clarificationAgentOutputSchema>;

/**
 * Flat schema for SDK structured outputs.
 *
 * IMPORTANT: The Claude Agent SDK does NOT support `oneOf`, `anyOf`, or `allOf`
 * at the top level of JSON schemas. Using z.discriminatedUnion() generates
 * a `oneOf` which causes structured_output to be null even on success.
 *
 * This flat schema avoids the limitation by:
 * 1. Using a single object with `type` as an enum discriminator
 * 2. Making variant-specific fields (`reason`, `questions`) optional
 * 3. Relying on the agent to populate the correct fields based on type
 *
 * Runtime validation with clarificationAgentOutputSchema ensures type safety.
 */
export const clarificationAgentOutputFlatSchema = z.object({
  assessment: clarificationAssessmentSchema,
  questions: z
    .array(clarificationQuestionSchema)
    .min(1)
    .max(5)
    .optional()
    .describe('Required when type is QUESTIONS_FOR_USER. Array of 1-5 clarifying questions.'),
  reason: z
    .string()
    .min(1)
    .optional()
    .describe('Required when type is SKIP_CLARIFICATION. Explanation of why clarification is not needed.'),
  type: z.enum(['SKIP_CLARIFICATION', 'QUESTIONS_FOR_USER']),
});

export type ClarificationAgentOutputFlat = z.infer<typeof clarificationAgentOutputFlatSchema>;

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
const generatedSchema = z.toJSONSchema(clarificationAgentOutputFlatSchema) as Record<string, unknown>;

// Remove $schema property - SDK may not support draft 2020-12 declarations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { $schema, ...schemaWithoutDraft } = generatedSchema;

export const clarificationAgentOutputJSONSchema: Record<string, unknown> = schemaWithoutDraft;

// =============================================================================
// Usage Tracking Types
// =============================================================================

/**
 * Heartbeat message during extended thinking execution.
 * Sent periodically to indicate progress when streaming is disabled.
 */
export interface ClarificationStreamExtendedThinkingHeartbeat extends ClarificationStreamMessageBase {
  /** Elapsed time in milliseconds since execution started */
  elapsedMs: number;
  /** Estimated completion percentage (0-100, null if unknown) */
  estimatedProgress: null | number;
  /** Maximum thinking tokens budget */
  maxThinkingTokens: number;
  type: 'extended_thinking_heartbeat';
}

// =============================================================================
// Streaming Message Types
// =============================================================================

/**
 * Discriminated union of all clarification stream message types.
 * Used for type-safe handling of streaming events in the renderer.
 */
export type ClarificationStreamMessage =
  | ClarificationStreamExtendedThinkingHeartbeat
  | ClarificationStreamPhaseChange
  | ClarificationStreamTextDelta
  | ClarificationStreamThinkingDelta
  | ClarificationStreamThinkingStart
  | ClarificationStreamToolStart
  | ClarificationStreamToolStop
  | ClarificationStreamToolUpdate;

/**
 * Base interface for all clarification stream messages.
 * All messages include session identification and timing.
 */
export interface ClarificationStreamMessageBase {
  /** The session ID this message belongs to */
  sessionId: string;
  /** Timestamp when the message was generated */
  timestamp: number;
  /** Message type discriminator */
  type: ClarificationStreamMessageType;
  /** The workflow ID this message belongs to */
  workflowId: number;
}

/**
 * Type discriminator for clarification stream messages.
 */
export type ClarificationStreamMessageType =
  | 'extended_thinking_heartbeat'
  | 'phase_change'
  | 'text_delta'
  | 'thinking_delta'
  | 'thinking_start'
  | 'tool_start'
  | 'tool_stop'
  | 'tool_update';

/**
 * Stream message for phase transitions during clarification.
 */
export interface ClarificationStreamPhaseChange extends ClarificationStreamMessageBase {
  /** The new phase the service has transitioned to */
  phase: ClarificationServicePhase;
  type: 'phase_change';
}

/**
 * Stream message for text delta (incremental text output).
 */
export interface ClarificationStreamTextDelta extends ClarificationStreamMessageBase {
  /** The incremental text content */
  delta: string;
  type: 'text_delta';
}

/**
 * Stream message for thinking delta (incremental thinking output).
 */
export interface ClarificationStreamThinkingDelta extends ClarificationStreamMessageBase {
  /** Index of the thinking block being updated */
  blockIndex: number;
  /** The incremental thinking content */
  delta: string;
  type: 'thinking_delta';
}

/**
 * Stream message indicating a new thinking block has started.
 */
export interface ClarificationStreamThinkingStart extends ClarificationStreamMessageBase {
  /** Index of the thinking block being started */
  blockIndex: number;
  type: 'thinking_start';
}

/**
 * Stream message indicating a tool has started executing.
 */
export interface ClarificationStreamToolStart extends ClarificationStreamMessageBase {
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
export interface ClarificationStreamToolStop extends ClarificationStreamMessageBase {
  /** Unique identifier of the tool invocation that completed */
  toolUseId: string;
  type: 'tool_stop';
}

/**
 * Stream message indicating a tool input payload has been updated.
 */
export interface ClarificationStreamToolUpdate extends ClarificationStreamMessageBase {
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
 * Tracks token usage, cost, and execution metrics.
 */
export interface ClarificationUsageStats {
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
