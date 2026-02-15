/**
 * Planning Step Service
 *
 * Orchestrates the implementation planning step of the workflow pipeline.
 * This service manages the execution of the planning agent, which generates
 * a structured implementation plan from the refined feature request and
 * discovered files context.
 *
 * Supports interactive feedback loops: the user can review the generated plan,
 * provide feedback, and the agent will regenerate incorporating the feedback.
 *
 * ## State Machine
 *
 * idle -> loading_agent -> executing -> processing_response -> awaiting_review | complete | error
 *                                                           -> cancelled | timeout
 * awaiting_review -> regenerating -> processing_response -> awaiting_review (feedback loop)
 *
 * @see {@link ../../lib/validations/planning.ts Planning Types}
 */

import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

import { randomUUID } from 'crypto';

import type { AgentActivityRepository } from '../../db/repositories/agent-activity.repository';
import type {
  ImplementationPlan,
  PlanningAgentConfig,
  PlanningOutcome,
  PlanningServiceOptions,
  PlanningServicePhase,
  PlanningServiceState,
  PlanningStreamMessage,
  PlanningUsageStats,
} from '../../lib/validations/planning';
import type { StepOutcomeWithPause } from './agent-step';
import type { ActiveToolInfo, ExecuteAgentResult } from './agent-step/step-types';

import {
  planningAgentOutputFlatSchema,
  planningAgentOutputJSONSchema,
} from '../../lib/validations/planning';
import { AgentSdkExecutor } from './agent-step/agent-sdk-executor';
import { MAX_RETRY_ATTEMPTS, STEP_TIMEOUTS } from './agent-step/agent-step-constants';
import { createTimeoutPromise } from './agent-step/agent-timeout-manager';
import { BaseAgentStepService } from './agent-step/base-agent-step-service';
import { buildOutcomeWithPauseInfo } from './agent-step/outcome-builder';
import { StepAuditLogger } from './agent-step/step-audit-logger';
import { buildErrorOutcomeFromResult, handleStepError } from './agent-step/step-error-handler';
import { StructuredOutputValidator } from './agent-step/structured-output-validator';
import { debugLoggerService } from './debug-logger.service';

const DEFAULT_TIMEOUT_SECONDS = STEP_TIMEOUTS.implementationPlanning;

/**
 * Extended outcome that includes pause information.
 */
export type PlanningOutcomeWithPause = StepOutcomeWithPause<PlanningOutcome, PlanningUsageStats>;

/**
 * Active planning session tracking.
 */
interface ActivePlanningSession {
  abortController: AbortController;
  activeTools: Array<ActiveToolInfo>;
  agentConfig: null | PlanningAgentConfig;
  currentPlan: ImplementationPlan | null;
  options: PlanningServiceOptions;
  phase: PlanningServicePhase;
  sessionId: string;
  streamingText: string;
  thinkingBlocks: Array<string>;
  timeoutId: null | ReturnType<typeof setTimeout>;
}

/**
 * Planning Step Service
 *
 * Manages the implementation planning step of workflow pipelines.
 * Loads agent configuration from the database and executes the planning
 * agent to generate structured implementation plans.
 */
class PlanningStepService extends BaseAgentStepService<
  PlanningAgentConfig,
  ActivePlanningSession,
  PlanningServiceOptions,
  PlanningServicePhase,
  PlanningOutcome,
  PlanningStreamMessage
