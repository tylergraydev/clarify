/**
 * Provider Registry
 *
 * Singleton registry for managing AI provider instances.
 * Providers register themselves at app startup and can be
 * looked up by ID for chat streaming and workflow execution.
 */
import type { LLMProvider, ProviderId } from '../../../types/provider';

class ProviderRegistry {
  private defaultProviderId: ProviderId = 'anthropic-sdk';
  private providers = new Map<ProviderId, LLMProvider>();

  get(id: ProviderId): LLMProvider | undefined {
    return this.providers.get(id);
  }

  getDefault(): LLMProvider | undefined {
    return this.providers.get(this.defaultProviderId);
  }

  getOrThrow(id: ProviderId): LLMProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider '${id}' is not registered. Available: ${[...this.providers.keys()].join(', ')}`);
    }
    return provider;
  }

  listProviders(): Array<LLMProvider> {
    return [...this.providers.values()];
  }

  register(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  setDefault(id: ProviderId): void {
    if (!this.providers.has(id)) {
      throw new Error(`Cannot set default: provider '${id}' is not registered`);
    }
    this.defaultProviderId = id;
  }
}

export const providerRegistry = new ProviderRegistry();
