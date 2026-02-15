/**
 * API Key Management Service
 *
 * Securely stores and retrieves API keys for AI providers.
 * Uses a separate electron-store file ('provider-keys') to isolate
 * sensitive data from the main application store.
 *
 * Keys are never returned in full to the renderer process —
 * only masked versions (last 4 characters) are exposed via IPC.
 */
import Store from 'electron-store';

import type { Provider } from '../../../lib/constants/providers';

interface CustomEndpointConfig {
  apiKey: string;
  baseUrl: string;
}

interface ProviderKeysStore {
  delete(key: string): void;
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

const store = new Store({ name: 'provider-keys' }) as unknown as ProviderKeysStore;

/**
 * Delete the API key for a provider.
 */
export function deleteApiKey(provider: Provider): void {
  store.delete(keyFor(provider));
}

/**
 * Get the raw API key for a provider (main process only — never expose to renderer).
 */
export function getApiKey(provider: Provider): string | undefined {
  return store.get(keyFor(provider));
}

/**
 * Get the custom endpoint configuration.
 */
export function getCustomEndpoint(): CustomEndpointConfig | undefined {
  const raw = store.get(customEndpointKey());
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as CustomEndpointConfig;
  } catch {
    return undefined;
  }
}

/**
 * Get a masked version of the API key for display in the renderer.
 */
export function getMaskedApiKey(provider: Provider): string | undefined {
  const key = store.get(keyFor(provider));
  if (!key) return undefined;
  return maskKey(key);
}

/**
 * Check whether an API key is configured for a provider.
 */
export function hasApiKey(provider: Provider): boolean {
  const key = store.get(keyFor(provider));
  return Boolean(key && key.length > 0);
}

/**
 * List all providers that have a configured API key.
 */
export function listConfiguredProviders(): Array<Provider> {
  const allProviders: Array<Provider> = ['openai', 'bedrock', 'vertex', 'custom'];
  return allProviders.filter((p) => hasApiKey(p));
}

/**
 * Store an API key for a provider.
 */
export function setApiKey(provider: Provider, apiKey: string): void {
  store.set(keyFor(provider), apiKey);
}

/**
 * Set the custom endpoint configuration.
 */
export function setCustomEndpoint(baseUrl: string, apiKey: string): void {
  store.set(customEndpointKey(), JSON.stringify({ apiKey, baseUrl }));
  // Also store as the 'custom' provider key for consistency
  setApiKey('custom', apiKey);
}

function customEndpointKey(): string {
  return 'customEndpoint';
}

function keyFor(provider: Provider): string {
  return `apiKey.${provider}`;
}

/**
 * Mask an API key, keeping only the last 4 characters visible.
 */
function maskKey(key: string): string {
  if (key.length <= 4) return '****';
  return `${'*'.repeat(key.length - 4)}${key.slice(-4)}`;
}
