'use client';

/**
 * Loading skeleton for the project detail page.
 * Mimics the page layout: breadcrumb, header with title/badges, tabbed content area.
 */
export const ProjectDetailSkeleton = () => {
  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb skeleton */}
      <div className={'flex items-center gap-2'}>
        <div className={'h-4 w-16 animate-pulse rounded-sm bg-muted'} />
        <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
      </div>

      {/* Header skeleton */}
      <div className={'space-y-2'}>
        <div className={'h-7 w-48 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-5 w-80 animate-pulse rounded-sm bg-muted'} />
      </div>

      {/* Tabs skeleton */}
      <div className={'space-y-4'}>
        <div className={'flex gap-4 border-b border-border pb-2'}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div className={'h-8 w-24 animate-pulse rounded-sm bg-muted'} key={index} />
          ))}
        </div>
        <div className={'h-48 animate-pulse rounded-lg bg-muted'} />
      </div>
    </div>
  );
};
