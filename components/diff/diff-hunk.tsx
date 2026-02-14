'use client';

import { Fragment, memo } from 'react';

import type { DiffHunk as DiffHunkType } from '@/types/diff';

import { DiffLineComponent } from './diff-line';

interface DiffHunkProps {
  hunk: DiffHunkType;
  isUnified?: boolean;
}

export const DiffHunk = memo(function DiffHunk({ hunk, isUnified = true }: DiffHunkProps) {
  return (
    <Fragment>
      {/* Hunk header */}
      <tr className={'bg-blue-50/50 dark:bg-blue-900/10'}>
        {isUnified && <td className={'w-12 min-w-12 border-r border-border/50'} />}
        <td className={'w-12 min-w-12 border-r border-border/50'} />
        <td className={'w-5 min-w-5'} />
        <td className={'px-2 py-0.5 font-mono text-xs text-blue-600 dark:text-blue-400'}>
          {hunk.header}
        </td>
      </tr>
      {/* Lines */}
      {hunk.lines.map((line, index) => (
        <DiffLineComponent
          key={`${line.type}-${line.oldLineNumber}-${line.newLineNumber}-${index}`}
          line={line}
          showOldLineNumber={isUnified}
        />
      ))}
    </Fragment>
  );
});
