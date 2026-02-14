'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ExpandContextProps {
  className?: string;
  direction: 'down' | 'up';
  lineCount?: number;
  onClick: () => void;
}

export const ExpandContext = ({ className, direction, lineCount = 10, onClick }: ExpandContextProps) => {
  const Icon = direction === 'up' ? ChevronUp : ChevronDown;

  return (
    <tr className={cn('group', className)}>
      <td
        className={
          'cursor-pointer bg-blue-50/30 py-0 text-center hover:bg-blue-50/60 dark:bg-blue-900/5 dark:hover:bg-blue-900/15'
        }
        colSpan={4}
        onClick={onClick}
      >
        <button
          className={
            'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
          }
          type={'button'}
        >
          <Icon aria-hidden={'true'} className={'size-3'} />
          Show {lineCount} more lines
        </button>
      </td>
    </tr>
  );
};
