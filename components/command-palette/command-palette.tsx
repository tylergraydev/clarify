'use client';

import { SearchIcon } from 'lucide-react';
import { type KeyboardEvent, memo, useCallback, useEffect, useRef, useState } from 'react';

import { DialogBackdrop, DialogPopup, DialogPortal, DialogRoot } from '@/components/ui/dialog';
import { useCommandPaletteCommands } from '@/lib/command-palette/use-command-palette-commands';
import { useCommandPaletteStore } from '@/lib/stores/command-palette-store';
import { cn } from '@/lib/utils';

const MAX_RESULTS = 20;

export const CommandPalette = memo(() => {
  const { close, isOpen } = useCommandPaletteStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  const { executeCommand, filtered, grouped } = useCommandPaletteCommands(query);
  const flatResults = filtered.slice(0, MAX_RESULTS);

  // Reset state when dialog opens (React 19 "adjust state during render" pattern)
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setQuery('');
    setActiveIndex(0);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.querySelector('[data-active="true"]') as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setActiveIndex(0);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = flatResults[activeIndex];
        if (command) executeCommand(command);
      }
    },
    [flatResults, activeIndex, executeCommand]
  );

  const _hasNoResults = flatResults.length === 0 && query;
  const _hasResults = flatResults.length > 0;

  return (
    <DialogRoot
      onOpenChange={(open) => {
        if (!open) close();
      }}
      open={isOpen}
    >
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
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={'Type a command or search...'}
              ref={inputRef}
              type={'text'}
              value={query}
            />
            <kbd className={'rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground'}>
              {'esc'}
            </kbd>
          </div>

          {/* Results list - grouped by category */}
          <div className={'max-h-[360px] overflow-y-auto'} ref={listRef}>
            {_hasNoResults && (
              <div className={'px-3 py-6 text-center text-xs text-muted-foreground'}>{'No commands found'}</div>
            )}
            {Array.from(grouped.entries()).map(([category, commands]) => (
              <div key={category}>
                <div
                  className={'px-3 pt-2 pb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase'}
                >
                  {category}
                </div>
                {commands.map((command) => {
                  const globalIndex = flatResults.indexOf(command);
                  const Icon = command.icon;
                  return (
                    <button
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted',
                        globalIndex === activeIndex && 'bg-muted'
                      )}
                      data-active={globalIndex === activeIndex}
                      key={command.id}
                      onClick={() => executeCommand(command)}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      type={'button'}
                    >
                      <Icon className={'size-4 shrink-0 text-muted-foreground'} />
                      <span className={'flex-1 truncate'}>{command.label}</span>
                      {command.shortcut && (
                        <kbd
                          className={'rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground'}
                        >
                          {command.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer hint */}
          {_hasResults && (
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
              <span className={'flex items-center gap-1'}>
                <kbd className={'rounded-sm border border-border px-1 py-0.5'}>{'esc'}</kbd>
                {'close'}
              </span>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
});

CommandPalette.displayName = 'CommandPalette';
