/**
 * Clarification Step Service
 *
 * Orchestrates the clarification step of the workflow pipeline.
 * This service manages the execution of the clarification agent,
 * which assesses feature request clarity and generates clarifying questions.
 *
 * ## Responsibilities
 *
 * - Load agent configuration from database
 * - Execute clarification agent via Claude Agent SDK
 * - Parse agent output for SKIP/QUESTIONS detection
 * - Handle timeout with configurable duration
 * - Manage state transitions through the clarification process
 *
 * ## State Machine
 *
 * idle -> loading_agent -> executing -> processing_response -> waiting_for_user | complete | error
 *                                                           -> cancelled | timeout
 *
 * @see {@link ../../lib/validations/clarification.ts Clarification Types}
 */

import type { Options, SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

import { randomUUID } from 'crypto';

import type { NewAuditLog, Workflow } from '../../db/schema';
import type {
  ClarificationAgentConfig,
  ClarificationOutcome,
  ClarificationQuestion,
  ClarificationRefinementInput,
  ClarificationServiceOptions,
  ClarificationServicePhase,
  ClarificationServiceState,
  ClarificationStreamMessage,
  ClarificationUsageStats,
} from '../../lib/validations/clarification';

import { getDatabase } from '../../db';
import {
  createAgentHooksRepository,
  createAgentSkillsRepository,
  createAgentsRepository,
  createAgentToolsRepository,
  createAuditLogsRepository,
  createWorkflowsRepository,
} from '../../db/repositories';
import {
  clarificationAgentOutputFlatSchema,
  clarificationAgentOutputJSONSchema,
  clarificationAgentOutputSchema,
} from '../../lib/validations/clarification';
import { debugLoggerService } from './debug-logger.service';

/**
 * Default timeout for clarification operations in seconds.
 */
const DEFAULT_TIMEOUT_SECONDS = 120;

/**
 * Maximum number of retry attempts for transient errors.
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay for exponential backoff in milliseconds.
 */
const BASE_RETRY_DELAY_MS = 1000;

/**
 * Cached SDK query function to avoid repeated dynamic imports.
 */
let cachedQueryFn: null | typeof import('@anthropic-ai/claude-agent-sdk')['query'] = null;

/**
 * Extended outcome fields for pause and retry information.
 */
export interface ClarificationOutcomePauseInfo {
  /** Whether the workflow should pause after this step */
  pauseRequested?: boolean;
  /** Current retry count for this session */
  retryCount?: number;
  /** SDK session ID for potential resumption */
  sdkSessionId?: string;
  /** Whether skip fallback is available */
  skipFallbackAvailable?: boolean;
  /** Usage statistics from SDK result */
  usage?: ClarificationUsageStats;
}

/**
 * Extended outcome that includes pause information.
 */
export type ClarificationOutcomeWithPause = ClarificationOutcome & ClarificationOutcomePauseInfo;

/**
 * Active clarification session tracking.
 */
interface ActiveClarificationSession {
  abortController: AbortController;
  activeTools: Array<ActiveToolInfo>;
  agentConfig: ClarificationAgentConfig | null;
  options: ClarificationServiceOptions;
  phase: ClarificationServicePhase;
  questions: Array<ClarificationQuestion> | null;
  sessionId: string;
  skipReason: null | string;
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
  outcome: ClarificationOutcome;
  sdkSessionId?: string;
  usage?: ClarificationUsageStats;
}

/**
 * Pause behaviors supported by workflows.
 */
type PauseBehavior = 'auto_pause' | 'continuous' | 'gates_only';

/**
 * Clarification Step Service
 *
 * Manages the clarification step of workflow pipelines.
 * Loads agent configuration from the database and executes
 * the clarification agent to assess feature request clarity.
 */
class ClarificationStepService {
  private activeSessions = new Map<string, ActiveClarificationSession>();
  private retryCountBySession = new Map<string, number>();

  /**
   * Cancel an active clarification session.
   *
   * @param sessionId - The session ID to cancel
   * @returns The cancelled outcome
   */
  cancelClarification(sessionId: string): ClarificationOutcome {
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

    // Audit log: clarification cancelled
    this.logAuditEntry('clarification_cancelled', 'Clarification step cancelled by user', {
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
      reason: 'User cancelled clarification',
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
   * Get the current state of a clarification session.
   *
   * @param sessionId - The session ID to query
   * @returns The current service state, or null if not found
   */
  getState(sessionId: string): ClarificationServiceState | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      agentConfig: session.agentConfig,
      phase: session.phase,
      questions: session.questions,
      skipReason: session.skipReason,
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
    // GATES_ONLY only pauses at gate steps (clarification is not a gate)
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
   * a complete agent configuration for the clarification step.
   *
   * @param agentId - The agent ID to load
   * @returns The complete agent configuration
   * @throws Error if agent is not found
   */
  async loadAgentConfig(agentId: number): Promise<ClarificationAgentConfig> {
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
      hooks: hooks.map((h) => ({
        body: h.body,
        eventType: h.eventType,
        matcher: h.matcher,
      })),
      id: agent.id,
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
    };
  }

  /**
   * Retry a failed clarification with exponential backoff.
   *
   * Automatically increments retry count and applies backoff delay.
   * If retry limit is reached, returns an error with skip fallback flag.
   *
   * @param options - The clarification service options
   * @param previousSessionId - The previous session ID for tracking retry count
   * @returns Promise resolving to the clarification outcome
   */
  async retryClarification(
    options: ClarificationServiceOptions,
    previousSessionId: string
  ): Promise<ClarificationOutcomeWithPause> {
    // Check if retry limit reached
    if (this.isRetryLimitReached(previousSessionId)) {
      debugLoggerService.logSdkEvent(previousSessionId, 'Retry limit reached', {
        maxRetries: MAX_RETRY_ATTEMPTS,
      });

      // Audit log: retry limit reached
      this.logAuditEntry('clarification_retry_limit_reached', 'Maximum retry attempts reached', {
        eventData: {
          maxRetries: MAX_RETRY_ATTEMPTS,
          sessionId: previousSessionId,
        },
        severity: 'warning',
        workflowId: options.workflowId,
        workflowStepId: options.stepId,
      });

      return {
        error: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Please skip clarification or try again later.`,
        retryCount: MAX_RETRY_ATTEMPTS,
        skipFallbackAvailable: true,
        type: 'ERROR',
      };
    }

    // Increment retry count
    const newRetryCount = this.incrementRetryCount(previousSessionId);

    // Calculate and apply backoff delay
    const backoffDelay = this.calculateBackoffDelay(newRetryCount);

    debugLoggerService.logSdkEvent(previousSessionId, 'Retrying clarification with backoff', {
      backoffDelayMs: backoffDelay,
      retryCount: newRetryCount,
    });

    // Audit log: retrying clarification
    this.logAuditEntry('clarification_retry_started', `Retrying clarification (attempt ${newRetryCount}/${MAX_RETRY_ATTEMPTS})`, {
      eventData: {
        backoffDelayMs: backoffDelay,
        retryCount: newRetryCount,
        sessionId: previousSessionId,
      },
      severity: 'info',
      workflowId: options.workflowId,
      workflowStepId: options.stepId,
    });

    // Wait for backoff delay
    await new Promise((resolve) => setTimeout(resolve, backoffDelay));

    // Transfer retry count to new session and start clarification
    const outcome = await this.startClarification(options);

    // Update the outcome with the correct retry count
    return {
      ...outcome,
      retryCount: newRetryCount,
    };
  }

  /**
   * Skip clarification for this session.
   *
   * Used when the user chooses to skip clarification manually,
   * or when auto-skip is enabled for clear features.
   *
   * @param sessionId - The session ID
   * @param reason - The reason for skipping
   * @returns The skip outcome
   */
  skipClarification(sessionId: string, reason?: string): ClarificationOutcome {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return {
        error: 'Session not found',
        type: 'ERROR',
      };
    }

    debugLoggerService.logSdkEvent(sessionId, 'Clarification skipped manually', {
      reason,
    });

    const skipReason = reason ?? 'User skipped clarification';

    // Audit log: clarification skipped
    this.logAuditEntry('clarification_skipped', 'Clarification step skipped by user', {
      agentId: session.agentConfig?.id,
      agentName: session.agentConfig?.name,
      eventData: {
        phase: session.phase,
        reason: skipReason,
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

    // Abort if still running
    if (!session.abortController.signal.aborted) {
      session.abortController.abort();
    }

    session.phase = 'complete';
    session.skipReason = skipReason;

    // Clean up
    this.activeSessions.delete(sessionId);

    return {
      assessment: { reason: session.skipReason, score: 5 },
      reason: session.skipReason,
      type: 'SKIP_CLARIFICATION',
    };
  }

  /**
   * Start the clarification process.
   *
   * Initializes a new clarification session:
   * 1. Loads agent configuration from database
   * 2. Creates an agent stream session with the agent's system prompt
   * 3. Configures tools based on agent's allowed tools
   * 4. Sets up timeout handling with AbortController
   *
   * @param options - The clarification service options
   * @param onStreamMessage - Optional callback for streaming events
   * @returns Promise resolving to the clarification outcome with pause information
   */
  async startClarification(
    options: ClarificationServiceOptions,
    onStreamMessage?: (message: ClarificationStreamMessage) => void
  ): Promise<ClarificationOutcomeWithPause> {
    const sessionId = randomUUID();
    const abortController = new AbortController();
    const timeoutSeconds = options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;

    // Initialize session
    const session: ActiveClarificationSession = {
      abortController,
      activeTools: [],
      agentConfig: null,
      options,
      phase: 'idle',
      questions: null,
      sessionId,
      skipReason: null,
      streamingText: '',
      thinkingBlocks: [],
      timeoutId: null,
    };

    this.activeSessions.set(sessionId, session);

    debugLoggerService.logSession(sessionId, 'start', {
      agentId: options.agentId,
      repositoryPath: options.repositoryPath,
      stepId: options.stepId,
      timeoutSeconds,
      workflowId: options.workflowId,
    });

    // Audit log: clarification started
    this.logAuditEntry('clarification_started', 'Clarification step started', {
      agentId: options.agentId,
      eventData: {
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
      this.logAuditEntry('clarification_agent_loaded', `Loaded clarification agent: ${agentConfig.name}`, {
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

            debugLoggerService.logSdkEvent(sessionId, 'Clarification timed out', {
              elapsedSeconds: timeoutSeconds,
            });

            // Audit log: clarification timeout
            this.logAuditEntry('clarification_timeout', `Clarification timed out after ${timeoutSeconds} seconds`, {
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
                error: `Clarification timed out after ${timeoutSeconds} seconds`,
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
      const outcomeWithPause: ClarificationOutcomeWithPause = {
        ...result.outcome,
        pauseRequested,
        retryCount: 0,
        sdkSessionId: result.sdkSessionId,
        skipFallbackAvailable: true,
        usage: result.usage,
      };

      debugLoggerService.logSdkEvent(sessionId, 'Clarification completed with pause info', {
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

      debugLoggerService.logSdkEvent(sessionId, 'Clarification error', {
        error: errorMessage,
        isRetryable,
        retryCount,
        retryLimitReached,
      });

      // Audit log: clarification error
      this.logAuditEntry('clarification_error', `Clarification step failed: ${errorMessage}`, {
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
      const outcomeWithPause: ClarificationOutcomeWithPause = {
        error: errorMessage,
        retryCount,
        skipFallbackAvailable: true,
        stack: errorStack,
        type: 'ERROR',
      };

      return outcomeWithPause;
    }
  }

  /**
   * Submit user answers for refinement.
   *
   * Takes the user's answers to clarification questions and
   * formats them for the next workflow step.
   *
   * @param input - The refinement input with answers
   * @returns The formatted refinement output
   */
  submitAnswers(input: ClarificationRefinementInput): {
    formattedAnswers: string;
    questions: Array<ClarificationQuestion>;
    selectedOptions: Record<string, string>;
  } {
    const { answers, questions, stepId, workflowId } = input;
    const selectedOptions: Record<string, string> = {};

    // Build formatted answers string
    const formattedLines: Array<string> = [];

    for (const question of questions) {
      const questionIndex = questions.indexOf(question).toString();
      const selectedLabel = answers[questionIndex];

      if (selectedLabel) {
        const selectedOption = question.options.find((opt) => opt.label === selectedLabel);
        if (selectedOption) {
          selectedOptions[question.header] = selectedLabel;
          formattedLines.push(`**${question.header}**: ${selectedLabel}`);
          formattedLines.push(`  ${selectedOption.description}`);
        }
      }
    }

    debugLoggerService.logSdkEvent('system', 'Clarification answers submitted', {
      questionCount: questions.length,
      selectedCount: Object.keys(selectedOptions).length,
    });

    // Audit log: clarification answers submitted
    this.logAuditEntry('clarification_answers_submitted', 'User submitted answers to clarifying questions', {
      eventData: {
        answeredCount: Object.keys(selectedOptions).length,
        questionCount: questions.length,
        selectedOptions,
      },
      severity: 'info',
      workflowId,
      workflowStepId: stepId,
    });

    return {
      formattedAnswers: formattedLines.join('\n'),
      questions,
      selectedOptions,
    };
  }

  /**
   * Submit manual edits to the clarification.
   *
   * Allows the user to provide custom clarification text
   * instead of answering the generated questions.
   *
   * @param sessionId - The session ID
   * @param editedText - The user's edited clarification text
   * @returns The skip outcome with the edited text as reason
   */
  submitEdits(sessionId: string, editedText: string): ClarificationOutcome {
    const session = this.activeSessions.get(sessionId);

    debugLoggerService.logSdkEvent(sessionId, 'Clarification edits submitted', {
      editLength: editedText.length,
    });

    // Audit log: clarification questions edited
    this.logAuditEntry('clarification_questions_edited', 'User provided manual clarification text', {
      agentId: session?.agentConfig?.id,
      agentName: session?.agentConfig?.name,
      eventData: {
        editedTextLength: editedText.length,
        sessionId,
      },
      severity: 'info',
      workflowId: session?.options.workflowId,
      workflowStepId: session?.options.stepId,
    });

    // Clean up session if it exists
    if (session) {
      if (session.timeoutId) {
        clearTimeout(session.timeoutId);
      }
      if (!session.abortController.signal.aborted) {
        session.abortController.abort();
      }
      this.activeSessions.delete(sessionId);
    }

    return {
      assessment: { reason: 'User provided manual clarification', score: 5 },
      reason: editedText,
      type: 'SKIP_CLARIFICATION',
    };
  }

  /**
   * Build the clarification prompt for the agent.
   *
   * The prompt focuses on the task (analyzing the feature request) without
   * specifying output format. The SDK's structured output feature (outputFormat)
   * automatically constrains the model to produce valid JSON matching the schema.
   *
   * @param featureRequest - The feature request text to analyze
   * @returns The formatted prompt
   */
  private buildClarificationPrompt(featureRequest: string): string {
    return `Analyze the following feature request for clarity and completeness.

## Feature Request

${featureRequest}

## Your Task

1. **Assess Clarity**: Score the feature request from 1-5 based on how clear and complete it is:
   - Score 1-2: Very vague, missing critical details, multiple interpretations possible
   - Score 3: Has some details but lacks specifics about scope or approach
   - Score 4-5: Clear scope, references specific patterns/files, includes technical details

2. **Decide the Outcome**:
   - If score >= 4: The request is clear enough. Set type to "SKIP_CLARIFICATION" and explain why in the reason field.
   - If score < 4: The request needs clarification. Set type to "QUESTIONS_FOR_USER" and generate targeted questions.

3. **If Generating Questions** (for scores 1-3):
   - Create 2-4 focused questions that will meaningfully impact implementation
   - Each question needs a short header (e.g., "Storage", "Scope", "UI Pattern")
   - Provide 2-4 concrete options per question with descriptions
   - Reference existing codebase patterns when relevant

Focus on understanding what the user wants to build and gathering just enough information to enable high-quality implementation planning.`;
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
    phase: ClarificationServicePhase,
    onStreamMessage?: (message: ClarificationStreamMessage) => void
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
   * Execute the clarification agent and collect output.
   *
   * @param session - The active session
   * @param agentConfig - The loaded agent configuration
   * @param onStreamMessage - Optional callback for streaming events
   * @returns The clarification outcome with usage metadata
   */
  private async executeAgent(
    session: ActiveClarificationSession,
    agentConfig: ClarificationAgentConfig,
    onStreamMessage?: (message: ClarificationStreamMessage) => void
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
        schema: clarificationAgentOutputJSONSchema,
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
    if (agentConfig.tools.length > 0) {
      const allowedToolNames = agentConfig.tools.map((t) => t.toolName);
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
      sdkOptions.disallowedTools = allBuiltInTools.filter(
        (tool) => !allowedToolNames.includes(tool)
      );
    }

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

    // Build the prompt for clarification
    const prompt = this.buildClarificationPrompt(session.options.featureRequest);

    debugLoggerService.logSdkEvent(session.sessionId, 'Starting clarification agent', {
      allowedTools: sdkOptions.allowedTools,
      model: sdkOptions.model,
      permissionMode: sdkOptions.permissionMode,
      promptLength: prompt.length,
    });

    // Audit log: clarification exploring
    this.logAuditEntry('clarification_exploring', 'Clarification agent is analyzing feature request', {
      agentId: agentConfig.id,
      agentName: agentConfig.name,
      eventData: {
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
              reason: 'Clarification was cancelled',
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
        hasStructuredOutput:
          resultMessage.subtype === 'success' ? !!resultMessage.structured_output : false,
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
      if (outcome.type === 'QUESTIONS_FOR_USER') {
        session.phase = 'waiting_for_user';
        session.questions = outcome.questions;
        this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
      } else if (outcome.type === 'SKIP_CLARIFICATION') {
        session.phase = 'complete';
        session.skipReason = outcome.reason;
        this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
      } else {
        session.phase = outcome.type === 'ERROR' ? 'error' : 'complete';
        this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
      }

      debugLoggerService.logSdkEvent(session.sessionId, 'Clarification outcome determined', {
        outcomeType: outcome.type,
        phase: session.phase,
      });

      // Audit log: clarification completed with specific outcome
      if (outcome.type === 'QUESTIONS_FOR_USER') {
        this.logAuditEntry(
          'clarification_questions_generated',
          `Clarification agent generated ${outcome.questions.length} questions`,
          {
            agentId: agentConfig.id,
            agentName: agentConfig.name,
            eventData: {
              assessment: outcome.assessment,
              questionCount: outcome.questions.length,
              questions: outcome.questions.map((q) => q.header),
              sessionId: session.sessionId,
            },
            severity: 'info',
            workflowId: session.options.workflowId,
            workflowStepId: session.options.stepId,
          }
        );
      } else if (outcome.type === 'SKIP_CLARIFICATION') {
        this.logAuditEntry(
          'clarification_completed',
          `Clarification completed: feature request is clear (score: ${outcome.assessment?.score ?? 'N/A'}/5)`,
          {
            afterState: { phase: 'complete', skipReason: outcome.reason },
            agentId: agentConfig.id,
            agentName: agentConfig.name,
            eventData: {
              assessment: outcome.assessment,
              outcomeType: outcome.type,
              reason: outcome.reason,
              sessionId: session.sessionId,
            },
            severity: 'info',
            workflowId: session.options.workflowId,
            workflowStepId: session.options.stepId,
          }
        );
      } else if (outcome.type === 'ERROR') {
        this.logAuditEntry('clarification_error', `Clarification error: ${outcome.error}`, {
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
      let usage: ClarificationUsageStats | undefined;
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
            reason: 'Clarification was cancelled',
            type: 'CANCELLED',
          },
        };
      }

      throw error;
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
   * Create an audit log entry for clarification events.
   *
   * @param eventType - The type of clarification event
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
      // Log to debug logger but don't throw - audit failures shouldn't break clarification
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
    session: ActiveClarificationSession,
    message: { event: Record<string, unknown>; type: 'stream_event' },
    onStreamMessage?: (message: ClarificationStreamMessage) => void
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
        const partialJson = delta.partial_json as string;
        const lastTool = session.activeTools[session.activeTools.length - 1];
        if (lastTool) {
          // Store partial JSON in a special field for accumulation
          const existing = (lastTool.toolInput._partialJson as string) ?? '';
          lastTool.toolInput._partialJson = existing + partialJson;
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
   * The SDK returns a flat schema (no oneOf) to work around Claude's
   * structured output limitations. This method validates the flat output
   * and transforms it to the proper discriminated union type.
   *
   * @param resultMessage - The SDK result message
   * @param sessionId - The session ID for logging
   * @returns The clarification outcome
   */
  private processStructuredOutput(resultMessage: SDKResultMessage, sessionId: string): ClarificationOutcome {
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

    // First, validate with the flat schema (matches what SDK returns)
    const flatParsed = clarificationAgentOutputFlatSchema.safeParse(structuredOutput);
    if (!flatParsed.success) {
      debugLoggerService.logSdkEvent(sessionId, 'Flat schema validation failed', {
        error: flatParsed.error.message,
        structuredOutput,
      });
      return {
        error: `Structured output validation failed: ${flatParsed.error.message}`,
        type: 'ERROR',
      };
    }

    const flatOutput = flatParsed.data;

    // Transform flat output to discriminated union and validate required fields
    if (flatOutput.type === 'SKIP_CLARIFICATION') {
      // Validate that reason is present for SKIP_CLARIFICATION
      if (!flatOutput.reason) {
        debugLoggerService.logSdkEvent(sessionId, 'Missing reason for SKIP_CLARIFICATION', {
          structuredOutput: flatOutput,
        });
        return {
          error: 'SKIP_CLARIFICATION output missing required "reason" field',
          type: 'ERROR',
        };
      }

      // Validate with the discriminated union schema for full type safety
      const skipOutput = {
        assessment: flatOutput.assessment,
        reason: flatOutput.reason,
        type: 'SKIP_CLARIFICATION' as const,
      };

      const parsed = clarificationAgentOutputSchema.safeParse(skipOutput);
      if (!parsed.success) {
        debugLoggerService.logSdkEvent(sessionId, 'SKIP_CLARIFICATION validation failed', {
          error: parsed.error.message,
          structuredOutput: flatOutput,
        });
        return {
          error: `Structured output validation failed: ${parsed.error.message}`,
          type: 'ERROR',
        };
      }

      return {
        assessment: skipOutput.assessment,
        reason: skipOutput.reason,
        type: 'SKIP_CLARIFICATION',
      };
    }

    // flatOutput.type === 'QUESTIONS_FOR_USER'
    // Validate that questions is present for QUESTIONS_FOR_USER
    if (!flatOutput.questions || flatOutput.questions.length === 0) {
      debugLoggerService.logSdkEvent(sessionId, 'Missing questions for QUESTIONS_FOR_USER', {
        structuredOutput: flatOutput,
      });
      return {
        error: 'QUESTIONS_FOR_USER output missing required "questions" field',
        type: 'ERROR',
      };
    }

    // Validate with the discriminated union schema for full type safety
    const questionsOutput = {
      assessment: flatOutput.assessment,
      questions: flatOutput.questions,
      type: 'QUESTIONS_FOR_USER' as const,
    };

    const parsed = clarificationAgentOutputSchema.safeParse(questionsOutput);
    if (!parsed.success) {
      debugLoggerService.logSdkEvent(sessionId, 'QUESTIONS_FOR_USER validation failed', {
        error: parsed.error.message,
        structuredOutput: flatOutput,
      });
      return {
        error: `Structured output validation failed: ${parsed.error.message}`,
        type: 'ERROR',
      };
    }

    return {
      assessment: questionsOutput.assessment,
      questions: questionsOutput.questions,
      type: 'QUESTIONS_FOR_USER',
    };
  }
}

/**
 * Get the SDK query function, loading it once and caching for subsequent calls.
 *
 * @returns The SDK query function
 * @throws Error if the SDK is not available
 */
async function getQueryFunction(): Promise<typeof import('@anthropic-ai/claude-agent-sdk')['query']> {
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

// Export singleton instance
export const clarificationStepService = new ClarificationStepService();
