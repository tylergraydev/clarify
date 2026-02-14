'use client';

import { CheckCircle, Circle, MessageSquare, Trash2 } from 'lucide-react';
import { useCallback } from 'react';

import type { DiffComment } from '@/types/diff';

import { cn } from '@/lib/utils';

interface CommentItemProps {
  className?: string;
  comment: DiffComment;
  onDelete: (id: number) => void;
  onReply: (id: number) => void;
  onToggleResolved: (id: number) => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const CommentItem = ({
  className,
  comment,
  onDelete,
  onReply,
  onToggleResolved,
}: CommentItemProps) => {
  const handleDelete = useCallback(() => onDelete(comment.id), [comment.id, onDelete]);
  const handleReply = useCallback(() => onReply(comment.id), [comment.id, onReply]);
  const handleToggleResolved = useCallback(() => onToggleResolved(comment.id), [comment.id, onToggleResolved]);

  const isTopLevel = comment.parentId === null;

  return (
    <div className={cn('flex flex-col gap-1.5 rounded-md border border-border/50 p-2', className)}>
      {/* Header */}
      <div className={'flex items-center gap-2'}>
        <span className={'text-[10px] text-muted-foreground'}>
          {formatRelativeTime(comment.createdAt)}
        </span>
        {comment.isResolved && (
          <span className={'text-[10px] font-medium text-green-600 dark:text-green-400'}>
            Resolved
          </span>
        )}
        <div className={'ml-auto flex items-center gap-0.5'}>
          {isTopLevel && (
            <button
              aria-label={comment.isResolved ? 'Unresolve comment' : 'Resolve comment'}
              className={'rounded-sm p-0.5 text-muted-foreground hover:text-foreground'}
              onClick={handleToggleResolved}
              title={comment.isResolved ? 'Unresolve' : 'Resolve'}
              type={'button'}
            >
              {comment.isResolved ? (
                <CheckCircle aria-hidden={'true'} className={'size-3.5 text-green-500'} />
              ) : (
                <Circle aria-hidden={'true'} className={'size-3.5'} />
              )}
            </button>
          )}
          <button
            aria-label={'Reply'}
            className={'rounded-sm p-0.5 text-muted-foreground hover:text-foreground'}
            onClick={handleReply}
            title={'Reply'}
            type={'button'}
          >
            <MessageSquare aria-hidden={'true'} className={'size-3.5'} />
          </button>
          <button
            aria-label={'Delete comment'}
            className={'rounded-sm p-0.5 text-muted-foreground hover:text-red-500'}
            onClick={handleDelete}
            title={'Delete'}
            type={'button'}
          >
            <Trash2 aria-hidden={'true'} className={'size-3.5'} />
          </button>
        </div>
      </div>
      {/* Content */}
      <div className={'text-xs whitespace-pre-wrap'}>{comment.content}</div>
    </div>
  );
};
