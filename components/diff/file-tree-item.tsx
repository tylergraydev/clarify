'use client';

import { SquareArrowOutUpRight } from 'lucide-react';
import { memo, type MouseEvent, useCallback } from 'react';

import type { FileDiff } from '@/types/diff';

import { useOpenInEditor, usePreferredEditor } from '@/hooks/queries/use-editor';
import { cn } from '@/lib/utils';

import { ChangeStats } from './change-stats';
import { StatusBadge } from './status-badge';

interface FileTreeItemProps {
  file: FileDiff;
  isSelected: boolean;
  onSelect: (path: string) => void;
  repoPath?: string;
}

export const FileTreeItem = memo(function FileTreeItem({ file, isSelected, onSelect, repoPath }: FileTreeItemProps) {
  const { data: preferred } = usePreferredEditor();
  const openMutation = useOpenInEditor();

  const handleClick = useCallback(() => {
    onSelect(file.path);
  }, [file.path, onSelect]);

  const handleOpenInEditor = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      openMutation.mutate({ filePath: file.path, repoPath });
    },
    [file.path, openMutation, repoPath]
  );

  const fileName = file.path.split('/').pop() ?? file.path;
  const dirPath = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : '';

  return (
    <button
      className={cn(
        'group/item flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors',
        isSelected ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      onClick={handleClick}
      title={file.path}
      type={'button'}
    >
      <StatusBadge status={file.status} />
      <div className={'min-w-0 flex-1'}>
        <div className={'truncate font-medium'}>{fileName}</div>
        {dirPath && <div className={'truncate text-[10px] text-muted-foreground/70'}>{dirPath}</div>}
      </div>
      {preferred?.editorId && (
        <span
          aria-label={'Open in editor'}
          className={
            'shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-foreground'
          }
          onClick={handleOpenInEditor}
          role={'button'}
          tabIndex={-1}
          title={'Open in editor'}
        >
          <SquareArrowOutUpRight aria-hidden={'true'} className={'size-3'} />
        </span>
      )}
      {!file.binary && (
        <ChangeStats additions={file.stats.additions} className={'shrink-0'} deletions={file.stats.deletions} />
      )}
    </button>
  );
});
