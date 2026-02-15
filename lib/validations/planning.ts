import { z } from 'zod';

import type { AgentConfig } from '../../types/agent-config';
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

// =============================================================================
// Plan Structure Schemas
// =============================================================================

/**
 * Schema for a single implementation step within the plan.
 */
export const implementationPlanStepSchema = z.object({
  description: z.string().min(1, 'Step description is required'),
  files: z.array(z.string().min(1)).min(1, 'At least 1 file is required'),
  order: z.number().int().min(1, 'Order must be at least 1'),
  successCriteria: z.array(z.string().min(1)),
  title: z.string().min(1, 'Step title is required'),
  validationCommands: z.array(z.string().min(1)),
});

export type ImplementationPlanStep = z.infer<typeof implementationPlanStepSchema>;

/**
 * Schema for a complete implementation plan.
 */
export const implementationPlanSchema = z.object({
  approach: z.string().min(1, 'Approach description is required'),
  estimatedComplexity: z.enum(['low', 'medium', 'high']),
  risks: z.array(z.string()).optional(),
  steps: z.array(implementationPlanStepSchema).min(1, 'At least 1 step is required').max(20, 'Maximum 20 steps'),
  summary: z.string().min(1, 'Plan summary is required'),
});

export type ImplementationPlan = z.infer<typeof implementationPlanSchema>;

// =============================================================================
// Plan Iteration & Step Output Schemas
// =============================================================================

/**
 * Schema for a single plan iteration (version).
 * Each feedback/revision cycle creates a new iteration.
 */
export const planIterationSchema = z.object({
  createdAt: z.string(),
  editedByUser: z.boolean().default(false),
  feedback: z.string().optional(),
  plan: implementationPlanSchema,
  version: z.number().int().min(1),
});

export type PlanIteration = z.infer<typeof planIterationSchema>;

/**
 * Schema for the complete planning step output stored in outputStructured.
 */
export const planningStepOutputSchema = z.object({
  approved: z.boolean().default(false),
  approvedAt: z.string().optional(),
  currentVersion: z.number().int().min(1),
  iterations: z.array(planIterationSchema).min(1),
});

export type PlanningStepOutput = z.infer<typeof planningStepOutputSchema>;

// =============================================================================
// Agent Structured Output Schemas
// =============================================================================

/**
 * Flat schema for SDK structured outputs.
 *
 * IMPORTANT: The Claude Agent SDK does NOT support `oneOf`, `anyOf`, or `allOf`
 * at the top level of JSON schemas. This flat schema avoids the limitation by:
 * 1. Using a single object with `type` as an enum discriminator
 * 2. Making variant-specific fields optional
 * 3. Relying on the agent to populate the correct fields based on type
 *
 * Runtime validation with planningAgentOutputSchema ensures type safety.
 */
export const planningAgentOutputFlatSchema = z.object({
  plan: implementationPlanSchema.optional().describe('Required when type is PLAN_GENERATED'),
  reason: z.string().min(1).optional().describe('Required when type is CANNOT_PLAN'),
  type: z.enum(['PLAN_GENERATED', 'CANNOT_PLAN']),
});

export type PlanningAgentOutputFlat = z.infer<typeof planningAgentOutputFlatSchema>;

/**
 * Schema for PLAN_GENERATED output variant.
 */
export const planningAgentPlanOutputSchema = z.object({
  plan: implementationPlanSchema,
  type: z.literal('PLAN_GENERATED'),
});

export type PlanningAgentPlanOutput = z.infer<typeof planningAgentPlanOutputSchema>;

/**
 * Schema for CANNOT_PLAN output variant.
 */
export const planningAgentCannotPlanOutputSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
  type: z.literal('CANNOT_PLAN'),
});

export type PlanningAgentCannotPlanOutput = z.infer<typeof planningAgentCannotPlanOutputSchema>;

/**
 * Discriminated union for runtime validation of agent output.
 */
