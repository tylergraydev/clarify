'use client';

import { CheckCircle, Filter, MessageSquare, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { DiffComment } from '@/types/diff';

import { cn } from '@/lib/utils';

import { CommentItem } from './comment-item';

type CommentFilter = 'all' | 'open' | 'resolved';

interface CommentSidebarProps {
  className?: string;
  comments: Array<DiffComment>;
  onDelete: (id: number) => void;
  onReply: (id: number) => void;
  onToggleResolved: (id: number) => void;
}

export const CommentSidebar = ({
  className,
  comments,
  onDelete,
  onReply,
  onToggleResolved,
}: CommentSidebarProps) => {
  const [filter, setFilter] = useState<CommentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const topLevelComments = useMemo(
    () => comments.filter((c) => c.parentId === null),
    [comments]
  );

  const filteredComments = useMemo(() => {
    let filtered = topLevelComments;

    if (filter === 'open') {
      filtered = filtered.filter((c) => !c.isResolved);
    } else if (filter === 'resolved') {
      filtered = filtered.filter((c) => c.isResolved);
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => c.content.toLowerCase().includes(lower));
    }

    return filtered;
  }, [topLevelComments, filter, searchQuery]);

  const openCount = topLevelComments.filter((c) => !c.isResolved).length;
  const resolvedCount = topLevelComments.filter((c) => c.isResolved).length;

  return (
    <div className={cn('flex h-full flex-col border-l border-border', className)}>
      {/* Header */}
      <div className={'border-b border-border p-3'}>
        <div className={'flex items-center gap-2'}>
          <MessageSquare aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
          <span className={'text-sm font-medium'}>Comments</span>
          <span className={'text-xs text-muted-foreground'}>
            ({topLevelComments.length})
          </span>
        </div>
      </div>

      {/* Search */}
      <div className={'border-b border-border p-2'}>
        <div className={'relative'}>
          <Search
            aria-hidden={'true'}
            className={'pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground'}
          />
          <input
            aria-label={'Search comments'}
            className={
              'h-7 w-full rounded-md border border-border bg-background pr-2 pl-7 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none'
            }
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={'Search comments...'}
            type={'text'}
            value={searchQuery}
          />
        </div>
      </div>

      {/* Filters */}
      <div className={'flex items-center gap-1 border-b border-border px-2 py-1.5'}>
        <Filter aria-hidden={'true'} className={'size-3 text-muted-foreground'} />
        <button
          className={cn(
            'rounded-sm px-1.5 py-0.5 text-[10px] font-medium transition-colors',
            filter === 'all'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setFilter('all')}
          type={'button'}
        >
          All ({topLevelComments.length})
        </button>
        <button
          className={cn(
            'rounded-sm px-1.5 py-0.5 text-[10px] font-medium transition-colors',
            filter === 'open'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setFilter('open')}
          type={'button'}
        >
          Open ({openCount})
        </button>
        <button
          className={cn(
            'flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[10px] font-medium transition-colors',
            filter === 'resolved'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setFilter('resolved')}
          type={'button'}
        >
          <CheckCircle aria-hidden={'true'} className={'size-2.5'} />
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Comment list */}
      <div className={'flex-1 overflow-y-auto p-2'}>
        {filteredComments.length === 0 ? (
          <div className={'flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground'}>
            <MessageSquare aria-hidden={'true'} className={'size-6 opacity-40'} />
            <span className={'text-xs'}>
              {searchQuery ? 'No matching comments' : 'No comments yet'}
            </span>
          </div>
        ) : (
          <div className={'flex flex-col gap-2'}>
            {filteredComments.map((comment) => (
              <div key={comment.id}>
                <div className={'mb-1 text-[10px] text-muted-foreground/70'}>
                  {comment.filePath}:{comment.lineNumber}
                </div>
                <CommentItem
                  comment={comment}
                  onDelete={onDelete}
                  onReply={onReply}
                  onToggleResolved={onToggleResolved}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
