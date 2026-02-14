'use client';

import { FileCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

interface DiffEmptyStateProps {
  className?: string;
  description?: string;
  title?: string;
}

export const DiffEmptyState = ({
  className,
  description,
  title = 'No changes to display',
}: DiffEmptyStateProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground', className)}>
      <FileCheck aria-hidden={'true'} className={'size-10 opacity-40'} />
      <p className={'text-sm'}>{title}</p>
      {description && (
        <p className={'max-w-xs text-center text-xs text-muted-foreground/70'}>{description}</p>
      )}
    </div>
  );
};
