'use client';

import { type KeyboardEvent, useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

interface CommentFormProps {
  className?: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (content: string) => void;
  placeholder?: string;
}

export const CommentForm = ({
  className,
  isSubmitting = false,
  onCancel,
  onSubmit,
  placeholder = 'Write a comment...',
}: CommentFormProps) => {
  const [content, setContent] = useState('');

  const isContentEmpty = content.trim().length === 0;

  const handleSubmit = useCallback(() => {
    if (isContentEmpty || isSubmitting) return;
    onSubmit(content.trim());
    setContent('');
  }, [content, isContentEmpty, isSubmitting, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  return (
    <div className={cn('flex flex-col gap-2 rounded-md border border-border bg-background p-2', className)}>
      <textarea
        autoFocus
        className={
          'min-h-[60px] w-full resize-y rounded-sm border-none bg-transparent p-1 text-xs placeholder:text-muted-foreground focus:outline-none'
        }
        disabled={isSubmitting}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={content}
      />
      <div className={'flex items-center justify-between'}>
        <span className={'text-[10px] text-muted-foreground'}>
          Ctrl+Enter to submit, Esc to cancel
        </span>
        <div className={'flex items-center gap-1.5'}>
          <button
            className={'rounded-sm px-2 py-1 text-xs text-muted-foreground hover:text-foreground'}
            disabled={isSubmitting}
            onClick={onCancel}
            type={'button'}
          >
            Cancel
          </button>
          <button
            className={cn(
              'rounded-sm bg-accent px-2 py-1 text-xs font-medium text-accent-foreground',
              (isContentEmpty || isSubmitting) && 'cursor-not-allowed opacity-50'
            )}
            disabled={isContentEmpty || isSubmitting}
            onClick={handleSubmit}
            type={'button'}
          >
            {isSubmitting ? 'Submitting...' : 'Comment'}
          </button>
        </div>
      </div>
    </div>
  );
};
