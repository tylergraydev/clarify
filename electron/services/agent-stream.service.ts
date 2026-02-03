import type {
  CanUseTool,
  HookCallback,
  HookCallbackMatcher,
  HookEvent,
  HookJSONOutput,
  Options,
  PermissionResult,
  PermissionUpdate,
  SDKAssistantMessage,
  SDKMessage,
  SDKPartialAssistantMessage,
  SDKResultMessage,
  SDKSystemMessage,
  SDKUserMessage,
} from '@anthropic-ai/claude-agent-sdk';

/**
 * Agent Stream Service
 *
 * Manages streaming communication with Claude Agent SDK.
 * Uses MessagePorts for efficient bidirectional streaming between
 * the main process and renderer.
 *
 * ## Implementation Notes
 *
 * This service uses the `@anthropic-ai/claude-agent-sdk` package to run
 * agent workflows. It handles:
 *
 * - Streaming messages from the SDK via async generators
 * - Mapping SDK message types to application message types
 * - Supporting hooks for pause points and intervention
 * - Permission request handling via canUseTool callback
 * - Cancellation via AbortController
 *
 * @see {@link https://platform.claude.com/docs/en/agent-sdk/overview Claude Agent SDK Documentation}
 * @see {@link ../../types/agent-stream.d.ts Agent Stream Types}
 */
import { randomUUID } from 'crypto';
import { MessageChannelMain, type MessagePortMain } from 'electron';

import type {
  AgentStreamClientMessage,
  AgentStreamHooks,
  AgentStreamMessage,
  AgentStreamOptions,
  AgentStreamSession,
} from '../../types/agent-stream';

import { debugLoggerService } from './debug-logger.service';

/**
 * Delay in milliseconds before cleaning up a completed session.
 * Allows time for final messages to be delivered to the renderer.
 */
const CLEANUP_DELAY_MS = 100;

/**
 * Active stream session with its ports
 */
interface ActiveSession {
  abortController: AbortController;
  id: string;
  /**
   * When true, partial messages are being streamed (text_delta, thinking_delta).
   * We skip emitting full text/thinking blocks in assistant messages to avoid duplication.
   */
  isPartialStreaming: boolean;
  /**
   * Queue for user messages to send to the SDK.
   * Used with the streaming input pattern to support multi-turn conversations.
   */
  messageQueue: Array<SDKUserMessage>;
  /**
   * Resolver function to wake up the message generator when new messages arrive.
   * Set when the generator is waiting for input.
   */
  messageQueueResolver: (() => void) | null;
  /** Pending permission requests awaiting user response */
  pendingPermissions: Map<
    string,
    {
      reject: (reason: Error) => void;
      resolve: (approved: boolean) => void;
    }
  >;
  port: MessagePortMain;
  session: AgentStreamSession;
}

/**
 * Manages agent streaming sessions.
 *
 * This service handles the lifecycle of streaming sessions between
 * the Electron main process and renderer. It creates MessageChannels
 * for efficient bidirectional communication and manages session state.
 *
 * @example
 * ```typescript
 * // Create a new session
 * const { sessionId, port } = agentStreamService.createSession({
 *   prompt: 'Analyze the codebase',
 *   cwd: '/path/to/project',
 *   allowedTools: ['Read', 'Grep', 'Glob'],
 * });
 *
 * // Transfer port to renderer via postMessage
 * mainWindow.webContents.postMessage('agentStream:port', { sessionId }, [port]);
 *
 * // Later, cancel if needed
 * agentStreamService.cancelSession(sessionId);
 * ```
 */
class AgentStreamService {
  private activeSessions = new Map<string, ActiveSession>();

  /**
   * Cancel an active streaming session.
   *
   * Aborts the session's operation, sends a cancellation message to the
   * renderer, and cleans up resources. Safe to call even if the session
   * is not active (will be a no-op).
   *
   * @param sessionId - The unique identifier of the session to cancel
   */
  cancelSession(sessionId: string): void {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    debugLoggerService.logSession(sessionId, 'cancel', {
      pendingPermissionCount: activeSession.pendingPermissions.size,
      previousStatus: activeSession.session.status,
    });

    activeSession.abortController.abort();
    activeSession.session.status = 'cancelled';

    // Reject any pending permission requests
    for (const [, pending] of activeSession.pendingPermissions) {
      pending.reject(new Error('Session cancelled'));
    }
    activeSession.pendingPermissions.clear();

    this.sendMessage(sessionId, {
      id: randomUUID(),
      sessionId,
      subtype: 'cancelled',
      timestamp: Date.now(),
      type: 'result',
    });

    this.cleanup(sessionId);
  }

