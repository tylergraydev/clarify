'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import type { FileDiff } from '@/types/diff';

import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex size-5 items-center justify-center rounded-sm text-[10px] font-bold',
  {
    defaultVariants: {
      status: 'modified',
    },
    variants: {
      status: {
        added: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        copied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        modified: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        renamed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      },
    },
  }
);

const STATUS_LABELS: Record<FileDiff['status'], string> = {
  added: 'A',
  copied: 'C',
  deleted: 'D',
  modified: 'M',
  renamed: 'R',
};

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  className?: string;
  status: FileDiff['status'];
}

export const StatusBadge = ({ className, status }: StatusBadgeProps) => {
  return (
    <span
      aria-label={status}
      className={cn(statusBadgeVariants({ status }), className)}
      title={status}
    >
      {STATUS_LABELS[status]}
    </span>
  );
};
