'use client';

import { FileIcon, SearchIcon } from 'lucide-react';
import { type KeyboardEvent, memo, useCallback, useEffect, useRef, useState } from 'react';

import { DialogBackdrop, DialogPopup, DialogPortal, DialogRoot } from '@/components/ui/dialog';
import { useFileSearch } from '@/hooks/queries/use-file-explorer';
import { useChatStore } from '@/lib/stores/chat-store';
import { cn } from '@/lib/utils';

interface FileSearchDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  repoPath: string | undefined;
}

const MAX_RESULTS = 12;

export const FileSearchDialog = memo(({ onOpenChange, open, repoPath }: FileSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { addMentionedFile } = useChatStore();

  const { data: results = [], isLoading } = useFileSearch(open ? repoPath : undefined, query);

  // Reset state when dialog opens
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }

  // Focus input after dialog animation
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelect = useCallback(
    (relativePath: string) => {
      addMentionedFile(relativePath);
      onOpenChange(false);
    },
    [addMentionedFile, onOpenChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, Math.min(results.length, MAX_RESULTS) - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const result = results[activeIndex];
        if (result) {
          handleSelect(result.relativePath);
        }
      }
    },
    [results, activeIndex, handleSelect]
  );

  const _hasNoResults = !!query && !isLoading && results.length === 0;

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPortal>
        <DialogBackdrop blur={'none'} />
        <DialogPopup
          className={
            'fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 translate-y-0 rounded-lg border border-border bg-background p-0 shadow-2xl'
          }
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className={'flex items-center gap-2 border-b border-border px-3'}>
            <SearchIcon className={'size-4 shrink-0 text-muted-foreground'} />
            <input
              autoFocus
              className={'flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground'}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder={'Search files...'}
              ref={inputRef}
              type={'text'}
              value={query}
            />
            <kbd className={'rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground'}>
              {'esc'}
            </kbd>
          </div>

          {/* Results list */}
          <div className={'max-h-[320px] overflow-y-auto'} ref={listRef}>
            {!query && (
              <div className={'px-3 py-6 text-center text-xs text-muted-foreground'}>
                {'Type to search for files in this project'}
              </div>
            )}
            {query && isLoading && <div className={'px-3 py-4 text-xs text-muted-foreground'}>{'Searching...'}</div>}
            {_hasNoResults && <div className={'px-3 py-4 text-xs text-muted-foreground'}>{'No files found'}</div>}
            {results.slice(0, MAX_RESULTS).map((result, i) => {
              const parts = result.relativePath.split('/');
              const fileName = parts.pop() ?? '';
              const dirPath = parts.join('/');
              return (
                <button
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted',
                    i === activeIndex && 'bg-muted'
                  )}
                  key={result.relativePath}
                  onClick={() => handleSelect(result.relativePath)}
                  onMouseEnter={() => setActiveIndex(i)}
                  type={'button'}
                >
                  <FileIcon className={'size-4 shrink-0 text-muted-foreground'} />
                  <span className={'truncate font-medium'}>{fileName}</span>
                  {dirPath && <span className={'truncate text-xs text-muted-foreground'}>{dirPath}</span>}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          {results.length > 0 && (
            <div
              className={'flex items-center gap-3 border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground'}
            >
              <span className={'flex items-center gap-1'}>
                <kbd className={'rounded-sm border border-border px-1 py-0.5'}>{'↑↓'}</kbd>
                {'navigate'}
              </span>
              <span className={'flex items-center gap-1'}>
                <kbd className={'rounded-sm border border-border px-1 py-0.5'}>{'↵'}</kbd>
                {'select'}
              </span>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
});

FileSearchDialog.displayName = 'FileSearchDialog';
