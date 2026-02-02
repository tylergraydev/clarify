'use client';

import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type StreamingAnalysisProps = ClassName & {
  isLoading: boolean;
  /** Placeholder text shown when loading but no text received yet */
  placeholder?: string;
  text: string;
};

/**
 * Displays streaming AI analysis text with a loading indicator.
 * Shows a spinner during loading and an animated cursor while text is streaming.
 */
export const StreamingAnalysis = ({
  className,
  isLoading,
  placeholder = 'Processing...',
  text,
}: StreamingAnalysisProps) => {
  if (!text && !isLoading) {
    return null;
  }

  return (
    <div className={cn('rounded-md border border-border bg-muted/30 p-4', className)}>
      <div className={'flex items-start gap-3'}>
        {isLoading && <Loader2 className={'mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground'} />}
        <div className={'flex-1'}>
          {isLoading && !text && <p className={'text-sm text-muted-foreground'}>{placeholder}</p>}
          {text && (
            <div className={'max-w-none'}>
              <p className={'text-sm/relaxed whitespace-pre-wrap text-foreground'}>
                {text}
                {isLoading && <span className={'ml-0.5 animate-pulse'}>|</span>}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
