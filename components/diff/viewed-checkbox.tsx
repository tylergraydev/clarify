'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ViewedCheckboxProps {
  className?: string;
  isViewed: boolean;
  onToggle: () => void;
}

export const ViewedCheckbox = ({ className, isViewed, onToggle }: ViewedCheckboxProps) => {
  return (
    <button
      aria-checked={isViewed}
      aria-label={isViewed ? 'Mark as unviewed' : 'Mark as viewed'}
      className={cn(
        'inline-flex size-5 items-center justify-center rounded-sm border transition-colors',
        isViewed
          ? 'border-green-500 bg-green-500 text-white'
          : 'border-border bg-background text-transparent hover:border-muted-foreground',
        className
      )}
      onClick={onToggle}
      role={'checkbox'}
      type={'button'}
    >
      <Check aria-hidden={'true'} className={'size-3'} />
    </button>
  );
};
