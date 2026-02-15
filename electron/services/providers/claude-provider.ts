/**
 * Claude Provider
 *
 * Wraps the Claude Agent SDK for the provider abstraction layer.
 * Claude is the primary provider with full capability support (tools,
 * permissions, hooks, thinking, structured output, subagents).
 *
 * For chat streaming, this provider delegates back to AgentStreamService
 * which manages MessagePorts and SDK sessions. For workflow execution,
 * it uses the SDK's query() function directly.
 */
import type {
  LLMProvider,
  ProviderCapabilities,
  ProviderChatOptions,
  ProviderStreamEvent,
  ProviderWorkflowOptions,
  ProviderWorkflowResult,
} from '../../../types/provider';

export class ClaudeProvider implements LLMProvider {
  readonly capabilities: ProviderCapabilities = {
    hooks: true,
    permissions: true,
    structuredOutput: true,
    subagents: true,
    thinking: true,
    tools: true,
  };

  readonly id = 'anthropic-sdk' as const;
  readonly name = 'Claude (Agent SDK)';

  async executeWorkflow(options: ProviderWorkflowOptions): Promise<ProviderWorkflowResult> {
    // Workflow execution is handled by agent-sdk-executor.ts
    // This method provides a standalone interface for future use
    try {
      const { query } = await import('@anthropic-ai/claude-agent-sdk');

      let resultText = '';
      let lastMessage: unknown = null;
      for await (const message of query({
        options: {
          cwd: options.cwd ?? process.cwd(),
          model: options.model,
          ...(options.maxThinkingTokens ? { maxThinkingTokens: options.maxThinkingTokens } : {}),
          ...(options.systemPrompt ? { systemPrompt: options.systemPrompt } : {}),
        },
        prompt: options.prompt,
      })) {
        lastMessage = message;
        if (message.type === 'result') {
          // SDKResultMessage is a discriminated union — extract result text safely
          const msg = message as Record<string, unknown>;
          if ('result' in msg && msg.result !== null && msg.result !== undefined) {
            resultText = typeof msg.result === 'string' ? msg.result : JSON.stringify(msg.result);
          }
        }
      }

      // If no result was found, try to get text from the last message
      if (!resultText && lastMessage) {
        const msg = lastMessage as Record<string, unknown>;
        if ('result' in msg && msg.result !== null && msg.result !== undefined) {
          resultText = typeof msg.result === 'string' ? msg.result : JSON.stringify(msg.result);
        }
      }

      return {
        result: resultText,
        success: true,
      };
    } catch (error) {
      return {
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        success: false,
      };
    }
  }

  async *streamChat(_options: ProviderChatOptions): AsyncGenerator<ProviderStreamEvent> {
    // Chat streaming for Claude is handled by AgentStreamService directly
    // because it manages MessagePorts, sessions, and the full SDK lifecycle.
    // This generator is not used for Claude — AgentStreamService calls the SDK directly.
    throw new Error('Claude chat streaming is handled by AgentStreamService directly');
  }

  async validateConfig(): Promise<{ error?: string; valid: boolean }> {
    try {
      // Check that the SDK is importable
      await import('@anthropic-ai/claude-agent-sdk');
      return { valid: true };
    } catch {
      return { error: 'Claude Agent SDK is not available', valid: false };
    }
  }
}
