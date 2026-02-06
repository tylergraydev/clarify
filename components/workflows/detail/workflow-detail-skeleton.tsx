'use client';

/**
 * Loading skeleton for the workflow detail page.
 * Mimics the three-zone layout: top bar, accordion steps, and streaming panel.
 */
export const WorkflowDetailSkeleton = () => {
  return (
    <div className={'flex h-full flex-col'}>
      {/* Top Bar Skeleton */}
      <div className={'flex h-14 items-center justify-between border-b border-border px-6'}>
        <div className={'flex items-center gap-3'}>
          <div className={'h-5 w-48 animate-pulse rounded-sm bg-muted'} />
          <div className={'h-5 w-16 animate-pulse rounded-full bg-muted'} />
          <div className={'h-4 w-20 animate-pulse rounded-sm bg-muted'} />
        </div>
        <div className={'flex items-center gap-2'}>
          <div className={'h-8 w-20 animate-pulse rounded-md bg-muted'} />
          <div className={'h-8 w-20 animate-pulse rounded-md bg-muted'} />
          <div className={'h-8 w-20 animate-pulse rounded-md bg-muted'} />
        </div>
      </div>

      {/* Accordion Steps Skeleton */}
      <div className={'flex-1 space-y-0 overflow-auto'}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div className={'border-b border-border px-6 py-3'} key={index}>
            <div className={'flex items-center gap-3'}>
              <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-5 w-20 animate-pulse rounded-full bg-muted'} />
              <div className={'h-3 w-24 animate-pulse rounded-sm bg-muted'} />
            </div>
          </div>
        ))}
      </div>

      {/* Streaming Panel Skeleton */}
      <div className={'border-t border-border'}>
        <div className={'flex h-8 items-center justify-center'}>
          <div className={'h-0.5 w-8 animate-pulse rounded-full bg-muted'} />
        </div>
        <div className={'border-t border-border p-3'}>
          <div className={'flex gap-4 border-b border-border pb-2'}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div className={'h-6 w-24 animate-pulse rounded-sm bg-muted'} key={index} />
            ))}
          </div>
          <div className={'mt-3 space-y-1'}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className={'h-4 animate-pulse rounded-sm bg-muted'}
                key={index}
                style={{ width: `${70 + index * 5}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
