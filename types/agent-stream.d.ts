/**
 * Agent Stream Message Types
 *
 * Defines the message protocol for streaming agent communication
 * between the Electron main process and renderer via MessagePorts.
 *
 * This is the single source of truth for all agent stream types.
 * Other files should import from this module rather than duplicating types.
 *
 * @see {@link https://platform.claude.com/docs/en/agent-sdk/overview Claude Agent SDK Documentation}
 */

/**
 * API interface for the agentStream methods exposed via preload.
 * Matches the interface at window.electronAPI.agentStream.
 */
export interface AgentStreamAPI {
  /** Cancel an active stream session */
  cancel: (sessionId: string) => Promise<boolean>;
  /** Register a callback to receive stream messages. Returns an unsubscribe function. */
  onMessage: (callback: (message: AgentStreamMessage | AgentStreamPortReadyMessage) => void) => () => void;
  /** Send a message to the stream (e.g., tool response, cancel) */
  sendMessage: (sessionId: string, message: AgentStreamClientMessage) => void;
  /** Start a new agent stream session. The onMessage callback will receive the port for this session. */
  start: (options: AgentStreamOptions) => Promise<{ sessionId: string }>;
}

/**
 * Budget exceeded message (when API spend limit reached)
 */
export interface AgentStreamBudgetExceededMessage extends AgentStreamMessageBase {
  /** Budget limit that was exceeded */
  budgetLimit?: number;
  /** Current spend amount */
  currentSpend?: number;
  type: 'budget_exceeded';
}

/**
 * Message sent from renderer to main process
 */
export interface AgentStreamClientMessage {
  /** User's response data */
  data?: unknown;
  /** Request ID being responded to */
  requestId?: string;
  type: 'cancel' | 'input_response' | 'user_message';
}

/**
 * Hook matcher configuration for filtering which events trigger callbacks.
 * Maps to SDK's HookMatcher with pattern matching support.
 */
export interface AgentStreamHookMatcher {
  /** Regex pattern to match tool names (e.g., 'Write|Edit') */
  matcher?: string;
}

/**
 * Hooks configuration for intercepting agent execution.
 * Allows validation, logging, security controls, and custom logic.
 *
 * Maps to the SDK's HookEvent type which includes all available hook events.
 *
 * @see {@link https://platform.claude.com/docs/en/agent-sdk/hooks SDK Hooks Documentation}
 */
export interface AgentStreamHooks {
  /** Hooks that run for notifications */
  Notification?: Array<AgentStreamHookMatcher>;
  /** Hooks that run when a permission is requested */
  PermissionRequest?: Array<AgentStreamHookMatcher>;
  /** Hooks that run after tool execution succeeds */
  PostToolUse?: Array<AgentStreamHookMatcher>;
  /** Hooks that run after tool execution fails */
  PostToolUseFailure?: Array<AgentStreamHookMatcher>;
  /** Hooks that run before conversation compaction */
  PreCompact?: Array<AgentStreamHookMatcher>;
  /** Hooks that run before tool execution */
  PreToolUse?: Array<AgentStreamHookMatcher>;
  /** Hooks that run when a session ends */
  SessionEnd?: Array<AgentStreamHookMatcher>;
  /** Hooks that run when a session starts */
  SessionStart?: Array<AgentStreamHookMatcher>;
  /** Hooks that run during setup */
  Setup?: Array<AgentStreamHookMatcher>;
  /** Hooks that run when agent wants to stop */
  Stop?: Array<AgentStreamHookMatcher>;
  /** Hooks that run when a subagent starts */
  SubagentStart?: Array<AgentStreamHookMatcher>;
  /** Hooks that run when a subagent stops */
  SubagentStop?: Array<AgentStreamHookMatcher>;
  /** Hooks that run when user submits a prompt */
  UserPromptSubmit?: Array<AgentStreamHookMatcher>;
}

/**
 * Input request data structure for UI state.
 * Represents a pending user input request shown in the UI.
 */
export interface AgentStreamInputRequest {
  /** Type of input needed */
  inputType: 'confirmation' | 'text' | 'tool_response';
  /** Prompt to show the user */
  prompt?: string;
  /** Request identifier for response correlation */
  requestId: string;
  /** Tool use ID if this is a tool response request */
  toolUseId?: string;
}

/**
 * User input request (for tool interaction)
 */
