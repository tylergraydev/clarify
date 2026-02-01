'use client';

/**
 * Loading skeleton for the workflow detail page.
 * Mimics the page layout: breadcrumb, header with workflow name, metadata badges,
 * timestamps, and action bar.
 */
export const WorkflowDetailSkeleton = () => {
  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb Skeleton */}
      <div className={'flex items-center gap-2'}>
        <div className={'h-4 w-16 animate-pulse rounded-sm bg-muted'} />
        <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
        <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-20 animate-pulse rounded-sm bg-muted'} />
        <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-40 animate-pulse rounded-sm bg-muted'} />
      </div>

      {/* Header Section */}
      <div className={'space-y-4'}>
        {/* Title Row: Name + Badges */}
        <div className={'flex items-center gap-3'}>
          {/* Workflow Name */}
          <div className={'h-7 w-64 animate-pulse rounded-sm bg-muted'} />

          {/* Status Badge */}
          <div className={'h-6 w-20 animate-pulse rounded-full bg-muted'} />

          {/* Type Badge */}
          <div className={'h-6 w-24 animate-pulse rounded-full bg-muted'} />
        </div>

        {/* Metadata Row: Project Link + Timestamps */}
        <div className={'flex items-center gap-6'}>
          {/* Project Link */}
          <div className={'flex items-center gap-2'}>
            <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
            <div className={'h-4 w-40 animate-pulse rounded-sm bg-muted'} />
          </div>

          {/* Created Timestamp */}
          <div className={'flex items-center gap-2'}>
            <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
            <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
          </div>

          {/* Started Timestamp */}
          <div className={'flex items-center gap-2'}>
            <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
            <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className={'flex items-center gap-2 border-b border-border pb-4'}>
        {/* Primary Action Button */}
        <div className={'h-9 w-28 animate-pulse rounded-md bg-muted'} />

        {/* Secondary Action Buttons */}
        <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />
        <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />

        {/* Spacer */}
        <div className={'flex-1'} />

        {/* More Actions (Icon Button) */}
        <div className={'size-9 animate-pulse rounded-md bg-muted'} />
      </div>

      {/* Content Area Placeholder */}
      <div className={'h-64 animate-pulse rounded-lg bg-muted'} />
    </div>
  );
};