  /**
   * Create a new streaming session and return the port for the renderer.
   *
   * Creates a MessageChannel pair, stores one port internally for sending
   * messages, and returns the other port to be transferred to the renderer
   * via `webContents.postMessage()`.
   *
   * @param options - Configuration options for the agent stream
   * @returns Object containing the sessionId and the MessagePort to transfer to the renderer
   *
   * @example
   * ```typescript
   * const { sessionId, port } = agentStreamService.createSession({
   *   prompt: 'Analyze the authentication code',
   *   cwd: '/path/to/project',
   *   allowedTools: ['Read', 'Grep'],
   *   permissionMode: 'default',
   * });
   *
   * // Transfer port to renderer
   * mainWindow.webContents.postMessage('agentStream:port', { sessionId }, [port]);
   * ```
   */
  createSession(options: AgentStreamOptions): { port: MessagePortMain; sessionId: string } {
    const sessionId = randomUUID();
    const { port1, port2 } = new MessageChannelMain();

    const session: AgentStreamSession = {
      activeTools: [],
      id: sessionId,
      status: 'initializing',
      text: '',
      thinking: [],
    };

    const abortController = new AbortController();

    const activeSession: ActiveSession = {
      abortController,
      id: sessionId,
      isPartialStreaming: true,
      messageQueue: [],
      messageQueueResolver: null,
      pendingPermissions: new Map(),
      port: port1,
      session,
    };

    this.activeSessions.set(sessionId, activeSession);

    debugLoggerService.logSession(sessionId, 'start', {
      allowedTools: options.allowedTools,
      cwd: options.cwd,
      maxBudgetUsd: options.maxBudgetUsd,
      maxThinkingTokens: options.maxThinkingTokens,
      maxTurns: options.maxTurns,
      permissionMode: options.permissionMode,
      prompt: options.prompt.slice(0, 500) + (options.prompt.length > 500 ? '...' : ''),
    });

    // Listen for messages from renderer
    port1.on('message', (event) => {
      this.handleClientMessage(sessionId, event.data as AgentStreamClientMessage);
    });

    // Start the port
    port1.start();

    // Start the real SDK stream
    void this.startSDKStream(sessionId, options);

    // Return port2 to be transferred to renderer
    return { port: port2, sessionId };
  }

  /**
   * Get a session's current state.
   *
   * Returns the session state object containing status, accumulated text,
   * thinking blocks, active tools, and any error or result information.
   *
   * @param sessionId - The unique identifier of the session
   * @returns The session state, or undefined if no session exists with that ID
   */
  getSession(sessionId: string): AgentStreamSession | undefined {
    return this.activeSessions.get(sessionId)?.session;
  }

  /**
   * Check if a session is currently active.
   *
   * @param sessionId - The unique identifier of the session to check
   * @returns True if the session exists and is active, false otherwise
   */
  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  /**
   * Clean up a session and release all associated resources.
   *
   * Closes the MessagePort, wakes up any waiting message generators,
   * clears the message queue, and removes the session from the active map.
   *
   * @param sessionId - The unique identifier of the session to clean up
   */
  private cleanup(sessionId: string): void {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    // Wake up any waiting message generator so it can exit cleanly
    if (activeSession.messageQueueResolver) {
      activeSession.messageQueueResolver();
      activeSession.messageQueueResolver = null;
    }

    // Clear the message queue
    activeSession.messageQueue.length = 0;

    activeSession.port.close();
    this.activeSessions.delete(sessionId);
  }

