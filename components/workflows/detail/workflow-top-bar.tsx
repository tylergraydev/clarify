'use client';

import type { ComponentPropsWithRef } from 'react';

import { Ban, Pause, RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type WorkflowTopBarProps = ComponentPropsWithRef<'div'>;

export const WorkflowTopBar = ({ className, ref, ...props }: WorkflowTopBarProps) => {
  const handlePauseClick = () => {
    // No-op: placeholder for pause action
  };

  const handleCancelClick = () => {
    // No-op: placeholder for cancel action
  };

  const handleRestartClick = () => {
    // No-op: placeholder for restart action
  };

  return (
    <div
      className={cn(
        `
          sticky top-0 z-40 flex h-(--workflow-header-height) flex-col
          justify-center bg-background
        `,
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Header Content */}
      <div className={'flex items-center justify-between px-6'}>
        {/* Left Side: Name, Status, Elapsed Time */}
        <div className={'flex items-center gap-3'}>
          <h1 className={'text-lg font-semibold text-foreground'}>Feature Implementation</h1>
          <Badge variant={'planning'}>Running</Badge>
          <span className={'text-sm text-muted-foreground'}>12m 34s</span>
          <span className={'text-xs text-muted-foreground'}>Auto Pause</span>
        </div>

        {/* Right Side: Action Buttons */}
        <div className={'flex items-center gap-2'}>
          <Tooltip content={'Pause workflow'}>
            <Button onClick={handlePauseClick} size={'sm'} variant={'outline'}>
              <Pause aria-hidden={'true'} className={'size-4'} />
              Pause
            </Button>
          </Tooltip>

          <Tooltip content={'Cancel workflow'}>
            <Button onClick={handleCancelClick} size={'sm'} variant={'destructive'}>
              <Ban aria-hidden={'true'} className={'size-4'} />
              Cancel
            </Button>
          </Tooltip>

          <Tooltip content={'Restart workflow'}>
            <Button onClick={handleRestartClick} size={'sm'} variant={'secondary'}>
              <RotateCcw aria-hidden={'true'} className={'size-4'} />
              Restart
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Bottom Separator */}
      <Separator className={'mt-auto'} />
    </div>
  );
};
