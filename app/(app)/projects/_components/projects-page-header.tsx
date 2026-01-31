'use client';

import { Plus } from 'lucide-react';
import { ComponentPropsWithRef, Fragment } from 'react';

import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ProjectsPageHeaderProps extends ComponentPropsWithRef<'header'> {
  /** Number of projects after filtering */
  filteredCount: number;
  /** Whether the list is currently filtered */
  isFiltered: boolean;
  /** Total number of projects */
  totalCount: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Header section for the projects page.
 *
 * Displays the page title, description, result count badge,
 * and a Create Project button that opens the CreateProjectDialog.
 *
 * @example
 * ```tsx
 * <ProjectsPageHeader
 *   filteredCount={10}
 *   totalCount={25}
 *   isFiltered={true}
 * />
 * ```
 */
export const ProjectsPageHeader = ({
  className,
  filteredCount,
  isFiltered,
  ref,
  totalCount,
  ...props
}: ProjectsPageHeaderProps) => {
  return (
    <Fragment>
      {/* Skip link for keyboard navigation */}
      <a
        className={cn(
          'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
          'z-50 rounded-md bg-background px-4 py-2 text-sm font-medium',
          'ring-2 ring-accent ring-offset-2'
        )}
        href={'#project-content'}
      >
        {'Skip to project content'}
      </a>

      {/* Page heading */}
      <header className={cn('flex items-start justify-between gap-4', className)} ref={ref} {...props}>
        <div className={'space-y-1'}>
          <div className={'flex items-center gap-3'}>
            <h1 className={'text-2xl font-semibold tracking-tight'}>{'Projects'}</h1>
            {/* Result count badge */}
            <Badge size={'sm'} variant={'default'}>
              {isFiltered ? `${filteredCount} of ${totalCount}` : `${filteredCount}`}
            </Badge>
          </div>
          <p className={'text-muted-foreground'}>{'Manage your projects and repositories.'}</p>
        </div>

        {/* Create Project Button */}
        <CreateProjectDialog
          trigger={
            <Button>
              <Plus aria-hidden={'true'} className={'size-4'} />
              {'Create Project'}
            </Button>
          }
        />
      </header>
    </Fragment>
  );
};
