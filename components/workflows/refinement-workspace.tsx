'use client';

import type { ComponentProps, ComponentPropsWithRef, ReactElement } from 'react';

import { FileText, Timer } from 'lucide-react';
import { Fragment, useMemo } from 'react';

import type { RefinementServicePhase } from '@/types/electron';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefinementEditor } from '@/components/workflows/refinement-editor';
import { RefinementStreaming } from '@/components/workflows/refinement-streaming';
import { cn } from '@/lib/utils';

/**
 * Maps refinement phase values to user-friendly labels for display.
 */
const PHASE_LABELS: Record<string, string> = {
  cancelled: 'Cancelled',
  complete: 'Refinement complete',
  error: 'Error occurred',
  executing: 'Refining feature request...',
  executing_extended_thinking: 'Deep reasoning in progress...',
  idle: 'Ready',
  loading_agent: 'Loading agent...',
  processing_response: 'Processing response...',
  timeout: 'Timed out',
} as const;

type RefinementStreamingProps = ComponentProps<typeof RefinementStreaming>;

/**
 * Props for the RefinementWorkspace component.
 */
interface RefinementWorkspaceProps extends Omit<ComponentPropsWithRef<'section'>, 'children'> {
  /** Formatted Q&A pairs from clarification step */
  clarificationContext: null | string;
  /** Time elapsed during extended thinking (in milliseconds) */
  extendedThinkingElapsedMs?: number;
  /** The original feature request text to display */
  featureRequest: null | string;
  /** Whether the refinement agent is currently streaming */
  isStreaming: boolean;
  /** Whether the form is being submitted */
  isSubmitting?: boolean;
  /** Callback when user regenerates with guidance */
  onRegenerate?: (guidance: string) => void;
  /** Callback when user reverts changes */
  onRevert?: () => void;
  /** Callback when user saves edited text */
  onSave?: (text: string) => void;
  /** Callback when user skips refinement */
  onSkip?: () => void;
  /** Current phase of the refinement service */
  phase?: RefinementServicePhase;
  /** Refined text output from the agent */
  refinedText: null | string;
  /** Props to forward to RefinementStreaming component */
  streamingProps: RefinementStreamingProps;
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
 * RefinementWorkspace displays the refinement step with a split view layout.
 * The left side shows streaming output from the refinement agent, while the right side
 * displays the editor (when refined text is available) or a waiting state.
 *
 * Layout adapts based on streaming state:
 * - While streaming: emphasizes the streaming output (primary)
 * - After streaming: emphasizes the editor (summary)
 *
 * @example
 * ```tsx
 * <RefinementWorkspace
 *   featureRequest="Add dark mode support"
 *   clarificationContext="Q: Target platforms?\nA: Web and mobile"
 *   isStreaming={true}
 *   isSubmitting={false}
 *   phase="executing"
 *   refinedText={null}
 *   streamingProps={{...}}
 *   onSave={(text) => console.log('Saved:', text)}
 *   onRevert={() => console.log('Reverted')}
 *   onRegenerate={(guidance) => console.log('Regenerate with:', guidance)}
 *   onSkip={() => console.log('Skipped')}
 * />
 * ```
 */
export const RefinementWorkspace = ({
  clarificationContext,
  className,
  extendedThinkingElapsedMs,
  featureRequest,
  isStreaming,
  isSubmitting = false,
  onRegenerate,
  onRevert,
  onSave,
  onSkip,
  phase = 'idle',
  ref,
  refinedText,
  streamingProps,
  ...props
}: RefinementWorkspaceProps): ReactElement => {
  // 3. useMemo hooks
  const phaseLabel = useMemo(() => PHASE_LABELS[phase] ?? phase, [phase]);

  const layout = useMemo(() => (isStreaming ? 'primary' : 'summary'), [isStreaming]);

  const statusVariant = useMemo(() => {
    if (isStreaming) return 'pending';
    if (refinedText) return 'completed';
    return 'default';
  }, [isStreaming, refinedText]);

  const columnLayoutClass = useMemo(
    () =>
      isStreaming ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]' : 'lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]',
    [isStreaming]
  );

  const hasRefinedText = refinedText !== null;
  const hasClarificationContext = clarificationContext !== null && clarificationContext.trim() !== '';

  // 7. Derived variables for conditional rendering
  let editorContent: ReactElement;

  if (hasRefinedText && onSave && onRevert && onRegenerate) {
    editorContent = (
      <RefinementEditor
        initialText={refinedText}
        isDisabled={isSubmitting}
        isRegenerating={isStreaming}
        onRegenerate={onRegenerate}
        onRevert={onRevert}
        onSave={onSave}
      />
    );
  } else {
    editorContent = (
      <div className={'flex h-full flex-col items-center justify-center px-6 py-16 text-center'}>
        {/* Status Badge */}
        <div className={'rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground'}>
          Refinement pending
        </div>

        {/* Heading */}
        <h3 className={'mt-4 text-base font-semibold text-foreground'}>Waiting for refinement</h3>

        {/* Description */}
        <p className={'mt-2 max-w-sm text-sm text-muted-foreground'}>
          Once the agent finishes refining the feature request based on your clarification answers, you can review and
          edit the output here.
        </p>

        {/* Loading Placeholders */}
        <div className={'mt-6 w-full space-y-3'}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className={'h-4 w-full animate-pulse rounded-full bg-muted/60'}
              key={`refinement-placeholder-${index}`}
              style={{ width: `${90 - index * 12}%` }}
            />
          ))}
        </div>

        {/* Skip Option */}
        {onSkip && (
          <Fragment>
            <div className={'mt-8 text-xs text-muted-foreground'}>
              You can skip refinement if you want to continue with the original request.
            </div>
            <Button className={'mt-3'} onClick={onSkip} type={'button'} variant={'ghost'}>
              Skip refinement
            </Button>
          </Fragment>
        )}
      </div>
    );
  }

  return (
    <section aria-label={'Refinement workspace'} className={cn('w-full', className)} ref={ref} {...props}>
      {/* Header Card */}
      <div className={'rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm sm:p-8'}>
        <div className={'flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'}>
          {/* Title Section */}
          <div className={'flex items-start gap-4'}>
            {/* Icon */}
            <div className={'mt-1 flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent'}>
              <FileText className={'size-5'} />
            </div>

            {/* Title and Description */}
            <div className={'space-y-2'}>
              {/* Title with Status Badge */}
              <div className={'flex flex-wrap items-center gap-2'}>
                <h2 className={'text-lg font-semibold text-foreground'}>Refinement</h2>
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
                The feature request is being refined based on your clarification answers to produce a clear, unambiguous
                specification.
              </p>
            </div>
          </div>

          {/* Progress Section */}
          <div className={'flex w-full max-w-xs flex-col gap-2 lg:items-end'}>
            <div className={'text-xs tracking-[0.18em] text-muted-foreground uppercase'}>Status</div>
            <div className={'text-sm font-medium text-foreground'}>
              {isStreaming ? 'Refining...' : hasRefinedText ? 'Ready for review' : 'Waiting'}
            </div>
            <div className={'h-1.5 w-full overflow-hidden rounded-full bg-muted'}>
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  isStreaming ? 'w-1/2 bg-amber-500' : hasRefinedText ? 'w-full bg-green-500' : 'w-0 bg-accent'
                )}
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

        {/* Clarification Context Collapsible */}
        {hasClarificationContext && (
          <div className={'mt-4 border-t border-border/60 pt-4'}>
            <Collapsible>
              <CollapsibleTrigger className={'px-0 text-sm text-foreground'} variant={'ghost'}>
                Clarification answers
              </CollapsibleTrigger>
              <CollapsibleContent className={'mt-2 text-sm text-muted-foreground'}>
                <div className={'max-h-48 overflow-y-auto rounded-xl border border-border/60 bg-muted/30 p-4'}>
                  <p className={'pr-2 whitespace-pre-wrap'}>{clarificationContext}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* Split View Grid */}
      <div className={cn('mt-6 grid grid-cols-1 gap-6', columnLayoutClass)}>
        {/* Streaming Output */}
        <RefinementStreaming {...streamingProps} className={'h-full self-stretch'} layout={layout} />

        {/* Editor Panel */}
        <div className={'rounded-2xl border border-border/60 bg-background/80 shadow-sm'}>{editorContent}</div>
      </div>
    </section>
  );
};
