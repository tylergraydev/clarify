'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type EmptyStateProps = ClassName<{
  action?: ReactNode;
  description?: string;
  icon?: ReactNode;
  title: string;
}>;

export function EmptyState({ action, className, description, icon, title }: EmptyStateProps) {
  return (
    <div
      className={cn(
        `
      flex flex-col items-center justify-center py-12 text-center
    `,
        className
      )}
    >
      {icon && (
        <div
          className={`
            mb-4 flex size-12 items-center justify-center rounded-full bg-muted
            text-muted-foreground
          `}
        >
          {icon}
        </div>
      )}
      <h3 className={'text-lg font-semibold'}>{title}</h3>
      {description && (
        <p
          className={`
        mt-1 max-w-sm text-sm text-muted-foreground
      `}
        >
          {description}
        </p>
      )}
      {action && <div className={'mt-4'}>{action}</div>}
    </div>
  );
}
