/**
 * Provider Initialization
 *
 * Registers all available providers with the provider registry.
 * Called from electron/main.ts during app startup, before registerAllHandlers().
 */
import { BedrockProvider } from './bedrock-provider';
import { ClaudeProvider } from './claude-provider';
import { CustomProvider } from './custom-provider';
import { OpenAIProvider } from './openai-provider';
import { providerRegistry } from './provider-registry';
import { VertexProvider } from './vertex-provider';

export function initializeProviders(): void {
  providerRegistry.register(new ClaudeProvider());
  providerRegistry.register(new OpenAIProvider());
  providerRegistry.register(new BedrockProvider());
  providerRegistry.register(new VertexProvider());
  providerRegistry.register(new CustomProvider());
}

export { providerRegistry } from './provider-registry';
