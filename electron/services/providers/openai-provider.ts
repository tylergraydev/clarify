/**
 * OpenAI Provider
 *
 * Implements the LLMProvider interface for OpenAI models (GPT-4o, o3, o4-mini).
 * Uses native fetch() to call the OpenAI API — no npm dependency required.
 *
 * Capabilities:
 * - Streaming via SSE (Server-Sent Events)
 * - Structured output via response_format JSON schema
 * - Reasoning levels for o3/o4 models (via reasoning_effort parameter)
 * - No tool use, permissions, hooks, or subagent support
 */
import { randomUUID } from 'node:crypto';

import type {
  AgentStreamResultMessage,
  AgentStreamSystemMessage,
  AgentStreamTextDeltaMessage,
} from '../../../types/agent-stream';
import type {
  LLMProvider,
  ProviderCapabilities,
  ProviderChatOptions,
  ProviderStreamEvent,
  ProviderWorkflowOptions,
  ProviderWorkflowResult,
} from '../../../types/provider';

import { getApiKey } from './api-key.service';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

interface OpenAIDelta {
  content?: null | string;
  role?: string;
}

interface OpenAIErrorResponse {
  error?: {
    message?: string;
    type?: string;
  };
}

interface OpenAIStreamChoice {
  delta: OpenAIDelta;
  finish_reason: null | string;
  index: number;
}

interface OpenAIStreamChunk {
  choices: Array<OpenAIStreamChoice>;
  id: string;
  model: string;
}

export class OpenAIProvider implements LLMProvider {
  readonly capabilities: ProviderCapabilities = {
    hooks: false,
    permissions: false,
    structuredOutput: true,
    subagents: false,
    thinking: false,
    tools: false,
  };

  readonly id = 'openai' as const;
  readonly name = 'OpenAI';

  async executeWorkflow(options: ProviderWorkflowOptions): Promise<ProviderWorkflowResult> {
    const apiKey = getApiKey('openai');
    if (!apiKey) {
      return { errors: ['OpenAI API key not configured'], success: false };
    }

    try {
      const body: Record<string, unknown> = {
        messages: [
          ...(options.systemPrompt ? [{ content: options.systemPrompt, role: 'system' }] : []),
          { content: options.prompt, role: 'user' },
        ],
        model: getModelId(options.model),
        stream: false,
      };

      // Add reasoning level for o3/o4 models
      if (options.reasoningLevel) {
        body.reasoning_effort = options.reasoningLevel;
      }

      // Add structured output format
      if (options.outputFormatSchema) {
        body.response_format = {
          json_schema: options.outputFormatSchema,
          type: 'json_schema',
        };
      }

      const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: options.abortController.signal,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as OpenAIErrorResponse;
        return {
          errors: [errorBody.error?.message ?? `HTTP ${response.status}`],
          success: false,
        };
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { completion_tokens: number; prompt_tokens: number };
      };

      const content = data.choices[0]?.message.content ?? '';

      return {
        result: content,
        structuredOutput: options.outputFormatSchema ? JSON.parse(content) : undefined,
        success: true,
        usage: data.usage
          ? {
              inputTokens: data.usage.prompt_tokens,
              outputTokens: data.usage.completion_tokens,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { errors: ['Request cancelled'], success: false };
      }
      return {
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        success: false,
      };
    }
  }

  async *streamChat(options: ProviderChatOptions): AsyncGenerator<ProviderStreamEvent> {
    const apiKey = getApiKey('openai');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const sessionId = randomUUID();

    // Emit system init message
    const initMessage: AgentStreamSystemMessage = {
      id: randomUUID(),
      sessionId,
      status: 'connected',
      subtype: 'init',
      timestamp: Date.now(),
      type: 'system',
    };
    yield initMessage;

    const body: Record<string, unknown> = {
      messages: [
        ...(options.systemPrompt ? [{ content: options.systemPrompt, role: 'system' }] : []),
        { content: options.prompt, role: 'user' },
      ],
      model: getModelId(options.model),
      stream: true,
    };

    // Add reasoning level for o3/o4 models
    if (options.reasoningLevel) {
      body.reasoning_effort = options.reasoningLevel;
    }

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: options.abortController.signal,
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as OpenAIErrorResponse;
      const resultMessage: AgentStreamResultMessage = {
        error: errorBody.error?.message ?? `HTTP ${response.status}`,
        id: randomUUID(),
        sessionId,
        subtype: 'error',
        timestamp: Date.now(),
        type: 'result',
      };
      yield resultMessage;
      return;
    }

    if (!response.body) {
      const resultMessage: AgentStreamResultMessage = {
        error: 'No response body',
        id: randomUUID(),
        sessionId,
        subtype: 'error',
        timestamp: Date.now(),
        type: 'result',
      };
      yield resultMessage;
      return;
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();

          if (data === '[DONE]') break;

          try {
            const chunk = JSON.parse(data) as OpenAIStreamChunk;
            const delta = chunk.choices[0]?.delta;

            if (delta?.content) {
              fullText += delta.content;
              const textDelta: AgentStreamTextDeltaMessage = {
                delta: delta.content,
                id: randomUUID(),
                sessionId,
                timestamp: Date.now(),
                type: 'text_delta',
              };
              yield textDelta;
            }

            if (chunk.choices[0]?.finish_reason === 'stop') {
              break;
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Emit result message
    const resultMessage: AgentStreamResultMessage = {
      id: randomUUID(),
      result: fullText,
      sessionId,
      subtype: 'success',
      timestamp: Date.now(),
      type: 'result',
    };
    yield resultMessage;
  }

  async validateConfig(): Promise<{ error?: string; valid: boolean }> {
    const apiKey = getApiKey('openai');
    if (!apiKey) {
      return { error: 'No API key configured', valid: false };
    }

    try {
      const response = await fetch(`${OPENAI_API_BASE}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: 'GET',
      });

      if (response.ok) {
        return { valid: true };
      }

      const body = (await response.json().catch(() => ({}))) as OpenAIErrorResponse;
      return { error: body.error?.message ?? `HTTP ${response.status}`, valid: false };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Connection failed', valid: false };
    }
  }
}

function getModelId(shorthand: string): string {
  // Map shorthand names to full OpenAI model IDs
  const modelMap: Record<string, string> = {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    o3: 'o3',
    'o4-mini': 'o4-mini',
  };
  return modelMap[shorthand] ?? shorthand;
}
