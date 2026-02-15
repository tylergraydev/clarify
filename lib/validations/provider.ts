import { z } from 'zod';

import { providerIds, providers, reasoningLevels } from '../constants/providers';

/**
 * Provider settings schema for the settings form.
 */
export const providerSettingsSchema = z.object({
  defaultModel: z.string().min(1, 'Default model is required'),
  defaultProvider: z.enum(providers),
});

export type ProviderSettingsFormValues = z.infer<typeof providerSettingsSchema>;

/**
 * API key set request validation.
 */
export const setApiKeySchema = z.object({
  key: z.string().min(1, 'API key is required'),
  provider: z.enum(providerIds),
});

export type SetApiKeyInput = z.infer<typeof setApiKeySchema>;

/**
 * Provider validation request.
 */
export const validateProviderSchema = z.object({
  providerId: z.enum(providerIds),
});

/**
 * Model selection for chat/agent context.
 */
export const modelSelectionSchema = z.object({
  model: z.string().min(1),
  provider: z.enum(providers),
  reasoningLevel: z.enum(reasoningLevels).nullable().optional(),
});

export type ModelSelection = z.infer<typeof modelSelectionSchema>;
