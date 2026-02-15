/**
 * Agent SDK Executor
 *
 * Reusable class for executing Claude Agent SDK queries with shared configuration,
 * tool management, extended thinking support, and stream event processing.
 *
 * This class consolidates common SDK execution logic across clarification, refinement,
 * and file discovery agent step services, eliminating ~600-700 lines of duplication.
 *
 * ## Type Parameters
 *
 * - `TAgentConfig`: The agent configuration type (e.g., ClarificationAgentConfig)
 * - `TSession`: The active session type (e.g., ActiveClarificationSession)
 * - `TStreamMessage`: The stream message type (e.g., ClarificationStreamMessage)
 *
 * ## Usage Example
 *
 * ```typescript
 * const executor = new AgentSdkExecutor<ClarificationAgentConfig, ActiveClarificationSession, ClarificationStreamMessage>();
 *
 * const config: SdkExecutorConfig<ClarificationAgentConfig> = {
 *   agentConfig,
 *   repositoryPath: '/path/to/repo',
 *   abortController: new AbortController(),
 *   outputFormatSchema: clarificationAgentOutputJSONSchema,
 * };
 *
 * const handlers: StreamEventHandlers<ClarificationStreamMessage> = {
 *   onPhaseChange: (phase) => console.log('Phase:', phase),
 *   onMessageEmit: (message) => console.log('Message:', message),
 * };
 *
 * const result = await executor.executeQuery(
 *   session,
 *   config,
 *   prompt,
 *   handlers
 * );
 * ```
 */

