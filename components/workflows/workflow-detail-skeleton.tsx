'use client';

/**
 * Loading skeleton for the workflow detail page.
 * Mimics the page layout: breadcrumb, header with workflow name, metadata badges,
 * timestamps, action bar, and vertical pipeline with progress bar.
 */
export const WorkflowDetailSkeleton = () => {
  return (
    <div className={'flex h-full flex-col space-y-6'}>
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

      {/* Vertical Pipeline Skeleton */}
      <div className={'flex flex-1 flex-col'}>
        {/* Progress Bar Skeleton */}
        <div className={'border-b border-border px-4 py-3'}>
          <div className={'mx-auto max-w-4xl'}>
            <div className={'mb-2 flex items-center justify-between'}>
              <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-4 w-20 animate-pulse rounded-sm bg-muted'} />
            </div>
            <div className={'h-1.5 w-full animate-pulse rounded-full bg-muted'} />
          </div>
        </div>

        {/* Steps Container */}
        <div className={'flex flex-1 flex-col items-center py-6'}>
          <div className={'w-full max-w-4xl space-y-4 px-4'}>
            {/* Step 1 Skeleton */}
            <div className={'relative'}>
              {/* Vertical Connector */}
              <div className={'absolute top-0 bottom-0 left-0 flex w-12 flex-col items-center'}>
                <div className={'size-8 animate-pulse rounded-full bg-muted'} />
                <div className={'w-0.5 flex-1 animate-pulse bg-muted'} />
              </div>
              {/* Step Card */}
              <div className={'ml-14 animate-pulse rounded-lg border border-border bg-muted/30 p-4'}>
                <div className={'flex items-center gap-3'}>
                  <div className={'size-8 rounded-full bg-muted'} />
                  <div className={'h-4 flex-1 rounded-sm bg-muted'} />
                  <div className={'h-5 w-24 rounded-full bg-muted'} />
                  <div className={'size-5 rounded-full bg-muted'} />
                </div>
              </div>
            </div>

            {/* Step 2 Skeleton */}
            <div className={'relative'}>
              {/* Vertical Connector */}
              <div className={'absolute top-0 bottom-0 left-0 flex w-12 flex-col items-center'}>
                <div className={'h-4 w-0.5 animate-pulse bg-muted'} />
                <div className={'size-8 animate-pulse rounded-full bg-muted'} />
                <div className={'w-0.5 flex-1 animate-pulse bg-muted'} />
              </div>
              {/* Step Card */}
              <div className={'ml-14 animate-pulse rounded-lg border border-border bg-muted/30 p-4'}>
                <div className={'flex items-center gap-3'}>
                  <div className={'size-8 rounded-full bg-muted'} />
                  <div className={'h-4 flex-1 rounded-sm bg-muted'} />
                  <div className={'h-5 w-20 rounded-full bg-muted'} />
                  <div className={'size-5 rounded-full bg-muted'} />
                </div>
              </div>
            </div>

            {/* Step 3 Skeleton */}
            <div className={'relative'}>
              {/* Vertical Connector */}
              <div className={'absolute top-0 bottom-0 left-0 flex w-12 flex-col items-center'}>
                <div className={'h-4 w-0.5 animate-pulse bg-muted'} />
                <div className={'size-8 animate-pulse rounded-full bg-muted'} />
                <div className={'w-0.5 flex-1 animate-pulse bg-muted'} />
              </div>
              {/* Step Card */}
              <div className={'ml-14 animate-pulse rounded-lg border border-border bg-muted/30 p-4'}>
                <div className={'flex items-center gap-3'}>
                  <div className={'size-8 rounded-full bg-muted'} />
                  <div className={'h-4 flex-1 rounded-sm bg-muted'} />
                  <div className={'size-5 rounded-full bg-muted'} />
                </div>
              </div>
            </div>

            {/* Step 4 Skeleton (last step, no bottom connector) */}
            <div className={'relative'}>
              {/* Vertical Connector */}
              <div className={'absolute top-0 bottom-0 left-0 flex w-12 flex-col items-center'}>
                <div className={'h-4 w-0.5 animate-pulse bg-muted'} />
                <div className={'size-8 animate-pulse rounded-full bg-muted'} />
              </div>
              {/* Step Card */}
              <div className={'ml-14 animate-pulse rounded-lg border border-border bg-muted/30 p-4'}>
                <div className={'flex items-center gap-3'}>
                  <div className={'size-8 rounded-full bg-muted'} />
                  <div className={'h-4 flex-1 rounded-sm bg-muted'} />
                  <div className={'size-5 rounded-full bg-muted'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
