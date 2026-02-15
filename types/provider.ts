/**
 * Provider Abstraction Types
 *
 * Defines the interface contract for AI providers (Claude, OpenAI, etc.)
 * used across the application for multi-model support.
 */

import type { AgentStreamMessage } from './agent-stream';

export interface LLMProvider {
  capabilities: ProviderCapabilities;
  /** Execute a workflow with optional structured output */
  executeWorkflow(options: ProviderWorkflowOptions): Promise<ProviderWorkflowResult>;
  id: ProviderId;

  name: string;

  /** Stream a chat response, yielding AgentStreamMessage events */
  streamChat(options: ProviderChatOptions): AsyncGenerator<ProviderStreamEvent>;

  /** Validate that the provider is properly configured */
  validateConfig(): Promise<{ error?: string; valid: boolean }>;
}

export interface ProviderCapabilities {
  /** Whether the provider supports lifecycle hooks */
  hooks: boolean;
  /** Whether the provider supports permission-based tool execution */
  permissions: boolean;
  /** Whether the provider supports structured JSON output */
  structuredOutput: boolean;
  /** Whether the provider supports subagent orchestration */
  subagents: boolean;
  /** Whether the provider supports extended thinking / reasoning */
  thinking: boolean;
  /** Whether the provider supports tool use */
  tools: boolean;
}

export interface ProviderChatOptions {
  abortController: AbortController;
  cwd?: string;
  maxThinkingTokens?: number;
  model: string;
  prompt: string;
  reasoningLevel?: string;
  systemPrompt?: string;
}

export type ProviderId = 'anthropic-sdk' | 'bedrock' | 'custom' | 'openai' | 'vertex';

export type ProviderStreamEvent = AgentStreamMessage;

export interface ProviderWorkflowOptions extends ProviderChatOptions {
  allowedTools?: Array<string>;
  disallowedTools?: Array<string>;
  outputFormatSchema?: Record<string, unknown>;
}

export interface ProviderWorkflowResult {
  errors?: Array<string>;
  result?: string;
  structuredOutput?: unknown;
  success: boolean;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
