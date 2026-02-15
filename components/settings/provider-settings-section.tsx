'use client';

import type { ReactElement } from 'react';

import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Trash2, XCircle } from 'lucide-react';
import { Fragment, useCallback, useState } from 'react';

import type { Provider } from '@/lib/constants/providers';

import {
  useDeleteProviderKey,
  useProviders,
  useSetProviderKey,
  useValidateProvider,
} from '@/hooks/queries/use-providers';
import { useToast } from '@/hooks/use-toast';
import { PROVIDER_INFO } from '@/lib/constants/providers';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { SettingsSection } from './settings-section';

interface ProviderRowProps {
  configured: boolean;
  maskedKey?: string;
  provider: Provider;
}

const ProviderRow = ({ configured, maskedKey, provider }: ProviderRowProps): ReactElement => {
  const toast = useToast();
  const setKeyMutation = useSetProviderKey();
  const deleteKeyMutation = useDeleteProviderKey();
  const validateMutation = useValidateProvider();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const providerInfo = PROVIDER_INFO[provider === 'claude' ? 'anthropic-sdk' : provider];
  const displayName = providerInfo?.displayName ?? provider;

  const handleSaveKey = useCallback(async () => {
    if (!apiKey.trim()) return;

    try {
      await setKeyMutation.mutateAsync({ apiKey: apiKey.trim(), provider });
      setApiKey('');
      setIsEditing(false);
      toast.success({ description: `API key saved for ${displayName}.`, title: 'Key Saved' });
    } catch {
      toast.error({ description: `Failed to save API key for ${displayName}.`, title: 'Error' });
    }
  }, [apiKey, displayName, provider, setKeyMutation, toast]);

  const handleDeleteKey = useCallback(async () => {
    try {
      await deleteKeyMutation.mutateAsync(provider);
      toast.success({ description: `API key removed for ${displayName}.`, title: 'Key Removed' });
    } catch {
      toast.error({ description: `Failed to remove API key for ${displayName}.`, title: 'Error' });
    }
  }, [deleteKeyMutation, displayName, provider, toast]);

  const handleValidate = useCallback(async () => {
    try {
      const result = await validateMutation.mutateAsync(provider);
      if (result.valid) {
        toast.success({ description: `${displayName} connection is working.`, title: 'Connection Valid' });
      } else {
        toast.error({ description: result.error ?? 'Connection test failed.', title: 'Connection Failed' });
      }
    } catch {
      toast.error({ description: `Failed to validate ${displayName} connection.`, title: 'Error' });
    }
  }, [displayName, provider, toast, validateMutation]);

  const _showMaskedKey = configured && !isEditing;

  return (
    <div className={'flex flex-col gap-3'}>
      <div className={'flex items-center justify-between'}>
        <div className={'flex items-center gap-2'}>
          <span className={'text-sm font-medium'}>{displayName}</span>
          {configured ? (
            <Badge size={'sm'} variant={'completed'}>
              Configured
            </Badge>
          ) : (
            <Badge size={'sm'} variant={'default'}>
              Not configured
            </Badge>
          )}
        </div>

        <div className={'flex items-center gap-2'}>
          {configured && (
            <Fragment>
              <Button disabled={validateMutation.isPending} onClick={handleValidate} size={'sm'} variant={'outline'}>
                {validateMutation.isPending ? (
                  <Loader2 className={'size-3.5 animate-spin'} />
                ) : (
                  <CheckCircle2 className={'size-3.5'} />
                )}
                {validateMutation.isPending ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button disabled={deleteKeyMutation.isPending} onClick={handleDeleteKey} size={'sm'} variant={'ghost'}>
                <Trash2 className={'size-3.5'} />
              </Button>
            </Fragment>
          )}
        </div>
      </div>

      {_showMaskedKey ? (
        <div className={'flex items-center gap-2'}>
          <div className={'flex-1 rounded-md bg-muted px-3 py-2'}>
            <span className={'font-mono text-xs text-muted-foreground'}>{maskedKey ?? '••••••••'}</span>
          </div>
          <Button onClick={() => setIsEditing(true)} size={'sm'} variant={'outline'}>
            <KeyRound className={'size-3.5'} />
            Update
          </Button>
        </div>
      ) : (
        <div className={'flex items-center gap-2'}>
          <div className={'relative flex-1'}>
            <Input
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter ${displayName} API key...`}
              size={'sm'}
              type={showKey ? 'text' : 'password'}
              value={apiKey}
            />
            <button
              className={'absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground'}
              onClick={() => setShowKey(!showKey)}
              type={'button'}
            >
              {showKey ? <EyeOff className={'size-3.5'} /> : <Eye className={'size-3.5'} />}
            </button>
          </div>
          <Button
            disabled={!apiKey.trim() || setKeyMutation.isPending}
            onClick={handleSaveKey}
            size={'sm'}
            variant={'default'}
          >
            {setKeyMutation.isPending ? <Loader2 className={'size-3.5 animate-spin'} /> : null}
            Save
          </Button>
          {isEditing && (
            <Button
              onClick={() => {
                setIsEditing(false);
                setApiKey('');
              }}
              size={'sm'}
              variant={'ghost'}
            >
              <XCircle className={'size-3.5'} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const ProviderSettingsSection = (): ReactElement => {
  const { data: providerList, isLoading } = useProviders();

  // Only show providers that require API keys
  const configurableProviders = (providerList ?? []).filter((p) => {
    const info = PROVIDER_INFO[p.provider === 'claude' ? 'anthropic-sdk' : p.provider];
    return info?.requiresApiKey;
  });

  return (
    <SettingsSection title={'AI Providers'}>
      <p className={'text-xs text-muted-foreground'}>
        Configure API keys for AI providers. Claude uses the built-in Agent SDK and does not require a separate API key.
      </p>

      {isLoading ? (
        <div className={'flex items-center justify-center py-4'}>
          <Loader2 className={'size-5 animate-spin text-muted-foreground'} />
        </div>
      ) : configurableProviders.length === 0 ? (
        <p className={'text-sm text-muted-foreground'}>No configurable providers available.</p>
      ) : (
        <div className={'flex flex-col gap-4'}>
          {configurableProviders.map((p, index) => (
            <div key={p.provider}>
              <ProviderRow configured={p.configured} maskedKey={p.maskedKey} provider={p.provider} />
              {index < configurableProviders.length - 1 && <Separator className={'mt-4'} />}
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  );
};