export const planningAgentOutputSchema = z.discriminatedUnion('type', [
  planningAgentPlanOutputSchema,
  planningAgentCannotPlanOutputSchema,
]);

export type PlanningAgentOutput = z.infer<typeof planningAgentOutputSchema>;

/**
 * JSON Schema for SDK structured outputs.
 * Generated from the Zod schema using z.toJSONSchema() for maintainability.
 */
const generatedSchema = z.toJSONSchema(planningAgentOutputFlatSchema) as Record<string, unknown>;

// Remove $schema property - SDK may not support draft 2020-12 declarations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { $schema, ...schemaWithoutDraft } = generatedSchema;

export const planningAgentOutputJSONSchema: Record<string, unknown> = schemaWithoutDraft;

// =============================================================================
// Service-Level Types
// =============================================================================

export type PlanningAgentConfig = AgentConfig;

/**
 * Discriminated union of all possible planning outcomes.
 */
export type PlanningOutcome =
  | PlanningOutcomeCancelled
  | PlanningOutcomeCannotPlan
  | PlanningOutcomeError
  | PlanningOutcomePlanGenerated
  | PlanningOutcomeTimeout;

export interface PlanningOutcomeCancelled {
  reason?: string;
  type: 'CANCELLED';
}

export interface PlanningOutcomeCannotPlan {
  reason: string;
  type: 'CANNOT_PLAN';
}

export interface PlanningOutcomeError {
  error: string;
  stack?: string;
  type: 'ERROR';
}

export interface PlanningOutcomePlanGenerated {
  plan: ImplementationPlan;
  type: 'PLAN_GENERATED';
}

export interface PlanningOutcomeTimeout {
  elapsedSeconds: number;
  error: string;
  type: 'TIMEOUT';
}

/**
 * Options for initializing the planning service.
 */
export interface PlanningServiceOptions {
  agentId: number;
  discoveredFiles: Array<{ filePath: string; priority: string; relevanceExplanation?: string }>;
  previousIterations?: Array<PlanIteration>;
  refinedFeatureRequest: string;
  repositoryPath: string;
  stepId: number;
  timeoutSeconds?: number;
  userFeedback?: string;
  workflowId: number;
}

/**
 * Phases of the planning service execution.
 */
export type PlanningServicePhase =
  | 'awaiting_review'
  | 'cancelled'
  | 'complete'
  | 'error'
  | 'executing'
  | 'executing_extended_thinking'
  | 'idle'
  | 'loading_agent'
  | 'processing_response'
  | 'regenerating'
  | 'timeout';

/**
 * State of the planning service during execution.
 */
export interface PlanningServiceState {
  agentConfig: null | PlanningAgentConfig;
  currentPlan: ImplementationPlan | null;
  phase: PlanningServicePhase;
}

// =============================================================================
// Streaming Message Types
// =============================================================================

export type PlanningStreamExtendedThinkingHeartbeat = StepStreamExtendedThinkingHeartbeat;

export type PlanningStreamMessage =
  | PlanningStreamExtendedThinkingHeartbeat
  | PlanningStreamPhaseChange
  | PlanningStreamTextDelta
  | PlanningStreamThinkingDelta
  | PlanningStreamThinkingStart
  | PlanningStreamToolStart
  | PlanningStreamToolStop
  | PlanningStreamToolUpdate;

export type PlanningStreamPhaseChange = StepStreamPhaseChange<PlanningServicePhase>;
export type PlanningStreamTextDelta = StepStreamTextDelta;
export type PlanningStreamThinkingDelta = StepStreamThinkingDelta;
export type PlanningStreamThinkingStart = StepStreamThinkingStart;
export type PlanningStreamToolStart = StepStreamToolStart;
export type PlanningStreamToolStop = StepStreamToolStop;
export type PlanningStreamToolUpdate = StepStreamToolUpdate;

// =============================================================================
// Usage Tracking Types
// =============================================================================

export type { UsageStats as PlanningUsageStats } from '../../types/usage-stats';
