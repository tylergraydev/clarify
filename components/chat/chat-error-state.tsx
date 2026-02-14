'use client';

import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { memo } from 'react';

import { Button } from '@/components/ui/button';

interface ChatErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ChatErrorState = memo(({ error, onRetry }: ChatErrorStateProps) => {
  return (
    <div className={'flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3'}>
      <AlertCircleIcon className={'mt-0.5 size-4 shrink-0 text-destructive'} />
      <div className={'flex-1'}>
        <p className={'text-sm font-medium text-destructive'}>{'Error generating response'}</p>
        <p className={'mt-1 text-xs text-muted-foreground'}>{error}</p>
      </div>
      <Button onClick={onRetry} size={'sm'} type={'button'} variant={'outline'}>
        <RefreshCwIcon className={'mr-1.5 size-3.5'} />
        {'Retry'}
      </Button>
    </div>
  );
});

ChatErrorState.displayName = 'ChatErrorState';
