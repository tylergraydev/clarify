'use client';

import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { useMemo } from 'react';

import type { DiffSortMode, DiffStatusFilter } from '@/lib/stores/diff-view-store';
import type { FileDiff } from '@/types/diff';

import { cn } from '@/lib/utils';

import { FileTreeItem } from './file-tree-item';
import { FileTreeToolbar } from './file-tree-toolbar';

interface FileTreeSidebarProps {
  className?: string;
  files: Array<FileDiff>;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onSearchChange: (query: string) => void;
  onSelectFile: (path: string) => void;
  onSortChange: (sort: DiffSortMode) => void;
  onStatusFilterChange: (filter: DiffStatusFilter) => void;
  repoPath?: string;
  searchQuery: string;
  selectedFilePath: null | string;
  sortMode: DiffSortMode;
  statusFilter: DiffStatusFilter;
}

const STATUS_ORDER: Record<FileDiff['status'], number> = {
  added: 0,
  copied: 3,
  deleted: 4,
  modified: 1,
  renamed: 2,
};

function filterFiles(files: Array<FileDiff>, query: string, statusFilter: DiffStatusFilter): Array<FileDiff> {
  let filtered = files;

  if (statusFilter !== 'all') {
    filtered = filtered.filter((f) => f.status === statusFilter);
  }

  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = filtered.filter((f) => f.path.toLowerCase().includes(lowerQuery));
  }

  return filtered;
}

function sortFiles(files: Array<FileDiff>, sortMode: DiffSortMode): Array<FileDiff> {
  const sorted = [...files];

  switch (sortMode) {
    case 'changes': {
      sorted.sort((a, b) => b.stats.additions + b.stats.deletions - (a.stats.additions + a.stats.deletions));
      break;
    }
    case 'name': {
      sorted.sort((a, b) => a.path.localeCompare(b.path));
      break;
    }
    case 'status': {
      sorted.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      break;
    }
  }

  return sorted;
}

export const FileTreeSidebar = ({
  className,
  files,
  onCollapseAll,
  onExpandAll,
  onSearchChange,
  onSelectFile,
  onSortChange,
  onStatusFilterChange,
  repoPath,
  searchQuery,
  selectedFilePath,
  sortMode,
  statusFilter,
}: FileTreeSidebarProps) => {
  const filteredFiles = useMemo(
    () => sortFiles(filterFiles(files, searchQuery, statusFilter), sortMode),
    [files, searchQuery, statusFilter, sortMode]
  );

  return (
    <div className={cn('flex h-full flex-col border-r border-border', className)}>
      {/* Toolbar */}
      <FileTreeToolbar
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
        onStatusFilterChange={onStatusFilterChange}
        searchQuery={searchQuery}
        sortMode={sortMode}
        statusFilter={statusFilter}
      />
      {/* Actions */}
      <div className={'flex items-center justify-between border-b border-border px-2 py-1'}>
        <span className={'text-[10px] text-muted-foreground'}>
          {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
        </span>
        <div className={'flex items-center gap-0.5'}>
          <button
            aria-label={'Expand all files'}
            className={'rounded-sm p-0.5 text-muted-foreground hover:text-foreground'}
            onClick={onExpandAll}
            title={'Expand all'}
            type={'button'}
          >
            <ChevronsUpDown aria-hidden={'true'} className={'size-3.5'} />
          </button>
          <button
            aria-label={'Collapse all files'}
            className={'rounded-sm p-0.5 text-muted-foreground hover:text-foreground'}
            onClick={onCollapseAll}
            title={'Collapse all'}
            type={'button'}
          >
            <ChevronsDownUp aria-hidden={'true'} className={'size-3.5'} />
          </button>
        </div>
      </div>
      {/* File list */}
      <div className={'flex-1 overflow-y-auto p-1'}>
        {filteredFiles.length === 0 ? (
          <div className={'px-2 py-4 text-center text-xs text-muted-foreground'}>No matching files</div>
        ) : (
          <div className={'flex flex-col gap-0.5'}>
            {filteredFiles.map((file) => (
              <FileTreeItem
                file={file}
                isSelected={selectedFilePath === file.path}
                key={file.path}
                onSelect={onSelectFile}
                repoPath={repoPath}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
