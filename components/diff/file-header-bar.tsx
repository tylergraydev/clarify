'use client';

import { ChevronDown, ChevronRight, Copy, SquareArrowOutUpRight } from 'lucide-react';
import { useCallback } from 'react';

import type { FileDiff } from '@/types/diff';

import { useOpenInEditor, usePreferredEditor } from '@/hooks/queries/use-editor';
import { cn } from '@/lib/utils';

import { ChangeStats } from './change-stats';
import { StatusBadge } from './status-badge';

interface FileHeaderBarProps {
  className?: string;
  file: FileDiff;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  repoPath?: string;
}

export const FileHeaderBar = ({ className, file, isCollapsed, onToggleCollapse, repoPath }: FileHeaderBarProps) => {
  const { data: preferred } = usePreferredEditor();
  const openMutation = useOpenInEditor();

  const handleCopyPath = useCallback(() => {
    void navigator.clipboard.writeText(file.path);
  }, [file.path]);

  const handleOpenInEditor = useCallback(() => {
    openMutation.mutate({ filePath: file.path, repoPath });
  }, [file.path, openMutation, repoPath]);

  return (
    <div
      className={cn(
        'sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-muted/80 px-3 py-1.5 backdrop-blur-sm',
        className
      )}
    >
      <button
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand file diff' : 'Collapse file diff'}
        className={'inline-flex items-center text-muted-foreground transition-colors hover:text-foreground'}
        onClick={onToggleCollapse}
        type={'button'}
      >
        {isCollapsed ? (
          <ChevronRight aria-hidden={'true'} className={'size-4'} />
        ) : (
          <ChevronDown aria-hidden={'true'} className={'size-4'} />
        )}
      </button>
      <StatusBadge status={file.status} />
      <span className={'min-w-0 flex-1 truncate font-mono text-xs text-foreground'}>
        {file.oldPath ? (
          <span>
            <span className={'text-muted-foreground'}>{file.oldPath}</span>
            <span className={'mx-1 text-muted-foreground'}>&#8594;</span>
            {file.path}
          </span>
        ) : (
          file.path
        )}
      </span>
      {preferred?.editorId && (
        <button
          aria-label={'Open in editor'}
          className={'text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground'}
          onClick={handleOpenInEditor}
          title={'Open in editor'}
          type={'button'}
        >
          <SquareArrowOutUpRight aria-hidden={'true'} className={'size-3.5'} />
        </button>
      )}
      <button
        aria-label={'Copy file path'}
        className={'text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground'}
        onClick={handleCopyPath}
        title={'Copy file path'}
        type={'button'}
      >
        <Copy aria-hidden={'true'} className={'size-3.5'} />
      </button>
      {!file.binary && <ChangeStats additions={file.stats.additions} deletions={file.stats.deletions} />}
    </div>
  );
};
