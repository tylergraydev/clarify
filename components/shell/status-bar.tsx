'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { TerminalSquare } from 'lucide-react';

import { useTerminalStore } from '@/lib/stores/terminal-store';
import { cn } from '@/lib/utils';

export const statusIndicatorVariants = cva(
  `
    size-2 shrink-0 rounded-full
  `,
  {
    defaultVariants: {
      status: 'online',
    },
    variants: {
      status: {
        offline: 'bg-destructive',
        online: 'bg-green-500',
        syncing: 'animate-pulse bg-yellow-500',
      },
    },
  }
);

interface StatusBarProps extends ComponentPropsWithRef<'footer'> {
  activeWorkflowCount?: number;
  status?: StatusIndicatorVariants['status'];
}

type StatusIndicatorVariants = VariantProps<typeof statusIndicatorVariants>;

export const StatusBar = ({ activeWorkflowCount = 0, className, ref, status = 'online', ...props }: StatusBarProps) => {
  const { tabs, toggle } = useTerminalStore();

  const workflowText =
    activeWorkflowCount === 0
      ? 'No active workflows'
      : activeWorkflowCount === 1
        ? '1 active workflow'
        : `${activeWorkflowCount} active workflows`;

  const statusAriaLabel = status === 'online' ? 'Online' : status === 'syncing' ? 'Syncing' : 'Offline';

  return (
    <footer
      className={cn('fixed inset-x-0 bottom-0 z-40 h-8 border-t border-border bg-background', className)}
      ref={ref}
      {...props}
    >
      <div className={'flex h-full items-center justify-between px-4'}>
        {/* Workflow Status */}
        <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
          <span aria-label={statusAriaLabel} className={cn(statusIndicatorVariants({ status }))} role={'status'} />
          <span>{workflowText}</span>
        </div>

        {/* Terminal indicator */}
        {tabs.length > 0 && (
          <button
            className={'flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground'}
            onClick={toggle}
          >
            <TerminalSquare className={'size-3.5'} />
            <span>{tabs.length === 1 ? '1 terminal' : `${tabs.length} terminals`}</span>
          </button>
        )}
      </div>
    </footer>
  );
};
