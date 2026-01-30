'use client';

import type { ComponentPropsWithRef } from 'react';

import { Pause, Play, XCircle } from 'lucide-react';

import type { workflowStatuses } from '@/db/schema/workflows.schema';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkflowControlBarProps extends ComponentPropsWithRef<'div'> {
  isCancelPending?: boolean;
  isPausePending?: boolean;
  isResumePending?: boolean;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  status: WorkflowStatus;
}

type WorkflowStatus = (typeof workflowStatuses)[number];

export const WorkflowControlBar = ({
  className,
  isCancelPending = false,
  isPausePending = false,
  isResumePending = false,
  onCancel,
  onPause,
  onResume,
  ref,
  status,
  ...props
}: WorkflowControlBarProps) => {
  const isPauseEnabled = status === 'running';
  const isResumeEnabled = status === 'paused';
  const isCancelEnabled = status === 'created' || status === 'running' || status === 'paused';

  const handlePauseClick = () => {
    onPause?.();
  };

  const handleResumeClick = () => {
    onResume?.();
  };

  const handleCancelClick = () => {
    onCancel?.();
  };

  return (
    <div className={cn('flex items-center gap-2', className)} ref={ref} {...props}>
      {/* Pause Button */}
      {isPauseEnabled && (
        <Button disabled={isPausePending} onClick={handlePauseClick} size={'sm'} variant={'outline'}>
          <Pause className={'size-4'} />
          {isPausePending ? 'Pausing...' : 'Pause'}
        </Button>
      )}

      {/* Resume Button */}
      {isResumeEnabled && (
        <Button disabled={isResumePending} onClick={handleResumeClick} size={'sm'} variant={'outline'}>
          <Play className={'size-4'} />
          {isResumePending ? 'Resuming...' : 'Resume'}
        </Button>
      )}

      {/* Cancel Button */}
      {isCancelEnabled && (
        <Button disabled={isCancelPending} onClick={handleCancelClick} size={'sm'} variant={'destructive'}>
          <XCircle className={'size-4'} />
          {isCancelPending ? 'Cancelling...' : 'Cancel'}
        </Button>
      )}
    </div>
  );
};
