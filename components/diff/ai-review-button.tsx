'use client';

import { Bot, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface AiReviewButtonProps {
  className?: string;
  isLoading?: boolean;
  onClick: () => void;
}

export const AiReviewButton = ({ className, isLoading = false, onClick }: AiReviewButtonProps) => {
  return (
    <button
      aria-label={'Start AI code review'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium transition-colors',
        isLoading
          ? 'cursor-not-allowed opacity-50'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        className
      )}
      disabled={isLoading}
      onClick={onClick}
      type={'button'}
    >
      {isLoading ? (
        <Loader2 aria-hidden={'true'} className={'size-3.5 animate-spin'} />
      ) : (
        <Bot aria-hidden={'true'} className={'size-3.5'} />
      )}
      AI Review
    </button>
  );
};
