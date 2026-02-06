'use client';

import type { ComponentPropsWithRef } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Ban, Pause, Play } from 'lucide-react';
import { Fragment, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { useCancelWorkflow, usePauseWorkflow, useResumeWorkflow, useWorkflow } from '@/hooks/queries';
import { useElectronDb } from '@/hooks/use-electron';
import { stepKeys } from '@/lib/queries/steps';
import { capitalizeFirstLetter, cn, getWorkflowStatusVariant } from '@/lib/utils';

import { ConfirmCancelWorkflowDialog } from './confirm-cancel-workflow-dialog';

const PAUSE_BEHAVIOR_LABELS: Record<string, string> = {
  auto_pause: 'Auto Pause',
  continuous: 'Continuous',
};

interface WorkflowTopBarProps extends ComponentPropsWithRef<'div'> {
  workflowId: number;
}

export const WorkflowTopBar = ({ className, ref, workflowId, ...props }: WorkflowTopBarProps) => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const { data: workflow } = useWorkflow(workflowId);
  const { isElectron, steps } = useElectronDb();

  const { data: workflowSteps } = useQuery({
    ...stepKeys.byWorkflow(workflowId),
    enabled: isElectron && workflowId > 0,
    queryFn: () => steps.list(workflowId),
  });

  const pauseMutation = usePauseWorkflow();
  const resumeMutation = useResumeWorkflow();
  const cancelMutation = useCancelWorkflow();

  if (!workflow) return null;

  const status = workflow.status;

  // Derive current step display text
  const getStepDisplayText = (): null | string => {
    if (!workflowSteps) return null;

    switch (status) {
      case 'cancelled': {
        const lastNonPendingStep = [...workflowSteps]
          .reverse()
          .find((s) => s.status !== 'pending');
        return lastNonPendingStep ? `Cancelled at ${lastNonPendingStep.title}` : null;
      }
      case 'completed':
        return 'All steps completed';
      case 'failed': {
        const failedStep = workflowSteps.find((s) => s.status === 'failed');
        return failedStep ? `Failed at ${failedStep.title}` : null;
      }
      case 'paused':
      case 'running': {
        const activeStep = workflowSteps.find((s) => s.status === 'running' || s.status === 'paused');
        return activeStep?.title ?? null;
      }
      default:
        return null;
    }
  };

  const stepDisplayText = getStepDisplayText();
  const showPauseBehavior = status === 'running' || status === 'paused';
  const isActive = status === 'running' || status === 'paused';

  const handlePauseClick = () => {
    pauseMutation.mutate(workflowId);
  };

  const handleResumeClick = () => {
    resumeMutation.mutate(workflowId);
  };

  const handleCancelConfirm = () => {
    cancelMutation.mutate(workflowId, {
      onSuccess: () => {
        setIsCancelDialogOpen(false);
      },
    });
  };

  return (
    <Fragment>
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
          {/* Left Side: Name, Status, Step, Pause Behavior */}
          <div className={'flex items-center gap-3'}>
            <h1 className={'text-lg font-semibold text-foreground'}>{workflow.featureName}</h1>
            <Badge variant={getWorkflowStatusVariant(status)}>
              {capitalizeFirstLetter(status)}
            </Badge>
            {stepDisplayText && (
              <span className={'text-sm text-muted-foreground'}>{stepDisplayText}</span>
            )}
            {showPauseBehavior && (
              <span className={'text-xs text-muted-foreground'}>
                {PAUSE_BEHAVIOR_LABELS[workflow.pauseBehavior] ?? capitalizeFirstLetter(workflow.pauseBehavior)}
              </span>
            )}
          </div>

          {/* Right Side: Action Buttons */}
          {isActive && (
            <div className={'flex items-center gap-2'}>
              {status === 'running' && (
                <Tooltip content={'Pause workflow'}>
                  <Button
                    disabled={pauseMutation.isPending}
                    onClick={handlePauseClick}
                    size={'sm'}
                    variant={'outline'}
                  >
                    <Pause aria-hidden={'true'} className={'size-4'} />
                    Pause
                  </Button>
                </Tooltip>
              )}

              {status === 'paused' && (
                <Tooltip content={'Resume workflow'}>
                  <Button
                    disabled={resumeMutation.isPending}
                    onClick={handleResumeClick}
                    size={'sm'}
                    variant={'outline'}
                  >
                    <Play aria-hidden={'true'} className={'size-4'} />
                    Resume
                  </Button>
                </Tooltip>
              )}

              <Tooltip content={'Cancel workflow'}>
                <Button
                  disabled={cancelMutation.isPending}
                  onClick={() => setIsCancelDialogOpen(true)}
                  size={'sm'}
                  variant={'destructive'}
                >
                  <Ban aria-hidden={'true'} className={'size-4'} />
                  Cancel
                </Button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Bottom Separator */}
        <Separator className={'mt-auto'} />
      </div>

      <ConfirmCancelWorkflowDialog
        featureName={workflow.featureName}
        isLoading={cancelMutation.isPending}
        isOpen={isCancelDialogOpen}
        onConfirm={handleCancelConfirm}
        onOpenChange={setIsCancelDialogOpen}
      />
    </Fragment>
  );
};