export interface AgentStreamInputRequestMessage extends AgentStreamMessageBase {
  /** Type of input needed */
  inputType: 'confirmation' | 'text' | 'tool_response';
  /** Prompt to show the user */
  prompt?: string;
  /** Request identifier for response correlation */
  requestId: string;
  /** Tool use ID if this is a tool response request */
  toolUseId?: string;
  type: 'input_request';
}

/**
 * Union type of all agent stream messages
 */
export type AgentStreamMessage =
  | AgentStreamBudgetExceededMessage
  | AgentStreamInputRequestMessage
  | AgentStreamPermissionRequestMessage
  | AgentStreamResultMessage
  | AgentStreamSubagentStartMessage
  | AgentStreamSubagentStopMessage
  | AgentStreamSystemMessage
  | AgentStreamTextDeltaMessage
  | AgentStreamTextMessage
  | AgentStreamThinkingMessage
  | AgentStreamToolResultMessage
  | AgentStreamToolUseMessage;

/**
 * Base message type with common fields.
 *
 * Note: Uses camelCase for property names (e.g., toolUseId) rather than
 * snake_case from the SDK (tool_use_id) for consistency with JavaScript
 * conventions. The service layer handles any necessary mapping.
 *
 * @see {@link https://platform.claude.com/docs/en/agent-sdk/message-types SDK Message Types Documentation}
 */
export interface AgentStreamMessageBase {
  /** Unique message ID for correlation */
  id: string;
  /** Session ID this message belongs to (optional for system init messages) */
  sessionId?: string;
  /** Timestamp when message was created */
  timestamp: number;
}

/**
 * Options for starting an agent stream
 */
export interface AgentStreamOptions {
  /** Allowed tools (empty = all tools) */
  allowedTools?: Array<string>;
  /** Working directory for the agent */
  cwd?: string;
  /**
   * Hooks for intercepting agent execution.
   * Enables validation, logging, security controls, and pause points.
   */
  hooks?: AgentStreamHooks;
  /** Maximum API spend in USD before stopping */
  maxBudgetUsd?: number;
  /** Maximum turns before stopping */
  maxTurns?: number;
  /**
   * Permission mode controlling tool execution behavior.
   * @default 'default'
   */
  permissionMode?: AgentStreamPermissionMode;
  /** The prompt/task for the agent */
  prompt: string;
  /** System prompt override */
  systemPrompt?: string;
}

/**
 * Permission mode for controlling tool execution behavior.
 *
 * - 'default': Standard behavior, unmatched tools trigger permission requests
 * - 'acceptEdits': Auto-approve file operations (Write, Edit, mkdir, rm, mv, cp)
 * - 'bypassPermissions': All tools execute without prompts (use with caution)
 * - 'plan': No tool execution, agent creates plans only
 * - 'delegate': Delegate permission decisions to subagents
 * - 'dontAsk': Don't prompt for permissions, deny if not pre-approved
 *
 * @see {@link https://platform.claude.com/docs/en/agent-sdk/permission-modes SDK Permission Modes Documentation}
 */
export type AgentStreamPermissionMode =
  | 'acceptEdits'
  | 'bypassPermissions'
  | 'default'
  | 'delegate'
  | 'dontAsk'
  | 'plan';

/**
 * Permission request message (when agent needs approval in default mode)
 */
export interface AgentStreamPermissionRequestMessage extends AgentStreamMessageBase {
  /** Tool arguments requiring permission */
  toolInput: Record<string, unknown>;
  /** Name of tool requiring permission */
  toolName: string;
  /** Tool use ID for correlation */
  toolUseId: string;
  type: 'permission_request';
}

/**
 * Port ready message (sent by preload when MessagePort is connected).
 * This is a local message type not from the SDK, generated by preload.ts
 * to signal that the MessagePort is ready for communication.
 */
export interface AgentStreamPortReadyMessage {
  /** Session ID this port is connected to */
  sessionId: string;
  /** Timestamp when port became ready */
  timestamp: number;
  type: 'port_ready';
}

/**
 * Final result message
 */
export interface AgentStreamResultMessage extends AgentStreamMessageBase {
  /** Error message */
  error?: string;
  /** Success result content */
  result?: string;
  subtype: 'budget_exceeded' | 'cancelled' | 'error' | 'max_turns' | 'success';
  type: 'result';
}

/**
 * Stream session state
 */
export interface AgentStreamSession {
  /** Active tool calls */
  activeTools: Array<{
    toolInput: Record<string, unknown>;
    toolName: string;
    toolUseId: string;
  }>;
  /** Error if status is 'error' */
  error?: string;
  /** Unique session ID */
  id: string;
  /** Final result if status is 'completed' */
  result?: string;
  /** Current status */
  status: 'cancelled' | 'completed' | 'error' | 'initializing' | 'running' | 'waiting_input';
  /** Accumulated text content */
  text: string;
  /** Thinking/reasoning blocks */
  thinking: Array<string>;
}

