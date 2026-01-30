'use client';

/**
 * Loading skeleton for the workflow detail page.
 * Mimics the page layout: breadcrumb, header with title/badges, control bar, pipeline steps.
 */
export const WorkflowDetailSkeleton = () => {
  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb skeleton */}
      <div className={'flex items-center gap-2'}>
        <div className={'h-4 w-20 animate-pulse rounded-sm bg-muted'} />
        <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
      </div>

      {/* Header skeleton */}
      <div className={'flex items-start justify-between gap-4'}>
        {/* Title and badges area */}
        <div className={'space-y-2'}>
          <div className={'flex items-center gap-3'}>
            <div className={'h-7 w-56 animate-pulse rounded-sm bg-muted'} />
            <div className={'h-5 w-16 animate-pulse rounded-full bg-muted'} />
            <div className={'h-5 w-20 animate-pulse rounded-full bg-muted'} />
          </div>
          <div className={'h-5 w-96 animate-pulse rounded-sm bg-muted'} />
        </div>

        {/* Control bar skeleton */}
        <div className={'flex gap-2'}>
          <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />
          <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />
          <div className={'h-9 w-20 animate-pulse rounded-md bg-muted'} />
        </div>
      </div>

      {/* Pipeline steps skeleton */}
      <div className={'space-y-4'}>
        {/* Pipeline header */}
        <div className={'flex items-center justify-between'}>
          <div className={'h-5 w-32 animate-pulse rounded-sm bg-muted'} />
          <div className={'h-5 w-24 animate-pulse rounded-sm bg-muted'} />
        </div>

        {/* Pipeline step nodes */}
        <div className={'space-y-3'}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div className={'flex items-center gap-4 rounded-lg border border-border bg-card p-4'} key={index}>
              {/* Step number indicator */}
              <div className={'flex size-8 animate-pulse items-center justify-center rounded-full bg-muted'} />

              {/* Step icon */}
              <div className={'size-5 animate-pulse rounded-sm bg-muted'} />

              {/* Step content */}
              <div className={'flex-1 space-y-2'}>
                <div className={'h-5 w-40 animate-pulse rounded-sm bg-muted'} />
                <div className={'h-4 w-64 animate-pulse rounded-sm bg-muted'} />
              </div>

              {/* Status badge */}
              <div className={'h-5 w-20 animate-pulse rounded-full bg-muted'} />

              {/* Expand chevron */}
              <div className={'size-5 animate-pulse rounded-sm bg-muted'} />
            </div>
          ))}
        </div>
      </div>

      {/* Metadata section skeleton */}
      <div className={'flex items-center gap-6'}>
        <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-28 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-24 animate-pulse rounded-sm bg-muted'} />
      </div>
    </div>
  );
};
