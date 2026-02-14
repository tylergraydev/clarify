'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const prStatusVariants = cva(
  'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    defaultVariants: {
      status: 'open',
    },
    variants: {
      status: {
        closed: 'bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-100',
        draft: 'bg-neutral-200 text-neutral-900 dark:bg-neutral-900/60 dark:text-neutral-100',
        merged: 'bg-purple-200 text-purple-900 dark:bg-purple-900/60 dark:text-purple-100',
        open: 'bg-green-200 text-green-900 dark:bg-green-900/60 dark:text-green-100',
      },
    },
  }
);

type PrStatusBadgeProps = VariantProps<typeof prStatusVariants> & {
  className?: string;
  isDraft?: boolean;
  state: 'CLOSED' | 'MERGED' | 'OPEN';
};

export const PrStatusBadge = ({ className, isDraft, state }: PrStatusBadgeProps) => {
  const status = isDraft ? 'draft' : state === 'MERGED' ? 'merged' : state === 'CLOSED' ? 'closed' : 'open';
  const label = isDraft ? 'Draft' : state === 'MERGED' ? 'Merged' : state === 'CLOSED' ? 'Closed' : 'Open';

  return <span className={cn(prStatusVariants({ status }), className)}>{label}</span>;
};