import type { Options, SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

import type { AgentActivityRepository } from '../../../db/repositories/agent-activity.repository';
import type { AgentConfig } from '../../../types/agent-config';
import type { ActiveToolInfo } from './step-types';

import { debugLoggerService } from '../debug-logger.service';
import { buildSdkMcpServers } from '../mcp-server.service';
import { getQueryFunction, parseToolInputJson } from './agent-sdk';
import { CLAUDE_CODE_TOOL_NAMES } from './agent-tools';
import { startHeartbeat, stopHeartbeat } from './heartbeat';
import { extractUsageStats } from './usage-stats';

// =============================================================================
// Type Definitions
// =============================================================================

export type BaseAgentConfig = AgentConfig;

/**
 * Minimum required fields for any active session.
 */
export interface BaseSession {
  /** Array of active tool invocations */
  activeTools: Array<ActiveToolInfo>;
  /** Unique session identifier */
  sessionId: string;
  /** Accumulated streaming text */
  streamingText: string;
  /** Array of thinking block content */
  thinkingBlocks: Array<string>;
}

/**
 * Base configuration interface for agent SDK execution.
 */
export interface SdkExecutorConfig<TAgentConfig extends BaseAgentConfig> {
  /** AbortController for cancellation support */
  abortController: AbortController;
  /** Optional repository for persisting agent activity events to SQLite */
  activityRepository?: AgentActivityRepository;
  /** The loaded agent configuration */
  agentConfig: TAgentConfig;
  /** JSON schema for structured output validation */
  outputFormatSchema: Record<string, unknown>;
  /** Optional provider ID override (defaults to 'anthropic-sdk' for Claude) */
  providerId?: string;
  /** Path to the repository being analyzed */
  repositoryPath: string;
  /** Workflow step ID for associating activity records */
  stepId?: number;
}

/**
 * Handlers for stream events during SDK execution.
 *
 * @template TStreamMessage - The step-specific stream message type
 * @template TSession - The step-specific session type
 */
export interface StreamEventHandlers<TStreamMessage, TSession extends BaseSession = BaseSession> {
  /**
   * Optional hook for custom stream event processing.
   * Called for each stream event before standard processing.
   * Use this for step-specific event handling (e.g., file_discovered events).
   *
   * @param event - The raw stream event object
   * @param session - The current session
   */
  onCustomStreamEvent?: (event: Record<string, unknown>, session: TSession) => void;

  /**
   * Called when a message should be emitted to the stream.
   */
  onMessageEmit?: (message: TStreamMessage) => void;

  /**
   * Called when the execution phase changes.
   */
  onPhaseChange?: (phase: string) => void;
}

// =============================================================================
// Agent SDK Executor Class
// =============================================================================

/**
 * Reusable SDK execution orchestrator for agent step services.
 *
 * Handles SDK options building, tool configuration, query execution,
 * and stream event processing with generic type parameters for step-specific customization.
 */
export class AgentSdkExecutor<
  TAgentConfig extends BaseAgentConfig,
  TSession extends BaseSession,
  TStreamMessage extends { sessionId: string; timestamp: number; type: string },
> {
  /**
   * Build SDK Options from agent configuration.
   *
   * Constructs the Options object for Claude Agent SDK query execution,
   * including structured output format, tools configuration, permission mode,
   * model selection, system prompt, and extended thinking setup.
   *
   * @param config - The SDK executor configuration
   * @returns Complete SDK Options object
   */
  buildSdkOptions(config: SdkExecutorConfig<TAgentConfig>): Options {
    const { abortController, agentConfig, outputFormatSchema, repositoryPath } = config;

    // Base SDK options with structured output format
    // Note: includePartialMessages enables streaming text/thinking deltas for UI
    // Structured output still comes from final ResultMessage.structured_output
    const sdkOptions: Options = {
      abortController,
      cwd: repositoryPath,
      includePartialMessages: true,
      outputFormat: {
        schema: outputFormatSchema,
        type: 'json_schema',
      },
      // Explicitly configure Claude Code tools as the base toolset
      // This ensures tools are properly available before filtering with allowedTools/disallowedTools
      tools: { preset: 'claude_code', type: 'preset' },
    };

    // Configure tools from agent config
    this.configureTools(sdkOptions, agentConfig);

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
    this.configureExtendedThinking(sdkOptions, agentConfig);

    // Configure MCP servers (global + project .mcp.json)
    const mcpServers = buildSdkMcpServers(repositoryPath);
    if (Object.keys(mcpServers).length > 0) {
      sdkOptions.mcpServers = mcpServers;
    }

    return sdkOptions;
  }

  /**
   * Configure extended thinking with heartbeat management.
   *
   * When enabled, the SDK disables partial streaming and only emits complete messages after each turn.
   * Logs configuration details for debugging.
   *
   * @param sdkOptions - The SDK options to configure
   * @param agentConfig - The agent configuration with extended thinking settings
   */
  configureExtendedThinking(sdkOptions: Options, agentConfig: TAgentConfig): void {
    if (agentConfig.extendedThinkingEnabled && agentConfig.maxThinkingTokens) {
      sdkOptions.maxThinkingTokens = agentConfig.maxThinkingTokens;
      // Disable partial streaming for extended thinking mode
      sdkOptions.includePartialMessages = false;

      debugLoggerService.logSdkEvent('system', 'Extended thinking enabled', {
        extendedThinkingNote: 'Partial streaming disabled - will process complete messages only',
        maxThinkingTokens: agentConfig.maxThinkingTokens,
      });
    }
  }

  /**
   * Configure allowed and disallowed tools for the SDK.
   *
   * Uses both allowedTools AND disallowedTools as a safeguard.
   * The SDK's allowedTools should restrict tools, but we also explicitly
   * disallow tools not in the allowed list to ensure tool restriction works.
   *
   * SECURITY: Always apply restrictions, even when tools array is empty (empty = NO tools allowed)
   *
   * @param sdkOptions - The SDK options to configure
   * @param agentConfig - The agent configuration with tool definitions
   */
  configureTools(sdkOptions: Options, agentConfig: TAgentConfig): void {
    const allowedToolNames = agentConfig.tools.length > 0 ? agentConfig.tools.map((t) => t.toolName) : [];
    sdkOptions.allowedTools = allowedToolNames;

    // Explicitly disallow tools NOT in the allowed list
    sdkOptions.disallowedTools = CLAUDE_CODE_TOOL_NAMES.filter((tool) => !allowedToolNames.includes(tool));
  }

  /**
   * Execute an SDK query with stream event processing.
   *
   * Runs the SDK query function with the provided options and prompt,
   * processes streaming events for real-time UI updates, and returns
   * the final result message.
   *
   * Handles:
   * - Extended thinking heartbeat management
   * - Stream event processing loop
   * - Cancellation via AbortController
   * - Result message extraction
   * - Activity persistence to SQLite (when activityRepository is configured)
   *
   * @param session - The active session for state tracking
   * @param config - The SDK executor configuration
   * @param prompt - The prompt text to send to the agent
   * @param handlers - Stream event handlers for callbacks
   * @returns The final SDK result message, or null if cancelled/no result
   */
  async executeQuery(
    session: TSession,
    config: SdkExecutorConfig<TAgentConfig>,
    prompt: string,
    handlers: StreamEventHandlers<TStreamMessage, TSession>
  ): Promise<null | SDKResultMessage> {
    // Branch by provider: non-Claude providers use the provider abstraction layer
    const resolvedProviderId = config.providerId ?? 'anthropic-sdk';
    if (resolvedProviderId !== 'anthropic-sdk') {
      return this.executeProviderQuery(session, config, prompt, handlers, resolvedProviderId);
    }

    const query = await getQueryFunction();
    const sdkOptions = this.buildSdkOptions(config);

    // Create execution-scoped map for tool start tracking (avoids cross-workflow contamination)
    const toolStartActivityIds = new Map<string, { id: number; startedAt: number }>();

    // Start heartbeat for extended thinking mode
    let heartbeatInterval: NodeJS.Timeout | null = null;

    if (config.agentConfig.extendedThinkingEnabled && config.agentConfig.maxThinkingTokens) {
      heartbeatInterval = startHeartbeat(({ elapsedMs, timestamp }) => {
        if (handlers.onMessageEmit) {
          // Cast to any to avoid strict type checking on extended thinking heartbeat message
          // Each service defines its own extended thinking heartbeat message type
          handlers.onMessageEmit({
            elapsedMs,
            estimatedProgress: null,
            maxThinkingTokens: config.agentConfig.maxThinkingTokens!,
            sessionId: session.sessionId,
            timestamp,
            type: 'extended_thinking_heartbeat',
          } as unknown as TStreamMessage);
        }

        debugLoggerService.logSdkEvent(session.sessionId, 'Extended thinking heartbeat', {
          elapsedMs,
          elapsedSeconds: Math.floor(elapsedMs / 1000),
        });
      });
    }

    try {
      let resultMessage: null | SDKResultMessage = null;

      // Execute the query and capture result message
      for await (const message of query({ options: sdkOptions, prompt })) {
        // Check for cancellation
        if (config.abortController.signal.aborted) {
          return null;
        }

        // Process streaming events for real-time UI updates
        if (message.type === 'stream_event') {
          this.processStreamEvent(session, message, handlers, config, toolStartActivityIds);
        }

        // Capture the result message for structured output extraction
        if (message.type === 'result') {
          resultMessage = message as SDKResultMessage;
        }
      }

      // Persist usage statistics from the result message
      if (resultMessage && config.activityRepository && config.stepId !== undefined) {
        this.persistUsageActivity(resultMessage, config);
      }

      return resultMessage;
    } finally {
      // Clean up heartbeat interval
      stopHeartbeat(heartbeatInterval);
      if (heartbeatInterval) {
        debugLoggerService.logSdkEvent(session.sessionId, 'Extended thinking heartbeat stopped', {});
      }
    }
  }

  /**
   * Process a stream event from the SDK.
   *
   * Handles text deltas, thinking deltas, and tool use events to accumulate
   * streaming content in the session state and emit messages to the UI.
   * When an activityRepository is configured, persists each event to SQLite.
   *
   * This method is 100% identical across all three agent step services
   * (clarification, refinement, file discovery).
   *
   * @param session - The active session for state tracking
   * @param message - The SDK stream event message
   * @param handlers - The event handlers including custom processing hook
   * @param config - Optional SDK executor config for activity persistence
   */
  processStreamEvent(
    session: TSession,
    message: { event: Record<string, unknown>; type: 'stream_event' },
    handlers: StreamEventHandlers<TStreamMessage, TSession>,
    config?: SdkExecutorConfig<TAgentConfig>,
    toolStartActivityIds?: Map<string, { id: number; startedAt: number }>
  ): void {
    const event = message.event;

    // Call custom handler first to allow step-specific processing
    if (handlers.onCustomStreamEvent) {
      handlers.onCustomStreamEvent(event, session);
    }

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
        if (handlers.onMessageEmit) {
          handlers.onMessageEmit({
            delta: text,
            sessionId: session.sessionId,
            timestamp: Date.now(),
            type: 'text_delta',
          } as unknown as TStreamMessage);
        }

        // Persist text_delta activity
        this.persistActivity(config, {
          eventType: 'text_delta',
          textDelta: text,
        });
      } else if (deltaType === 'thinking_delta') {
        // Accumulate thinking text into the current block
        const thinking = delta.thinking as string;
        const lastIndex = session.thinkingBlocks.length - 1;
        if (lastIndex >= 0) {
          session.thinkingBlocks[lastIndex] += thinking;

          // Emit thinking delta to UI
          if (handlers.onMessageEmit) {
            handlers.onMessageEmit({
              blockIndex: lastIndex,
              delta: thinking,
              sessionId: session.sessionId,
              timestamp: Date.now(),
              type: 'thinking_delta',
            } as unknown as TStreamMessage);
          }

          // Persist thinking_delta activity
          this.persistActivity(config, {
            eventType: 'thinking_delta',
            textDelta: thinking,
            thinkingBlockIndex: lastIndex,
          });
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
          if (handlers.onMessageEmit) {
            handlers.onMessageEmit({
              sessionId: session.sessionId,
              timestamp: Date.now(),
              toolInput: lastTool.toolInput,
              toolName: lastTool.toolName,
              toolUseId: lastTool.toolUseId,
              type: 'tool_update',
            } as unknown as TStreamMessage);
          }

          // Persist tool_update activity with accumulated input
          // Strip the internal _partialJson field before persisting
          const { _partialJson: _, ...cleanInput } = lastTool.toolInput;
          this.persistActivity(config, {
            eventType: 'tool_update',
            toolInput: cleanInput,
            toolName: lastTool.toolName,
            toolUseId: lastTool.toolUseId,
          });
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
        if (handlers.onMessageEmit) {
          handlers.onMessageEmit({
            blockIndex,
            sessionId: session.sessionId,
            timestamp: Date.now(),
            type: 'thinking_start',
          } as unknown as TStreamMessage);
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
        if (handlers.onMessageEmit) {
          handlers.onMessageEmit({
            sessionId: session.sessionId,
            timestamp: Date.now(),
            toolInput: {},
            toolName,
            toolUseId,
            type: 'tool_start',
          } as unknown as TStreamMessage);
        }

        // Persist tool_start activity and track the record ID for later update
        this.persistToolStartActivity(config, toolName, toolUseId, toolStartActivityIds);
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
          if (handlers.onMessageEmit) {
            handlers.onMessageEmit({
              sessionId: session.sessionId,
              timestamp: Date.now(),
              toolUseId: completedTool.toolUseId,
              type: 'tool_stop',
            } as unknown as TStreamMessage);
          }

          // Update the tool_start record with stoppedAt and durationMs
          this.persistToolStopActivity(config, completedTool.toolUseId, toolStartActivityIds);
        }
      }
    }
  }

  /**
   * Execute a query via a non-Claude provider's executeWorkflow method.
   *
   * Delegates to the provider abstraction layer for non-Claude providers (e.g., OpenAI).
   * Maps the provider result back to an SDKResultMessage shape for downstream compatibility.
   *
   * @param session - The active session for state tracking
   * @param config - The SDK executor configuration
   * @param prompt - The prompt text to send
   * @param handlers - Stream event handlers for callbacks
   * @param providerId - The provider ID to use
   * @returns The result mapped to SDKResultMessage, or null
   */
  private async executeProviderQuery(
    session: TSession,
    config: SdkExecutorConfig<TAgentConfig>,
    prompt: string,
    handlers: StreamEventHandlers<TStreamMessage, TSession>,
    providerId: string
  ): Promise<null | SDKResultMessage> {
    const { providerRegistry } = await import('../providers/provider-registry');
    const provider = providerRegistry.get(providerId as import('../../../types/provider').ProviderId);

    if (!provider) {
      debugLoggerService.logSdkEvent(
        session.sessionId,
        `Provider '${providerId}' not found, falling back to Claude SDK`,
        {}
      );
      // Fall back to Claude SDK if provider not found
      const query = await getQueryFunction();
      const sdkOptions = this.buildSdkOptions(config);
      let resultMessage: null | SDKResultMessage = null;
      for await (const message of query({ options: sdkOptions, prompt })) {
        if (config.abortController.signal.aborted) return null;
        if (message.type === 'result') {
          resultMessage = message as SDKResultMessage;
        }
      }
      return resultMessage;
    }

    debugLoggerService.logSdkEvent(session.sessionId, `Executing workflow via provider: ${providerId}`, {
      model: config.agentConfig.model,
      provider: providerId,
    });

    const result = await provider.executeWorkflow({
      abortController: config.abortController,
      cwd: config.repositoryPath,
      model: config.agentConfig.model ?? 'gpt-4o',
      outputFormatSchema: config.outputFormatSchema,
      prompt,
      systemPrompt: config.agentConfig.systemPrompt,
    });

    // Emit the result text as a text delta for UI streaming
    if (result.result && handlers.onMessageEmit) {
      handlers.onMessageEmit({
        delta: result.result,
        sessionId: session.sessionId,
        timestamp: Date.now(),
        type: 'text_delta',
      } as unknown as TStreamMessage);
    }

    if (!result.success) {
      debugLoggerService.logSdkEvent(session.sessionId, `Provider workflow failed`, {
        errors: result.errors,
        provider: providerId,
      });
    }

    // Map result to SDKResultMessage shape for downstream compatibility
    return {
      result: result.result ?? '',
      structured_output: result.structuredOutput,
      type: 'result',
      usage: result.usage ?? {},
    } as unknown as SDKResultMessage;
  }

  // =============================================================================
  // Private Activity Persistence Helpers
  // =============================================================================

  /**
   * Persist a generic activity event to SQLite.
   *
   * Wraps the repository create call in try/catch to ensure persistence
   * failures never disrupt the streaming flow.
   *
   * @param config - The SDK executor config (may be undefined if not configured)
   * @param data - Partial activity data to persist (eventType is required)
   */
  private persistActivity(
    config: SdkExecutorConfig<TAgentConfig> | undefined,
    data: {
      eventType: string;
      textDelta?: string;
      thinkingBlockIndex?: number;
      toolInput?: Record<string, unknown>;
      toolName?: string;
      toolUseId?: string;
    }
  ): void {
    if (!config?.activityRepository || config.stepId === undefined) return;

    try {
      config.activityRepository.create({
        eventType: data.eventType,
        textDelta: data.textDelta ?? null,
        thinkingBlockIndex: data.thinkingBlockIndex ?? null,
        toolInput: data.toolInput ?? null,
        toolName: data.toolName ?? null,
        toolUseId: data.toolUseId ?? null,
        workflowStepId: config.stepId,
      });
    } catch (error) {
      debugLoggerService.logSdkEvent('activity-persistence', `Failed to persist ${data.eventType} activity`, {
        error: error instanceof Error ? error.message : String(error),
        eventType: data.eventType,
      });
    }
  }

  /**
   * Persist a tool_start activity event and track the database record ID.
   *
   * The record ID is stored in the toolStartActivityIds map so it can be
   * updated with stoppedAt and durationMs when the tool completes.
   *
   * @param config - The SDK executor config
   * @param toolName - The name of the tool being started
   * @param toolUseId - The unique tool use identifier
   */
  private persistToolStartActivity(
    config: SdkExecutorConfig<TAgentConfig> | undefined,
    toolName: string,
    toolUseId: string,
    toolStartActivityIds?: Map<string, { id: number; startedAt: number }>
  ): void {
    if (!config?.activityRepository || config.stepId === undefined) return;

    const startedAt = Date.now();

    try {
      const record = config.activityRepository.create({
        eventType: 'tool_start',
        startedAt,
        toolInput: {},
        toolName,
        toolUseId,
        workflowStepId: config.stepId,
      });

      toolStartActivityIds?.set(toolUseId, { id: record.id, startedAt });
    } catch (error) {
      debugLoggerService.logSdkEvent('activity-persistence', 'Failed to persist tool_start activity', {
        error: error instanceof Error ? error.message : String(error),
        toolName,
        toolUseId,
      });
    }
  }

  /**
   * Update a tool_start activity record with stop time and duration.
   *
   * Looks up the tracked record by toolUseId, computes durationMs,
   * and updates the record with stoppedAt and durationMs.
   *
   * @param config - The SDK executor config
   * @param toolUseId - The unique tool use identifier to look up
   */
  private persistToolStopActivity(
    config: SdkExecutorConfig<TAgentConfig> | undefined,
    toolUseId: string,
    toolStartActivityIds?: Map<string, { id: number; startedAt: number }>
  ): void {
    if (!config?.activityRepository || config.stepId === undefined) return;

    const tracked = toolStartActivityIds?.get(toolUseId);
    if (!tracked) return;

    const stoppedAt = Date.now();
    const durationMs = stoppedAt - tracked.startedAt;

    try {
      config.activityRepository.update(tracked.id, {
        durationMs,
        stoppedAt,
      });

      toolStartActivityIds?.delete(toolUseId);
    } catch (error) {
      debugLoggerService.logSdkEvent('activity-persistence', 'Failed to persist tool_stop activity update', {
        error: error instanceof Error ? error.message : String(error),
        toolUseId,
      });
    }
  }

  /**
   * Persist usage statistics from a successful result message as a usage activity event.
   *
   * Extracts token counts, cost, and cache metrics from the SDK result message
   * and writes them as a single `usage` event type record.
   *
   * @param resultMessage - The SDK result message
   * @param config - The SDK executor config with activity repository
   */
  private persistUsageActivity(resultMessage: SDKResultMessage, config: SdkExecutorConfig<TAgentConfig>): void {
    if (!config.activityRepository || config.stepId === undefined) return;

    try {
      const usage = extractUsageStats(resultMessage);
      if (!usage) return;

      config.activityRepository.create({
        cacheCreationInputTokens: usage.cacheCreationInputTokens ?? null,
        cacheReadInputTokens: usage.cacheReadInputTokens ?? null,
        durationMs: usage.durationMs,
        estimatedCost: usage.costUsd,
        eventType: 'usage',
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        workflowStepId: config.stepId,
      });
    } catch (error) {
      debugLoggerService.logSdkEvent('activity-persistence', 'Failed to persist usage activity', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
