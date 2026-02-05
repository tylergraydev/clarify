'use client';

import type { ComponentPropsWithRef, KeyboardEvent, ReactNode } from 'react';

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  CircleCheck,
  CircleDashed,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquare,
  Play,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { Fragment } from 'react';

import type {
  ClarificationAnswers,
  ClarificationOutcome,
  ClarificationQuestion,
  ClarificationServicePhase,
  ClarificationStepOutput,
} from '@/lib/validations/clarification';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClarificationForm } from '@/components/workflows/clarification-form';
import { ClarificationStreaming } from '@/components/workflows/clarification-streaming';
import { PipelineStepMetrics, type StepMetrics } from '@/components/workflows/pipeline-step-metrics';
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
 * Active tool indicator for clarification streaming.
 */
interface ActiveTool {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
}

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
    ml-14 flex flex-col rounded-lg border transition-all
    duration-200 focus-visible:ring-2 focus-visible:ring-accent
    focus-visible:ring-offset-0
    focus-visible:outline-none data-disabled:pointer-events-none
    data-disabled:opacity-50
  `,
  {
    defaultVariants: {
      status: 'pending',
    },
    variants: {
      status: {
        completed: 'border-green-300 bg-green-50 opacity-75 dark:border-green-800 dark:bg-green-950/30',
        pending: 'border-border bg-muted/30 opacity-50',
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes -- step-glow-pulse is defined in globals.css
        running: 'step-glow-pulse border-accent bg-accent/5 ring-1 ring-accent/30',
      },
    },
  }
);

interface PipelineStepProps
  extends Omit<ComponentPropsWithRef<'div'>, 'title'>, VariantProps<typeof pipelineStepVariants> {
  /** Whether the step can be started manually */
  canStart?: boolean;
  /** Active tools for clarification streaming */
  clarificationActiveTools?: Array<ActiveTool>;
  /** Agent name for clarification streaming */
  clarificationAgentName?: string;
  /** Error from clarification streaming */
  clarificationError?: null | string;
  /** Outcome from clarification streaming */
  clarificationOutcome?: ClarificationOutcome | null;
  /** Phase of clarification streaming */
  clarificationPhase?: ClarificationServicePhase;
  /** Session ID for clarification streaming */
  clarificationSessionId?: null | string;
  /** Text output from clarification streaming */
  clarificationText?: string;
  /** Thinking blocks from clarification streaming */
  clarificationThinking?: Array<string>;
  /** Tool history for clarification streaming */
  clarificationToolHistory?: Array<ActiveTool>;
  /** Elapsed time in ms for extended thinking */
  extendedThinkingElapsedMs?: number;
  /** Whether clarification streaming is active */
  isClarificationStreaming?: boolean;
  /** Whether the step is currently expanded */
  isExpanded: boolean;
  /** Whether additional clarification generation is in progress */
  isGeneratingClarification?: boolean;
  /** Whether clarification rerun is in progress */
  isRerunningClarification?: boolean;
  /** Whether form submission is in progress */
  isSubmitting?: boolean;
  /** Maximum thinking tokens budget */
  maxThinkingTokens?: null | number;
  /** Metrics data for collapsed state display */
  metrics?: StepMetrics;
  /** Callback when clarification is cancelled */
  onClarificationCancel?: () => void;
  /** Callback when clarification error occurs */
  onClarificationError?: (error: string) => void;
  /** Callback to request additional clarification questions */
  onGenerateClarifications?: () => void;
  /** Callback when clarification questions are ready */
  onQuestionsReady?: (questions: Array<ClarificationQuestion>) => void;
  /** Callback to rerun clarification from scratch */
  onRerunClarification?: () => void;
  /** Callback when clarification skip is ready */
  onSkipReady?: (reason: string) => void;
  /** Callback when user skips clarification */
  onSkipStep?: () => void;
  /** Callback when start button is clicked */
  onStart?: () => void;
  /** Callback when clarification form is submitted */
  onSubmitClarification?: (answers: ClarificationAnswers) => void;
  /** Callback when expand/collapse is toggled */
  onToggle: () => void;
  /** Output content to display when expanded */
  output?: string;
  /** Structured output containing questions and answers */
  outputStructured?: ClarificationStepOutput | null;
  /** The type of step (determines icon) */
  stepType: PipelineStepType;
  /** The title of the step */
  title: string;
}

export const PipelineStep = ({
  canStart = false,
  clarificationActiveTools,
  clarificationAgentName,
  clarificationError,
  clarificationOutcome,
  clarificationPhase,
  clarificationSessionId,
  clarificationText,
  clarificationThinking,
  clarificationToolHistory,
  className,
  extendedThinkingElapsedMs,
  isClarificationStreaming = false,
  isExpanded,
  isGeneratingClarification = false,
  isRerunningClarification = false,
  isSubmitting = false,
  maxThinkingTokens,
  metrics,
  onClarificationCancel,
  onClarificationError,
  onGenerateClarifications,
  onQuestionsReady,
  onRerunClarification,
  onSkipReady,
  onSkipStep,
  onStart,
  onSubmitClarification,
  onToggle,
  output,
  outputStructured,
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
  const isClarificationStep = stepType === 'clarification';
  const clarificationQuestions = outputStructured?.questions ?? [];
  const clarificationAnswers = outputStructured?.answers ?? {};
  const answeredCount = clarificationQuestions.reduce((count, _, index) => {
    return clarificationAnswers[String(index)] ? count + 1 : count;
  }, 0);
  const totalCount = clarificationQuestions.length;
  const isClarificationSkipped = Boolean(outputStructured?.skipped);

  // Determine if clarification streaming should be shown
  const isStreamingActive = isClarificationStep && isClarificationStreaming;

  // Determine if clarification form should be shown (all required conditions met)
  const isFormReady =
    isClarificationStep &&
    isRunning &&
    !isStreamingActive &&
    outputStructured?.questions &&
    outputStructured.questions.length > 0 &&
    onSubmitClarification &&
    onSkipStep;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  const showClarificationSummary =
    isClarificationStep && !isFormReady && !isStreamingActive && (isClarificationSkipped || totalCount > 0);

  const canGenerateMore = Boolean(onGenerateClarifications && answeredCount > 0);
  const canRerun = Boolean(onRerunClarification);
  const isClarificationActionPending = isGeneratingClarification || isRerunningClarification;
  const showStartButton = canStart && isPending && Boolean(onStart);

  const renderClarificationSummary = () => {
    if (!showClarificationSummary || !outputStructured) {
      return null;
    }

    if (isClarificationSkipped) {
      return (
        <div className={'rounded-md border border-border/50 bg-background p-4'}>
          <div className={'flex flex-wrap items-center justify-between gap-3'}>
            <div>
              <div className={'text-xs tracking-[0.2em] text-muted-foreground uppercase'}>Clarification</div>
              <div className={'mt-1 text-sm font-semibold text-foreground'}>Skipped</div>
            </div>
            <Badge size={'sm'} variant={'default'}>
              Skipped
            </Badge>
          </div>
          <p className={'mt-3 text-sm text-muted-foreground'}>
            {outputStructured.skipReason ?? 'Clarification was skipped for this request.'}
          </p>
          {canRerun && (
            <div className={'mt-4 flex flex-wrap items-center gap-2'}>
              <Button disabled={isClarificationActionPending} onClick={onRerunClarification} size={'sm'}>
                {isRerunningClarification ? (
                  <Loader2 aria-hidden={'true'} className={'size-4 animate-spin'} />
                ) : (
                  <RotateCcw aria-hidden={'true'} className={'size-4'} />
                )}
                {isRerunningClarification ? 'Rerunning...' : 'Run clarification'}
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={'rounded-md border border-border/50 bg-background p-4'}>
        <div className={'flex flex-wrap items-center justify-between gap-3'}>
          <div>
            <div className={'text-xs tracking-[0.2em] text-muted-foreground uppercase'}>Clarification Summary</div>
            <div className={'mt-1 text-sm font-semibold text-foreground'}>
              Answered {answeredCount} of {totalCount}
            </div>
          </div>
          <Badge size={'sm'} variant={'completed'}>
            {answeredCount}/{totalCount} answered
          </Badge>
        </div>
        <div className={'mt-4 space-y-3'}>
          {clarificationQuestions.map((question, index) => {
            const answerKey = String(index);
            const answer = clarificationAnswers[answerKey];

            // Handle backward compatibility - old format is string
            let answerDisplay: ReactNode;

            if (!answer) {
              answerDisplay = <div className={'text-sm text-muted-foreground'}>Unanswered</div>;
            } else if (typeof answer === 'string') {
              // Old format: treat as radio selection
              const selectedOption = question.options?.find((option) => option.label === answer);
              answerDisplay = (
                <Fragment>
                  <div className={'mt-1 text-sm font-semibold text-foreground'}>{answer}</div>
                  {selectedOption?.description && (
                    <div className={'mt-1 text-xs text-muted-foreground'}>{selectedOption.description}</div>
                  )}
                </Fragment>
              );
            } else if (answer.type === 'radio') {
              // Radio answer: single selection with optional "Other"
              const selectedOption = question.options?.find((option) => option.label === answer.selected);
              answerDisplay = (
                <Fragment>
                  <div className={'mt-1 text-sm font-semibold text-foreground'}>{answer.selected}</div>
                  {selectedOption?.description && (
                    <div className={'mt-1 text-xs text-muted-foreground'}>{selectedOption.description}</div>
                  )}
                  {answer.other && (
                    <div className={'mt-2 rounded-md border border-border/40 bg-muted/30 px-3 py-2'}>
                      <div className={'text-xs tracking-[0.2em] text-muted-foreground uppercase'}>Other</div>
                      <div className={'mt-1 text-sm whitespace-pre-wrap text-foreground'}>{answer.other}</div>
                    </div>
                  )}
                </Fragment>
              );
            } else if (answer.type === 'checkbox') {
              // Checkbox answer: multiple selections with optional "Other"
              answerDisplay = (
                <Fragment>
                  <div className={'space-y-2'}>
                    {answer.selected.map((selectedLabel, selectedIndex) => {
                      const selectedOption = question.options?.find((option) => option.label === selectedLabel);
                      return (
                        <div className={'mt-1'} key={selectedIndex}>
                          <div className={'text-sm font-semibold text-foreground'}>• {selectedLabel}</div>
                          {selectedOption?.description && (
                            <div className={'mt-0.5 ml-3 text-xs text-muted-foreground'}>
                              {selectedOption.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {answer.other && (
                    <div className={'mt-2 rounded-md border border-border/40 bg-muted/30 px-3 py-2'}>
                      <div className={'text-xs tracking-[0.2em] text-muted-foreground uppercase'}>Other</div>
                      <div className={'mt-1 text-sm whitespace-pre-wrap text-foreground'}>{answer.other}</div>
                    </div>
                  )}
                </Fragment>
              );
            } else if (answer.type === 'text') {
              // Text answer: open-ended response
              answerDisplay = <div className={'mt-1 text-sm whitespace-pre-wrap text-foreground'}>{answer.text}</div>;
            }

            return (
              <div className={'rounded-md border border-border/40 bg-muted/30 p-3'} key={answerKey}>
                <div className={'flex items-start gap-3'}>
                  <div
                    className={
                      'mt-0.5 flex size-7 items-center justify-center rounded-full bg-background text-xs font-semibold'
                    }
                  >
                    {index + 1}
                  </div>
                  <div className={'flex-1'}>
                    <div className={'text-sm font-medium text-foreground'}>{question.header}</div>
                    <div className={'mt-1 text-sm text-muted-foreground'}>{question.question}</div>
                  </div>
                </div>
                <div className={'mt-3 rounded-md border border-border/50 bg-background/80 p-3'}>
                  <div className={'text-xs tracking-[0.2em] text-muted-foreground uppercase'}>Answer</div>
                  {answerDisplay}
                </div>
              </div>
            );
          })}
        </div>
        {(canRerun || canGenerateMore) && (
          <div className={'mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4'}>
            {canRerun && (
              <Button disabled={isClarificationActionPending} onClick={onRerunClarification} size={'sm'}>
                {isRerunningClarification ? (
                  <Loader2 aria-hidden={'true'} className={'size-4 animate-spin'} />
                ) : (
                  <RotateCcw aria-hidden={'true'} className={'size-4'} />
                )}
                {isRerunningClarification ? 'Rerunning...' : 'Rerun clarification'}
              </Button>
            )}
            {canGenerateMore && (
              <Button
                disabled={isClarificationActionPending}
                onClick={onGenerateClarifications}
                size={'sm'}
                variant={'outline'}
              >
                {isGeneratingClarification ? (
                  <Loader2 aria-hidden={'true'} className={'size-4 animate-spin'} />
                ) : (
                  <Sparkles aria-hidden={'true'} className={'size-4'} />
                )}
                {isGeneratingClarification ? 'Generating...' : 'Generate more questions'}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseCollapsible.Root onOpenChange={onToggle} open={isExpanded}>
      <div className={cn(pipelineStepVariants({ status }), className)} ref={ref} {...props}>
        {/* Step Header */}
        <div className={'relative flex items-center'}>
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

            {/* Step Metrics Badge (collapsed header) */}
            {metrics && status && <PipelineStepMetrics metrics={metrics} status={status} stepType={stepType} />}

            {/* Spacer for start button to prevent layout shift */}
            {showStartButton && <span className={'w-[85px]'} />}

            {/* Status Indicator */}
            <div className={'flex items-center gap-2'}>
              {isCompleted && (
                <CircleCheck aria-label={'Completed'} className={'size-5 text-green-600 dark:text-green-400'} />
              )}
              {isRunning && <Loader2 aria-label={'Running'} className={'size-5 animate-spin text-accent'} />}
              {isPending && <CircleDashed aria-label={'Pending'} className={'size-5 text-muted-foreground'} />}
            </div>
          </BaseCollapsible.Trigger>

          {/* Start Button - positioned outside trigger to avoid nested button issue */}
          {showStartButton && (
            <Button className={'absolute right-12'} onClick={onStart} size={'sm'} type={'button'} variant={'outline'}>
              <Play aria-hidden={'true'} className={'size-3.5'} />
              Start
            </Button>
          )}
        </div>

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
            {/* Status Badge with Agent Name */}
            <div className={'mb-3 flex items-center gap-2'}>
              <Badge size={'sm'} variant={statusBadgeVariants[status ?? 'pending']}>
                {statusLabels[status ?? 'pending']}
              </Badge>
              {clarificationAgentName && isClarificationStep && (
                <span className={'text-xs text-muted-foreground'}>via {clarificationAgentName}</span>
              )}
            </div>

            {/* Clarification Streaming (when exploration phase is active) */}
            {isStreamingActive && (
              <ClarificationStreaming
                activeTools={clarificationActiveTools}
                agentName={clarificationAgentName}
                error={clarificationError}
                extendedThinkingElapsedMs={extendedThinkingElapsedMs}
                isStreaming={isClarificationStreaming}
                maxThinkingTokens={maxThinkingTokens}
                onCancel={onClarificationCancel}
                onClarificationError={onClarificationError}
                onQuestionsReady={onQuestionsReady}
                onSkipReady={onSkipReady}
                outcome={clarificationOutcome}
                phase={clarificationPhase}
                sessionId={clarificationSessionId}
                text={clarificationText}
                thinking={clarificationThinking}
                toolHistory={clarificationToolHistory}
              />
            )}

            {/* Clarification Form (when step is running and waiting for input) */}
            {isFormReady && (
              <ClarificationForm
                existingAnswers={outputStructured?.answers}
                isSubmitting={isSubmitting}
                onSkip={onSkipStep}
                onSubmit={onSubmitClarification}
                questions={outputStructured.questions}
              />
            )}

            {/* Output Container (for non-clarification steps or completed clarification) */}
            {!isFormReady && !isStreamingActive && (
              <Fragment>
                {showClarificationSummary ? (
                  renderClarificationSummary()
                ) : (
                  <div className={cn('rounded-md border border-border/50 bg-background p-3', 'min-h-20 text-sm')}>
                    {output ? (
                      <p className={'whitespace-pre-wrap text-foreground'}>{output}</p>
                    ) : (
                      <p className={'text-muted-foreground'}>Output will appear here</p>
                    )}
                  </div>
                )}
              </Fragment>
            )}
          </div>
        </BaseCollapsible.Panel>
      </div>
    </BaseCollapsible.Root>
  );
};
