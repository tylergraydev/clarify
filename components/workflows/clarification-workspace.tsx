'use client';

import type { ComponentProps, ComponentPropsWithRef, ReactElement } from 'react';

import { MessageSquare, Timer } from 'lucide-react';
import { Fragment, useCallback, useMemo, useState } from 'react';

import type {
  ClarificationAnswers,
  ClarificationQuestion,
  ClarificationServicePhase,
} from '@/lib/validations/clarification';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ClarificationForm } from '@/components/workflows/clarification-form';
import { ClarificationStreaming } from '@/components/workflows/clarification-streaming';
import { cn } from '@/lib/utils';

/**
 * Maps clarification phase values to user-friendly labels for display.
 */
const PHASE_LABELS: Record<string, string> = {
  cancelled: 'Cancelled',
  complete: 'Analysis complete',
  error: 'Error occurred',
  executing: 'Analyzing codebase...',
  executing_extended_thinking: 'Deep reasoning in progress...',
  idle: 'Ready',
  loading_agent: 'Loading agent...',
  processing_response: 'Processing response...',
  timeout: 'Timed out',
  waiting_for_user: 'Waiting for answers',
} as const;

type ClarificationStreamingProps = ComponentProps<typeof ClarificationStreaming>;

/**
 * Props for the ClarificationWorkspace component.
 */
interface ClarificationWorkspaceProps extends Omit<ComponentPropsWithRef<'section'>, 'children' | 'onSubmit'> {
  /** Existing user answers to clarification questions */
  existingAnswers?: ClarificationAnswers;
  /** Time elapsed during extended thinking (in milliseconds) */
  extendedThinkingElapsedMs?: number;
  /** The original feature request text to display */
  featureRequest?: null | string;
  /** Whether the clarification agent is currently streaming */
  isStreaming: boolean;
  /** Whether the form is being submitted */
  isSubmitting?: boolean;
  /** Callback when user skips clarification */
  onSkip?: () => void;
  /** Callback when user submits clarification answers */
  onSubmit?: (answers: ClarificationAnswers) => void;
  /** Current phase of the clarification service */
  phase?: ClarificationServicePhase;
  /** Array of clarification questions to display */
  questions?: Array<ClarificationQuestion>;
  /** Props to forward to ClarificationStreaming component */
  streamingProps: ClarificationStreamingProps;
}

/**
 * Formats elapsed time in milliseconds to a human-readable string (e.g., "2m 30s" or "45s").
 *
 * @param ms - Time in milliseconds
 * @returns Formatted time string
 */
function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * ClarificationWorkspace displays the clarification step with a split view layout.
 * The left side shows streaming output from the clarification agent, while the right side
 * displays clarification questions (when available) or a waiting state with optional skip.
 *
 * Layout adapts based on streaming state:
 * - While streaming: emphasizes the streaming output (primary)
 * - After streaming: emphasizes the questions form (summary)
 *
 * @example
 * ```tsx
 * <ClarificationWorkspace
 *   isStreaming={true}
 *   phase="executing"
 *   questions={[]}
 *   streamingProps={{...}}
 *   featureRequest="Add dark mode"
 * />
 * ```
 */
