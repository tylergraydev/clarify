'use client';

import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/utils';

interface AgentListSkeletonProps extends ComponentPropsWithRef<'div'> {
  count?: number;
}

const AgentListSkeletonItem = () => {
  return (
    <div className={cn('flex items-center gap-4 rounded-md border border-border bg-card px-4 py-3')}>
      {/* Color Indicator */}
      <div className={'size-3 shrink-0 animate-pulse rounded-full bg-muted'} />

      {/* Agent Name */}
      <div className={'min-w-0 flex-1'}>
        <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
      </div>

      {/* Type Badge */}
      <div className={'h-5 w-16 shrink-0 animate-pulse rounded-full bg-muted'} />

      {/* Origin Badges */}
      <div className={'flex shrink-0 items-center gap-1'}>
        <div className={'h-5 w-14 animate-pulse rounded-full bg-muted'} />
      </div>

      {/* Status Toggle */}
      <div className={'flex shrink-0 items-center gap-2'}>
        <div className={'h-3 w-12 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-5 w-9 animate-pulse rounded-full bg-muted'} />
      </div>

      {/* Action Buttons */}
      <div className={'flex shrink-0 items-center gap-1'}>
        <div className={'size-8 animate-pulse rounded-md bg-muted'} />
        <div className={'size-8 animate-pulse rounded-md bg-muted'} />
      </div>
    </div>
  );
};

export const AgentListSkeleton = ({ className, count = 6, ref, ...props }: AgentListSkeletonProps) => {
  return (
    <div
      aria-busy={true}
      aria-label={'Loading agents list'}
      className={cn('flex flex-col gap-2', className)}
      ref={ref}
      role={'status'}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <AgentListSkeletonItem key={index} />
      ))}
    </div>
  );
};
