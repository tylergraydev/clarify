'use client';

import { ArchiveIcon, Loader2Icon } from 'lucide-react';
import { memo, useState } from 'react';

import { Button } from '@/components/ui/button';

interface ChatCompactionDialogProps {
  isCompacting: boolean;
  messageCount: number;
  onCancel: () => void;
  onCompact: (upToMessageId?: number) => void;
  tokenEstimate: number;
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

export const ChatCompactionDialog = memo(
  ({ isCompacting, messageCount, onCancel, onCompact, tokenEstimate }: ChatCompactionDialogProps) => {
    const [selectedPercentage, setSelectedPercentage] = useState(75);

    const messagesToCompact = Math.floor(messageCount * (selectedPercentage / 100));
    const estimatedSavings = Math.floor(tokenEstimate * (selectedPercentage / 100));

    const handleCompact = () => {
      onCompact();
    };

    return (
      <div className={'fixed inset-0 z-50 flex items-center justify-center bg-black/50'}>
        <div className={'w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg'}>
          {/* Header */}
          <div className={'mb-4 flex items-center gap-2'}>
            <ArchiveIcon className={'size-5 text-foreground'} />
            <h3 className={'text-sm font-medium'}>{'Compact Conversation'}</h3>
          </div>

          {/* Description */}
          <p className={'mb-4 text-sm text-muted-foreground'}>
            {'Compaction replaces older messages with an AI-generated summary, reducing context size while preserving key information.'}
          </p>

          {/* Stats */}
          <div className={'mb-4 grid grid-cols-2 gap-3'}>
            <div className={'rounded-md border border-border p-3'}>
              <p className={'text-xs text-muted-foreground'}>{'Current tokens'}</p>
              <p className={'text-sm font-medium'}>{formatTokenCount(tokenEstimate)}</p>
            </div>
            <div className={'rounded-md border border-border p-3'}>
              <p className={'text-xs text-muted-foreground'}>{'Est. savings'}</p>
              <p className={'text-sm font-medium'}>{`~${formatTokenCount(estimatedSavings)}`}</p>
            </div>
          </div>

          {/* Slider */}
          <div className={'mb-4'}>
            <div className={'mb-2 flex items-center justify-between text-xs text-muted-foreground'}>
              <span>{'Messages to compact'}</span>
              <span>{`${messagesToCompact} of ${messageCount}`}</span>
            </div>
            <input
              className={'w-full'}
              max={90}
              min={25}
              onChange={(e) => setSelectedPercentage(Number(e.target.value))}
              step={5}
              type={'range'}
              value={selectedPercentage}
            />
            <div className={'mt-1 flex justify-between text-[10px] text-muted-foreground'}>
              <span>{'25%'}</span>
              <span>{'90%'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className={'flex justify-end gap-2'}>
            <Button disabled={isCompacting} onClick={onCancel} size={'sm'} type={'button'} variant={'outline'}>
              {'Cancel'}
            </Button>
            <Button disabled={isCompacting} onClick={handleCompact} size={'sm'} type={'button'}>
              {isCompacting ? (
                <Loader2Icon className={'mr-1.5 size-3.5 animate-spin'} />
              ) : (
                <ArchiveIcon className={'mr-1.5 size-3.5'} />
              )}
              {isCompacting ? 'Compacting...' : 'Compact'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ChatCompactionDialog.displayName = 'ChatCompactionDialog';
