'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Loader2, Play, RotateCcw, SkipForward } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useRef } from 'react';

import type { ClarificationServicePhase } from '@/lib/validations/clarification';
import type {
  ClarificationAnswer,
  ClarificationQuestion,
  ClarificationStepOutput,
} from '@/lib/validations/clarification';
import type { ClarificationQuestion as ElectronClarificationQuestion } from '@/types/electron';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  useClarificationState,
  useClarificationStep,
  useRetryClarification,
  useSkipClarification,
  useStartClarification,
  useSubmitClarificationAnswers,
} from '@/hooks/queries/use-clarification';
import { useDefaultClarificationAgent } from '@/hooks/queries/use-default-clarification-agent';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { useWorkflow } from '@/hooks/queries/use-workflows';
import { useElectronDb } from '@/hooks/use-electron';
import { PHASE_LABELS } from '@/lib/constants/clarification';
import { useWorkflowDetailStore } from '@/lib/stores/workflow-detail-store';
import { clarificationStepOutputSchema } from '@/lib/validations/clarification';

import { useClarificationStreamContext } from '../clarification-stream-provider';
import { ClarificationAgentSelector } from './clarification-agent-selector';
import { ClarificationQuestionForm } from './clarification-question-form';

// =============================================================================
// Types
// =============================================================================

interface ClarificationStepContentProps {
  workflowId: number;
}

/**
 * UI phase derived from step status and outputStructured contents.
 */
type UiPhase = 'answered' | 'error' | 'parse_error' | 'pending' | 'running' | 'skipped' | 'unanswered';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Determine the UI phase from step status and parsed output.
 * When a step is completed but the output fails validation, returns 'parse_error'.
 */
function determineUiPhase(
  stepStatus: string,
  parsedOutput: ClarificationStepOutput | null,
  isParseError: boolean
): UiPhase {
  if (stepStatus === 'pending') return 'pending';
  if (stepStatus === 'running') return 'running';
  if (stepStatus === 'failed') return 'error';
  if (stepStatus === 'skipped') return 'skipped';
  if (stepStatus === 'awaiting_input') return 'unanswered';

  // Status is completed
  if (stepStatus === 'completed') {
    // Output exists but failed schema validation
    if (isParseError) return 'parse_error';

    // Skipped via agent assessment or manual skip
    if (parsedOutput?.skipped) return 'skipped';

    // Has questions
    if (parsedOutput?.questions && parsedOutput.questions.length > 0) {
      // Check if answers are present
      if (parsedOutput.answers && Object.keys(parsedOutput.answers).length > 0) {
        return 'answered';
      }
      return 'unanswered';
    }

    // Completed with no questions (agent determined feature is clear)
    return 'skipped';
  }

  return 'pending';
}

/**
 * Format a ClarificationAnswer for display in the answered summary.
 */
function formatAnswerText(answer: ClarificationAnswer): string {
  switch (answer.type) {
    case 'checkbox': {
      const parts = [...answer.selected];
      if (answer.other) parts.push(`Other: ${answer.other}`);
      return parts.join(', ');
    }
    case 'radio': {
      if (answer.other) return `Other: ${answer.other}`;
      return answer.selected;
    }
    case 'text': {
      return answer.text;
    }
  }
}

/**
 * Parse the step's outputStructured JSON into a typed ClarificationStepOutput.
 * Returns an object with the parsed data and whether parsing failed.
 */
