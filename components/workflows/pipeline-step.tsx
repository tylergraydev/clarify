'use client';

import type { ComponentPropsWithRef, KeyboardEvent } from 'react';

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleCheck, CircleDashed, FileText, Lightbulb, Loader2, MessageSquare, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Visual status of the pipeline step.
 */
export type PipelineStepStatus = 'completed' | 'pending' | 'running';

/**
 * Step type for the pipeline. Each type maps to a specific icon.
 */
export type PipelineStepType = 'clarification' | 'discovery' | 'planning' | 'refinement';

/**
 * Maps step types to their corresponding icons.
 */
const stepTypeIcons: Record<PipelineStepType, typeof MessageSquare> = {
  clarification: MessageSquare,
  discovery: Search,
  planning: FileText,
  refinement: Lightbulb,
};

/**
 * Maps step status to badge variants.
 */
const statusBadgeVariants: Record<PipelineStepStatus, 'completed' | 'default' | 'pending'> = {
  completed: 'completed',
  pending: 'pending',
  running: 'default',
};

/**
 * Human-readable status labels.
 */
const statusLabels: Record<PipelineStepStatus, string> = {
  completed: 'Completed',
  pending: 'Pending',
  running: 'Running',
};

export const pipelineStepVariants = cva(
  `
    flex flex-col rounded-lg border transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
    data-disabled:pointer-events-none data-disabled:opacity-50
  `,
  {
    defaultVariants: {
      status: 'pending',
    },
    variants: {
      status: {
        completed: 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
        pending: 'border-border bg-muted/30 opacity-60',
        running: 'border-accent bg-accent/5',
      },
    },
  }
);

interface PipelineStepProps
  extends Omit<ComponentPropsWithRef<'div'>, 'title'>,
    VariantProps<typeof pipelineStepVariants> {
  /** Whether the step is currently expanded */
  isExpanded: boolean;
  /** Callback when expand/collapse is toggled */
  onToggle: () => void;
  /** Output content to display when expanded */
  output?: string;
  /** The type of step (determines icon) */
  stepType: PipelineStepType;
  /** The title of the step */
  title: string;
}

export const PipelineStep = ({
  className,
  isExpanded,
  onToggle,
  output,
  ref,
  status = 'pending',
  stepType,
  title,
  ...props
}: PipelineStepProps) => {
  const Icon = stepTypeIcons[stepType];
  const isRunning = status === 'running';
  const isCompleted = status === 'completed';
  const isPending = status === 'pending';

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <BaseCollapsible.Root onOpenChange={onToggle} open={isExpanded}>
      <div
        className={cn(pipelineStepVariants({ status }), className)}
        ref={ref}
        {...props}
      >
        {/* Step Header */}
        <BaseCollapsible.Trigger
          aria-expanded={isExpanded}
          aria-label={`${title} - ${statusLabels[status ?? 'pending']}. ${isExpanded ? 'Click to collapse' : 'Click to expand'}`}
          className={`
            flex w-full cursor-pointer items-center gap-3 p-4
            transition-colors hover:bg-muted/50
            focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
            focus-visible:outline-none
          `}
          onKeyDown={handleKeyDown}
        >
          {/* Step Icon */}
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              isCompleted && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
              isRunning && 'bg-accent/20 text-accent',
              isPending && 'bg-muted text-muted-foreground'
            )}
          >
            <Icon aria-hidden={'true'} className={'size-4'} />
          </div>

          {/* Title */}
          <span className={'flex-1 text-left text-sm font-medium'}>{title}</span>

          {/* Status Indicator */}
          <div className={'flex items-center gap-2'}>
            {isCompleted && (
              <CircleCheck
                aria-label={'Completed'}
                className={'size-5 text-green-600 dark:text-green-400'}
              />
            )}
            {isRunning && (
              <Loader2
                aria-label={'Running'}
                className={'size-5 animate-spin text-accent'}
              />
            )}
            {isPending && (
              <CircleDashed
                aria-label={'Pending'}
                className={'size-5 text-muted-foreground'}
              />
            )}
          </div>
        </BaseCollapsible.Trigger>

        {/* Expanded Content */}
        <BaseCollapsible.Panel
          className={`
            flex h-(--collapsible-panel-height) flex-col overflow-hidden
            transition-all duration-200 ease-out
            data-ending-style:h-0
            data-starting-style:h-0
          `}
        >
          <div className={'border-t border-border/50 p-4'}>
            {/* Status Badge */}
            <div className={'mb-3 flex items-center gap-2'}>
              <Badge size={'sm'} variant={statusBadgeVariants[status ?? 'pending']}>
                {statusLabels[status ?? 'pending']}
              </Badge>
            </div>

            {/* Output Container */}
            <div
              className={cn(
                'rounded-md border border-border/50 bg-background p-3',
                'min-h-20 text-sm'
              )}
            >
              {output ? (
                <p className={'whitespace-pre-wrap text-foreground'}>{output}</p>
              ) : (
                <p className={'text-muted-foreground'}>Output will appear here</p>
              )}
            </div>
          </div>
        </BaseCollapsible.Panel>
      </div>
    </BaseCollapsible.Root>
  );
};
