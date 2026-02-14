'use client';

import type { DiffViewMode } from '@/lib/stores/diff-view-store';
import type { FileDiff } from '@/types/diff';

import { FileHeaderBar } from './file-header-bar';
import { SplitDiffView } from './split-diff-view';
import { UnifiedDiffView } from './unified-diff-view';

interface DiffFileProps {
  file: FileDiff;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  viewMode: DiffViewMode;
}

export const DiffFile = ({ file, isCollapsed, onToggleCollapse, viewMode }: DiffFileProps) => {
  return (
    <div className={'group rounded-md border border-border'}>
      <FileHeaderBar
        file={file}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
      {!isCollapsed && (
        viewMode === 'split' ? (
          <SplitDiffView file={file} />
        ) : (
          <UnifiedDiffView file={file} />
        )
      )}
    </div>
  );
};
