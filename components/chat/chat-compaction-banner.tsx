'use client';

import { AlertTriangleIcon, XIcon } from 'lucide-react';
import { memo } from 'react';

import { Button } from '@/components/ui/button';

interface ChatCompactionBannerProps {
  onCompact: () => void;
  onDismiss: () => void;
  tokenEstimate: number;
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

export const ChatCompactionBanner = memo(({ onCompact, onDismiss, tokenEstimate }: ChatCompactionBannerProps) => {
  return (
    <div className={'flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2'}>
      <AlertTriangleIcon className={'size-4 shrink-0 text-amber-500'} />
      <p className={'flex-1 text-xs text-amber-700 dark:text-amber-400'}>
        {`Context is getting large (~${formatTokenCount(tokenEstimate)} tokens).`}
      </p>
      <Button onClick={onCompact} size={'sm'} type={'button'} variant={'outline'}>
        {'Compact Now'}
      </Button>
      <Button onClick={onDismiss} size={'icon-sm'} type={'button'} variant={'ghost'}>
        <XIcon className={'size-3.5'} />
      </Button>
    </div>
  );
});

ChatCompactionBanner.displayName = 'ChatCompactionBanner';
