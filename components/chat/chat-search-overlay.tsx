'use client';

import { ChevronDownIcon, ChevronUpIcon, SearchIcon, XIcon } from 'lucide-react';
import { type KeyboardEvent, memo, useCallback, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChatSearchOverlayProps {
  currentMatchIndex: number;
  matchCount: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export const ChatSearchOverlay = memo(
  ({
    currentMatchIndex,
    matchCount,
    onClose,
    onNext,
    onPrev,
    onSearchChange,
    searchQuery,
  }: ChatSearchOverlayProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'Enter') {
          if (e.shiftKey) {
            onPrev();
          } else {
            onNext();
          }
        }
      },
      [onClose, onNext, onPrev]
    );

    const isNavigationDisabled = matchCount === 0;

    return (
      <div
        className={cn(
          'absolute top-2 right-2 left-2 z-10 flex items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-md'
        )}
      >
        <SearchIcon className={'size-4 text-muted-foreground'} />

        <Input
          className={'flex-1'}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={'Search messages...'}
          ref={inputRef}
          size={'sm'}
          value={searchQuery}
        />

        {matchCount > 0 && (
          <span className={'text-xs whitespace-nowrap text-muted-foreground'}>
            {currentMatchIndex + 1} of {matchCount}
          </span>
        )}

        <Button
          aria-label={'Previous match'}
          disabled={isNavigationDisabled}
          onClick={onPrev}
          size={'icon-sm'}
          type={'button'}
          variant={'ghost'}
        >
          <ChevronUpIcon className={'size-4'} />
        </Button>

        <Button
          aria-label={'Next match'}
          disabled={isNavigationDisabled}
          onClick={onNext}
          size={'icon-sm'}
          type={'button'}
          variant={'ghost'}
        >
          <ChevronDownIcon className={'size-4'} />
        </Button>

        <Button
          aria-label={'Close search'}
          onClick={onClose}
          size={'icon-sm'}
          type={'button'}
          variant={'ghost'}
        >
          <XIcon className={'size-4'} />
        </Button>
      </div>
    );
  }
);

ChatSearchOverlay.displayName = 'ChatSearchOverlay';
