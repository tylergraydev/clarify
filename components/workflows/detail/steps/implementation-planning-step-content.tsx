'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, CheckCircle, Loader2, MessageSquare, Play, RotateCcw, Square, X } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useRef } from 'react';

import type {
  ImplementationPlan,
  ImplementationPlanStep,
  PlanIteration,
  PlanningStepOutput,
} from '@/lib/validations/planning';
import type { PlanningServicePhase } from '@/types/electron';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  useApprovePlan,
  usePlanningState,
  useRetryPlanning,
  useStartPlanning,
  useSubmitPlanFeedback,
} from '@/hooks/queries/use-planning';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { useWorkflow } from '@/hooks/queries/use-workflows';
import { useWorktreeByWorkflowId } from '@/hooks/queries/use-worktrees';
import { useElectronDb } from '@/hooks/use-electron';
import { stepKeys } from '@/lib/queries/steps';
import { useWorkflowDetailStore } from '@/lib/stores/workflow-detail-store';
import { cn } from '@/lib/utils';
import { planningStepOutputSchema } from '@/lib/validations/planning';

import { usePlanningStreamContext } from '../planning-stream-provider';

// =============================================================================
// Types
// =============================================================================

interface ImplementationPlanningStepContentProps {
  workflowId: number;
}

type UiPhase = 'approved' | 'error' | 'pending' | 'plan_review' | 'running';

// =============================================================================
// Constants
// =============================================================================

const PLANNING_STEP_TYPE = 'implementationPlanning';

const PHASE_LABELS: Record<PlanningServicePhase, string> = {
  awaiting_review: 'Plan ready for review',
  cancelled: 'Cancelled',
  complete: 'Complete',
  error: 'Error',
  executing: 'Generating implementation plan...',
  executing_extended_thinking: 'Analyzing codebase and thinking deeply...',
  idle: 'Idle',
  loading_agent: 'Loading agent configuration...',
  processing_response: 'Processing agent response...',
  regenerating: 'Regenerating plan with feedback...',
  timeout: 'Timed out',
};

const COMPLEXITY_COLORS = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
} as const;

// =============================================================================
// Utilities
// =============================================================================

function determineUiPhase(stepStatus: string, output: null | PlanningStepOutput, errorMessage: null | string): UiPhase {
  if (stepStatus === 'pending') return 'pending';
  if (stepStatus === 'running') return 'running';
  if (stepStatus === 'error' || errorMessage) return 'error';

  if (stepStatus === 'completed' && output?.approved) return 'approved';
  if (stepStatus === 'awaiting_input' && output) return 'plan_review';
  if (stepStatus === 'completed' && output && !output.approved) return 'plan_review';

  if (stepStatus === 'completed' && !output) return 'error';

  return 'pending';
}

function parseStepOutput(outputStructured: Record<string, unknown>): {
  output: null | PlanningStepOutput;
  parseError: boolean;
} {
  const result = planningStepOutputSchema.safeParse(outputStructured);
  if (result.success) {
    return { output: result.data, parseError: false };
  }
  return { output: null, parseError: true };
}

// =============================================================================
// Sub-Components
// =============================================================================

const PendingState = () => (
  <div className={'flex items-center gap-2 text-sm text-muted-foreground'}>
    <div className={'size-2 rounded-full bg-muted-foreground/40'} />
    <span>Implementation planning has not started yet.</span>
  </div>
);

const RunningState = ({ currentPhase }: { currentPhase: null | PlanningServicePhase }) => {
  const phaseText = currentPhase ? PHASE_LABELS[currentPhase] : 'Starting...';

  return (
    <div className={'flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4'}>
      <Loader2 aria-hidden={'true'} className={'size-5 shrink-0 animate-spin text-accent'} />
      <div className={'flex flex-col gap-0.5'}>
        <span className={'text-sm font-medium text-foreground'}>Running planning agent</span>
        <span className={'text-xs text-muted-foreground'}>{phaseText}</span>
      </div>
    </div>
  );
};

const ErrorState = ({
  errorMessage,
  isRetrying,
  onRetry,
}: {
  errorMessage: string;
  isRetrying: boolean;
  onRetry: () => void;
}) => (
  <div className={'flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4'}>
    <div className={'flex items-center gap-2'}>
      <AlertTriangle aria-hidden={'true'} className={'size-4 text-destructive'} />
      <span className={'text-sm font-medium text-destructive'}>Planning failed</span>
    </div>
    <p className={'text-sm text-muted-foreground'}>{errorMessage}</p>
    <div>
      <Button disabled={isRetrying} onClick={onRetry} size={'sm'} variant={'outline'}>
        <RotateCcw aria-hidden={'true'} className={'size-3.5'} />
        {isRetrying ? 'Retrying...' : 'Retry'}
      </Button>
    </div>
  </div>
);

