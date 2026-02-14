'use client';

import { cn } from '@/lib/utils';

interface DiffLoadingSkeletonProps {
  className?: string;
}

export const DiffLoadingSkeleton = ({ className }: DiffLoadingSkeletonProps) => {
  return (
    <div className={cn('flex flex-col gap-4 p-4', className)}>
      {/* File header skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div className={'flex flex-col gap-2'} key={i}>
          {/* File header */}
          <div className={'flex items-center gap-2'}>
            <div className={'h-5 w-5 animate-pulse rounded-sm bg-muted'} />
            <div className={'h-4 w-48 animate-pulse rounded-sm bg-muted'} />
            <div className={'ml-auto h-3 w-16 animate-pulse rounded-sm bg-muted'} />
          </div>
          {/* Diff lines */}
          <div className={'rounded-md border border-border'}>
            {Array.from({ length: 4 }).map((_, j) => (
              <div className={'flex h-6 items-center gap-2 border-b border-border/50 px-3 last:border-b-0'} key={j}>
                <div className={'h-3 w-8 animate-pulse rounded-sm bg-muted'} />
                <div className={cn('h-3 animate-pulse rounded-sm bg-muted', j % 3 === 0 ? 'w-64' : j % 3 === 1 ? 'w-48' : 'w-36')} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
