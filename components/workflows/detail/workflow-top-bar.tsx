'use client';

import type { ComponentPropsWithRef } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Ban, GitPullRequest, Pause, Play, TerminalSquare } from 'lucide-react';
import { Fragment, useState } from 'react';

import { CreatePrDialog } from '@/components/pulls/create-pr-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { useCancelWorkflow, usePauseWorkflow, useQueuePosition, useResumeWorkflow, useWorkflow } from '@/hooks/queries';
import { useGitHubAuth } from '@/hooks/queries/use-github';
import { useElectronDb } from '@/hooks/use-electron';
import { useTerminal } from '@/hooks/use-terminal';
import { stepKeys } from '@/lib/queries/steps';
import { capitalizeFirstLetter, cn, getWorkflowStatusLabel, getWorkflowStatusVariant } from '@/lib/utils';
import { isGitHubRepo } from '@/lib/utils/github';

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
  const [isCreatePrOpen, setIsCreatePrOpen] = useState(false);

  const { data: workflow } = useWorkflow(workflowId);
  const { diff, isElectron, repositories, steps, workflowRepositories } = useElectronDb();

  const { data: workflowSteps } = useQuery({
    ...stepKeys.listByWorkflow(workflowId),
    enabled: isElectron && workflowId > 0,
    queryFn: () => steps.list(workflowId),
  });

  const { data: queuePosition } = useQueuePosition(workflowId, workflow?.status);
  const { data: ghAuth } = useGitHubAuth();

  // Fetch workflow repositories for "Create PR" button
  const { data: workflowRepos } = useQuery({
    enabled: isElectron && workflow?.status === 'completed',
    queryFn: async () => {
      const repoAssociations = await workflowRepositories.list(workflowId);
      const repos = await Promise.all(
        repoAssociations.map((wr) => repositories.get(wr.repositoryId))
      );
      return repos.filter(Boolean);
    },
    queryKey: ['workflowRepos', workflowId],
  });

  // Fetch branches for the first GitHub repo
  const firstGitHubRepo = workflowRepos?.find((r) => isGitHubRepo(r?.remoteUrl));
  const { data: branches = [] } = useQuery({
    enabled: isElectron && !!firstGitHubRepo?.path,
    queryFn: () => diff.getBranches(firstGitHubRepo!.path),
    queryKey: ['branches', firstGitHubRepo?.path],
  });

  // Fetch worktree for "Open Terminal" button
  const { data: worktree } = useQuery({
    enabled: isElectron && workflowId > 0,
    queryFn: () => window.electronAPI!.worktree.getByWorkflowId(workflowId),
    queryKey: ['worktree', 'byWorkflow', workflowId],
  });

  const { createTerminal } = useTerminal();

  const pauseMutation = usePauseWorkflow();
  const resumeMutation = useResumeWorkflow();
  const cancelMutation = useCancelWorkflow();

  if (!workflow) return null;

  const status = workflow.status;
  const isQueued = status === 'queued';

  // Derive current step display text
  const getStepDisplayText = (): null | string => {
    if (!workflowSteps) return null;

    switch (status) {
      case 'awaiting_input': {
        const awaitingStep = workflowSteps.find((s) => s.status === 'awaiting_input');
        return awaitingStep ? `${awaitingStep.title} \u2014 Awaiting Input` : null;
      }
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

  const stepDisplayText = isQueued
    ? `Waiting in queue${queuePosition ? ` (position ${queuePosition})` : ''}`
    : getStepDisplayText();
  const showPauseBehavior = status === 'running' || status === 'paused' || status === 'awaiting_input';
  const isActive = status === 'running' || status === 'paused' || status === 'awaiting_input' || isQueued;
  const _isCreatePrVisible = status === 'completed' && firstGitHubRepo && ghAuth?.isAuthenticated;

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
              {getWorkflowStatusLabel(status)}
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

              <Tooltip content={isQueued ? 'Remove from queue' : 'Cancel workflow'}>
                <Button
                  disabled={cancelMutation.isPending}
                  onClick={() => setIsCancelDialogOpen(true)}
                  size={'sm'}
                  variant={'destructive'}
                >
                  <Ban aria-hidden={'true'} className={'size-4'} />
                  {isQueued ? 'Dequeue' : 'Cancel'}
                </Button>
              </Tooltip>
            </div>
          )}

          {/* Non-active action buttons */}
          {!isActive && (
            <div className={'flex items-center gap-2'}>
              {/* Open Terminal - shown when workflow has a worktree */}
              {worktree?.path && (
                <Tooltip content={'Open terminal in worktree directory'}>
                  <Button
                    onClick={() => createTerminal({ cwd: worktree.path, workflowId })}
                    size={'sm'}
                    variant={'outline'}
                  >
                    <TerminalSquare aria-hidden={'true'} className={'size-4'} />
                    {'Terminal'}
                  </Button>
                </Tooltip>
              )}

              {/* Create PR Button - shown when workflow is completed and has a GitHub repo */}
              {_isCreatePrVisible && (
                <Tooltip content={'Create pull request from workflow'}>
                  <Button
                    onClick={() => setIsCreatePrOpen(true)}
                    size={'sm'}
                    variant={'outline'}
                  >
                    <GitPullRequest aria-hidden={'true'} className={'size-4'} />
                    {'Create PR'}
                  </Button>
                </Tooltip>
              )}
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

      {firstGitHubRepo && (
        <CreatePrDialog
          branches={branches}
          defaultBody={workflow.featureRequest ?? ''}
          defaultTitle={workflow.featureName}
          isOpen={isCreatePrOpen}
          onOpenChange={setIsCreatePrOpen}
          repoPath={firstGitHubRepo.path}
        />
      )}
    </Fragment>
  );
};