const PlanSummaryHeader = ({ isApproved, plan }: { isApproved: boolean; plan: ImplementationPlan }) => {
  const _hasRisks = !!plan.risks && plan.risks.length > 0;

  return (
    <div className={'flex flex-col gap-3'}>
      <div className={'flex items-center gap-2'}>
        {isApproved && (
          <Badge size={'sm'} variant={'completed'}>
            <CheckCircle aria-hidden={'true'} className={'size-3'} />
            Approved
          </Badge>
        )}
        <Badge
          className={cn('text-xs', COMPLEXITY_COLORS[plan.estimatedComplexity as keyof typeof COMPLEXITY_COLORS])}
          size={'sm'}
        >
          {plan.estimatedComplexity} complexity
        </Badge>
      </div>

      <p className={'text-sm text-foreground'}>{plan.summary}</p>

      <div className={'flex flex-col gap-1'}>
        <h4 className={'text-xs font-medium text-muted-foreground'}>Approach</h4>
        <p className={'text-sm text-foreground'}>{plan.approach}</p>
      </div>

      {_hasRisks && plan.risks && (
        <div className={'flex flex-col gap-1.5'}>
          <h4 className={'text-xs font-medium text-muted-foreground'}>Risks</h4>
          <ul className={'flex flex-col gap-1'}>
            {plan.risks.map((risk, i) => (
              <li className={'flex items-start gap-2 text-sm text-foreground'} key={i}>
                <AlertTriangle aria-hidden={'true'} className={'mt-0.5 size-3.5 shrink-0 text-yellow-500'} />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const PlanStepList = ({
  onSelectStep,
  selectedIndex,
  steps,
}: {
  onSelectStep: (index: number) => void;
  selectedIndex: number;
  steps: Array<ImplementationPlanStep>;
}) => (
  <div className={'flex flex-col gap-1 overflow-y-auto rounded-md border border-border p-2'}>
    {steps.map((step, index) => {
      const isSelected = index === selectedIndex;

      return (
        <button
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
            'hover:bg-muted',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none',
            isSelected && 'bg-accent text-accent-foreground hover:bg-accent-hover'
          )}
          key={index}
          onClick={() => onSelectStep(index)}
          type={'button'}
        >
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
              isSelected ? 'bg-accent-foreground/20 text-accent-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {step.order}
          </span>
          <span className={'truncate font-medium'}>{step.title}</span>
        </button>
      );
    })}
  </div>
);

const PlanStepDetail = ({ step, stepIndex }: { step: ImplementationPlanStep; stepIndex: number }) => (
  <div className={'flex flex-col gap-5'}>
    <div className={'flex flex-col gap-1'}>
      <h3 className={'text-base font-semibold text-foreground'}>
        Step {stepIndex + 1}: {step.title}
      </h3>
      <p className={'text-sm text-muted-foreground'}>{step.description}</p>
    </div>

    <div className={'flex flex-col gap-2'}>
      <h4 className={'text-sm font-medium text-foreground'}>Files</h4>
      <div className={'flex flex-wrap gap-1.5'}>
        {step.files.map((file) => (
          <code className={'rounded-md bg-muted px-2 py-0.5 text-xs text-foreground'} key={file}>
            {file}
          </code>
        ))}
      </div>
    </div>

    {step.validationCommands.length > 0 && (
      <div className={'flex flex-col gap-2'}>
        <h4 className={'text-sm font-medium text-foreground'}>Validation Commands</h4>
        <pre className={'overflow-x-auto rounded-md border border-border bg-muted p-3 text-xs text-foreground'}>
          {step.validationCommands.join('\n')}
        </pre>
      </div>
    )}

    {step.successCriteria.length > 0 && (
      <div className={'flex flex-col gap-2'}>
        <h4 className={'text-sm font-medium text-foreground'}>Success Criteria</h4>
        <ul className={'flex flex-col gap-1.5'}>
          {step.successCriteria.map((criterion) => (
            <li className={'flex items-start gap-2 text-sm text-foreground'} key={criterion}>
              <span className={'mt-0.5 shrink-0 text-muted-foreground'}>
                <Square aria-hidden={'true'} className={'size-4'} />
              </span>
              {criterion}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const VersionSelector = ({
  activeVersion,
  iterations,
  onVersionChange,
}: {
  activeVersion: number;
  iterations: Array<PlanIteration>;
  onVersionChange: (version: number) => void;
}) => {
  if (iterations.length <= 1) return null;

  return (
    <div className={'flex items-center gap-2'}>
      <span className={'text-xs text-muted-foreground'}>Version:</span>
      <div className={'flex gap-1'}>
        {iterations.map((iteration, index) => (
          <button
            className={cn(
              'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
              index === activeVersion
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
            )}
            key={iteration.version}
            onClick={() => onVersionChange(index)}
            type={'button'}
          >
            v{iteration.version}
            {iteration.editedByUser && ' (edited)'}
          </button>
        ))}
      </div>
    </div>
  );
};

const FeedbackForm = ({
  feedbackText,
  isSubmitting,
  onCancel,
  onFeedbackChange,
  onSubmit,
}: {
  feedbackText: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onFeedbackChange: (text: string) => void;
  onSubmit: () => void;
}) => (
  <div className={'flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-4'}>
    <label className={'text-sm font-medium text-foreground'} htmlFor={'plan-feedback'}>
      Provide feedback on the plan
    </label>
    <textarea
      className={
        'resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none'
      }
      id={'plan-feedback'}
      onChange={(e) => onFeedbackChange(e.target.value)}
      placeholder={'Describe what should be changed, added, or removed from the plan...'}
      rows={4}
      value={feedbackText}
    />
    <div className={'flex items-center gap-2'}>
      <Button disabled={isSubmitting || !feedbackText.trim()} onClick={onSubmit} size={'sm'}>
        <MessageSquare aria-hidden={'true'} className={'size-3.5'} />
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
      <Button onClick={onCancel} size={'sm'} variant={'ghost'}>
        <X aria-hidden={'true'} className={'size-3.5'} />
        Cancel
      </Button>
    </div>
  </div>
);

// =============================================================================
// Main Component
// =============================================================================

/**
 * Main content component for the implementation planning step.
 * Handles all execution states (pending, running, plan review, approved, error)
 * and wires action buttons to IPC mutation hooks.
 */
export const ImplementationPlanningStepContent = ({ workflowId }: ImplementationPlanningStepContentProps) => {
  const { isElectron, steps, workflowRepositories } = useElectronDb();

  // Fetch step data
  const { data: step, isLoading: isStepLoading } = useQuery({
    enabled: isElectron && workflowId > 0,
    queryFn: async () => {
      const workflowSteps = await steps.list(workflowId);
      return workflowSteps.find((s) => s.stepType === PLANNING_STEP_TYPE) ?? null;
    },
    queryKey: stepKeys.byWorkflow(workflowId).queryKey,
    select: (s) => {
      if (!s) return null;
      return {
        ...s,
        outputStructured: s.outputStructured ? (s.outputStructured as Record<string, unknown>) : null,
      };
    },
  });

  const { data: workflow } = useWorkflow(workflowId);

  // Repository path resolution
  const { data: workflowRepos } = useQuery({
    enabled: isElectron && workflowId > 0,
    queryFn: () => workflowRepositories.list(workflowId),
    queryKey: ['workflowRepositories', workflowId],
  });
  const { data: repositories } = useRepositoriesByProject(workflow?.projectId ?? 0);
  const { data: worktree } = useWorktreeByWorkflowId(workflowId);

  const repositoryPath = useMemo(() => {
    if (worktree?.path && worktree.status === 'active') return worktree.path;
    if (!workflowRepos || workflowRepos.length === 0 || !repositories || repositories.length === 0) return '';
    const workflowRepo = workflowRepos[0];
    if (workflowRepo) {
      const matchedRepo = repositories.find((r) => r.id === workflowRepo.repositoryId);
      if (matchedRepo) return matchedRepo.path;
    }
    return '';
  }, [worktree, repositories, workflowRepos]);

  // Zustand store state
  const planningActiveVersion = useWorkflowDetailStore((s) => s.planningActiveVersion);
  const planningFeedbackText = useWorkflowDetailStore((s) => s.planningFeedbackText);
  const planningSelectedStepIndex = useWorkflowDetailStore((s) => s.planningSelectedStepIndex);
  const planningIsEditing = useWorkflowDetailStore((s) => s.planningIsEditing);
  const clearPlanningState = useWorkflowDetailStore((s) => s.clearPlanningState);
  const setPlanningActiveVersion = useWorkflowDetailStore((s) => s.setPlanningActiveVersion);
  const setPlanningFeedbackText = useWorkflowDetailStore((s) => s.setPlanningFeedbackText);
  const setPlanningSelectedStepIndex = useWorkflowDetailStore((s) => s.setPlanningSelectedStepIndex);
  const setPlanningIsEditing = useWorkflowDetailStore((s) => s.setPlanningIsEditing);

  // Clear state on workflow navigation
  const prevWorkflowIdRef = useRef(workflowId);
  useEffect(() => {
    if (prevWorkflowIdRef.current !== workflowId) {
      clearPlanningState();
      prevWorkflowIdRef.current = workflowId;
    }
  }, [workflowId, clearPlanningState]);

  // Mutations
  const startMutation = useStartPlanning();
  const feedbackMutation = useSubmitPlanFeedback();
  const approveMutation = useApprovePlan();
  const retryMutation = useRetryPlanning();

  // Stream context
  const { currentPhase, reset: resetStream } = usePlanningStreamContext();

  // Service state
  const { data: serviceState, isLoading: isStateLoading } = usePlanningState(workflowId);

  // Parse output
  const { output: parsedOutput } = useMemo(() => {
    if (!step?.outputStructured) return { output: null, parseError: false };
    return parseStepOutput(step.outputStructured as Record<string, unknown>);
  }, [step]);

  // Determine UI phase
  const stepStatus = step?.status ?? 'pending';
  const uiPhase = useMemo(
    () => determineUiPhase(stepStatus, parsedOutput, step?.errorMessage ?? null),
    [stepStatus, parsedOutput, step?.errorMessage]
  );

  const resolvedStepId = step?.id ?? 0;

  // Active iteration and plan
  const iterations = parsedOutput?.iterations ?? [];
  const activeIteration = iterations[planningActiveVersion] ?? iterations[iterations.length - 1] ?? null;
  const activePlan = activeIteration?.plan ?? null;
  const isApproved = parsedOutput?.approved ?? false;

  // Selected step in the plan
  const planSteps = activePlan?.steps ?? [];
  const selectedStep = planSteps[planningSelectedStepIndex] ?? planSteps[0] ?? null;

  // Effective state booleans
  const isRunning = uiPhase === 'running';
  const isPendingPhase = uiPhase === 'pending';
  const isPlanReviewPhase = uiPhase === 'plan_review';
  const isApprovedPhase = uiPhase === 'approved';
  const isErrorPhase = uiPhase === 'error';
  const isShowFeedbackForm = planningIsEditing && isPlanReviewPhase;
  const isAnyMutationPending =
    startMutation.isPending || feedbackMutation.isPending || approveMutation.isPending || retryMutation.isPending;
  const isStepResolved = resolvedStepId > 0;

  // Handlers
  const handleStart = useCallback(() => {
    if (!repositoryPath || resolvedStepId === 0) return;

    resetStream();
    startMutation.mutate({
      repositoryPath,
      stepId: resolvedStepId,
      workflowId,
    });
  }, [repositoryPath, resetStream, startMutation, resolvedStepId, workflowId]);

  const handleRetry = useCallback(() => {
    if (!repositoryPath || resolvedStepId === 0) return;

    resetStream();
    retryMutation.mutate({
      repositoryPath,
      stepId: resolvedStepId,
      workflowId,
    });
  }, [repositoryPath, resetStream, retryMutation, resolvedStepId, workflowId]);

  const handleApprove = useCallback(() => {
    if (resolvedStepId === 0) return;
    approveMutation.mutate({ stepId: resolvedStepId, workflowId });
  }, [approveMutation, resolvedStepId, workflowId]);

  const handleSubmitFeedback = useCallback(() => {
    const feedback = planningFeedbackText.trim();
    if (!feedback || resolvedStepId === 0) return;

    resetStream();
    feedbackMutation.mutate(
      { feedback, stepId: resolvedStepId, workflowId },
      {
        onSuccess: () => {
          setPlanningFeedbackText('');
          setPlanningIsEditing(false);
        },
      }
    );
  }, [
    planningFeedbackText,
    resetStream,
    feedbackMutation,
    resolvedStepId,
    workflowId,
    setPlanningFeedbackText,
    setPlanningIsEditing,
  ]);

  const handleOpenFeedback = useCallback(() => {
    setPlanningIsEditing(true);
  }, [setPlanningIsEditing]);

  const handleCancelFeedback = useCallback(() => {
    setPlanningIsEditing(false);
    setPlanningFeedbackText('');
  }, [setPlanningIsEditing, setPlanningFeedbackText]);

  // Auto-start: bridge DB status → service execution.
  // The ref is scoped to the current step — reset when the step ID changes
  // so a new step can auto-trigger independently.
  const hasAutoTriggeredRef = useRef(false);
  useEffect(() => {
    hasAutoTriggeredRef.current = false;
  }, [resolvedStepId]);
  useEffect(() => {
    if (
      !isStateLoading &&
      uiPhase === 'running' &&
      serviceState === null &&
      !hasAutoTriggeredRef.current &&
      !isAnyMutationPending &&
      repositoryPath &&
      resolvedStepId > 0
    ) {
      hasAutoTriggeredRef.current = true;
      handleStart();
    }
  }, [isStateLoading, uiPhase, serviceState, isAnyMutationPending, repositoryPath, resolvedStepId, handleStart]);

  const _isPlanVisible = isPlanReviewPhase || isApprovedPhase;

  // Loading state
  if (isStepLoading) {
    return (
      <div className={'flex items-center gap-2 py-4 text-sm text-muted-foreground'}>
        <Loader2 aria-hidden={'true'} className={'size-4 animate-spin'} />
        <span>Loading step data...</span>
      </div>
    );
  }

  return (
    <div className={'flex flex-col gap-6'}>
      {/* Phase Content */}
      <Fragment>
        {isPendingPhase && <PendingState />}

        {isRunning && <RunningState currentPhase={currentPhase} />}

        {isErrorPhase && (
          <ErrorState
            errorMessage={step?.errorMessage ?? 'An unknown error occurred.'}
            isRetrying={retryMutation.isPending}
            onRetry={handleRetry}
          />
        )}

        {_isPlanVisible && activePlan && (
          <Fragment>
            {/* Version Selector */}
            <VersionSelector
              activeVersion={planningActiveVersion}
              iterations={iterations}
              onVersionChange={setPlanningActiveVersion}
            />

            {/* Plan Summary */}
            <PlanSummaryHeader isApproved={isApproved} plan={activePlan} />

            <Separator />

            {/* Split Layout: Step List and Detail Panel */}
            <div className={'grid grid-cols-3 gap-6'}>
              <div className={'col-span-1'}>
                <PlanStepList
                  onSelectStep={setPlanningSelectedStepIndex}
                  selectedIndex={planningSelectedStepIndex}
                  steps={planSteps}
                />
              </div>

              <div className={'col-span-2'}>
                {selectedStep && <PlanStepDetail step={selectedStep} stepIndex={planningSelectedStepIndex} />}
              </div>
            </div>

            {/* Feedback Form */}
            {isShowFeedbackForm && (
              <Fragment>
                <Separator />
                <FeedbackForm
                  feedbackText={planningFeedbackText}
                  isSubmitting={feedbackMutation.isPending}
                  onCancel={handleCancelFeedback}
                  onFeedbackChange={setPlanningFeedbackText}
                  onSubmit={handleSubmitFeedback}
                />
              </Fragment>
            )}
          </Fragment>
        )}
      </Fragment>

      <Separator />

      {/* Action Bar */}
      <div className={'flex items-center gap-2'}>
        {isPendingPhase && (
          <Button
            disabled={isAnyMutationPending || !repositoryPath || !isStepResolved}
            onClick={handleStart}
            variant={'default'}
          >
            <Play aria-hidden={'true'} className={'size-4'} />
            {startMutation.isPending ? 'Starting...' : 'Start Planning'}
          </Button>
        )}

        {isPlanReviewPhase && !isShowFeedbackForm && (
          <Button disabled={isAnyMutationPending} onClick={handleApprove} variant={'default'}>
            <Check aria-hidden={'true'} className={'size-4'} />
            {approveMutation.isPending ? 'Approving...' : 'Approve Plan'}
          </Button>
        )}

        {isPlanReviewPhase && !isShowFeedbackForm && (
          <Button disabled={isAnyMutationPending} onClick={handleOpenFeedback} variant={'outline'}>
            <MessageSquare aria-hidden={'true'} className={'size-4'} />
            Provide Feedback
          </Button>
        )}

        {(isPlanReviewPhase || isErrorPhase) && (
          <Button
            disabled={isAnyMutationPending || !repositoryPath || !isStepResolved}
            onClick={handleRetry}
            variant={'outline'}
          >
            <RotateCcw aria-hidden={'true'} className={'size-4'} />
            {retryMutation.isPending ? 'Re-running...' : 'Re-run'}
          </Button>
        )}
      </div>
    </div>
  );
};
