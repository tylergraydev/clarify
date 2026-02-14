'use client';

import { Search, X } from 'lucide-react';
import { useCallback } from 'react';

import type { DiffSortMode, DiffStatusFilter } from '@/lib/stores/diff-view-store';

import { cn } from '@/lib/utils';

interface FileTreeToolbarProps {
  className?: string;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: DiffSortMode) => void;
  onStatusFilterChange: (filter: DiffStatusFilter) => void;
  searchQuery: string;
  sortMode: DiffSortMode;
  statusFilter: DiffStatusFilter;
}

const STATUS_OPTIONS: Array<{ label: string; value: DiffStatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'M', value: 'modified' },
  { label: 'A', value: 'added' },
  { label: 'D', value: 'deleted' },
  { label: 'R', value: 'renamed' },
];

export const FileTreeToolbar = ({
  className,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
  searchQuery,
  sortMode,
  statusFilter,
}: FileTreeToolbarProps) => {
  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <div className={cn('flex flex-col gap-2 border-b border-border p-2', className)}>
      {/* Search */}
      <div className={'relative'}>
        <Search
          aria-hidden={'true'}
          className={'pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground'}
        />
        <input
          aria-label={'Search files'}
          className={
            'h-7 w-full rounded-md border border-border bg-background pr-7 pl-7 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none'
          }
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={'Filter files...'}
          type={'text'}
          value={searchQuery}
        />
        {searchQuery && (
          <button
            aria-label={'Clear search'}
            className={'absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground'}
            onClick={handleClearSearch}
            type={'button'}
          >
            <X aria-hidden={'true'} className={'size-3.5'} />
          </button>
        )}
      </div>
      {/* Filters */}
      <div className={'flex items-center gap-1'}>
        {/* Status filter */}
        {STATUS_OPTIONS.map((option) => (
          <button
            className={cn(
              'rounded-sm px-1.5 py-0.5 text-[10px] font-medium transition-colors',
              statusFilter === option.value
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            key={option.value}
            onClick={() => onStatusFilterChange(option.value)}
            type={'button'}
          >
            {option.label}
          </button>
        ))}
        {/* Sort */}
        <div className={'ml-auto'}>
          <select
            aria-label={'Sort files by'}
            className={
              'h-5 rounded-sm border-none bg-transparent text-[10px] text-muted-foreground focus:outline-none'
            }
            onChange={(e) => onSortChange(e.target.value as DiffSortMode)}
            value={sortMode}
          >
            <option value={'name'}>Name</option>
            <option value={'status'}>Status</option>
            <option value={'changes'}>Changes</option>
          </select>
        </div>
      </div>
    </div>
  );
};
