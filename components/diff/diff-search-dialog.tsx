'use client';

import { ArrowDown, ArrowUp, Search, X } from 'lucide-react';
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface DiffSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function clearHighlights() {
  document.querySelectorAll('.diff-search-match').forEach((el) => {
    el.classList.remove('diff-search-match', 'diff-search-current');
  });
}

function findMatches(query: string): Array<Element> {
  if (!query || query.length < 2) return [];

  const diffContent = document.querySelectorAll('td.whitespace-pre-wrap');
  const found: Array<Element> = [];

  diffContent.forEach((td) => {
    const text = td.textContent ?? '';
    if (text.toLowerCase().includes(query.toLowerCase())) {
      found.push(td);
    }
  });

  return found;
}

export const DiffSearchDialog = ({ isOpen, onClose }: DiffSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [searchVersion, setSearchVersion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const matchesRef = useRef<Array<Element>>([]);

  // Compute matches based on query changes
  const matchCount = useMemo(() => {
    clearHighlights();
    const found = findMatches(query);
    matchesRef.current = found;

    for (const el of found) {
      el.classList.add('diff-search-match');
    }

    if (found[0]) {
      found[0].classList.add('diff-search-current');
      found[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return found.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchVersion]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchVersion((v) => v + 1);
    } else {
      setQuery('');
      setCurrentMatchIndex(0);
      clearHighlights();
      matchesRef.current = [];
    }
  }, [isOpen]);

  const handleNavigate = useCallback(
    (direction: 'next' | 'prev') => {
      const matches = matchesRef.current;
      if (matches.length === 0) return;

      setCurrentMatchIndex((prev) => {
        matches[prev]?.classList.remove('diff-search-current');

        let nextIndex: number;
        if (direction === 'next') {
          nextIndex = (prev + 1) % matches.length;
        } else {
          nextIndex = (prev - 1 + matches.length) % matches.length;
        }

        matches[nextIndex]?.classList.add('diff-search-current');
        matches[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return nextIndex;
      });
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNavigate(e.shiftKey ? 'prev' : 'next');
      }
    },
    [handleNavigate, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed top-16 right-4 z-50 flex items-center gap-2 rounded-md border border-border bg-background p-2 shadow-lg'
      )}
    >
      <Search aria-hidden={'true'} className={'size-3.5 text-muted-foreground'} />
      <input
        aria-label={'Search in diff'}
        className={
          'h-6 w-48 border-none bg-transparent text-xs placeholder:text-muted-foreground focus:outline-none'
        }
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={'Search in diff...'}
        ref={inputRef}
        type={'text'}
        value={query}
      />
      {matchCount > 0 && (
        <span className={'text-[10px] text-muted-foreground'}>
          {currentMatchIndex + 1}/{matchCount}
        </span>
      )}
      <button
        aria-label={'Previous match'}
        className={'rounded-sm p-0.5 text-muted-foreground hover:text-foreground'}
        disabled={matchCount === 0}
        onClick={() => handleNavigate('prev')}
        type={'button'}
      >
        <ArrowUp aria-hidden={'true'} className={'size-3.5'} />
      </button>
      <button
        aria-label={'Next match'}
        className={'rounded-sm p-0.5 text-muted-foreground hover:text-foreground'}
        disabled={matchCount === 0}
        onClick={() => handleNavigate('next')}
        type={'button'}
      >
        <ArrowDown aria-hidden={'true'} className={'size-3.5'} />
      </button>
      <button
        aria-label={'Close search'}
        className={'rounded-sm p-0.5 text-muted-foreground hover:text-foreground'}
        onClick={onClose}
        type={'button'}
      >
        <X aria-hidden={'true'} className={'size-3.5'} />
      </button>
      {/* Inject styles for search highlights */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .diff-search-match { background-color: rgba(234, 179, 8, 0.2) !important; }
            .diff-search-current { background-color: rgba(234, 179, 8, 0.5) !important; outline: 2px solid rgb(234, 179, 8); }
          `,
        }}
      />
    </div>
  );
};