  /**
   * Handle messages received from the renderer via the MessagePort.
   *
   * Routes client messages to the appropriate handler based on message type:
   * - `cancel`: Cancels the active session
   * - `input_response`: Handles tool responses or permission decisions
   * - `user_message`: Handles follow-up user messages (currently a no-op)
   *
   * @param sessionId - The session ID the message belongs to
   * @param message - The client message to process
   */
  private handleClientMessage(sessionId: string, message: AgentStreamClientMessage): void {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    switch (message.type) {
      case 'cancel':
        this.cancelSession(sessionId);
        break;

      case 'input_response':
        // Handle tool response or permission decision
        this.handleInputResponse(sessionId, message);
        break;

      case 'user_message':
        // Intentionally empty: Follow-up user messages are currently not implemented.
        // This case exists as a placeholder for future multi-turn conversation support
        // where user messages would be queued for the SDK message generator.
        break;
    }
  }

  /**
   * Handle input response messages from the renderer.
   *
   * Processes responses to permission requests or tool input requests:
   * - For permission requests: Resolves the pending permission promise with approve/deny
   * - For user input: Queues the response as a user message for the SDK
   *
   * @param sessionId - The session ID the response belongs to
   * @param message - The client message containing the response data and request ID
   */
  private handleInputResponse(sessionId: string, message: AgentStreamClientMessage): void {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    const requestId = message.requestId;
    if (!requestId) {
      return;
    }

    // Check if this is a permission decision
    const pendingPermission = activeSession.pendingPermissions.get(requestId);
    if (pendingPermission) {
      // Resolve the permission promise
      const approved = message.data === true || message.data === 'approve';
      pendingPermission.resolve(approved);
      activeSession.pendingPermissions.delete(requestId);

      // Update session status back to running
      if (activeSession.session.status === 'waiting_input') {
        activeSession.session.status = 'running';
      }
      return;
    }

    // Otherwise, it's a user input response that needs to be sent to the SDK.
    // Queue the message and wake up the generator if it's waiting.

    // Format the response as a user message for the SDK
    const responseText = typeof message.data === 'string' ? message.data : JSON.stringify(message.data);

    const userMessage: SDKUserMessage = {
      message: {
        content: responseText,
        role: 'user',
      },
      // The requestId may be a tool_use_id if this is a response to a tool call
      parent_tool_use_id: requestId,
      session_id: activeSession.session.id,
      type: 'user',
    };

    // Add to queue and wake up generator
    activeSession.messageQueue.push(userMessage);
    if (activeSession.messageQueueResolver) {
      activeSession.messageQueueResolver();
      activeSession.messageQueueResolver = null;
    }

    // Update session status back to running
    if (activeSession.session.status === 'waiting_input') {
      activeSession.session.status = 'running';
    }
  }

  /**
   * Map SDK message to application message and send to renderer.
   *
   * This method handles the translation between SDK message format
   * and our application's message format. The SDK uses these message types:
   *
   * - 'assistant': Complete assistant message with content blocks
   * - 'user': User message (for multi-turn)
   * - 'result': Final result (success or error)
   * - 'system': System initialization or compact boundary
   * - 'stream_event': Partial message updates (when includePartialMessages=true)
   */
  private mapAndSendSDKMessage(sessionId: string, sdkMessage: SDKMessage): void {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    const baseMessage = {
      id: randomUUID(),
      sessionId,
      timestamp: Date.now(),
    };

    switch (sdkMessage.type) {
      case 'assistant':
        // Process each content block in the assistant message
        debugLoggerService.logSdkEvent(sessionId, 'Assistant message received', {
          contentBlockCount: Array.isArray((sdkMessage as SDKAssistantMessage).message.content)
            ? (sdkMessage as SDKAssistantMessage).message.content.length
            : 0,
          messageType: 'assistant',
        });
        this.processAssistantMessage(sessionId, sdkMessage as SDKAssistantMessage, baseMessage);
        break;

      // Handle other message types that don't need special processing
      case 'auth_status':

      case 'tool_progress':

      case 'tool_use_summary':
        // These can be extended later if needed
        debugLoggerService.logSdkEvent(sessionId, `SDK message: ${sdkMessage.type}`, {
          messageType: sdkMessage.type,
        });
        break;

      case 'result':
        debugLoggerService.logSdkEvent(sessionId, 'Result message received', {
          messageType: 'result',
          subtype: (sdkMessage as SDKResultMessage).subtype,
        });
        this.processResultMessage(sessionId, sdkMessage as SDKResultMessage, baseMessage);
        break;

      case 'stream_event':
        // Handle streaming partial updates (logged in processStreamEvent for detail)
        this.processStreamEvent(sessionId, sdkMessage as SDKPartialAssistantMessage, baseMessage);
        break;
      case 'system':
        // Handle system messages (init, compact_boundary, etc.)
        debugLoggerService.logSdkEvent(sessionId, 'System message received', {
          messageType: 'system',
          subtype: (sdkMessage as SDKSystemMessage).subtype,
        });
        if ((sdkMessage as SDKSystemMessage).subtype === 'init') {
          const sysMessage = sdkMessage as SDKSystemMessage;
          this.sendMessage(sessionId, {
            ...baseMessage,
            sessionId: sysMessage.session_id,
            subtype: 'init',
            tools: sysMessage.tools ?? [],
            type: 'system',
          });
        }
        // compact_boundary events can be logged but don't need UI messages
        break;
      case 'user':
        // User messages are typically echoed back during multi-turn
        // We don't need to forward these to the renderer
        debugLoggerService.logSdkEvent(sessionId, 'User message echoed', {
          messageType: 'user',
        });
        break;
    }
  }