> {
  private activityRepository: AgentActivityRepository | null = null;
  private auditLogger = new StepAuditLogger('implementationPlanning');
  private sdkExecutor = new AgentSdkExecutor<
    PlanningAgentConfig,
    ActivePlanningSession,
    PlanningStreamMessage
  >();
  private structuredValidator = new StructuredOutputValidator(planningAgentOutputFlatSchema);

  /**
   * Cancel an active planning session.
   */
  async cancelPlanning(
    workflowId: number,
    onStreamMessage?: (message: PlanningStreamMessage) => void
  ): Promise<PlanningOutcome> {
    return this.cancelSession(workflowId, this.auditLogger, onStreamMessage);
  }

  /**
   * Retry a failed planning with exponential backoff.
   */
  async retryPlanning(
    options: PlanningServiceOptions,
    onStreamMessage?: (message: PlanningStreamMessage) => void
  ): Promise<PlanningOutcomeWithPause> {
    return this.retrySession(
      options.workflowId,
      options,
      this.startPlanning.bind(this),
      this.auditLogger,
      onStreamMessage
    );
  }

  /**
   * Set the agent activity repository for persisting activity events.
   */
  setAgentActivityRepository(repo: AgentActivityRepository): void {
    this.activityRepository = repo;
  }

  /**
   * Start the planning process.
   *
   * Generates a structured implementation plan from the refined feature
   * request and discovered files context.
   */
  async startPlanning(
    options: PlanningServiceOptions,
    onStreamMessage?: (message: PlanningStreamMessage) => void
  ): Promise<PlanningOutcomeWithPause> {
    const { session, timeoutSeconds, workflowId } = this.initializeSession(options, this.auditLogger, {
      agentId: options.agentId,
      discoveredFilesCount: options.discoveredFiles.length,
      hasPreviousIterations: (options.previousIterations?.length ?? 0) > 0,
      repositoryPath: options.repositoryPath,
      stepId: options.stepId,
      timeoutSeconds: options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS,
    });

    try {
      // Phase: Loading agent
      session.phase = 'loading_agent';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      const agentConfig = this.loadAgentConfig(workflowId, options.agentId);
      session.agentConfig = agentConfig;

      debugLoggerService.logSdkEvent(session.sessionId, 'Agent configuration loaded for planning', {
        agentName: agentConfig.name,
        hooksCount: agentConfig.hooks.length,
        model: agentConfig.model,
        skillsCount: agentConfig.skills.length,
        toolsCount: agentConfig.tools.length,
      });

      this.auditLogger.logAgentLoaded(workflowId, options.stepId, agentConfig.id, agentConfig.name, {
        hooksCount: agentConfig.hooks.length,
        model: agentConfig.model,
        permissionMode: agentConfig.permissionMode,
        sessionId: session.sessionId,
        skillsCount: agentConfig.skills.length,
        toolsCount: agentConfig.tools.length,
      });

      // Phase: Executing (or regenerating if feedback loop)
      session.phase = options.userFeedback ? 'regenerating' : 'executing';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      // Set up timeout
      const { cleanup: cleanupTimeout, promise: timeoutPromise } = createTimeoutPromise<
        ExecuteAgentResult<PlanningOutcome, PlanningUsageStats>
      >({
        abortController: session.abortController,
        onTimeout: () => {
          session.phase = 'timeout';
          this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

          debugLoggerService.logSdkEvent(session.sessionId, 'Planning timed out', {
            elapsedSeconds: timeoutSeconds,
          });

          this.auditLogger.logStepTimeout(
            workflowId,
            options.stepId,
            agentConfig.id,
            agentConfig.name,
            timeoutSeconds,
            { sessionId: session.sessionId }
          );

          return {
            outcome: {
              elapsedSeconds: timeoutSeconds,
              error: `Planning timed out after ${timeoutSeconds} seconds`,
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

      cleanupTimeout();
      this.cleanupSession(workflowId);

      const outcomeWithPause = buildOutcomeWithPauseInfo(
        result.outcome,
        workflowId,
        result,
        false // no skip fallback for planning
      );

      debugLoggerService.logSdkEvent(session.sessionId, 'Planning completed with pause info', {
        hasSdkSessionId: !!result.sdkSessionId,
        hasUsage: !!result.usage,
        outcomeType: result.outcome.type,
        pauseRequested: outcomeWithPause.pauseRequested,
      });

      return outcomeWithPause;
    } catch (error) {
      session.phase = 'error';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      const errorResult = handleStepError({
        agentId: session.agentConfig?.id,
        agentName: session.agentConfig?.name,
        auditLogger: this.auditLogger,
        error,
        getRetryCount: () => this.getRetryCount(workflowId),
        isRetryLimitReached: () => this.isRetryLimitReached(workflowId),
        sessionId: session.sessionId,
        stepId: options.stepId,
        stepName: 'Planning',
        workflowId,
      });

      this.activeSessions.delete(workflowId);

      return buildErrorOutcomeFromResult(errorResult, false) as PlanningOutcomeWithPause;
    }
  }

  /**
   * Submit feedback and regenerate the plan.
   *
   * Re-runs the planning agent with all prior iterations and the user's
   * feedback included in the prompt context.
   */
  async submitFeedback(
    options: PlanningServiceOptions,
    onStreamMessage?: (message: PlanningStreamMessage) => void
  ): Promise<PlanningOutcomeWithPause> {
    return this.startPlanning(options, onStreamMessage);
  }

  // ===========================================================================
  // Protected Template Method Implementations
  // ===========================================================================

  protected applyOutcomeToSession(
    session: ActivePlanningSession,
    outcome: PlanningOutcome,
    _resultMessage: SDKResultMessage,
    _agentConfig: PlanningAgentConfig,
    onStreamMessage?: (message: PlanningStreamMessage) => void
  ): void {
    if (outcome.type === 'PLAN_GENERATED') {
      session.phase = 'awaiting_review';
      session.currentPlan = outcome.plan;
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
    } else if (outcome.type === 'CANNOT_PLAN') {
      session.phase = 'complete';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
    } else {
      session.phase = outcome.type === 'ERROR' ? 'error' : 'complete';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
    }
  }

  protected buildCancelledOutcome(_session: ActivePlanningSession): PlanningOutcome {
    return {
      reason: 'User cancelled planning',
      type: 'CANCELLED',
    };
  }

  protected buildMaxRetryErrorOutcome(_workflowId: number): PlanningOutcome {
    return {
      error: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Please try again later.`,
      type: 'ERROR',
    };
  }

  protected buildNotFoundErrorOutcome(_workflowId: number): PlanningOutcome {
    return {
      error: 'Session not found',
      type: 'ERROR',
    };
  }

  protected buildPrompt(options: PlanningServiceOptions): string {
    // Build discovered files context
    const filesContext = options.discoveredFiles.length > 0
      ? options.discoveredFiles
          .map((f) => `- \`${f.filePath}\` [${f.priority}]${f.relevanceExplanation ? `: ${f.relevanceExplanation}` : ''}`)
          .join('\n')
      : 'No files discovered yet.';

    // Build prior iterations context
    let iterationsContext = '';
    if (options.previousIterations && options.previousIterations.length > 0) {
      iterationsContext = '\n\n## Previous Plan Iterations\n\n';
      for (const iteration of options.previousIterations) {
        iterationsContext += `### Version ${iteration.version}${iteration.editedByUser ? ' (User Edited)' : ''}\n\n`;
        iterationsContext += `**Summary:** ${iteration.plan.summary}\n`;
        iterationsContext += `**Approach:** ${iteration.plan.approach}\n`;
        iterationsContext += `**Complexity:** ${iteration.plan.estimatedComplexity}\n`;
        iterationsContext += `**Steps:** ${iteration.plan.steps.map((s) => s.title).join(', ')}\n`;
        if (iteration.feedback) {
          iterationsContext += `\n**User Feedback:** ${iteration.feedback}\n`;
        }
        iterationsContext += '\n';
      }
    }

    // Build feedback context
    const feedbackContext = options.userFeedback
      ? `\n\n## User Feedback on Previous Plan\n\n${options.userFeedback}\n\nRevise the plan based on this feedback. Address the user's concerns while maintaining plan quality.`
      : '';

    return `Generate a structured implementation plan for the following feature request.

## Refined Feature Request

${options.refinedFeatureRequest}

## Discovered Files

The following files have been identified as relevant to this feature:

${filesContext}
${iterationsContext}${feedbackContext}

## Your Task

Create a detailed, actionable implementation plan with the following structure:

1. **Summary**: A concise overview of what will be implemented (1-2 sentences)
2. **Approach**: The architectural approach and key design decisions
3. **Steps**: Ordered implementation steps, each containing:
   - A clear title
   - A detailed description of what to do
   - The specific files to create or modify
   - Success criteria (how to verify the step is complete)
   - Validation commands to run (e.g., typecheck, lint, test)
4. **Risks**: Any potential risks or concerns (optional)
5. **Estimated Complexity**: low, medium, or high

Guidelines:
- Order steps by dependency (earlier steps should not depend on later ones)
- Each step should be independently verifiable
- Reference existing codebase patterns and conventions
- Keep steps focused — each should accomplish one logical unit of work
- Include 3-10 implementation steps (more for complex features, fewer for simple ones)
- Include validation commands that can actually be run in this project`;
  }

  protected createSession(_workflowId: number, options: PlanningServiceOptions): ActivePlanningSession {
    return {
      abortController: new AbortController(),
      activeTools: [],
      agentConfig: null,
      currentPlan: null,
      options,
      phase: 'idle',
      sessionId: randomUUID(),
      streamingText: '',
      thinkingBlocks: [],
      timeoutId: null,
    };
  }

  protected extractState(session: ActivePlanningSession): PlanningServiceState {
    return {
      agentConfig: session.agentConfig,
      currentPlan: session.currentPlan,
      phase: session.phase,
    };
  }

  protected getActivityRepository() {
    return this.activityRepository;
  }

  protected getAuditLogger() {
    return this.auditLogger;
  }

  protected getOutputFormatSchema() {
    return planningAgentOutputJSONSchema;
  }

  protected getSdkExecutor() {
    return this.sdkExecutor;
  }

  protected getStepName(): string {
    return 'implementationPlanning';
  }

  protected logOutcomeAudit(
    session: ActivePlanningSession,
    outcome: PlanningOutcome,
    agentConfig: PlanningAgentConfig
  ): void {
    if (outcome.type === 'PLAN_GENERATED') {
      this.auditLogger.logStepCompleted(
        session.options.workflowId,
        session.options.stepId,
        agentConfig.id,
        agentConfig.name,
        `Planning agent generated plan with ${outcome.plan.steps.length} steps`,
        {
          complexity: outcome.plan.estimatedComplexity,
          sessionId: session.sessionId,
          stepCount: outcome.plan.steps.length,
          steps: outcome.plan.steps.map((s) => s.title),
        }
      );
    } else if (outcome.type === 'CANNOT_PLAN') {
      this.auditLogger.logStepCompleted(
        session.options.workflowId,
        session.options.stepId,
        agentConfig.id,
        agentConfig.name,
        `Planning agent could not generate a plan: ${outcome.reason}`,
        {
          outcomeType: outcome.type,
          reason: outcome.reason,
          sessionId: session.sessionId,
        }
      );
    } else if (outcome.type === 'ERROR') {
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
  }

  protected processStructuredOutput(result: SDKResultMessage, sessionId: string): PlanningOutcome {
    const validationResult = this.structuredValidator.validate(result, sessionId);

    if (!validationResult.success) {
      return {
        error: validationResult.error,
        type: 'ERROR',
      };
    }

    const flatOutput = validationResult.data;

    if (flatOutput.type === 'CANNOT_PLAN') {
      const reasonCheck = this.structuredValidator.validateField(flatOutput, 'reason', sessionId);
      if (!reasonCheck.success) {
        return {
          error: 'CANNOT_PLAN output missing required "reason" field',
          type: 'ERROR',
        };
      }

      return {
        reason: flatOutput.reason!,
        type: 'CANNOT_PLAN',
      };
    }

    // flatOutput.type === 'PLAN_GENERATED'
    const planCheck = this.structuredValidator.validateField(flatOutput, 'plan', sessionId);
    if (!planCheck.success) {
      return {
        error: 'PLAN_GENERATED output missing required "plan" field',
        type: 'ERROR',
      };
    }

    return {
      plan: flatOutput.plan!,
      type: 'PLAN_GENERATED',
    };
  }
}

// Export singleton instance
export const planningStepService = new PlanningStepService();
