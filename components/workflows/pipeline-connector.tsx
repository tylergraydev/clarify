'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const pipelineConnectorVariants = cva(
  `
    h-0.5 flex-1 rounded-full transition-colors
  `,
  {
    defaultVariants: {
      state: 'pending',
    },
    variants: {
      state: {
        completed: 'bg-accent',
        pending: 'bg-border opacity-50',
      },
    },
  }
);

type PipelineConnectorProps = Omit<ComponentPropsWithRef<'div'>, 'children'> &
  VariantProps<typeof pipelineConnectorVariants> & {
    isCompleted?: boolean;
  };

export const PipelineConnector = ({
  className,
  isCompleted = false,
  ref,
  state,
  ...props
}: PipelineConnectorProps) => {
  const resolvedState = state ?? (isCompleted ? 'completed' : 'pending');

  return (
    <div
      aria-hidden={'true'}
      className={cn(pipelineConnectorVariants({ state: resolvedState }), className)}
      ref={ref}
      {...props}
    />
  );
};
