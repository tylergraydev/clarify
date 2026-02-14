'use client';

import { memo } from 'react';

import type { DiffLine as DiffLineType } from '@/types/diff';

import { cn } from '@/lib/utils';

interface DiffLineProps {
  highlightedHtml?: string;
  line: DiffLineType;
  showOldLineNumber?: boolean;
}

const LINE_TYPE_STYLES: Record<DiffLineType['type'], string> = {
  add: 'bg-green-50 dark:bg-green-900/20',
  context: '',
  delete: 'bg-red-50 dark:bg-red-900/20',
};

const LINE_NUMBER_STYLES: Record<DiffLineType['type'], string> = {
  add: 'text-green-600/60 dark:text-green-400/60',
  context: 'text-muted-foreground/50',
  delete: 'text-red-600/60 dark:text-red-400/60',
};

const PREFIX_MAP: Record<DiffLineType['type'], string> = {
  add: '+',
  context: ' ',
  delete: '-',
};

export const DiffLineComponent = memo(function DiffLineComponent({
  highlightedHtml,
  line,
  showOldLineNumber = true,
}: DiffLineProps) {
  return (
    <tr className={cn('group font-mono text-xs/5', LINE_TYPE_STYLES[line.type])}>
      {/* Old line number */}
      {showOldLineNumber && (
        <td
          className={cn(
            'w-12 min-w-12 border-r border-border/50 px-2 text-right select-none',
            LINE_NUMBER_STYLES[line.type]
          )}
        >
          {line.oldLineNumber ?? ''}
        </td>
      )}
      {/* New line number */}
      <td
        className={cn(
          'w-12 min-w-12 border-r border-border/50 px-2 text-right select-none',
          LINE_NUMBER_STYLES[line.type]
        )}
      >
        {line.newLineNumber ?? ''}
      </td>
      {/* Prefix */}
      <td
        className={cn(
          'w-5 min-w-5 px-1 text-center select-none',
          line.type === 'add' && 'text-green-600 dark:text-green-400',
          line.type === 'delete' && 'text-red-600 dark:text-red-400'
        )}
      >
        {PREFIX_MAP[line.type]}
      </td>
      {/* Content */}
      <td className={'px-2 break-all whitespace-pre-wrap'}>
        {highlightedHtml ? (
          <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        ) : (
          line.content
        )}
      </td>
    </tr>
  );
});