  /**
   * Map AgentStreamHooks to SDK hooks format.
   *
   * The SDK expects hooks in the format:
   * ```typescript
   * hooks: {
   *   PreToolUse: [{ matcher?: string, hooks: HookCallback[] }],
   *   PostToolUse: [{ matcher?: string, hooks: HookCallback[] }],
   *   // ...
   * }
   * ```
   *
   * Our AgentStreamHooks format only contains matchers (no callbacks) because
   * the actual hook logic is handled by the SDK internally. We map our
   * simplified format to the SDK format with empty callback arrays since
   * we're only using hooks for their filtering/matching behavior.
   *
   * @param hooks - The AgentStreamHooks configuration from options
   * @returns SDK-compatible hooks object
   */
  private mapHooksToSDKFormat(hooks: AgentStreamHooks): Partial<Record<HookEvent, Array<HookCallbackMatcher>>> {
    const sdkHooks: Partial<Record<HookEvent, Array<HookCallbackMatcher>>> = {};

    // Map each hook event type - using all HookEvent values from the SDK
    const hookEvents: Array<HookEvent> = [
      'PreToolUse',
      'PostToolUse',
      'PostToolUseFailure',
      'Notification',
      'UserPromptSubmit',
      'SessionStart',
      'SessionEnd',
      'Stop',
      'SubagentStart',
      'SubagentStop',
      'PreCompact',
      'PermissionRequest',
      'Setup',
    ];

    for (const event of hookEvents) {
      const matchers = hooks[event];
      if (matchers && matchers.length > 0) {
        sdkHooks[event] = matchers.map((m) => {
          // Create a hook callback that continues execution - the matcher provides filtering.
          // TypeScript allows callback implementations to omit unused trailing parameters,
          // so we use a parameterless function rather than underscore-prefixed unused params.
          const handleHookContinue: HookCallback = async (): Promise<HookJSONOutput> => {
            return { continue: true };
          };

          const callbackMatcher: HookCallbackMatcher = {
            hooks: [handleHookContinue],
            matcher: m.matcher,
          };
          return callbackMatcher;
        });
      }
    }

    return sdkHooks;
  }

