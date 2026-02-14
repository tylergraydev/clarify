'use client';

import { Columns2, Rows3 } from 'lucide-react';

import type { DiffViewMode } from '@/lib/stores/diff-view-store';

import { cn } from '@/lib/utils';

interface ViewModeToggleProps {
  className?: string;
  onChange: (mode: DiffViewMode) => void;
  value: DiffViewMode;
}

export const ViewModeToggle = ({ className, onChange, value }: ViewModeToggleProps) => {
  return (
    <div className={cn('inline-flex items-center rounded-md border border-border', className)}>
      <button
        aria-label={'Unified view'}
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-l-md px-2.5 text-xs transition-colors',
          value === 'unified'
            ? 'bg-muted font-medium text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onChange('unified')}
        type={'button'}
      >
        <Rows3 aria-hidden={'true'} className={'size-3.5'} />
        Unified
      </button>
      <button
        aria-label={'Split view'}
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-r-md border-l border-border px-2.5 text-xs transition-colors',
          value === 'split'
            ? 'bg-muted font-medium text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onChange('split')}
        type={'button'}
      >
        <Columns2 aria-hidden={'true'} className={'size-3.5'} />
        Split
      </button>
    </div>
  );
};
