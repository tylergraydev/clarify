'use client';

import { Bot } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AiReviewDialogProps {
  children: ReactNode;
  onStartReview: (prompt: string) => void;
}

const DEFAULT_PROMPT = `Review this code diff for:
- Bugs and logic errors
- Security vulnerabilities
- Performance issues
- Code style and best practices
- Missing error handling`;

export const AiReviewDialog = ({ children, onStartReview }: AiReviewDialogProps) => {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [isOpen, setIsOpen] = useState(false);

  const handleStartReview = () => {
    onStartReview(prompt);
    setIsOpen(false);
  };

  return (
    <DialogRoot onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={'w-[480px]'}>
          <div className={'flex items-center gap-2'}>
            <Bot aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
            <DialogTitle>AI Code Review</DialogTitle>
          </div>
          <DialogDescription>
            Customize the review prompt to focus on specific areas.
          </DialogDescription>
          <textarea
            className={cn(
              'mt-3 min-h-[120px] w-full rounded-md border border-border bg-background p-3 text-sm',
              'placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none'
            )}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={'Enter review instructions...'}
            value={prompt}
          />
          <div className={'mt-4 flex items-center justify-end gap-2'}>
            <DialogClose>
              <button
                className={'rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground'}
                type={'button'}
              >
                Cancel
              </button>
            </DialogClose>
            <button
              className={
                'rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90'
              }
              onClick={handleStartReview}
              type={'button'}
            >
              Start Review
            </button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
