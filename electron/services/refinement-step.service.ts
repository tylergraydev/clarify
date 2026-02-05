/**
 * Refinement Step Service
 *
 * Orchestrates the refinement step of the workflow pipeline.
 * This service manages the execution of the refinement agent,
 * which takes the original feature request along with clarification
 * context (Q&A pairs) and produces a refined, enhanced feature description.
 *
 * ## Responsibilities
 *
 * - Load agent configuration from database
 * - Execute refinement agent via Claude Agent SDK
 * - Parse agent output for refined feature text
 * - Handle timeout with configurable duration (180s default for deeper exploration)
 * - Manage state transitions through the refinement process
 *
 * ## State Machine
 *
 * idle -> loading_agent -> executing -> processing_response -> complete | error
 *                                                          -> cancelled | timeout
 *
 * @see {@link ../../lib/validations/refinement.ts Refinement Types}
 */

import type { Options, SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

import { randomUUID } from 'crypto';

import type { NewAuditLog, Workflow } from '../../db/schema';
import type {
  RefinementAgentConfig,
  RefinementOutcome,
  RefinementServiceOptions,
  RefinementServicePhase,
  RefinementServiceState,
  RefinementStreamMessage,
  RefinementUsageStats,
} from '../../lib/validations/refinement';

import { getDatabase } from '../../db';
import {
  createAgentHooksRepository,
  createAgentSkillsRepository,
  createAgentsRepository,
  createAgentToolsRepository,
  createAuditLogsRepository,
  createWorkflowsRepository,
} from '../../db/repositories';
import { refinementAgentOutputFlatSchema, refinementAgentOutputJSONSchema } from '../../lib/validations/refinement';
import { debugLoggerService } from './debug-logger.service';

/**
 * Default timeout for refinement operations in seconds.
 * Longer than clarification (120s) to allow for deeper codebase exploration.
 */
const DEFAULT_TIMEOUT_SECONDS = 180;

/**
 * Maximum number of retry attempts for transient errors.
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay for exponential backoff in milliseconds.
 */
const BASE_RETRY_DELAY_MS = 1000;

/**
 * Heartbeat interval for extended thinking progress updates in milliseconds.
 * Sends periodic status updates to UI when partial streaming is disabled.
 */
const EXTENDED_THINKING_HEARTBEAT_INTERVAL_MS = 2000; // 2 seconds

/**
 * Cached SDK query function to avoid repeated dynamic imports.
 */
let cachedQueryFn: (typeof import('@anthropic-ai/claude-agent-sdk'))['query'] | null = null;

/**
 * Extended outcome fields for pause and retry information.
 */
export interface RefinementOutcomePauseInfo {
  /** Whether the workflow should pause after this step */
  pauseRequested?: boolean;
  /** Current retry count for this session */
  retryCount?: number;
  /** SDK session ID for potential resumption */
  sdkSessionId?: string;
  /** Whether skip fallback is available */
  skipFallbackAvailable?: boolean;
  /** Usage statistics from SDK result */
  usage?: RefinementUsageStats;
}

/**
 * Extended outcome that includes pause information.
 */
export type RefinementOutcomeWithPause = RefinementOutcome & RefinementOutcomePauseInfo;

/**
 * Active refinement session tracking.
 */
interface ActiveRefinementSession {
  abortController: AbortController;
  activeTools: Array<ActiveToolInfo>;
  agentConfig: null | RefinementAgentConfig;
  options: RefinementServiceOptions;
  phase: RefinementServicePhase;
  refinedText: null | string;
  sessionId: string;
  streamingText: string;
  thinkingBlocks: Array<string>;
  timeoutId: null | ReturnType<typeof setTimeout>;
}

/**
 * Active tool being used by the agent.
 */
interface ActiveToolInfo {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
}

/**
 * Internal result from executeAgent including usage metadata.
 */
interface ExecuteAgentResult {
  outcome: RefinementOutcome;
  sdkSessionId?: string;
  usage?: RefinementUsageStats;
}

/**
 * Pause behaviors supported by workflows.
 */
type PauseBehavior = 'auto_pause' | 'continuous' | 'gates_only';

/**
 * Refinement Step Service
 *
 * Manages the refinement step of workflow pipelines.
 * Loads agent configuration from the database and executes
 * the refinement agent to produce an enhanced feature description
 * by combining the original request with clarification context.
 */
class RefinementStepService {
  private activeSessions = new Map<string, ActiveRefinementSession>();
  private retryCountBySession = new Map<string, number>();

  /**
   * Cancel an active refinement session.
   *
   * @param sessionId - The session ID to cancel
   * @returns The cancelled outcome
   */
  cancelRefinement(sessionId: string): RefinementOutcome {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return {
        error: 'Session not found',
        type: 'ERROR',
      };
    }

    debugLoggerService.logSession(sessionId, 'cancel', {
      phase: session.phase,
      reason: 'User cancelled',
    });

    // Audit log: refinement cancelled
    this.logAuditEntry('refinement_cancelled', 'Refinement step cancelled by user', {
      agentId: session.agentConfig?.id,
      agentName: session.agentConfig?.name,
      eventData: {
        phase: session.phase,
        reason: 'User cancelled',
        sessionId,
      },
      severity: 'info',
      workflowId: session.options.workflowId,
      workflowStepId: session.options.stepId,
    });

    // Clear timeout if active
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
    }

    // Abort the SDK operation
    session.abortController.abort();
    session.phase = 'cancelled';

    // Clean up
    this.activeSessions.delete(sessionId);

    return {
      reason: 'User cancelled refinement',
      type: 'CANCELLED',
    };
  }

  /**
   * Get the current retry count for a session.
   *
   * @param sessionId - The session ID
   * @returns The current retry count (0 if not retried)
   */
  getRetryCount(sessionId: string): number {
    return this.retryCountBySession.get(sessionId) ?? 0;
  }

  /**
   * Get the current state of a refinement session.
   *
   * @param sessionId - The session ID to query
   * @returns The current service state, or null if not found
   */
  getState(sessionId: string): null | RefinementServiceState {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      agentConfig: session.agentConfig,
      phase: session.phase,
      refinedText: session.refinedText,
    };
  }

  /**
   * Get the workflow's pause behavior from the database.
   *
   * @param workflowId - The workflow ID to query
   * @returns The workflow record or undefined if not found
   */
  getWorkflow(workflowId: number): undefined | Workflow {
    const db = getDatabase();
    const workflowsRepo = createWorkflowsRepository(db);
    return workflowsRepo.findById(workflowId);
  }

  /**
   * Check if a pause is requested based on workflow's pause behavior.
   *
   * @param workflowId - The workflow ID
   * @returns Whether pause is requested
   */
  isPauseRequested(workflowId: number): boolean {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) return false;

    const pauseBehavior = (workflow.pauseBehavior ?? 'auto_pause') as PauseBehavior;

    // AUTO_PAUSE pauses after each step
    // CONTINUOUS never pauses
    // GATES_ONLY only pauses at gate steps (refinement is not a gate)
    return pauseBehavior === 'auto_pause';
  }

  /**
   * Check if retry limit has been reached.
   *
   * @param sessionId - The session ID
   * @returns Whether the max retry limit has been reached
   */
  isRetryLimitReached(sessionId: string): boolean {
    return this.getRetryCount(sessionId) >= MAX_RETRY_ATTEMPTS;
  }

  /**
   * Load full agent configuration from database.
   *
   * Queries the agents, tools, skills, and hooks tables to build
   * a complete agent configuration for the refinement step.
   *
   * @param agentId - The agent ID to load
   * @returns The complete agent configuration
   * @throws Error if agent is not found
   */
  async loadAgentConfig(agentId: number): Promise<RefinementAgentConfig> {
    const db = getDatabase();
    const agentsRepo = createAgentsRepository(db);
    const toolsRepo = createAgentToolsRepository(db);
    const skillsRepo = createAgentSkillsRepository(db);
    const hooksRepo = createAgentHooksRepository(db);

    const agent = await agentsRepo.findById(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    const tools = await toolsRepo.findByAgentId(agentId);
    const skills = await skillsRepo.findByAgentId(agentId);
    const hooks = await hooksRepo.findByAgentId(agentId);

    // TODO: Hooks are loaded for future extensibility but not yet passed to SDK options.
    // To enable hooks, convert to SDK format and add to sdkOptions:
    // sdkOptions.hooks = { PreToolUse: [...], PostToolUse: [...] }
    // See .claude/skills/claude-agent-sdk/references/hook-types.md for HookCallbackMatcher format.
    return {
      extendedThinkingEnabled: agent.extendedThinkingEnabled ?? false,
      hooks: hooks.map((h) => ({
        body: h.body,
        eventType: h.eventType,
        matcher: h.matcher,
      })),
      id: agent.id,
      maxThinkingTokens: agent.maxThinkingTokens,
      model: agent.model,
      name: agent.name,
      permissionMode: agent.permissionMode,
      skills: skills.map((s) => ({
        isRequired: s.requiredAt !== null,
        skillName: s.skillName,
      })),
      systemPrompt: agent.systemPrompt,
      tools: tools
        .filter((t) => !t.disallowedAt)
        .map((t) => ({
          toolName: t.toolName,
          toolPattern: t.toolPattern ?? '',
        })),
    } satisfies RefinementAgentConfig;
  }

  /**
   * Retry a failed refinement with exponential backoff.
   *
   * Automatically increments retry count and applies backoff delay.
   * If retry limit is reached, returns an error.
   *
   * @param options - The refinement service options
   * @param previousSessionId - The previous session ID for tracking retry count
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the refinement outcome
   */
  async retryRefinement(
    options: RefinementServiceOptions,
    previousSessionId: string,
    onStreamMessage?: (message: RefinementStreamMessage) => void
  ): Promise<RefinementOutcomeWithPause> {
    // Check if retry limit reached
    if (this.isRetryLimitReached(previousSessionId)) {
      debugLoggerService.logSdkEvent(previousSessionId, 'Retry limit reached', {
        maxRetries: MAX_RETRY_ATTEMPTS,
      });

      // Audit log: retry limit reached
      this.logAuditEntry('refinement_retry_limit_reached', 'Maximum retry attempts reached', {
        eventData: {
          maxRetries: MAX_RETRY_ATTEMPTS,
          sessionId: previousSessionId,
        },
        severity: 'warning',
        workflowId: options.workflowId,
        workflowStepId: options.stepId,
      });

      return {
        error: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Please skip refinement or try again later.`,
        retryCount: MAX_RETRY_ATTEMPTS,
        skipFallbackAvailable: true,
        type: 'ERROR',
      };
    }

    // Increment retry count
    const newRetryCount = this.incrementRetryCount(previousSessionId);

    // Calculate and apply backoff delay
    const backoffDelay = this.calculateBackoffDelay(newRetryCount);

    debugLoggerService.logSdkEvent(previousSessionId, 'Retrying refinement with backoff', {
      backoffDelayMs: backoffDelay,
      retryCount: newRetryCount,
    });

    // Audit log: retrying refinement
    this.logAuditEntry(
      'refinement_retry_started',
      `Retrying refinement (attempt ${newRetryCount}/${MAX_RETRY_ATTEMPTS})`,
      {
        eventData: {
          backoffDelayMs: backoffDelay,
          retryCount: newRetryCount,
          sessionId: previousSessionId,
        },
        severity: 'info',
        workflowId: options.workflowId,
        workflowStepId: options.stepId,
      }
    );

    // Wait for backoff delay
    await new Promise((resolve) => setTimeout(resolve, backoffDelay));

    // Start new refinement session
    const outcome = await this.startRefinement(options, onStreamMessage);

    // Clean up previous session's retry count to prevent memory leak
    this.clearRetryCount(previousSessionId);

    // Update the outcome with the correct retry count
    return {
      ...outcome,
      retryCount: newRetryCount,
    };
  }

  /**
   * Start the refinement process.
   *
   * Initializes a new refinement session:
   * 1. Loads agent configuration from database
   * 2. Creates an agent stream session with the agent's system prompt
   * 3. Configures tools based on agent's allowed tools
   * 4. Sets up timeout handling with AbortController
   *
   * @param options - The refinement service options
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the refinement outcome with pause information
   */
  async startRefinement(
    options: RefinementServiceOptions,
    onStreamMessage?: (message: RefinementStreamMessage) => void
  ): Promise<RefinementOutcomeWithPause> {
    const sessionId = randomUUID();
    const abortController = new AbortController();
    const timeoutSeconds = options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;

    // Initialize session
    const session: ActiveRefinementSession = {
      abortController,
      activeTools: [],
      agentConfig: null,
      options,
      phase: 'idle',
      refinedText: null,
      sessionId,
      streamingText: '',
      thinkingBlocks: [],
      timeoutId: null,
    };

    this.activeSessions.set(sessionId, session);

    debugLoggerService.logSession(sessionId, 'start', {
      agentId: options.agentId,
      clarificationQuestionCount: options.clarificationContext.questions.length,
      repositoryPath: options.repositoryPath,
      stepId: options.stepId,
      timeoutSeconds,
      workflowId: options.workflowId,
    });

    // Audit log: refinement started
    this.logAuditEntry('refinement_started', 'Refinement step started', {
      agentId: options.agentId,
      eventData: {
        clarificationQuestionCount: options.clarificationContext.questions.length,
        featureRequestLength: options.featureRequest.length,
        repositoryPath: options.repositoryPath,
        sessionId,
        timeoutSeconds,
      },
      severity: 'info',
      workflowId: options.workflowId,
      workflowStepId: options.stepId,
    });

    try {
      // Phase: Loading agent
      session.phase = 'loading_agent';
      this.emitPhaseChange(sessionId, session.phase, onStreamMessage);

      const agentConfig = await this.loadAgentConfig(options.agentId);
      session.agentConfig = agentConfig;

      debugLoggerService.logSdkEvent(sessionId, 'Agent configuration loaded', {
        agentName: agentConfig.name,
        hooksCount: agentConfig.hooks.length,
        model: agentConfig.model,
        skillsCount: agentConfig.skills.length,
        toolsCount: agentConfig.tools.length,
      });

      // Audit log: agent configuration loaded
      this.logAuditEntry('refinement_agent_loaded', `Loaded refinement agent: ${agentConfig.name}`, {
        agentId: agentConfig.id,
        agentName: agentConfig.name,
        eventData: {
          hooksCount: agentConfig.hooks.length,
          model: agentConfig.model,
          permissionMode: agentConfig.permissionMode,
          sessionId,
          skillsCount: agentConfig.skills.length,
          toolsCount: agentConfig.tools.length,
        },
        severity: 'info',
        workflowId: options.workflowId,
        workflowStepId: options.stepId,
      });

      // Phase: Executing
      session.phase = 'executing';
      this.emitPhaseChange(sessionId, session.phase, onStreamMessage);

      // Set up timeout
      const timeoutPromise = new Promise<ExecuteAgentResult>((resolve) => {
        session.timeoutId = setTimeout(() => {
          if (!abortController.signal.aborted) {
            abortController.abort();
            session.phase = 'timeout';
            this.emitPhaseChange(sessionId, session.phase, onStreamMessage);

            debugLoggerService.logSdkEvent(sessionId, 'Refinement timed out', {
              elapsedSeconds: timeoutSeconds,
            });

            // Audit log: refinement timeout
            this.logAuditEntry('refinement_timeout', `Refinement timed out after ${timeoutSeconds} seconds`, {
              agentId: agentConfig.id,
              agentName: agentConfig.name,
              eventData: {
                elapsedSeconds: timeoutSeconds,
                sessionId,
              },
              severity: 'warning',
              workflowId: options.workflowId,
              workflowStepId: options.stepId,
            });

            resolve({
              outcome: {
                elapsedSeconds: timeoutSeconds,
                error: `Refinement timed out after ${timeoutSeconds} seconds`,
                type: 'TIMEOUT',
              },
            });
          }
        }, timeoutSeconds * 1000);
      });

      // Execute the agent
      const executionPromise = this.executeAgent(session, agentConfig, onStreamMessage);

      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // Clear timeout if execution completed first
      if (session.timeoutId) {
        clearTimeout(session.timeoutId);
      }

      // Clean up session on success
      this.activeSessions.delete(sessionId);
      this.clearRetryCount(sessionId);

      // Add pause information and usage to successful outcomes
      const pauseRequested = this.isPauseRequested(options.workflowId);
      const outcomeWithPause: RefinementOutcomeWithPause = {
        ...result.outcome,
        pauseRequested,
        retryCount: 0,
        sdkSessionId: result.sdkSessionId,
        usage: result.usage,
      };

      debugLoggerService.logSdkEvent(sessionId, 'Refinement completed with pause info', {
        hasSdkSessionId: !!result.sdkSessionId,
        hasUsage: !!result.usage,
        outcomeType: result.outcome.type,
        pauseRequested,
      });

      return outcomeWithPause;
    } catch (error) {
      // Clear timeout on error
      if (session.timeoutId) {
        clearTimeout(session.timeoutId);
      }

      session.phase = 'error';
      this.emitPhaseChange(sessionId, session.phase, onStreamMessage);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const retryCount = this.getRetryCount(sessionId);
      const isRetryable = this.isTransientError(errorMessage);
      const retryLimitReached = this.isRetryLimitReached(sessionId);

      debugLoggerService.logSdkEvent(sessionId, 'Refinement error', {
        error: errorMessage,
        isRetryable,
        retryCount,
        retryLimitReached,
      });

      // Audit log: refinement error
      this.logAuditEntry('refinement_error', `Refinement step failed: ${errorMessage}`, {
        agentId: session.agentConfig?.id,
        agentName: session.agentConfig?.name,
        eventData: {
          error: errorMessage,
          isRetryable,
          retryCount,
          retryLimitReached,
          sessionId,
          stack: errorStack,
        },
        severity: 'error',
        workflowId: options.workflowId,
        workflowStepId: options.stepId,
      });

      // Clean up session (but keep retry count for potential retry)
      this.activeSessions.delete(sessionId);

      // Return extended outcome with retry information
      return {
        error: errorMessage,
        retryCount,
        skipFallbackAvailable: true,
        stack: errorStack,
        type: 'ERROR',
      };
    }
  }

  /**
   * Build the refinement prompt for the agent.
   *
   * Combines the original feature request with the clarification context
   * (questions and answers) to create a comprehensive prompt for producing
   * a refined feature description.
   *
   * @param featureRequest - The original feature request text
   * @param clarificationContext - The questions and answers from clarification
   * @returns The formatted prompt
   */
  private buildRefinementPrompt(
    featureRequest: string,
    clarificationContext: RefinementServiceOptions['clarificationContext']
  ): string {
    // Format the clarification Q&A pairs
    const clarificationPairs = clarificationContext.questions
      .map((question, index) => {
        const answer = clarificationContext.answers[index.toString()];
        if (!answer) return null;

        let answerText: string;
        if (answer.type === 'text') {
          answerText = answer.text;
        } else if (answer.type === 'radio') {
          answerText = answer.selected || answer.other || 'No response';
          if (answer.other && answer.selected) {
            answerText = `${answer.selected} (Additional: ${answer.other})`;
          }
        } else if (answer.type === 'checkbox') {
          const selections = answer.selected.join(', ');
          answerText = answer.other ? `${selections} (Additional: ${answer.other})` : selections;
        } else {
          answerText = 'No response';
        }

        return `**${question.header}**\nQ: ${question.question}\nA: ${answerText}`;
      })
      .filter(Boolean)
      .join('\n\n');

    // Include assessment context if available
    const assessmentContext = clarificationContext.assessment
      ? `\n\n## Initial Assessment\n\nClarity Score: ${clarificationContext.assessment.score}/5\nReason: ${clarificationContext.assessment.reason}`
      : '';

    return `You are refining a feature request based on user-provided clarifications.

## Original Feature Request

${featureRequest}
${assessmentContext}

## Clarification Context

The following questions were asked to clarify the feature request, along with the user's answers:

${clarificationPairs}

## Your Task

Based on the original feature request and the clarification answers above, produce a **refined feature request** that:

1. **Incorporates all clarifications**: Weave the user's answers naturally into the description
2. **Resolves ambiguities**: Replace vague statements with specific requirements from the answers
3. **Maintains coherence**: Write as a single, well-structured feature description (not a list of Q&A)
4. **Preserves intent**: Keep the user's original vision while adding necessary detail
5. **Is implementation-ready**: Include enough detail for the next planning step

The refined text should be a prose narrative that reads as if the user had provided this complete description from the start. Do not include section headers like "Clarifications" - integrate everything seamlessly.

**Important**: Output only the refined feature request text. The system will extract your response automatically.`;
  }

  /**
   * Calculate exponential backoff delay for a retry attempt.
   *
   * @param retryCount - The current retry count (1-based)
   * @returns The delay in milliseconds
   */
  private calculateBackoffDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, ...
    return BASE_RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
  }

  /**
   * Clear the retry count for a session.
   *
   * @param sessionId - The session ID
   */
  private clearRetryCount(sessionId: string): void {
    this.retryCountBySession.delete(sessionId);
  }

  /**
   * Emit a phase change message to the stream callback.
   *
   * @param sessionId - The session ID
   * @param phase - The new phase
   * @param onStreamMessage - Optional callback for streaming events
   */
  private emitPhaseChange(
    sessionId: string,
    phase: RefinementServicePhase,
    onStreamMessage?: (message: RefinementStreamMessage) => void
  ): void {
    if (onStreamMessage) {
      onStreamMessage({
        phase,
        sessionId,
        timestamp: Date.now(),
        type: 'phase_change',
      });
    }
  }

  /**
   * Execute the refinement agent and collect output.
   *
   * @param session - The active session
   * @param agentConfig - The loaded agent configuration
   * @param onStreamMessage - Optional callback for streaming events
   * @returns The refinement outcome with usage metadata
   */
  private async executeAgent(
    session: ActiveRefinementSession,
    agentConfig: RefinementAgentConfig,
    onStreamMessage?: (message: RefinementStreamMessage) => void
  ): Promise<ExecuteAgentResult> {
    const query = await getQueryFunction();

    // Build SDK options with structured output format
    // Note: includePartialMessages enables streaming text/thinking deltas for UI
    // Structured output still comes from final ResultMessage.structured_output
    const sdkOptions: Options = {
      abortController: session.abortController,
      cwd: session.options.repositoryPath,
      includePartialMessages: true,
      outputFormat: {
        schema: refinementAgentOutputJSONSchema,
        type: 'json_schema',
      },
      // Explicitly configure Claude Code tools as the base toolset
      // This ensures tools are properly available before filtering with allowedTools/disallowedTools
      tools: { preset: 'claude_code', type: 'preset' },
    };

    // Configure tools from agent config
    // Use both allowedTools AND disallowedTools as a safeguard
    // The SDK's allowedTools should restrict tools, but we also explicitly
    // disallow tools not in the allowed list to ensure tool restriction works
    // SECURITY: Always apply restrictions, even when tools array is empty (empty = NO tools allowed)
    const allowedToolNames = agentConfig.tools.length > 0 ? agentConfig.tools.map((t) => t.toolName) : [];
    sdkOptions.allowedTools = allowedToolNames;

    // All built-in Claude Code tools that should be blocked if not in the allowed list
    const allBuiltInTools = [
      'Task',
      'AskUserQuestion',
      'Bash',
      'BashOutput',
      'Edit',
      'Read',
      'Write',
      'Glob',
      'Grep',
      'KillBash',
      'NotebookEdit',
      'WebFetch',
      'WebSearch',
      'TodoWrite',
      'ExitPlanMode',
      'ListMcpResources',
      'ReadMcpResource',
    ];

    // Explicitly disallow tools NOT in the allowed list
    sdkOptions.disallowedTools = allBuiltInTools.filter((tool) => !allowedToolNames.includes(tool));

    // Configure permission mode
    if (agentConfig.permissionMode) {
      sdkOptions.permissionMode = agentConfig.permissionMode as Options['permissionMode'];
    }

    // Configure model if specified
    if (agentConfig.model) {
      sdkOptions.model = agentConfig.model;
    }

    // Configure system prompt using append mode to preserve Claude Code's base capabilities
    // while adding the agent's specific instructions
    if (agentConfig.systemPrompt) {
      sdkOptions.systemPrompt = {
        append: agentConfig.systemPrompt,
        preset: 'claude_code',
        type: 'preset',
      };
    }

    // Configure extended thinking
    // When enabled, the SDK disables partial streaming and only emits complete messages after each turn
    if (agentConfig.extendedThinkingEnabled && agentConfig.maxThinkingTokens) {
      sdkOptions.maxThinkingTokens = agentConfig.maxThinkingTokens;
      // Disable partial streaming for extended thinking mode
      sdkOptions.includePartialMessages = false;

      debugLoggerService.logSdkEvent(session.sessionId, 'Extended thinking enabled', {
        extendedThinkingNote: 'Partial streaming disabled - will process complete messages only',
        maxThinkingTokens: agentConfig.maxThinkingTokens,
      });
    }

    // Start heartbeat for extended thinking mode
    let heartbeatInterval: NodeJS.Timeout | null = null;
    const startTime = Date.now();

    if (agentConfig.extendedThinkingEnabled && agentConfig.maxThinkingTokens) {
      heartbeatInterval = setInterval(() => {
        const elapsedMs = Date.now() - startTime;

        if (onStreamMessage) {
          onStreamMessage({
            elapsedMs,
            estimatedProgress: null,
            maxThinkingTokens: agentConfig.maxThinkingTokens!,
            sessionId: session.sessionId,
            timestamp: Date.now(),
            type: 'extended_thinking_heartbeat',
          });
        }

        debugLoggerService.logSdkEvent(session.sessionId, 'Extended thinking heartbeat', {
          elapsedMs,
          elapsedSeconds: Math.floor(elapsedMs / 1000),
        });
      }, EXTENDED_THINKING_HEARTBEAT_INTERVAL_MS);
    }

    // Build the prompt for refinement
    const prompt = this.buildRefinementPrompt(session.options.featureRequest, session.options.clarificationContext);

    debugLoggerService.logSdkEvent(session.sessionId, 'Starting refinement agent', {
      allowedTools: sdkOptions.allowedTools,
      clarificationQuestionCount: session.options.clarificationContext.questions.length,
      model: sdkOptions.model,
      permissionMode: sdkOptions.permissionMode,
      promptLength: prompt.length,
    });

    // Audit log: refinement exploring
    this.logAuditEntry('refinement_exploring', 'Refinement agent is processing feature request with clarifications', {
      agentId: agentConfig.id,
      agentName: agentConfig.name,
      eventData: {
        clarificationQuestionCount: session.options.clarificationContext.questions.length,
        model: sdkOptions.model,
        promptLength: prompt.length,
        sessionId: session.sessionId,
        toolsCount: agentConfig.tools.length,
      },
      severity: 'debug',
      workflowId: session.options.workflowId,
      workflowStepId: session.options.stepId,
    });

    try {
      let resultMessage: null | SDKResultMessage = null;

      // Execute the query and capture result message
      for await (const message of query({ options: sdkOptions, prompt })) {
        // Check for cancellation
        if (session.abortController.signal.aborted) {
          return {
            outcome: {
              reason: 'Refinement was cancelled',
              type: 'CANCELLED',
            },
          };
        }

        // Process streaming events for real-time UI updates
        if (message.type === 'stream_event') {
          this.processStreamEvent(session, message, onStreamMessage);
        }

        // Capture the result message for structured output extraction
        if (message.type === 'result') {
          resultMessage = message as SDKResultMessage;
        }
      }

      // Phase: Processing response
      session.phase = 'processing_response';
      this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);

      // Handle missing result message
      if (!resultMessage) {
        return {
          outcome: {
            error: 'No result message received from agent',
            type: 'ERROR',
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

      // Extract and validate structured output
      const outcome = this.processStructuredOutput(resultMessage, session.sessionId);

      // Update session state based on outcome
      if (outcome.type === 'SUCCESS') {
        session.phase = 'complete';
        session.refinedText = outcome.refinedText;
        this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
      } else {
        session.phase = outcome.type === 'ERROR' ? 'error' : 'complete';
        this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
      }

      debugLoggerService.logSdkEvent(session.sessionId, 'Refinement outcome determined', {
        outcomeType: outcome.type,
        phase: session.phase,
        refinedTextLength: outcome.type === 'SUCCESS' ? outcome.refinedText.length : 0,
      });

      // Audit log: refinement completed with specific outcome
      if (outcome.type === 'SUCCESS') {
        this.logAuditEntry('refinement_completed', 'Refinement completed successfully', {
          afterState: { phase: 'complete', refinedTextLength: outcome.refinedText.length },
          agentId: agentConfig.id,
          agentName: agentConfig.name,
          eventData: {
            outcomeType: outcome.type,
            refinedTextLength: outcome.refinedText.length,
            refinedTextPreview: outcome.refinedText.slice(0, 200),
            sessionId: session.sessionId,
          },
          severity: 'info',
          workflowId: session.options.workflowId,
          workflowStepId: session.options.stepId,
        });
      } else if (outcome.type === 'ERROR') {
        this.logAuditEntry('refinement_error', `Refinement error: ${outcome.error}`, {
          agentId: agentConfig.id,
          agentName: agentConfig.name,
          eventData: {
            error: outcome.error,
            outcomeType: outcome.type,
            sessionId: session.sessionId,
          },
          severity: 'error',
          workflowId: session.options.workflowId,
          workflowStepId: session.options.stepId,
        });
      }

      // Extract usage statistics from successful result
      let usage: RefinementUsageStats | undefined;
      if (resultMessage.subtype === 'success') {
        usage = {
          costUsd: resultMessage.total_cost_usd,
          durationMs: resultMessage.duration_ms,
          inputTokens: resultMessage.usage.input_tokens,
          numTurns: resultMessage.num_turns,
          outputTokens: resultMessage.usage.output_tokens,
        };

        debugLoggerService.logSdkEvent(session.sessionId, 'Usage statistics extracted', {
          costUsd: usage.costUsd,
          durationMs: usage.durationMs,
          inputTokens: usage.inputTokens,
          numTurns: usage.numTurns,
          outputTokens: usage.outputTokens,
        });
      }

      return {
        outcome,
        sdkSessionId: resultMessage.session_id,
        usage,
      };
    } catch (error) {
      // Check if it was an abort
      if (session.abortController.signal.aborted) {
        return {
          outcome: {
            reason: 'Refinement was cancelled',
            type: 'CANCELLED',
          },
        };
      }

      throw error;
    } finally {
      // Clean up heartbeat interval
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        debugLoggerService.logSdkEvent(session.sessionId, 'Extended thinking heartbeat stopped', {
          elapsedMs: Date.now() - startTime,
        });
      }
    }
  }

  /**
   * Increment the retry count for a session.
   *
   * @param sessionId - The session ID
   * @returns The new retry count
   */
  private incrementRetryCount(sessionId: string): number {
    const currentCount = this.getRetryCount(sessionId);
    const newCount = currentCount + 1;
    this.retryCountBySession.set(sessionId, newCount);
    return newCount;
  }

  /**
   * Check if an error is transient and should be retried.
   *
   * @param error - The error message
   * @returns Whether the error is likely transient
   */
  private isTransientError(error: string): boolean {
    const transientPatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /ECONNRESET/i,
      /ETIMEDOUT/i,
      /rate.?limit/i,
      /503/i,
      /502/i,
      /overloaded/i,
      /temporarily.?unavailable/i,
    ];

    return transientPatterns.some((pattern) => pattern.test(error));
  }

  /**
   * Create an audit log entry for refinement events.
   *
   * @param eventType - The type of refinement event
   * @param message - Human-readable description of the event
   * @param options - Additional audit log options
   */
  private logAuditEntry(
    eventType: string,
    message: string,
    options: {
      afterState?: Record<string, unknown>;
      agentId?: number;
      agentName?: string;
      beforeState?: Record<string, unknown>;
      eventData?: Record<string, unknown>;
      severity?: 'debug' | 'error' | 'info' | 'warning';
      workflowId?: number;
      workflowStepId?: number;
    } = {}
  ): void {
    try {
      const db = getDatabase();
      const auditLogsRepo = createAuditLogsRepository(db);

      const auditEntry: NewAuditLog = {
        afterState: options.afterState ?? null,
        beforeState: options.beforeState ?? null,
        eventCategory: 'step',
        eventData: {
          agentId: options.agentId,
          agentName: options.agentName,
          ...options.eventData,
        },
        eventType,
        message,
        severity: options.severity ?? 'info',
        source: 'system',
        workflowId: options.workflowId ?? null,
        workflowStepId: options.workflowStepId ?? null,
      };

      auditLogsRepo.create(auditEntry);
    } catch (error) {
      // Log to debug logger but don't throw - audit failures shouldn't break refinement
      debugLoggerService.logSdkEvent('system', 'Failed to create audit log entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType,
      });
    }
  }

  /**
   * Process streaming events from the SDK for real-time UI updates.
   *
   * Handles text deltas, thinking deltas, and tool use events to accumulate
   * streaming content in the session state and emit messages to the UI.
   *
   * @param session - The active session
   * @param message - The SDK stream event message
   * @param onStreamMessage - Optional callback for streaming events
   */
  private processStreamEvent(
    session: ActiveRefinementSession,
    message: { event: Record<string, unknown>; type: 'stream_event' },
    onStreamMessage?: (message: RefinementStreamMessage) => void
  ): void {
    const event = message.event;
    const eventType = event.type as string;

    if (eventType === 'content_block_delta') {
      const delta = event.delta as Record<string, unknown> | undefined;
      if (!delta) return;

      const deltaType = delta.type as string;

      if (deltaType === 'text_delta') {
        // Accumulate streaming text
        const text = delta.text as string;
        session.streamingText += text;

        // Emit text delta to UI
        if (onStreamMessage) {
          onStreamMessage({
            delta: text,
            sessionId: session.sessionId,
            timestamp: Date.now(),
            type: 'text_delta',
          });
        }
      } else if (deltaType === 'thinking_delta') {
        // Accumulate thinking text into the current block
        const thinking = delta.thinking as string;
        const lastIndex = session.thinkingBlocks.length - 1;
        if (lastIndex >= 0) {
          session.thinkingBlocks[lastIndex] += thinking;

          // Emit thinking delta to UI
          if (onStreamMessage) {
            onStreamMessage({
              blockIndex: lastIndex,
              delta: thinking,
              sessionId: session.sessionId,
              timestamp: Date.now(),
              type: 'thinking_delta',
            });
          }
        }
      } else if (deltaType === 'input_json_delta') {
        // Accumulate tool input JSON
        const partialJson = typeof delta.partial_json === 'string' ? delta.partial_json : '';
        if (!partialJson) {
          return;
        }
        const lastTool = session.activeTools[session.activeTools.length - 1];
        if (lastTool) {
          // Store partial JSON in a special field for accumulation
          const existing = typeof lastTool.toolInput._partialJson === 'string' ? lastTool.toolInput._partialJson : '';
          const mergedJson = existing + partialJson;
          const parsedInput = parseToolInputJson(mergedJson);

          lastTool.toolInput = parsedInput
            ? { ...parsedInput, _partialJson: mergedJson }
            : { ...lastTool.toolInput, _partialJson: mergedJson };

          // Emit tool update to UI with the latest input payload
          if (onStreamMessage) {
            onStreamMessage({
              sessionId: session.sessionId,
              timestamp: Date.now(),
              toolInput: lastTool.toolInput,
              toolName: lastTool.toolName,
              toolUseId: lastTool.toolUseId,
              type: 'tool_update',
            });
          }
        }
      }
    } else if (eventType === 'content_block_start') {
      const contentBlock = event.content_block as Record<string, unknown> | undefined;
      if (!contentBlock) return;

      const blockType = contentBlock.type as string;

      if (blockType === 'thinking') {
        // Start a new thinking block
        const blockIndex = session.thinkingBlocks.length;
        session.thinkingBlocks.push('');

        // Emit thinking start to UI
        if (onStreamMessage) {
          onStreamMessage({
            blockIndex,
            sessionId: session.sessionId,
            timestamp: Date.now(),
            type: 'thinking_start',
          });
        }
      } else if (blockType === 'tool_use') {
        const toolName = contentBlock.name as string;
        const toolUseId = contentBlock.id as string;

        // Track active tool
        session.activeTools.push({
          toolInput: {},
          toolName,
          toolUseId,
        });

        debugLoggerService.logSdkEvent(session.sessionId, 'Tool started', {
          toolName,
          toolUseId,
        });

        // Emit tool start to UI
        if (onStreamMessage) {
          onStreamMessage({
            sessionId: session.sessionId,
            timestamp: Date.now(),
            toolInput: {},
            toolName,
            toolUseId,
            type: 'tool_start',
          });
        }
      }
    } else if (eventType === 'content_block_stop') {
      // Clear the most recent tool from active list when done
      if (session.activeTools.length > 0) {
        const completedTool = session.activeTools.pop();
        if (completedTool) {
          debugLoggerService.logSdkEvent(session.sessionId, 'Tool completed', {
            toolName: completedTool.toolName,
            toolUseId: completedTool.toolUseId,
          });

          // Emit tool stop to UI
          if (onStreamMessage) {
            onStreamMessage({
              sessionId: session.sessionId,
              timestamp: Date.now(),
              toolUseId: completedTool.toolUseId,
              type: 'tool_stop',
            });
          }
        }
      }
    }
  }

  /**
   * Process the structured output from the SDK result message.
   *
   * For refinement, the output is a simple object with a refinedText field.
   * This method validates the output and transforms it to the proper outcome type.
   *
   * @param resultMessage - The SDK result message
   * @param sessionId - The session ID for logging
   * @returns The refinement outcome
   */
  private processStructuredOutput(resultMessage: SDKResultMessage, sessionId: string): RefinementOutcome {
    // Check for structured output validation failure
    if (resultMessage.subtype === 'error_max_structured_output_retries') {
      const errors = 'errors' in resultMessage ? resultMessage.errors : [];
      return {
        error: `Agent could not produce valid structured output: ${errors.join(', ')}`,
        type: 'ERROR',
      };
    }

    // Check for other error subtypes
    if (resultMessage.subtype !== 'success') {
      const errors = 'errors' in resultMessage ? resultMessage.errors : [];
      return {
        error: `Agent execution failed: ${resultMessage.subtype} - ${errors.join(', ')}`,
        type: 'ERROR',
      };
    }

    // Extract structured output
    const structuredOutput = resultMessage.structured_output;
    if (!structuredOutput) {
      return {
        error: 'Agent completed successfully but no structured output was returned',
        type: 'ERROR',
      };
    }

    // Validate with the flat schema
    const parsed = refinementAgentOutputFlatSchema.safeParse(structuredOutput);
    if (!parsed.success) {
      debugLoggerService.logSdkEvent(sessionId, 'Flat schema validation failed', {
        error: parsed.error.message,
        structuredOutput,
      });
      return {
        error: `Structured output validation failed: ${parsed.error.message}`,
        type: 'ERROR',
      };
    }

    const output = parsed.data;

    // Validate that refinedText is present and non-empty
    if (!output.refinedText || output.refinedText.trim().length === 0) {
      debugLoggerService.logSdkEvent(sessionId, 'Missing or empty refinedText', {
        structuredOutput: output,
      });
      return {
        error: 'Agent output missing required "refinedText" field or field is empty',
        type: 'ERROR',
      };
    }

    // Return the success outcome
    return {
      refinedText: output.refinedText,
      type: 'SUCCESS',
    };
  }
}

/**
 * Get the SDK query function, loading it once and caching for subsequent calls.
 *
 * @returns The SDK query function
 * @throws Error if the SDK is not available
 */
async function getQueryFunction(): Promise<(typeof import('@anthropic-ai/claude-agent-sdk'))['query']> {
  if (!cachedQueryFn) {
    try {
      const sdk = await import('@anthropic-ai/claude-agent-sdk');
      cachedQueryFn = sdk.query;
    } catch (error) {
      throw new Error(
        `Claude Agent SDK not available. Ensure @anthropic-ai/claude-agent-sdk is installed. ` +
          `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return cachedQueryFn;
}

/**
 * Safely parse a tool input JSON payload.
 */
function parseToolInputJson(payload: string): null | Record<string, unknown> {
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(payload);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore partial JSON parsing failures.
  }

  return null;
}

// Export singleton instance
export const refinementStepService = new RefinementStepService();