  /**
   * Process an assistant message and extract content blocks.
   * The SDK uses BetaMessage from @anthropic-ai/sdk for the message content.
   */
  private processAssistantMessage(
    sessionId: string,
    message: SDKAssistantMessage,
    baseMessage: { id: string; sessionId: string; timestamp: number }
  ): void {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    const content = message.message.content;
    if (!Array.isArray(content)) return;

    for (const block of content) {
      switch (block.type) {
        case 'text':
          // Complete text block - skip if we've already streamed via deltas
          // to avoid duplicating content that was sent incrementally
          if ('text' in block && block.text && !activeSession.isPartialStreaming) {
            debugLoggerService.logText(sessionId, block.text);
            activeSession.session.text += block.text;
            this.sendMessage(sessionId, {
              ...baseMessage,
              id: randomUUID(),
              text: block.text,
              type: 'text',
            });
          }
          break;

        case 'thinking':
          // Thinking/reasoning block - skip if we've already streamed via deltas
          // to avoid duplicating content that was sent incrementally
          if ('thinking' in block && block.thinking && !activeSession.isPartialStreaming) {
            debugLoggerService.logThinking(sessionId, block.thinking);
            activeSession.session.thinking.push(block.thinking);
            this.sendMessage(sessionId, {
              ...baseMessage,
              content: block.thinking,
              id: randomUUID(),
              isFinal: true,
              type: 'thinking',
            });
          }
          break;

        case 'tool_result':
          // Tool execution result
          if ('tool_use_id' in block && block.tool_use_id) {
            // Remove tool from active tools
            const toolForResult = activeSession.session.activeTools.find((t) => t.toolUseId === block.tool_use_id);
            activeSession.session.activeTools = activeSession.session.activeTools.filter(
              (t) => t.toolUseId !== block.tool_use_id
            );

            // Extract text content from tool result
            let output: unknown = 'content' in block ? block.content : undefined;
            if (Array.isArray(output)) {
              output = output.map((c) => (typeof c === 'string' ? c : 'text' in c ? (c.text ?? '') : '')).join('');
            }

            debugLoggerService.logToolResult(sessionId, toolForResult?.toolName ?? 'unknown', {
              isError: 'is_error' in block ? block.is_error : undefined,
              output,
              toolUseId: block.tool_use_id,
            });

            this.sendMessage(sessionId, {
              ...baseMessage,
              id: randomUUID(),
              isError: 'is_error' in block ? block.is_error : undefined,
              output,
              toolUseId: block.tool_use_id,
              type: 'tool_result',
            });
          }
          break;

        case 'tool_use':
          // Tool invocation
          if ('name' in block && 'id' in block && block.name && block.id) {
            const toolInfo = {
              toolInput: 'input' in block ? ((block.input as Record<string, unknown>) ?? {}) : {},
              toolName: block.name,
              toolUseId: block.id,
            };

            debugLoggerService.logToolUse(sessionId, toolInfo.toolName, toolInfo.toolInput);
            activeSession.session.activeTools.push(toolInfo);

            this.sendMessage(sessionId, {
              ...baseMessage,
              ...toolInfo,
              id: randomUUID(),
              type: 'tool_use',
            });
          }
          break;
      }
    }
  }

  /**
   * Process a result message (success or error)
   */
  private processResultMessage(
    sessionId: string,
    message: SDKResultMessage,
    baseMessage: { id: string; sessionId: string; timestamp: number }
  ): void {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    if (message.subtype === 'success') {
      debugLoggerService.logSession(sessionId, 'end', {
        outcome: 'success',
        resultLength: typeof message.result === 'string' ? message.result.length : 0,
      });
      activeSession.session.status = 'completed';
      activeSession.session.result = message.result;

      this.sendMessage(sessionId, {
        ...baseMessage,
        result: message.result,
        subtype: 'success',
        type: 'result',
      });
    } else {
      activeSession.session.status = 'error';

      // Map error subtypes to our simpler format
      let errorSubtype: 'budget_exceeded' | 'error' | 'max_turns' = 'error';
      if (message.subtype === 'error_max_turns') {
        errorSubtype = 'max_turns';
      } else if (message.subtype === 'error_max_budget_usd') {
        errorSubtype = 'budget_exceeded';
      }

      const errorMessage = message.errors?.join('\n') ?? 'Unknown error occurred';
      activeSession.session.error = errorMessage;

      debugLoggerService.logSession(sessionId, 'end', {
        errorMessage,
        errorSubtype,
        outcome: 'error',
      });

      this.sendMessage(sessionId, {
        ...baseMessage,
        error: errorMessage,
        subtype: errorSubtype,
        type: 'result',
      });
    }

    // Clean up session after a short delay to allow message delivery
    setTimeout(() => this.cleanup(sessionId), CLEANUP_DELAY_MS);
  }

