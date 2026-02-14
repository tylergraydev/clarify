'use client';

import { memo, useCallback } from 'react';

import type { FileDiff } from '@/types/diff';

import { cn } from '@/lib/utils';

import { ChangeStats } from './change-stats';
import { StatusBadge } from './status-badge';

interface FileTreeItemProps {
  file: FileDiff;
  isSelected: boolean;
  onSelect: (path: string) => void;
}

export const FileTreeItem = memo(function FileTreeItem({
  file,
  isSelected,
  onSelect,
}: FileTreeItemProps) {
  const handleClick = useCallback(() => {
    onSelect(file.path);
  }, [file.path, onSelect]);

  const fileName = file.path.split('/').pop() ?? file.path;
  const dirPath = file.path.includes('/')
    ? file.path.slice(0, file.path.lastIndexOf('/'))
    : '';

  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors',
        isSelected
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      onClick={handleClick}
      title={file.path}
      type={'button'}
    >
      <StatusBadge status={file.status} />
      <div className={'min-w-0 flex-1'}>
        <div className={'truncate font-medium'}>{fileName}</div>
        {dirPath && (
          <div className={'truncate text-[10px] text-muted-foreground/70'}>{dirPath}</div>
        )}
      </div>
      {!file.binary && (
        <ChangeStats
          additions={file.stats.additions}
          className={'shrink-0'}
          deletions={file.stats.deletions}
        />
      )}
    </button>
  );
});
