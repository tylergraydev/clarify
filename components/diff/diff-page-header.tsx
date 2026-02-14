'use client';

import type { DiffViewMode } from '@/lib/stores/diff-view-store';

import { cn } from '@/lib/utils';

import { ViewModeToggle } from './view-mode-toggle';

interface DiffPageHeaderProps {
  className?: string;
  onViewModeChange: (mode: DiffViewMode) => void;
  viewMode: DiffViewMode;
}

export const DiffPageHeader = ({
  className,
  onViewModeChange,
  viewMode,
}: DiffPageHeaderProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-border px-4 py-3',
        className
      )}
    >
      <div>
        <h1 className={'text-lg font-semibold'}>Changes</h1>
        <p className={'text-xs text-muted-foreground'}>
          View code changes across your projects
        </p>
      </div>
      <ViewModeToggle onChange={onViewModeChange} value={viewMode} />
    </div>
  );
};