  /**
   * Process streaming partial message events.
   * These provide real-time updates as the model generates content.
   * The event field contains BetaRawMessageStreamEvent from @anthropic-ai/sdk.
   */
  private processStreamEvent(
    sessionId: string,
    message: SDKPartialAssistantMessage,
    baseMessage: { id: string; sessionId: string; timestamp: number }
  ): void {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    const event = message.event;
    if (!event) return;

    // Handle content_block_delta events for streaming text
    // The event type comes from BetaRawMessageStreamEvent
    if (event.type === 'content_block_delta' && 'delta' in event) {
      const delta = event.delta as { text?: string; thinking?: string; type?: string };
      if (delta.type === 'text_delta' && delta.text) {
        // Stream text delta - log periodically to avoid log spam
        // Only log when accumulated text crosses 500 char thresholds
        const prevLength = activeSession.session.text.length;
        activeSession.session.text += delta.text;
        const newLength = activeSession.session.text.length;
        if (Math.floor(newLength / 500) > Math.floor(prevLength / 500)) {
          debugLoggerService.logSdkEvent(sessionId, 'Text delta streaming', {
            accumulatedLength: newLength,
            eventType: 'text_delta',
          });
        }
        this.sendMessage(sessionId, {
          ...baseMessage,
          delta: delta.text,
          type: 'text_delta',
        });
      } else if (delta.type === 'thinking_delta' && delta.thinking) {
        // Stream thinking delta - append to last thinking block
        const thinkingContent = delta.thinking;
        if (activeSession.session.thinking.length > 0) {
          activeSession.session.thinking[activeSession.session.thinking.length - 1] += thinkingContent;
        } else {
          activeSession.session.thinking.push(thinkingContent);
        }

        // Log periodically to avoid log spam (every 500 chars threshold)
        const totalThinking = activeSession.session.thinking.join('').length;
        if (totalThinking % 500 < thinkingContent.length) {
          debugLoggerService.logSdkEvent(sessionId, 'Thinking delta streaming', {
            accumulatedLength: totalThinking,
            eventType: 'thinking_delta',
          });
        }

        this.sendMessage(sessionId, {
          ...baseMessage,
          content: thinkingContent,
          id: randomUUID(),
          type: 'thinking',
        });
      }
    }
  }

  /**
   * Send a message to the renderer via the session's MessagePort.
   *
   * Looks up the active session and posts the message to its port.
   * Silently returns if the session no longer exists.
   *
   * @param sessionId - The session ID to send the message to
   * @param message - The message to send to the renderer
   */
  private sendMessage(sessionId: string, message: AgentStreamMessage): void {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    activeSession.port.postMessage(message);
  }

