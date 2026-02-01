'use client';

import { ChevronRight, FolderGit2 } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Error state component for when a project is not found.
 * Displays breadcrumb navigation, an empty state with folder icon,
 * a descriptive message, and a back navigation link.
 */
export const ProjectNotFound = () => {
  return (
    <div className={'space-y-6'}>
      {/* Breadcrumb */}
      <nav aria-label={'Breadcrumb'} className={'flex items-center gap-2'}>
        <Link
          className={'text-sm text-muted-foreground transition-colors hover:text-foreground'}
          href={$path({ route: '/projects' })}
        >
          Projects
        </Link>
        <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
        <span className={'text-sm text-foreground'}>{'Not Found'}</span>
      </nav>

      {/* Error content */}
      <div className={'rounded-lg border border-dashed border-border p-8'}>
        <EmptyState
          action={
            <Link className={buttonVariants({ variant: 'outline' })} href={$path({ route: '/projects' })}>
              Back to Projects
            </Link>
          }
          description={"The project you're looking for doesn't exist or may have been deleted."}
          icon={<FolderGit2 aria-hidden={'true'} className={'size-6'} />}
          title={'Project not found'}
        />
      </div>
    </div>
  );
};