function parseStepOutput(outputStructured: null | Record<string, unknown>): {
  isParseError: boolean;
  output: ClarificationStepOutput | null;
} {
  if (!outputStructured) return { isParseError: false, output: null };

  const result = clarificationStepOutputSchema.safeParse(outputStructured);
  if (result.success) {
    return { isParseError: false, output: result.data };
  }

  return { isParseError: true, output: null };
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Displays a "not started" indicator for the pending phase.
 */
const PendingState = () => {
  return (
    <div className={'flex items-center gap-2 text-sm text-muted-foreground'}>
      <div className={'size-2 rounded-full bg-muted-foreground/40'} />
      <span>Clarification has not started yet.</span>
    </div>
  );
};

/**
 * Displays a loading spinner with the current streaming phase label.
 */
const RunningState = ({ currentPhase }: { currentPhase: ClarificationServicePhase | null }) => {
  const phaseText = currentPhase ? PHASE_LABELS[currentPhase] : 'Starting...';

  return (
    <div className={'flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4'}>
      <Loader2 aria-hidden={'true'} className={'size-5 shrink-0 animate-spin text-accent'} />
      <div className={'flex flex-col gap-0.5'}>
        <span className={'text-sm font-medium text-foreground'}>Running clarification agent</span>
        <span className={'text-xs text-muted-foreground'}>{phaseText}</span>
      </div>
    </div>
  );
};

/**
 * Displays a summary of answered Q&A pairs.
 */
const AnsweredSummary = ({
  answers,
  questions,
}: {
  answers: Record<string, ClarificationAnswer>;
  questions: Array<ClarificationQuestion>;
}) => {
  return (
    <div className={'flex flex-col gap-3'}>
      {/* Summary Header */}
      <div className={'flex items-center gap-2'}>
        <CheckCircle aria-hidden={'true'} className={'size-4 text-green-600 dark:text-green-400'} />
        <span className={'text-sm font-medium text-foreground'}>
          {questions.length} question{questions.length !== 1 ? 's' : ''} answered
        </span>
      </div>

      {/* Q&A Cards */}
      {questions.map((question, index) => {
        const answer = answers[String(index)];
        return (
          <div className={'rounded-lg border border-border bg-card p-3'} key={index}>
            <p className={'mb-1 text-sm font-medium text-foreground'}>{question.question}</p>
            <p className={'text-sm text-muted-foreground'}>
              {answer ? formatAnswerText(answer) : 'No answer provided'}
            </p>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Displays a success/skip message when clarification was skipped or no questions needed.
 */
const SkippedState = ({
  assessment,
  skipReason,
}: {
  assessment?: { reason: string; score: number };
  skipReason?: string;
}) => {
  const displayReason = skipReason ?? assessment?.reason ?? 'Feature request is clear enough to proceed.';

  return (
    <div className={'flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-4'}>
      <div className={'flex items-center gap-2'}>
        <CheckCircle aria-hidden={'true'} className={'size-4 text-green-600 dark:text-green-400'} />
        <span className={'text-sm font-medium text-foreground'}>Clarification skipped</span>
        {assessment?.score !== undefined && (
          <Badge size={'sm'} variant={'completed'}>
            Clarity: {assessment.score}/5
          </Badge>
        )}
      </div>
      <p className={'text-sm text-muted-foreground'}>{displayReason}</p>
    </div>
  );
};

/**
 * Displays an error message with a retry option.
 */
const ErrorState = ({
  errorMessage,
  isRetrying,
  onRetry,
}: {
  errorMessage: string;
  isRetrying: boolean;
  onRetry: () => void;
}) => {
  return (
    <div className={'flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4'}>
      <div className={'flex items-center gap-2'}>
        <AlertTriangle aria-hidden={'true'} className={'size-4 text-destructive'} />
        <span className={'text-sm font-medium text-destructive'}>Clarification failed</span>
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
};

/**
 * Displays a warning when the step output could not be parsed.
 */
const ParseErrorState = () => {
  return (
    <div className={'flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4'}>
      <div className={'flex items-center gap-2'}>
        <AlertTriangle aria-hidden={'true'} className={'size-4 text-destructive'} />
        <span className={'text-sm font-medium text-destructive'}>Unable to parse step output</span>
      </div>
      <p className={'text-sm text-muted-foreground'}>
        The clarification step completed but its output could not be read. The data may be corrupted or in an unexpected
        format. Try re-running the step.
      </p>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * Main content component for the clarification step.
 * Handles all execution states (pending, running, completed variants, skipped, failed)
 * and wires action buttons to IPC mutation hooks.
 */
export const ClarificationStepContent = ({ workflowId }: ClarificationStepContentProps) => {
  const { data: step, isLoading: isStepLoading } = useClarificationStep(workflowId);
  const { data: workflow } = useWorkflow(workflowId);
  const { agentId: defaultAgentId } = useDefaultClarificationAgent();

  const clarificationKeepExistingQuestions = useWorkflowDetailStore(
    (state) => state.clarificationKeepExistingQuestions
  );
  const clarificationRerunGuidance = useWorkflowDetailStore((state) => state.clarificationRerunGuidance);
  const clarificationSelectedAgentId = useWorkflowDetailStore((state) => state.clarificationSelectedAgentId);
  const clearClarificationDraftAnswers = useWorkflowDetailStore((state) => state.clearClarificationDraftAnswers);
  const setClarificationDraftAnswer = useWorkflowDetailStore((state) => state.setClarificationDraftAnswer);
  const setClarificationKeepExistingQuestions = useWorkflowDetailStore(
    (state) => state.setClarificationKeepExistingQuestions
  );
  const setClarificationRerunGuidance = useWorkflowDetailStore((state) => state.setClarificationRerunGuidance);
  const setClarificationSelectedAgentId = useWorkflowDetailStore((state) => state.setClarificationSelectedAgentId);

  // Clear draft answers and agent override when navigating to a different workflow to prevent cross-workflow leakage
  const prevWorkflowIdRef = useRef(workflowId);
  const hasAutoTriggeredRef = useRef(false);
  useEffect(() => {
    if (prevWorkflowIdRef.current !== workflowId) {
      clearClarificationDraftAnswers();
      setClarificationKeepExistingQuestions(false);
      setClarificationSelectedAgentId(null);
      setClarificationRerunGuidance('');
      hasAutoTriggeredRef.current = false;
      prevWorkflowIdRef.current = workflowId;
    }
  }, [
    workflowId,
    clearClarificationDraftAnswers,
    setClarificationKeepExistingQuestions,
    setClarificationSelectedAgentId,
    setClarificationRerunGuidance,
  ]);

  // Fetch the workflow's associated repositories and the project's repositories
  const { isElectron, workflowRepositories } = useElectronDb();
  const { data: workflowRepos } = useQuery({
    enabled: isElectron && workflowId > 0,
    queryFn: () => workflowRepositories.list(workflowId),
    queryKey: ['workflowRepositories', workflowId],
  });
  const { data: repositories } = useRepositoriesByProject(workflow?.projectId ?? 0);

  const repositoryPath = useMemo(() => {
    if (!repositories || repositories.length === 0) return '';

    // Prefer the first workflow repository, then the project's default repository
    if (workflowRepos && workflowRepos.length > 0) {
      const workflowRepo = workflowRepos[0];
      if (workflowRepo) {
        const matchedRepo = repositories.find((r) => r.id === workflowRepo.repositoryId);
        if (matchedRepo) return matchedRepo.path;
      }
    }

    // Fall back to the project's default repository
    const defaultRepo = repositories.find((r) => r.setAsDefaultAt !== null);
    const selected = defaultRepo ?? repositories[0];
    return selected ? selected.path : '';
  }, [repositories, workflowRepos]);

  // Mutations
  const startMutation = useStartClarification();
  const submitMutation = useSubmitClarificationAnswers();
  const skipMutation = useSkipClarification();
  const retryMutation = useRetryClarification();

  // Stream context (provided by ClarificationStreamProvider)
  const { currentPhase, reset: resetStream } = useClarificationStreamContext();

  // Service state — used to detect when workflow:start set DB status to 'running'
  // but clarification:start was never called (serviceState will be null).
  const { data: serviceState, isLoading: isStateLoading } = useClarificationState(workflowId);

  // Parse output with error tracking
  const { isParseError, output: parsedOutput } = useMemo(() => {
    if (!step?.outputStructured) return { isParseError: false, output: null };
    return parseStepOutput(step.outputStructured as Record<string, unknown>);
  }, [step]);

  // Determine UI phase
  const stepStatus = step?.status ?? 'pending';
  const uiPhase = useMemo(
    () => determineUiPhase(stepStatus, parsedOutput, isParseError && stepStatus === 'completed'),
    [stepStatus, parsedOutput, isParseError]
  );

  const isRunning = uiPhase === 'running';

  // Use step ID from the query result, not from props
  const resolvedStepId = step?.id ?? 0;

  // Derive questions and answers
  const questions = useMemo(() => parsedOutput?.questions ?? [], [parsedOutput]);
  const answers = useMemo(() => parsedOutput?.answers ?? {}, [parsedOutput]);

  // Effective agent ID: prefer user selection, then workflow config, then default
  const effectiveAgentId = useMemo(() => {
    if (clarificationSelectedAgentId !== null) return clarificationSelectedAgentId;
    if (workflow?.clarificationAgentId) return workflow.clarificationAgentId;
    return defaultAgentId ?? 0;
  }, [clarificationSelectedAgentId, workflow, defaultAgentId]);

  // Handlers
  const handleStart = useCallback(() => {
    if (!workflow?.featureRequest || !repositoryPath || resolvedStepId === 0) return;

    resetStream();
    startMutation.mutate({
      agentId: effectiveAgentId > 0 ? effectiveAgentId : undefined,
      featureRequest: workflow.featureRequest,
      repositoryPath,
      stepId: resolvedStepId,
      workflowId,
    });
  }, [workflow, repositoryPath, resetStream, startMutation, resolvedStepId, workflowId, effectiveAgentId]);

  const handleSubmitAnswers = useCallback(
    (answers: Array<ClarificationAnswer>) => {
      if (resolvedStepId === 0) return;

      // Convert the array of answers to a record keyed by index, preserving typed answer objects
      const answersRecord: Record<string, ClarificationAnswer> = {};
      for (const [index, answer] of answers.entries()) {
        answersRecord[String(index)] = answer;
      }

      clearClarificationDraftAnswers();
      submitMutation.mutate({
        answers: answersRecord,
        questions: questions as Array<ElectronClarificationQuestion>,
        stepId: resolvedStepId,
        workflowId,
      });
    },
    [clearClarificationDraftAnswers, questions, resolvedStepId, submitMutation, workflowId]
  );

  const handleSkip = useCallback(() => {
    skipMutation.mutate({ workflowId });
  }, [skipMutation, workflowId]);

  const handleRetry = useCallback(() => {
    if (!workflow?.featureRequest || !repositoryPath || resolvedStepId === 0) return;

    // If keeping existing questions and answers exist, copy them to draft state
    // so they pre-populate the form when it re-renders in `unanswered` phase
    if (clarificationKeepExistingQuestions && Object.keys(answers).length > 0) {
      for (const [key, answer] of Object.entries(answers)) {
        setClarificationDraftAnswer(key, answer);
      }
    }

    resetStream();
    const guidance = clarificationRerunGuidance.trim();
    retryMutation.mutate(
      {
        agentId: effectiveAgentId > 0 ? effectiveAgentId : undefined,
        featureRequest: workflow.featureRequest,
        keepExistingQuestions: clarificationKeepExistingQuestions || undefined,
        repositoryPath,
        rerunGuidance: guidance || undefined,
        stepId: resolvedStepId,
        workflowId,
      },
      {
        onSuccess: () => {
          setClarificationRerunGuidance('');
          setClarificationKeepExistingQuestions(false);
        },
      }
    );
  }, [
    workflow,
    repositoryPath,
    resetStream,
    retryMutation,
    resolvedStepId,
    workflowId,
    effectiveAgentId,
    clarificationRerunGuidance,
    setClarificationRerunGuidance,
    clarificationKeepExistingQuestions,
    setClarificationKeepExistingQuestions,
    answers,
    setClarificationDraftAnswer,
  ]);

  // Derived state
  const isStarting = startMutation.isPending;
  const isSubmitting = submitMutation.isPending;
  const isSkipping = skipMutation.isPending;
  const isRetrying = retryMutation.isPending;
  const isAnyMutationPending = isStarting || isSubmitting || isSkipping || isRetrying;
  const isStepResolved = resolvedStepId > 0;
  const isPendingPhase = uiPhase === 'pending';
  const isUnansweredPhase = uiPhase === 'unanswered';
  const isAnsweredPhase = uiPhase === 'answered';
  const isSkippedPhase = uiPhase === 'skipped';
  const isErrorPhase = uiPhase === 'error';
  const isParseErrorPhase = uiPhase === 'parse_error';
  const hasExistingQuestions = (isAnsweredPhase || isUnansweredPhase) && questions.length > 0;
  const isCanRetryPhase = isErrorPhase || isAnsweredPhase || isParseErrorPhase || isUnansweredPhase;
  const isCanSkipPhase = isPendingPhase || isUnansweredPhase;
  const isShowAgentSelector =
    isPendingPhase || isUnansweredPhase || isErrorPhase || isParseErrorPhase || isAnsweredPhase;

  // Auto-start: bridge the gap between workflow:start (DB-only status update)
  // and clarification:start (actual agent execution).
  useEffect(() => {
    if (
      !isStateLoading &&
      uiPhase === 'running' &&
      serviceState === null &&
      !hasAutoTriggeredRef.current &&
      !isAnyMutationPending &&
      workflow?.featureRequest &&
      repositoryPath &&
      resolvedStepId > 0
    ) {
      hasAutoTriggeredRef.current = true;
      handleStart();
    }
  }, [
    isStateLoading,
    uiPhase,
    serviceState,
    isAnyMutationPending,
    workflow?.featureRequest,
    repositoryPath,
    resolvedStepId,
    handleStart,
  ]);

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

        {isUnansweredPhase && (
          <ClarificationQuestionForm isSubmitting={isSubmitting} onSubmit={handleSubmitAnswers} questions={questions} />
        )}

        {isAnsweredPhase && <AnsweredSummary answers={answers} questions={questions} />}

        {isSkippedPhase && <SkippedState assessment={parsedOutput?.assessment} skipReason={parsedOutput?.skipReason} />}

        {isErrorPhase && (
          <ErrorState
            errorMessage={step?.errorMessage ?? 'An unknown error occurred.'}
            isRetrying={isRetrying}
            onRetry={handleRetry}
          />
        )}

        {isParseErrorPhase && <ParseErrorState />}
      </Fragment>

      <Separator />

      {/* Rerun Guidance Textarea */}
      {isCanRetryPhase && (
        <div className={'flex flex-col gap-1.5'}>
          <label className={'text-xs font-medium text-muted-foreground'} htmlFor={'rerun-guidance'}>
            Additional guidance for re-run (optional)
          </label>
          <textarea
            className={
              'resize-none rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none'
            }
            id={'rerun-guidance'}
            onChange={(e) => setClarificationRerunGuidance(e.target.value)}
            placeholder={'Provide feedback or additional context to guide the agent...'}
            rows={2}
            value={clarificationRerunGuidance}
          />
        </div>
      )}

      {/* Keep Existing Questions Toggle */}
      {hasExistingQuestions && isCanRetryPhase && (
        <div className={'flex items-center gap-2'}>
          <Switch
            checked={clarificationKeepExistingQuestions}
            id={'keep-existing-questions'}
            onCheckedChange={setClarificationKeepExistingQuestions}
            size={'sm'}
          />
          <label className={'text-xs font-medium text-muted-foreground'} htmlFor={'keep-existing-questions'}>
            Keep existing questions
          </label>
        </div>
      )}

      {/* Action Bar */}
      <div className={'flex items-center gap-2'}>
        {/* Start Button (pending phase) */}
        {isPendingPhase && (
          <Button
            disabled={isAnyMutationPending || !repositoryPath || !isStepResolved}
            onClick={handleStart}
            variant={'default'}
          >
            <Play aria-hidden={'true'} className={'size-4'} />
            {isStarting ? 'Starting...' : 'Start Clarification'}
          </Button>
        )}

        {/* Retry Button (error, answered, or parse error phase) */}
        {isCanRetryPhase && (
          <Button
            disabled={isAnyMutationPending || !repositoryPath || !isStepResolved}
            onClick={handleRetry}
            variant={'outline'}
          >
            <RotateCcw aria-hidden={'true'} className={'size-4'} />
            {isRetrying ? 'Retrying...' : 'Re-run'}
          </Button>
        )}

        {/* Skip Button (pending or unanswered phase) */}
        {isCanSkipPhase && (
          <Button disabled={isAnyMutationPending} onClick={handleSkip} variant={'ghost'}>
            <SkipForward aria-hidden={'true'} className={'size-4'} />
            {isSkipping ? 'Skipping...' : 'Skip'}
          </Button>
        )}

        {/* Agent Selector (pending, unanswered, error, or parse error phase) */}
        {isShowAgentSelector && (
          <div className={'ml-auto'}>
            <ClarificationAgentSelector defaultAgentId={effectiveAgentId} />
          </div>
        )}
      </div>
    </div>
  );
};
