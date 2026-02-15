'use client';

import { FileIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useFileSearch } from '@/hooks/queries/use-file-explorer';
import { cn } from '@/lib/utils';

interface ChatMentionPopupProps {
  onClose: () => void;
  onSelect: (relativePath: string) => void;
  query: string;
  repoPath: string | undefined;
}

const MAX_VISIBLE = 8;

export const ChatMentionPopup = memo(({ onClose, onSelect, query, repoPath }: ChatMentionPopupProps) => {
  const { data: results = [], isLoading } = useFileSearch(repoPath, query);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset active index when query changes (drives new results)
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIndex(0);
  }

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const result = results[activeIndex];
        if (result) {
          onSelect(result.relativePath);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [results, activeIndex, onSelect, onClose]
  );

  // Listen for keyboard events on the document (textarea keeps focus)
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  if (!query || (results.length === 0 && !isLoading)) return null;

  return (
    <div
      className={
        'absolute bottom-full left-0 z-50 mb-1 w-full max-w-md rounded-md border border-border bg-background shadow-lg'
      }
    >
      <div className={'px-2 py-1.5 text-xs text-muted-foreground'}>{'Mention a file'}</div>
      <div className={'max-h-[240px] overflow-y-auto'} ref={listRef}>
        {isLoading ? (
          <div className={'px-3 py-2 text-xs text-muted-foreground'}>{'Searching...'}</div>
        ) : (
          results.slice(0, MAX_VISIBLE).map((result, i) => (
            <button
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted',
                i === activeIndex && 'bg-muted'
              )}
              key={result.relativePath}
              onClick={() => onSelect(result.relativePath)}
              onMouseEnter={() => setActiveIndex(i)}
              type={'button'}
            >
              <FileIcon className={'size-3.5 shrink-0 text-muted-foreground'} />
              <span className={'truncate'}>{result.relativePath}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
});

ChatMentionPopup.displayName = 'ChatMentionPopup';
