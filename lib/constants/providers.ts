/**
 * Provider & Model Constants
 *
 * Centralized definitions for AI providers, models, and capabilities.
 * Used across the application for model selection, provider configuration,
 * and capability gating.
 */

// =============================================================================
// Provider Types
// =============================================================================

export const providers = ['claude', 'openai', 'bedrock', 'vertex', 'custom'] as const;
export type Provider = (typeof providers)[number];

export const providerIds = ['anthropic-sdk', 'openai', 'bedrock', 'vertex', 'custom'] as const;
export type ProviderId = (typeof providerIds)[number];

// =============================================================================
// Model Types
// =============================================================================

export const claudeModels = ['sonnet', 'opus', 'haiku'] as const;
export type ClaudeModel = (typeof claudeModels)[number];

export const openaiModels = ['gpt-4o', 'gpt-4o-mini', 'o3', 'o4-mini'] as const;
export type OpenAIModel = (typeof openaiModels)[number];

export const allModels = [...claudeModels, ...openaiModels] as const;
export type ModelId = (typeof allModels)[number];

// =============================================================================
// Reasoning Levels
// =============================================================================

export const reasoningLevels = ['low', 'medium', 'high'] as const;
export interface ModelDefinition {
  displayName: string;
  id: string;
  provider: Provider;
  providerId: ProviderId;
  supportsReasoning: boolean;
  supportsStreaming: boolean;
  supportsTools: boolean;
}

// =============================================================================
// Model Definitions
// =============================================================================

export type ReasoningLevel = (typeof reasoningLevels)[number];

export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  // OpenAI models (via OpenAI API)
  'gpt-4o': {
    displayName: 'GPT-4o',
    id: 'gpt-4o',
    provider: 'openai',
    providerId: 'openai',
    supportsReasoning: false,
    supportsStreaming: true,
    supportsTools: false,
  },
  'gpt-4o-mini': {
    displayName: 'GPT-4o Mini',
    id: 'gpt-4o-mini',
    provider: 'openai',
    providerId: 'openai',
    supportsReasoning: false,
    supportsStreaming: true,
    supportsTools: false,
  },
  // Claude models (via Claude Agent SDK)
  haiku: {
    displayName: 'Claude Haiku',
    id: 'haiku',
    provider: 'claude',
    providerId: 'anthropic-sdk',
    supportsReasoning: false,
    supportsStreaming: true,
    supportsTools: true,
  },

  o3: {
    displayName: 'o3',
    id: 'o3',
    provider: 'openai',
    providerId: 'openai',
    supportsReasoning: true,
    supportsStreaming: true,
    supportsTools: false,
  },
  'o4-mini': {
    displayName: 'o4-mini',
    id: 'o4-mini',
    provider: 'openai',
    providerId: 'openai',
    supportsReasoning: true,
    supportsStreaming: true,
    supportsTools: false,
  },
  opus: {
    displayName: 'Claude Opus',
    id: 'opus',
    provider: 'claude',
    providerId: 'anthropic-sdk',
    supportsReasoning: false,
    supportsStreaming: true,
    supportsTools: true,
  },
  sonnet: {
    displayName: 'Claude Sonnet',
    id: 'sonnet',
    provider: 'claude',
    providerId: 'anthropic-sdk',
    supportsReasoning: false,
    supportsStreaming: true,
    supportsTools: true,
  },
};

// =============================================================================
// Provider Display Info
// =============================================================================

export interface ProviderInfo {
  displayName: string;
  id: ProviderId;
  provider: Provider;
  requiresApiKey: boolean;
}

export const PROVIDER_INFO: Record<ProviderId, ProviderInfo> = {
  'anthropic-sdk': {
    displayName: 'Claude (Agent SDK)',
    id: 'anthropic-sdk',
    provider: 'claude',
    requiresApiKey: false,
  },
  bedrock: {
    displayName: 'AWS Bedrock',
    id: 'bedrock',
    provider: 'bedrock',
    requiresApiKey: true,
  },
  custom: {
    displayName: 'Custom Endpoint',
    id: 'custom',
    provider: 'custom',
    requiresApiKey: true,
  },
  openai: {
    displayName: 'OpenAI',
    id: 'openai',
    provider: 'openai',
    requiresApiKey: true,
  },
  vertex: {
    displayName: 'Google Vertex AI',
    id: 'vertex',
    provider: 'vertex',
    requiresApiKey: true,
  },
};

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get a model definition by ID.
 */
export function getModelDefinition(modelId: string): ModelDefinition | undefined {
  return MODEL_REGISTRY[modelId];
}

/**
 * Get model options for a select dropdown, optionally filtered by provider.
 */
export function getModelOptions(provider?: Provider): Array<{ label: string; value: string }> {
  const models = provider ? getModelsForProvider(provider) : Object.values(MODEL_REGISTRY);
  return models.map((m) => ({ label: m.displayName, value: m.id }));
}

/**
 * Get all models for a given provider.
 */
export function getModelsForProvider(provider: Provider): Array<ModelDefinition> {
  return Object.values(MODEL_REGISTRY).filter((m) => m.provider === provider);
}

/**
 * Get the provider for a given model ID.
 */
export function getProviderForModel(modelId: string): Provider | undefined {
  return MODEL_REGISTRY[modelId]?.provider;
}

/**
 * Get the provider ID for a given model ID.
 */
export function getProviderIdForModel(modelId: string): ProviderId | undefined {
  return MODEL_REGISTRY[modelId]?.providerId;
}

/**
 * Check if a model supports reasoning levels.
 */
export function modelSupportsReasoning(modelId: string): boolean {
  return MODEL_REGISTRY[modelId]?.supportsReasoning ?? false;
}
