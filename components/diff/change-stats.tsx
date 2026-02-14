'use client';

import { cn } from '@/lib/utils';

interface ChangeStatsProps {
  additions: number;
  className?: string;
  deletions: number;
}

export const ChangeStats = ({ additions, className, deletions }: ChangeStatsProps) => {
  const isHasAdditions = additions > 0;
  const isHasDeletions = deletions > 0;
  const isNoChanges = !isHasAdditions && !isHasDeletions;

  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-xs', className)}>
      {isHasAdditions && (
        <span className={'text-green-600 dark:text-green-400'}>+{additions}</span>
      )}
      {isHasDeletions && (
        <span className={'text-red-600 dark:text-red-400'}>-{deletions}</span>
      )}
      {isNoChanges && (
        <span className={'text-muted-foreground'}>0</span>
      )}
    </span>
  );
};
