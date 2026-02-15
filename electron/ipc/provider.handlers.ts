/**
 * Provider IPC Handlers
 *
 * Handles all provider management operations including:
 * - Listing configured providers
 * - API key CRUD (masked keys returned to renderer)
 * - Provider validation (connectivity check)
 * - Default provider/model management
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { Provider } from '../../lib/constants/providers';

import {
  deleteApiKey,
  getApiKey,
  getMaskedApiKey,
  hasApiKey,
  listConfiguredProviders,
  setApiKey,
} from '../services/providers/api-key.service';
import { IpcChannels } from './channels';

export interface ProviderStatus {
  configured: boolean;
  maskedKey?: string;
  provider: Provider;
}

/**
 * Register all provider-related IPC handlers.
 */
export function registerProviderHandlers(): void {
  // List all providers with their configuration status
  ipcMain.handle(IpcChannels.provider.list, (_event: IpcMainInvokeEvent): Array<ProviderStatus> => {
    try {
      const allProviders: Array<Provider> = ['claude', 'openai', 'bedrock', 'vertex', 'custom'];
      return allProviders.map((provider) => ({
        configured: provider === 'claude' || hasApiKey(provider),
        maskedKey: getMaskedApiKey(provider),
        provider,
      }));
    } catch (error) {
      console.error('[IPC Error] provider:list:', error);
      throw error;
    }
  });

  // Get masked API key for a specific provider
  ipcMain.handle(IpcChannels.provider.getKey, (_event: IpcMainInvokeEvent, provider: Provider): string | undefined => {
    try {
      return getMaskedApiKey(provider);
    } catch (error) {
      console.error('[IPC Error] provider:getKey:', error);
      throw error;
    }
  });

  // Set API key for a provider
  ipcMain.handle(
    IpcChannels.provider.setKey,
    (_event: IpcMainInvokeEvent, provider: Provider, apiKey: string): boolean => {
      try {
        setApiKey(provider, apiKey);
        return true;
      } catch (error) {
        console.error('[IPC Error] provider:setKey:', error);
        throw error;
      }
    }
  );

  // Delete API key for a provider
  ipcMain.handle(IpcChannels.provider.deleteKey, (_event: IpcMainInvokeEvent, provider: Provider): boolean => {
    try {
      deleteApiKey(provider);
      return true;
    } catch (error) {
      console.error('[IPC Error] provider:deleteKey:', error);
      throw error;
    }
  });

  // Validate a provider's API key by making a lightweight API call
  ipcMain.handle(
    IpcChannels.provider.validate,
    async (_event: IpcMainInvokeEvent, provider: Provider): Promise<{ error?: string; valid: boolean }> => {
      try {
        const apiKey = getApiKey(provider);
        if (!apiKey) {
          return { error: 'No API key configured', valid: false };
        }

        if (provider === 'openai') {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10_000);
          let response: Response;
          try {
            response = await fetch('https://api.openai.com/v1/models', {
              headers: { Authorization: `Bearer ${apiKey}` },
              method: 'GET',
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeoutId);
          }
          if (response.ok) {
            return { valid: true };
          }
          const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
          return { error: body.error?.message ?? `HTTP ${response.status}`, valid: false };
        }

        // For other providers, just check that the key exists
        return { valid: true };
      } catch (error) {
        console.error('[IPC Error] provider:validate:', error);
        return { error: error instanceof Error ? error.message : 'Validation failed', valid: false };
      }
    }
  );

  // List only configured providers (convenience)
  ipcMain.handle(IpcChannels.provider.listConfigured, (_event: IpcMainInvokeEvent): Array<Provider> => {
    try {
      // Claude is always configured (uses Agent SDK with its own auth)
      return ['claude' as Provider, ...listConfiguredProviders()];
    } catch (error) {
      console.error('[IPC Error] provider:listConfigured:', error);
      throw error;
    }
  });
}