  /**
   * Start the real Claude Agent SDK stream.
   *
   * This method dynamically imports the SDK and initiates a streaming
   * session using the `query()` function. It handles:
   *
   * - SDK initialization and configuration
   * - Mapping options to SDK format
   * - Processing streaming messages
   * - Permission handling via canUseTool callback
   * - Cancellation via AbortController
   * - Error handling and cleanup
   *
   * @param sessionId - The session ID for this stream
   * @param options - Stream options including prompt, tools, permissions, etc.
   */
  private async startSDKStream(sessionId: string, options: AgentStreamOptions): Promise<void> {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    const { signal } = activeSession.abortController;

    try {
      // Dynamically import the SDK to avoid issues with ESM/CommonJS
      const { query } = await import('@anthropic-ai/claude-agent-sdk');

      // Send init message
      this.sendMessage(sessionId, {
        id: randomUUID(),
        sessionId,
        subtype: 'init',
        timestamp: Date.now(),
        tools: options.allowedTools ?? [],
        type: 'system',
      });

      activeSession.session.status = 'running';

      // Detect extended thinking mode
      // StreamEvent messages are not emitted - only complete messages after each turn.
      const hasExtendedThinking = options.maxThinkingTokens !== undefined && options.maxThinkingTokens > 0;

      // Update session's partial streaming flag based on extended thinking mode
      // When extended thinking is enabled, the SDK does NOT emit StreamEvent messages,
      // so we must process complete text/thinking blocks instead of skipping them.
      activeSession.isPartialStreaming = !hasExtendedThinking;

      // Build SDK options with proper typing
      const sdkOptions: Options = {
        // Pass the abort controller to the SDK for proper cancellation
        abortController: activeSession.abortController,
        cwd: options.cwd ?? process.cwd(),
        // Enable partial messages for real-time streaming (unless extended thinking is enabled)
        includePartialMessages: !hasExtendedThinking,
      };

      // Map allowed tools
      if (options.allowedTools && options.allowedTools.length > 0) {
        sdkOptions.allowedTools = options.allowedTools;
      }

      // Map permission mode
      if (options.permissionMode) {
        sdkOptions.permissionMode = options.permissionMode;
      }

      // Map max turns
      if (options.maxTurns !== undefined) {
        sdkOptions.maxTurns = options.maxTurns;
      }

      // Map max budget
      if (options.maxBudgetUsd !== undefined) {
        sdkOptions.maxBudgetUsd = options.maxBudgetUsd;
      }

      // Map system prompt
      if (options.systemPrompt) {
        sdkOptions.systemPrompt = options.systemPrompt;
      }

      // Map maxThinkingTokens for extended thinking
      // When set, the SDK disables partial streaming and only emits complete messages after each turn
      if (hasExtendedThinking) {
        sdkOptions.maxThinkingTokens = options.maxThinkingTokens;
      }

      // Map hooks configuration
      // Converts AgentStreamHooks to SDK format with proper HookCallbackMatcher structure
      if (options.hooks) {
        sdkOptions.hooks = this.mapHooksToSDKFormat(options.hooks);
      }

      // Set up canUseTool callback for permission handling
      // This is called when the SDK needs permission for a tool
      const canUseTool: CanUseTool = async (
        toolName: string,
        toolInput: Record<string, unknown>,
        callbackOptions: { signal: AbortSignal; suggestions?: Array<PermissionUpdate>; toolUseID: string }
      ): Promise<PermissionResult> => {
        debugLoggerService.logSdkEvent(sessionId, 'Permission request initiated', {
          toolInput,
          toolName,
          toolUseId: callbackOptions.toolUseID,
        });

        // Check if session is still active
        const session = this.activeSessions.get(sessionId);
        if (!session) {
          debugLoggerService.logPermission(sessionId, `${toolName} (session inactive)`, false);
          return { behavior: 'deny', message: 'Session no longer active' };
        }

        // Check if cancelled (use either the callback signal or our abort controller)
        if (signal.aborted || callbackOptions.signal.aborted) {
          debugLoggerService.logPermission(sessionId, `${toolName} (session cancelled)`, false);
          return { behavior: 'deny', message: 'Session cancelled' };
        }

        // Generate a unique request ID for this permission request
        const requestId = randomUUID();

        // Update session status
        session.session.status = 'waiting_input';

        // Send permission request to renderer
        this.sendMessage(sessionId, {
          id: randomUUID(),
          sessionId,
          timestamp: Date.now(),
          toolInput,
          toolName,
          toolUseId: requestId,
          type: 'permission_request',
        });

        // Also send an input request so the UI knows to prompt the user
        this.sendMessage(sessionId, {
          id: randomUUID(),
          inputType: 'confirmation',
          prompt: `Allow ${toolName}?`,
          requestId,
          sessionId,
          timestamp: Date.now(),
          toolUseId: requestId,
          type: 'input_request',
        });

        // Create a promise that will be resolved when the user responds
        return new Promise<PermissionResult>((resolve, reject) => {
          // Set up abort handlers
          const handleAbort = () => {
            session.pendingPermissions.delete(requestId);
            resolve({ behavior: 'deny', message: 'Session cancelled' });
          };

          // Listen to both abort signals
          signal.addEventListener('abort', handleAbort, { once: true });
          callbackOptions.signal.addEventListener('abort', handleAbort, { once: true });

          // Register the pending permission request BEFORE waiting
          session.pendingPermissions.set(requestId, {
            reject: (err) => {
              signal.removeEventListener('abort', handleAbort);
              callbackOptions.signal.removeEventListener('abort', handleAbort);
              reject(err);
            },
            resolve: (approved: boolean) => {
              signal.removeEventListener('abort', handleAbort);
              callbackOptions.signal.removeEventListener('abort', handleAbort);

              debugLoggerService.logPermission(sessionId, toolName, approved);

              if (approved) {
                // Allow with the original input
                resolve({
                  behavior: 'allow',
                  updatedInput: toolInput,
                });
              } else {
                // Deny with a message
                resolve({
                  behavior: 'deny',
                  message: `User denied permission for ${toolName}`,
                });
              }
            },
          });
        });
      };

      sdkOptions.canUseTool = canUseTool;

      /**
       * Create an async generator that yields user messages.
       * This enables multi-turn conversations by:
       * 1. Yielding the initial prompt as the first message
       * 2. Waiting for new messages to be queued via handleInputResponse
       * 3. Yielding queued messages to continue the conversation
       */
      const messageGenerator = async function* (
        this: AgentStreamService
      ): AsyncGenerator<SDKUserMessage, void, unknown> {
        // First, yield the initial prompt
        yield {
          message: {
            content: options.prompt,
            role: 'user' as const,
          },
          parent_tool_use_id: null,
          session_id: activeSession.session.id,
          type: 'user' as const,
        };

        // Then wait for subsequent messages from the queue
        while (!signal.aborted) {
          // Wait for messages to appear in the queue
          if (activeSession.messageQueue.length === 0) {
            // No messages yet - wait for one to be queued
            await new Promise<void>((resolve) => {
              activeSession.messageQueueResolver = resolve;

              // Also listen for abort to break out
              const handleAbort = () => resolve();
              signal.addEventListener('abort', handleAbort, { once: true });
            });
          }

          // Check again after waiting
          if (signal.aborted) break;

          // Yield all queued messages
          while (activeSession.messageQueue.length > 0) {
            const msg = activeSession.messageQueue.shift()!;
            yield msg;
          }
        }
      }.bind(this);

      debugLoggerService.logSdkEvent(sessionId, 'SDK query starting', {
        allowedTools: sdkOptions.allowedTools,
        cwd: sdkOptions.cwd,
        includePartialMessages: sdkOptions.includePartialMessages,
        maxThinkingTokens: sdkOptions.maxThinkingTokens,
        maxTurns: sdkOptions.maxTurns,
        permissionMode: sdkOptions.permissionMode,
        ...(hasExtendedThinking && {
          extendedThinkingEnabled: true,
          extendedThinkingNote: 'Partial streaming disabled - will process complete messages only',
        }),
      });

      // Execute the SDK query with streaming input mode
      for await (const message of query({
        options: sdkOptions,
        prompt: messageGenerator(),
      })) {
        // Check for cancellation
        if (signal.aborted) {
          return;
        }

        // Map and send the SDK message
        this.mapAndSendSDKMessage(sessionId, message);
      }

      // If we reach here without a result message, send a success result
      if (activeSession.session.status === 'running') {
        debugLoggerService.logSdkEvent(sessionId, 'SDK query completed without explicit result', {
          textLength: activeSession.session.text.length,
          thinkingBlocks: activeSession.session.thinking.length,
        });
        debugLoggerService.logSession(sessionId, 'end', {
          implicit: true,
          outcome: 'success',
        });
        activeSession.session.status = 'completed';
        this.sendMessage(sessionId, {
          id: randomUUID(),
          result: activeSession.session.text || 'Task completed successfully.',
          sessionId,
          subtype: 'success',
          timestamp: Date.now(),
          type: 'result',
        });

        setTimeout(() => this.cleanup(sessionId), CLEANUP_DELAY_MS);
      }
    } catch (error) {
      // Don't report errors if the session was cancelled
      if (signal.aborted) return;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      debugLoggerService.logSdkEvent(sessionId, 'SDK query error', {
        errorMessage,
        errorType: error instanceof Error ? error.name : 'Unknown',
      });
      debugLoggerService.logSession(sessionId, 'end', {
        errorMessage,
        outcome: 'error',
      });

      activeSession.session.status = 'error';
      activeSession.session.error = errorMessage;

      this.sendMessage(sessionId, {
        error: errorMessage,
        id: randomUUID(),
        sessionId,
        subtype: 'error',
        timestamp: Date.now(),
        type: 'result',
      });

      this.cleanup(sessionId);
    }
  }
}

// Export singleton instance
export const agentStreamService = new AgentStreamService();
