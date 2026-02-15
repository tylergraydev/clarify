/**
 * AWS Bedrock Provider
 *
 * Implements the LLMProvider interface for Claude models via AWS Bedrock.
 * Requires AWS credentials (access key, secret key, region) configured via provider settings.
 *
 * Status: Stub implementation — validates configuration but does not yet
 * make API calls. Full implementation requires @aws-sdk/client-bedrock-runtime.
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

export class BedrockProvider implements LLMProvider {
  capabilities: ProviderCapabilities = {
    hooks: false,
    permissions: false,
    structuredOutput: true,
    subagents: false,
    thinking: false,
    tools: false,
  };
  id = 'bedrock' as const;
  name = 'AWS Bedrock';

  async executeWorkflow(_options: ProviderWorkflowOptions): Promise<ProviderWorkflowResult> {
    return {
      errors: ['AWS Bedrock provider is not yet implemented. Configure Claude (Agent SDK) or OpenAI instead.'],
      result: undefined,
      structuredOutput: undefined,
      success: false,
    };
  }

  async *streamChat(_options: ProviderChatOptions): AsyncGenerator<ProviderStreamEvent> {
    throw new Error('AWS Bedrock provider is not yet implemented. Configure Claude (Agent SDK) or OpenAI instead.');
  }

  async validateConfig(): Promise<{ error?: string; valid: boolean }> {
    const configured = hasApiKey('bedrock');
    if (!configured) {
      return {
        error: 'AWS Bedrock credentials are not configured. Set your AWS access key in Settings > Providers.',
        valid: false,
      };
    }
    return { error: 'AWS Bedrock provider validation is not yet implemented.', valid: false };
  }
}
