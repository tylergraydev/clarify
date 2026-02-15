'use client';

import {
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  Loader2Icon,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { Fragment, memo, type MouseEvent, useCallback } from 'react';

import { useOpenInEditor, usePreferredEditor } from '@/hooks/queries/use-editor';
import { useDirectoryListing } from '@/hooks/queries/use-file-explorer';
import { useFileExplorerStore } from '@/lib/stores/file-explorer-store';
import { cn } from '@/lib/utils';

interface FileExplorerTreeNodeProps {
  depth: number;
  name: string;
  relativePath: string;
  repoPath: string;
  type: 'directory' | 'file';
}

const FILE_ICON_MAP: Record<string, string> = {
  css: 'text-blue-400',
  html: 'text-orange-400',
  js: 'text-yellow-400',
  json: 'text-yellow-600',
  jsx: 'text-yellow-400',
  md: 'text-gray-400',
  ts: 'text-blue-500',
  tsx: 'text-blue-500',
};

function getFileColorClass(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return FILE_ICON_MAP[ext] ?? 'text-muted-foreground';
}

export const FileExplorerTreeNode = memo(({ depth, name, relativePath, repoPath, type }: FileExplorerTreeNodeProps) => {
  const { expandedDirs, selectedFiles, toggleDir, toggleFileSelection } = useFileExplorerStore();
  const { data: preferred } = usePreferredEditor();
  const openMutation = useOpenInEditor();
  const isExpanded = expandedDirs.has(relativePath);
  const isSelected = selectedFiles.some((f) => f.relativePath === relativePath);

  // Only fetch children when directory is expanded
  const { data: children, isLoading } = useDirectoryListing(
    type === 'directory' && isExpanded ? repoPath : undefined,
    type === 'directory' && isExpanded ? relativePath : undefined
  );

  const handleClick = useCallback(() => {
    if (type === 'directory') {
      toggleDir(relativePath);
    } else {
      toggleFileSelection(relativePath);
    }
  }, [type, relativePath, toggleDir, toggleFileSelection]);

  const handleOpenInEditor = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      openMutation.mutate({ filePath: relativePath, repoPath });
    },
    [relativePath, openMutation, repoPath]
  );

  const _canOpenInEditor = type === 'file' && !!preferred?.editorId;
  const _showChildren = type === 'directory' && isExpanded && !!children;
  const _isEmptyDirectory = !!children && children.length === 0 && !isLoading;

  return (
    <Fragment>
      <button
        className={cn(
          'group/node flex w-full items-center gap-1 rounded-sm px-1 py-0.5 text-left text-xs hover:bg-muted',
          isSelected && 'bg-accent/20'
        )}
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        type={'button'}
      >
        {type === 'directory' ? (
          <Fragment>
            <ChevronRightIcon className={cn('size-3 shrink-0 transition-transform', isExpanded && 'rotate-90')} />
            {isExpanded ? (
              <FolderOpenIcon className={'size-3.5 shrink-0 text-amber-500'} />
            ) : (
              <FolderIcon className={'size-3.5 shrink-0 text-amber-500'} />
            )}
          </Fragment>
        ) : (
          <Fragment>
            <span className={'size-3 shrink-0'} />
            <FileIcon className={cn('size-3.5 shrink-0', getFileColorClass(name))} />
          </Fragment>
        )}
        <span className={'truncate'}>{name}</span>
        {_canOpenInEditor && (
          <span
            aria-label={'Open in editor'}
            className={
              'ml-auto shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/node:opacity-100 hover:text-foreground'
            }
            onClick={handleOpenInEditor}
            role={'button'}
            tabIndex={-1}
            title={'Open in editor'}
          >
            <SquareArrowOutUpRight aria-hidden={'true'} className={'size-3'} />
          </span>
        )}
        {isLoading && <Loader2Icon className={'ml-auto size-3 shrink-0 animate-spin text-muted-foreground'} />}
      </button>

      {/* Render children when expanded */}
      {_showChildren && (
        <Fragment>
          {children.map((child) => (
            <FileExplorerTreeNode
              depth={depth + 1}
              key={child.relativePath}
              name={child.name}
              relativePath={child.relativePath}
              repoPath={repoPath}
              type={child.type}
            />
          ))}
          {_isEmptyDirectory && (
            <div
              className={'px-1 py-0.5 text-xs text-muted-foreground'}
              style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
            >
              {'Empty'}
            </div>
          )}
        </Fragment>
      )}
    </Fragment>
  );
});

FileExplorerTreeNode.displayName = 'FileExplorerTreeNode';
