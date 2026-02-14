'use client';

import { Fragment, memo } from 'react';

import type { DiffHunk as DiffHunkType, DiffLine, FileDiff } from '@/types/diff';

import { cn } from '@/lib/utils';

interface SplitDiffViewProps {
  file: FileDiff;
}

interface SplitLinePair {
  left: DiffLine | null;
  right: DiffLine | null;
}

/**
 * Convert a hunk into pairs of left/right lines for side-by-side display.
 * Context lines appear on both sides. Deletions go left, additions go right.
 * Consecutive delete/add sequences are paired together.
 */
function buildSplitLines(hunk: DiffHunkType): Array<SplitLinePair> {
  const pairs: Array<SplitLinePair> = [];
  const lines = hunk.lines;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.type === 'context') {
      pairs.push({ left: line, right: line });
      i++;
    } else {
      // Collect consecutive deletes and adds
      const deletes: Array<DiffLine> = [];
      const adds: Array<DiffLine> = [];

      while (i < lines.length && lines[i]!.type === 'delete') {
        deletes.push(lines[i]!);
        i++;
      }
      while (i < lines.length && lines[i]!.type === 'add') {
        adds.push(lines[i]!);
        i++;
      }

      // Pair them up
      const maxLen = Math.max(deletes.length, adds.length);
      for (let j = 0; j < maxLen; j++) {
        pairs.push({
          left: j < deletes.length ? deletes[j]! : null,
          right: j < adds.length ? adds[j]! : null,
        });
      }
    }
  }

  return pairs;
}

const SplitLine = memo(function SplitLine({
  line,
  side,
}: {
  line: DiffLine | null;
  side: 'left' | 'right';
}) {
  if (!line) {
    return (
      <Fragment>
        <td className={'w-10 min-w-10 border-r border-border/50 bg-muted/30 px-2 text-right text-muted-foreground/30 select-none'} />
        <td className={'bg-muted/30'} />
      </Fragment>
    );
  }

  const lineNumber = side === 'left' ? line.oldLineNumber : line.newLineNumber;
  const bgColor =
    line.type === 'add'
      ? 'bg-green-50 dark:bg-green-900/20'
      : line.type === 'delete'
        ? 'bg-red-50 dark:bg-red-900/20'
        : '';
  const numColor =
    line.type === 'add'
      ? 'text-green-600/60 dark:text-green-400/60'
      : line.type === 'delete'
        ? 'text-red-600/60 dark:text-red-400/60'
        : 'text-muted-foreground/50';

  return (
    <Fragment>
      <td
        className={cn(
          'w-10 min-w-10 border-r border-border/50 px-2 text-right select-none',
          numColor,
          bgColor
        )}
      >
        {lineNumber ?? ''}
      </td>
      <td className={cn('px-2 break-all whitespace-pre-wrap', bgColor)}>
        {line.content}
      </td>
    </Fragment>
  );
});

export const SplitDiffView = ({ file }: SplitDiffViewProps) => {
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
      <table className={'w-full border-collapse font-mono text-xs/5'}>
        <tbody>
          {file.hunks.map((hunk, hunkIndex) => {
            const pairs = buildSplitLines(hunk);
            return (
              <Fragment key={`${hunk.oldStart}-${hunk.newStart}-${hunkIndex}`}>
                {/* Hunk header */}
                <tr className={'bg-blue-50/50 dark:bg-blue-900/10'}>
                  <td className={'w-10 min-w-10 border-r border-border/50'} />
                  <td className={'border-r border-border/30'} />
                  <td className={'w-10 min-w-10 border-r border-border/50'} />
                  <td className={'px-2 py-0.5 text-blue-600 dark:text-blue-400'}>
                    {hunk.header}
                  </td>
                </tr>
                {/* Lines */}
                {pairs.map((pair, lineIndex) => (
                  <tr key={lineIndex}>
                    <SplitLine line={pair.left} side={'left'} />
                    <SplitLine line={pair.right} side={'right'} />
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
