'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Visual state of the connector, derived from step status.
 */
export type VerticalConnectorState = 'active' | 'completed' | 'pending';

export const verticalConnectorLineVariants = cva('w-0.5 transition-colors duration-200', {
  defaultVariants: {
    state: 'pending',
  },
  variants: {
    state: {
      active: 'bg-accent',
      completed: 'bg-accent',
      pending: 'bg-border opacity-50',
    },
  },
});

export const verticalConnectorNodeVariants = cva(
  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all duration-200',
  {
    defaultVariants: {
      state: 'pending',
    },
    variants: {
      state: {
        active: 'bg-accent text-accent-foreground ring-4 ring-accent/20',
        completed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        pending: 'bg-muted text-muted-foreground',
      },
    },
  }
);

interface VerticalConnectorProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children'>, VariantProps<typeof verticalConnectorLineVariants> {
  /** Whether this is the first step (no top connector) */
  isFirst?: boolean;
  /** Whether this is the last step (no bottom connector) */
  isLast?: boolean;
  /** The step number to display in the node */
  stepNumber: number;
}

/**
 * Vertical connector with step number node for the pipeline layout.
 *
 * Renders:
 * - Top connector line (unless first step)
 * - Step number in a circular node
 * - Bottom connector line (unless last step)
 *
 * The connector is positioned absolutely on the left side of the step container.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <VerticalConnector
 *     stepNumber={1}
 *     state="completed"
 *     isFirst
 *   />
 *   <PipelineStep className="ml-14" />
 * </div>
 * ```
 */
export const VerticalConnector = ({
  className,
  isFirst = false,
  isLast = false,
  state = 'pending',
  stepNumber,
  ...props
}: VerticalConnectorProps) => {
  return (
    <div
      aria-hidden={'true'}
      className={cn('absolute top-0 bottom-0 left-0 flex w-12 flex-col items-center', className)}
      {...props}
    >
      {/* Top connector line (not on first step) */}
      {!isFirst && <div className={cn(verticalConnectorLineVariants({ state }), 'h-4')} />}

      {/* Step number node */}
      <div className={verticalConnectorNodeVariants({ state })}>{stepNumber}</div>

      {/* Bottom connector line (not on last step) */}
      {!isLast && <div className={cn(verticalConnectorLineVariants({ state }), 'flex-1')} />}
    </div>
  );
};
