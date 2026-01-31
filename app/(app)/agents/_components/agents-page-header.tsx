'use client';

import type { ComponentPropsWithRef } from 'react';

import { Plus } from 'lucide-react';
import { Fragment } from 'react';

import { AgentEditorDialog } from '@/components/agents/agent-editor-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AgentsPageHeaderProps extends ComponentPropsWithRef<'header'> {
  /** Number of agents after filtering */
  filteredCount: number;
  /** Whether the list is currently filtered */
  isFiltered: boolean;
  /** Total number of agents */
  totalCount: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Header section for the agents page.
 *
 * Displays the page title, description, result count badge,
 * and a Create Agent button that opens the AgentEditorDialog.
 *
 * @example
 * ```tsx
 * <AgentsPageHeader
 *   filteredCount={10}
 *   totalCount={25}
 *   isFiltered={true}
 * />
 * ```
 */
export const AgentsPageHeader = ({
  className,
  filteredCount,
  isFiltered,
  ref,
  totalCount,
  ...props
}: AgentsPageHeaderProps) => {
  return (
    <Fragment>
      {/* Skip link for keyboard navigation */}
      <a
        className={cn(
          'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
          'z-50 rounded-md bg-background px-4 py-2 text-sm font-medium',
          'ring-2 ring-accent ring-offset-2'
        )}
        href={'#agent-content'}
      >
        {'Skip to agent content'}
      </a>

      {/* Page heading */}
      <header className={cn('flex items-start justify-between gap-4', className)} ref={ref} {...props}>
        <div className={'space-y-1'}>
          <div className={'flex items-center gap-3'}>
            <h1 className={'text-2xl font-semibold tracking-tight'}>{'Agents'}</h1>
            {/* Result count badge */}
            <Badge size={'sm'} variant={'default'}>
              {isFiltered ? `${filteredCount} of ${totalCount}` : `${filteredCount}`}
            </Badge>
          </div>
          <p className={'text-muted-foreground'}>{'Manage and customize AI agents for your workflows.'}</p>
        </div>

        {/* Create Agent Button */}
        <AgentEditorDialog
          mode={'create'}
          trigger={
            <Button>
              <Plus aria-hidden={'true'} className={'size-4'} />
              {'Create Agent'}
            </Button>
          }
        />
      </header>
    </Fragment>
  );
};
