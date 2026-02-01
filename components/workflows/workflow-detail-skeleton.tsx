'use client';

/**
 * Loading skeleton for the workflow detail page.
 * Mimics the page layout: breadcrumb, header with workflow name.
 */
export const WorkflowDetailSkeleton = () => {
  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb skeleton */}
      <div className={'flex items-center gap-2'}>
        <div className={'h-4 w-16 animate-pulse rounded-sm bg-muted'} />
        <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
        <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-20 animate-pulse rounded-sm bg-muted'} />
        <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-40 animate-pulse rounded-sm bg-muted'} />
      </div>

      {/* Header skeleton */}
      <div className={'space-y-2'}>
        <div className={'h-7 w-64 animate-pulse rounded-sm bg-muted'} />
      </div>
    </div>
  );
};
