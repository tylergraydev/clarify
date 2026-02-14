'use client';

import type { FileDiff } from '@/types/diff';

import { DiffHunk } from './diff-hunk';

interface UnifiedDiffViewProps {
  file: FileDiff;
}

export const UnifiedDiffView = ({ file }: UnifiedDiffViewProps) => {
  if (file.binary) {
    return (
      <div className={'flex items-center justify-center py-6 text-xs text-muted-foreground'}>
        Binary file not shown
      </div>
    );
  }

  if (file.hunks.length === 0) {
    return (
      <div className={'flex items-center justify-center py-6 text-xs text-muted-foreground'}>
        Empty file
      </div>
    );
  }

  return (
    <div className={'overflow-x-auto'}>
      <table className={'w-full border-collapse'}>
        <tbody>
          {file.hunks.map((hunk, index) => (
            <DiffHunk hunk={hunk} isUnified={true} key={`${hunk.oldStart}-${hunk.newStart}-${index}`} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