/**
 * UI state for a streaming session.
 * Extends session state with UI-specific fields like inputRequest and toolResults.
 */
export interface AgentStreamState {
  /** Active tool calls */
  activeTools: AgentStreamSession['activeTools'];
  /** Error message if status is 'error' */
  error: null | string;
  /** Current input request (if waiting for user input) */
  inputRequest: AgentStreamInputRequest | null;
  /** All messages received (for debugging) */
  messages: Array<AgentStreamMessage | AgentStreamPortReadyMessage>;
  /** Final result if status is 'completed' */
  result: null | string;
  /** Unique session identifier */
  sessionId: null | string;
  /** Current session status */
  status: AgentStreamSession['status'];
  /** Accumulated text content */
  text: string;
  /** Thinking/reasoning blocks */
  thinking: Array<string>;
  /** Completed tool results */
  toolResults: Array<AgentStreamToolResultEntry>;
}

/**
 * Subagent start message (when a subagent begins execution)
 */
export interface AgentStreamSubagentStartMessage extends AgentStreamMessageBase {
  /** Type of subagent being started */
  agentType?: string;
  /** Parent session ID */
  parentSessionId?: string;
  /** Subagent session ID */
  subagentSessionId: string;
  type: 'subagent_start';
}

/**
 * Subagent stop message (when a subagent completes execution)
 */
export interface AgentStreamSubagentStopMessage extends AgentStreamMessageBase {
  /** Path to subagent transcript */
  agentTranscriptPath?: string;
  /** Result of subagent execution */
  result?: string;
  /** Subagent session ID */
  subagentSessionId: string;
  type: 'subagent_stop';
}

/**
 * System initialization message
 */
export interface AgentStreamSystemMessage extends AgentStreamMessageBase {
  /** Session identifier */
  sessionId?: string;
  /** Status message */
  status?: string;
  subtype: 'init' | 'status';
  /** Available tools */
  tools?: Array<string>;
  type: 'system';
}

/**
 * Character-by-character text delta
 */
export interface AgentStreamTextDeltaMessage extends AgentStreamMessageBase {
  /** New text chunk to append */
  delta: string;
  type: 'text_delta';
}

/**
 * Text content streaming (typewriter effect)
 */
export interface AgentStreamTextMessage extends AgentStreamMessageBase {
  /** Accumulated text content */
  text: string;
  type: 'text';
}

/**
 * Chain of thought / reasoning message
 */
export interface AgentStreamThinkingMessage extends AgentStreamMessageBase {
  /** Thinking/reasoning content */
  content: string;
  /** Whether this is the final thinking block */
  isFinal?: boolean;
  type: 'thinking';
}

/**
 * Entry in the toolResults array tracking completed tool executions.
 */
export interface AgentStreamToolResultEntry {
  /** Whether the tool encountered an error */
  isError?: boolean;
  /** Tool output data */
  output: unknown;
  /** Matching tool use ID */
  toolUseId: string;
}

/**
 * Tool execution result message
 */
export interface AgentStreamToolResultMessage extends AgentStreamMessageBase {
  /** Whether the tool encountered an error */
  isError?: boolean;
  /** Tool output */
  output: unknown;
  /** Matching tool use ID */
  toolUseId: string;
  type: 'tool_result';
}

/**
 * Tool invocation message
 */
export interface AgentStreamToolUseMessage extends AgentStreamMessageBase {
  /** Tool input arguments */
  toolInput: Record<string, unknown>;
  /** Name of the tool being called */
  toolName: string;
  /** Unique ID for this tool use */
  toolUseId: string;
  type: 'tool_use';
}

/**
 * Return type for the useAgentStream hook.
 * Includes both state fields and control functions.
 */
export interface UseAgentStreamReturn extends AgentStreamState {
  /** Cancel the current session */
  cancel: () => Promise<boolean>;
  /** Whether a start operation is in progress */
  isStarting: boolean;
  /** Reset the stream state to initial values */
  reset: () => void;
  /** Send a response to an input request */
  sendResponse: (data: unknown) => void;
  /** Send a result for a tool use request */
  sendToolResult: (toolUseId: string, result: unknown) => void;
  /** Start a new streaming session */
  start: (options: AgentStreamOptions) => Promise<string>;
}