export const ClarificationWorkspace = ({
  className,
  existingAnswers,
  extendedThinkingElapsedMs,
  featureRequest,
  isStreaming,
  isSubmitting,
  onSkip,
  onSubmit,
  phase = 'idle',
  questions = [],
  ref,
  streamingProps,
  ...props
}: ClarificationWorkspaceProps): ReactElement => {
  // 1. useState hooks
  const [liveAnsweredCount, setLiveAnsweredCount] = useState<null | number>(null);

  // 3. useMemo hooks
  const totalCount = questions.length;

  const initialAnsweredCount = useMemo(() => {
    if (!existingAnswers) return 0;
    return Object.values(existingAnswers).filter((value) => Boolean(value)).length;
  }, [existingAnswers]);

  // 6. Event handlers (useCallback)
  const handleProgressChange = useCallback((count: number) => {
    setLiveAnsweredCount((prev) => (prev === count ? prev : count));
  }, []);

  // 7. Derived variables
  const answeredCount = liveAnsweredCount ?? initialAnsweredCount;
  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((answeredCount / totalCount) * 100)) : 0;
  const progressLabel = totalCount > 0 ? `${answeredCount} of ${totalCount} answered` : 'Questions pending';
  const canRenderForm = totalCount > 0 && onSubmit && onSkip;
  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const layout = isStreaming ? 'primary' : 'summary';
  const statusVariant = isStreaming ? 'pending' : totalCount > 0 ? 'clarifying' : 'default';
  const columnLayoutClass = isStreaming
    ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]'
    : 'lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]';

  let questionsContent: ReactElement;

  if (canRenderForm && onSubmit && onSkip) {
    questionsContent = (
      <ClarificationForm
        existingAnswers={existingAnswers}
        isSubmitting={isSubmitting}
        onProgressChange={handleProgressChange}
        onSkip={onSkip}
        onSubmit={onSubmit}
        questions={questions}
      />
    );
  } else {
    questionsContent = (
      <div className={'flex h-full flex-col items-center justify-center px-6 py-16 text-center'}>
        {/* Status Badge */}
        <div className={'rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground'}>
          Questions pending
        </div>

        {/* Heading */}
        <h3 className={'mt-4 text-base font-semibold text-foreground'}>Waiting for analysis</h3>

        {/* Description */}
        <p className={'mt-2 max-w-sm text-sm text-muted-foreground'}>
          Once the agent finishes reviewing the feature request and codebase, the questions will appear here.
        </p>

        {/* Loading Placeholders */}
        <div className={'mt-6 w-full space-y-3'}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className={'h-4 w-full animate-pulse rounded-full bg-muted/60'}
              key={`clarification-placeholder-${index}`}
              style={{ width: `${90 - index * 12}%` }}
            />
          ))}
        </div>

        {/* Skip Option */}
        {onSkip && (
          <Fragment>
            <div className={'mt-8 text-xs text-muted-foreground'}>
              You can skip clarification if you want to continue without answering.
            </div>
            <Button className={'mt-3'} onClick={onSkip} type={'button'} variant={'ghost'}>
              Skip clarification
            </Button>
          </Fragment>
        )}
      </div>
    );
  }

  return (
    <section aria-label={'Clarification workspace'} className={cn('w-full', className)} ref={ref} {...props}>
      {/* Header Card */}
      <div className={'rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm sm:p-8'}>
        <div className={'flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'}>
          {/* Title Section */}
          <div className={'flex items-start gap-4'}>
            {/* Icon */}
            <div className={'mt-1 flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent'}>
              <MessageSquare className={'size-5'} />
            </div>

            {/* Title and Description */}
            <div className={'space-y-2'}>
              {/* Title with Status Badge */}
              <div className={'flex flex-wrap items-center gap-2'}>
                <h2 className={'text-lg font-semibold text-foreground'}>Clarification</h2>
                <Badge size={'sm'} variant={statusVariant}>
                  {phaseLabel}
                </Badge>
                {extendedThinkingElapsedMs !== undefined && (
                  <span className={'flex items-center gap-1 text-xs text-muted-foreground'}>
                    <Timer className={'size-3.5'} />
                    {formatElapsedTime(extendedThinkingElapsedMs)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className={'max-w-2xl text-sm text-muted-foreground'}>
                We ask a few clarifying questions to avoid rework and tailor the plan to your intent.
              </p>
            </div>
          </div>

          {/* Progress Section */}
          <div className={'flex w-full max-w-xs flex-col gap-2 lg:items-end'}>
            <div className={'text-xs tracking-[0.18em] text-muted-foreground uppercase'}>Progress</div>
            <div className={'text-sm font-medium text-foreground'}>{progressLabel}</div>
            <div className={'h-1.5 w-full overflow-hidden rounded-full bg-muted'}>
              <div
                className={'h-full rounded-full bg-accent transition-all duration-300'}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Feature Request Collapsible */}
        {featureRequest && (
          <div className={'mt-6 border-t border-border/60 pt-4'}>
            <Collapsible defaultOpen>
              <CollapsibleTrigger className={'px-0 text-sm text-foreground'} variant={'ghost'}>
                Feature request
              </CollapsibleTrigger>
              <CollapsibleContent className={'mt-2 text-sm text-muted-foreground'}>
                <div className={'max-h-32 overflow-y-auto rounded-xl border border-border/60 bg-muted/30 p-4'}>
                  <p className={'pr-2 whitespace-pre-wrap'}>{featureRequest}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* Split View Grid */}
      <div className={cn('mt-6 grid grid-cols-1 gap-6', columnLayoutClass)}>
        {/* Streaming Output */}
        <ClarificationStreaming {...streamingProps} className={'h-full self-stretch'} layout={layout} />

        {/* Questions Panel */}
        <div className={'rounded-2xl border border-border/60 bg-background/80 shadow-sm'}>{questionsContent}</div>
      </div>
    </section>
  );
};
