'use client';

import { useCallback, useMemo, useRef } from 'react';

import type { FileDiff } from '@/types/diff';

import { useDiffViewStore } from '@/lib/stores/diff-view-store';
import { cn } from '@/lib/utils';

import { DiffEmptyState } from './diff-empty-state';
import { DiffFile } from './diff-file';
import { DiffSections } from './diff-sections';
import { FileTreeSidebar } from './file-tree-sidebar';
import { ViewModeToggle } from './view-mode-toggle';

interface DiffViewerProps {
  className?: string;
  committedFiles?: Array<FileDiff>;
  files: Array<FileDiff>;
  isSectioned?: boolean;
  uncommittedFiles?: Array<FileDiff>;
}

export const DiffViewer = ({
  className,
  committedFiles = [],
  files,
  isSectioned = false,
  uncommittedFiles = [],
}: DiffViewerProps) => {
  const viewMode = useDiffViewStore((s) => s.viewMode);
  const setViewMode = useDiffViewStore((s) => s.setViewMode);
  const collapsedFiles = useDiffViewStore((s) => s.collapsedFiles);
  const toggleFileCollapsed = useDiffViewStore((s) => s.toggleFileCollapsed);
  const collapseAllFiles = useDiffViewStore((s) => s.collapseAllFiles);
  const expandAllFiles = useDiffViewStore((s) => s.expandAllFiles);
  const selectedFilePath = useDiffViewStore((s) => s.selectedFilePath);
  const setSelectedFilePath = useDiffViewStore((s) => s.setSelectedFilePath);
  const searchQuery = useDiffViewStore((s) => s.fileSearchQuery);
  const setSearchQuery = useDiffViewStore((s) => s.setFileSearchQuery);
  const sortMode = useDiffViewStore((s) => s.sortMode);
  const setSortMode = useDiffViewStore((s) => s.setSortMode);
  const statusFilter = useDiffViewStore((s) => s.statusFilter);
  const setStatusFilter = useDiffViewStore((s) => s.setStatusFilter);

  const contentRef = useRef<HTMLDivElement>(null);

  const allFiles = useMemo(
    () => (isSectioned ? [...committedFiles, ...uncommittedFiles] : files),
    [committedFiles, files, isSectioned, uncommittedFiles]
  );

  const handleSelectFile = useCallback(
    (path: string) => {
      setSelectedFilePath(path);
      // Scroll to the selected file
      const el = contentRef.current?.querySelector(`[data-file-path="${CSS.escape(path)}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [setSelectedFilePath]
  );

  const handleCollapseAll = useCallback(() => {
    collapseAllFiles(allFiles.map((f) => f.path));
  }, [allFiles, collapseAllFiles]);

  const isEmptyDiff = allFiles.length === 0;

  if (isEmptyDiff) {
    return <DiffEmptyState />;
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Toolbar */}
      <div className={'flex items-center justify-between border-b border-border px-3 py-2'}>
        <div className={'text-xs text-muted-foreground'}>
          {allFiles.length} file{allFiles.length !== 1 ? 's' : ''} changed
        </div>
        <ViewModeToggle onChange={setViewMode} value={viewMode} />
      </div>
      {/* Main content */}
      <div className={'flex flex-1 overflow-hidden'}>
        {/* File tree sidebar */}
        <FileTreeSidebar
          className={'w-64 shrink-0'}
          files={allFiles}
          onCollapseAll={handleCollapseAll}
          onExpandAll={expandAllFiles}
          onSearchChange={setSearchQuery}
          onSelectFile={handleSelectFile}
          onSortChange={setSortMode}
          onStatusFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          selectedFilePath={selectedFilePath}
          sortMode={sortMode}
          statusFilter={statusFilter}
        />
        {/* Diff content */}
        <div className={'flex-1 overflow-y-auto'} ref={contentRef}>
          {isSectioned ? (
            <DiffSections
              collapsedFiles={collapsedFiles}
              committedFiles={committedFiles}
              onToggleFileCollapse={toggleFileCollapsed}
              uncommittedFiles={uncommittedFiles}
              viewMode={viewMode}
            />
          ) : (
            <div className={'flex flex-col gap-3 p-3'}>
              {files.map((file) => (
                <div data-file-path={file.path} key={file.path}>
                  <DiffFile
                    file={file}
                    isCollapsed={collapsedFiles.has(file.path)}
                    onToggleCollapse={() => toggleFileCollapsed(file.path)}
                    viewMode={viewMode}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
