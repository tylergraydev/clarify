/**
 * Google Vertex AI Provider
 *
 * Implements the LLMProvider interface for Claude models via Google Vertex AI.
 * Requires Google Cloud credentials (project ID, location, service account) configured via provider settings.
 *
 * Status: Stub implementation — validates configuration but does not yet
 * make API calls. Full implementation requires Google Cloud SDK.
 */
import type {
  LLMProvider,
  ProviderCapabilities,
  ProviderChatOptions,
  ProviderStreamEvent,
  ProviderWorkflowOptions,
  ProviderWorkflowResult,
} from '../../../types/provider';

import { hasApiKey } from './api-key.service';

export class VertexProvider implements LLMProvider {
  capabilities: ProviderCapabilities = {
    hooks: false,
    permissions: false,
    structuredOutput: true,
    subagents: false,
    thinking: false,
    tools: false,
  };
  id = 'vertex' as const;
  name = 'Google Vertex AI';

  async executeWorkflow(_options: ProviderWorkflowOptions): Promise<ProviderWorkflowResult> {
    return {
      errors: ['Google Vertex AI provider is not yet implemented. Configure Claude (Agent SDK) or OpenAI instead.'],
      result: undefined,
      structuredOutput: undefined,
      success: false,
    };
  }

  async *streamChat(_options: ProviderChatOptions): AsyncGenerator<ProviderStreamEvent> {
    throw new Error(
      'Google Vertex AI provider is not yet implemented. Configure Claude (Agent SDK) or OpenAI instead.'
    );
  }

  async validateConfig(): Promise<{ error?: string; valid: boolean }> {
    const configured = hasApiKey('vertex');
    if (!configured) {
      return {
        error: 'Google Vertex AI credentials are not configured. Set your credentials in Settings > Providers.',
        valid: false,
      };
    }
    return { error: 'Google Vertex AI provider validation is not yet implemented.', valid: false };
  }
}
