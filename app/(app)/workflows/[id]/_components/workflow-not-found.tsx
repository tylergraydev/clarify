'use client';

import { ChevronRight, Workflow } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Error state component for when a workflow is not found.
 * Displays breadcrumb navigation, an empty state with workflow icon,
 * a descriptive message, and a back navigation link.
 */
export const WorkflowNotFound = () => {
  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb */}
      <nav aria-label={'Breadcrumb'} className={'flex items-center gap-2'}>
        <Link
          className={'text-sm text-muted-foreground transition-colors hover:text-foreground'}
          href={$path({ route: '/workflows' })}
        >
          {'Workflows'}
        </Link>
        <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
        <span className={'text-sm text-foreground'}>{'Not Found'}</span>
      </nav>

      {/* Error content */}
      <div className={'rounded-lg border border-dashed border-border p-8'}>
        <EmptyState
          action={
            <Link className={buttonVariants({ variant: 'outline' })} href={$path({ route: '/workflows' })}>
              {'Back to Workflows'}
            </Link>
          }
          description={"The workflow you're looking for doesn't exist or may have been deleted."}
          icon={<Workflow aria-hidden={'true'} className={'size-6'} />}
          title={'Workflow not found'}
        />
      </div>
    </div>
  );
};
