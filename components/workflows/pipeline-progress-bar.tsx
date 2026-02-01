'use client';

import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/utils';

interface PipelineProgressBarProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Number of completed steps */
  completedSteps: number;
  /** Title of the current step being executed */
  currentStepTitle?: string;
  /** Total number of steps in the pipeline */
  totalSteps: number;
}

/**
 * Sticky progress bar that shows pipeline completion status.
 *
 * Displays the current step title, step count (X / Y), and a visual progress bar.
 * Designed to be placed at the top of the pipeline view with sticky positioning.
 *
 * @example
 * ```tsx
 * <PipelineProgressBar
 *   completedSteps={2}
 *   totalSteps={5}
 *   currentStepTitle="Discovery"
 * />
 * ```
 */
export const PipelineProgressBar = ({
  className,
  completedSteps,
  currentStepTitle,
  totalSteps,
  ...props
}: PipelineProgressBarProps) => {
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const progressLabel = `${completedSteps} of ${totalSteps} steps completed`;

  return (
    <div className={cn('border-b border-border px-4 py-3', className)} {...props}>
      <div className={'mx-auto max-w-4xl'}>
        {/* Progress header with title and count */}
        <div className={'mb-2 flex items-center justify-between text-sm'}>
          <span className={'font-medium text-foreground'}>{currentStepTitle ?? 'Pipeline Progress'}</span>
          <span className={'text-muted-foreground'}>
            {completedSteps} / {totalSteps} steps
          </span>
        </div>

        {/* Progress bar */}
        <div
          aria-label={progressLabel}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(progress)}
          className={'h-1.5 w-full overflow-hidden rounded-full bg-muted'}
          role={'progressbar'}
        >
          <div
            className={'h-full rounded-full bg-accent transition-all duration-300 ease-out'}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
