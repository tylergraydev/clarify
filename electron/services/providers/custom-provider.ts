/**
 * Custom OpenAI-Compatible Provider
 *
 * Implements the LLMProvider interface for OpenAI-compatible API endpoints.
 * Supports custom base URLs for services like Ollama, LM Studio, vLLM, etc.
 *
 * Status: Stub implementation — validates configuration but does not yet
 * make API calls. Full implementation will extend the OpenAI provider pattern
 * with a configurable base URL.
 */
import type {
  LLMProvider,
  ProviderCapabilities,
  ProviderChatOptions,
  ProviderStreamEvent,
  ProviderWorkflowOptions,
  ProviderWorkflowResult,
} from '../../../types/provider';

import { getCustomEndpoint, hasApiKey } from './api-key.service';

export class CustomProvider implements LLMProvider {
  capabilities: ProviderCapabilities = {
    hooks: false,
    permissions: false,
    structuredOutput: true,
    subagents: false,
    thinking: false,
    tools: false,
  };
  id = 'custom' as const;
  name = 'Custom Endpoint';

  async executeWorkflow(_options: ProviderWorkflowOptions): Promise<ProviderWorkflowResult> {
    const endpoint = getCustomEndpoint();
    if (!endpoint) {
      return {
        errors: ['Custom endpoint is not configured. Set your endpoint URL in Settings > Providers.'],
        result: undefined,
        structuredOutput: undefined,
        success: false,
      };
    }

    return {
      errors: ['Custom provider is not yet fully implemented. Configure Claude (Agent SDK) or OpenAI instead.'],
      result: undefined,
      structuredOutput: undefined,
      success: false,
    };
  }

  async *streamChat(_options: ProviderChatOptions): AsyncGenerator<ProviderStreamEvent> {
    const endpoint = getCustomEndpoint();
    if (!endpoint) {
      throw new Error('Custom endpoint is not configured. Set your endpoint URL in Settings > Providers.');
    }
    throw new Error('Custom provider is not yet fully implemented. Configure Claude (Agent SDK) or OpenAI instead.');
  }

  async validateConfig(): Promise<{ error?: string; valid: boolean }> {
    const hasKey = hasApiKey('custom');
    const endpoint = getCustomEndpoint();

    if (!endpoint) {
      return { error: 'Custom endpoint URL is not configured. Set it in Settings > Providers.', valid: false };
    }

    if (!hasKey) {
      return { error: 'Custom provider API key is not configured. Set it in Settings > Providers.', valid: false };
    }

    return { error: 'Custom provider validation is not yet implemented.', valid: false };
  }
}
