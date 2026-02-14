'use client';

import { MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CommentBadgeProps {
  className?: string;
  count: number;
  onClick: () => void;
}

export const CommentBadge = ({ className, count, onClick }: CommentBadgeProps) => {
  if (count === 0) return null;

  return (
    <button
      aria-label={`${count} comment${count !== 1 ? 's' : ''}`}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
        className
      )}
      onClick={onClick}
      type={'button'}
    >
      <MessageSquare aria-hidden={'true'} className={'size-2.5'} />
      {count}
    </button>
  );
};
