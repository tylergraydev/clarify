'use client';

import type { ComponentProps, ReactElement } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertCircle,
  BrainIcon,
  ChevronDownIcon,
  File,
  Loader2,
  RefreshCw,
  Search,
  SkipForward,
  StopCircle,
  XCircle,
} from 'lucide-react';
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';

import type { ClarificationOutcome, ClarificationQuestion } from '@/lib/validations/clarification';

import { Shimmer } from '@/components/ui/ai/shimmer';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

/**
 * Tool use indicator display names and icons.
 */
const TOOL_CONFIG: Record<string, { icon: typeof File; label: string }> = {
  Edit: { icon: File, label: 'Editing' },
  Glob: { icon: Search, label: 'Finding files' },
  Grep: { icon: Search, label: 'Searching' },
  Read: { icon: File, label: 'Reading' },
  Write: { icon: File, label: 'Writing' },
};

/**
 * Phase display configuration.
 */
const PHASE_LABELS: Record<string, string> = {
  cancelled: 'Cancelled',
  complete: 'Analysis complete',
  error: 'Error occurred',
  executing: 'Analyzing codebase...',
  idle: 'Ready',
  loading_agent: 'Loading agent...',
  processing_response: 'Processing response...',
  timeout: 'Timed out',
  waiting_for_user: 'Waiting for input',
};

export const clarificationStreamingVariants = cva(
  `
    relative flex flex-col rounded-lg border transition-all
    duration-200
  `,
  {
    defaultVariants: {
      status: 'default',
    },
    variants: {
      status: {
        default: 'border-border bg-muted/30',
        error: 'border-destructive/50 bg-destructive/5',
        running: 'border-accent/50 bg-accent/5',
        success: 'border-green-500/50 bg-green-500/5',
      },
    },
  }
);

/**
 * Active tool indicator for displaying current tool operations.
 */
interface ActiveTool {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
}

/**
 * Extended outcome fields for pause and retry information.
 */
interface ClarificationOutcomePauseInfo {
  pauseRequested?: boolean;
  retryCount?: number;
  skipFallbackAvailable?: boolean;
}

interface ClarificationStreamingProps
  extends Omit<ComponentProps<'div'>, 'onError'>,
    VariantProps<typeof clarificationStreamingVariants> {
  /** Active tool calls in progress */
  activeTools?: Array<ActiveTool>;
  /** Name of the agent being used */
  agentName?: string;
  /** Error message if something went wrong */
  error?: null | string;
  /** Whether a retry operation is in progress */
  isRetrying?: boolean;
  /** Whether the stream is currently running */
  isStreaming?: boolean;
  /** Maximum number of retry attempts allowed */
  maxRetries?: number;
  /** Callback when cancel button is clicked */
  onCancel?: () => void;
  /** Callback when a clarification error occurs */
  onClarificationError?: (error: string) => void;
  /** Callback when questions are ready */
  onQuestionsReady?: (questions: Array<ClarificationQuestion>) => void;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Callback when skip clarification button is clicked */
  onSkipClarification?: (reason: string) => void;
  /** Callback when skip is ready */
  onSkipReady?: (reason: string) => void;
  /** Outcome of the clarification process */
  outcome?: ExtendedClarificationOutcome | null;
  /** Current phase of execution */
  phase?: string;
  /** Current retry count */
  retryCount?: number;
  /** Session ID for the current streaming session */
  sessionId?: null | string;
  /** Streaming text output */
  text?: string;
  /** Thinking/reasoning blocks from the agent */
  thinking?: Array<string>;
}

/**
 * Extended outcome that may include pause and retry information.
 */
type ExtendedClarificationOutcome = ClarificationOutcome & ClarificationOutcomePauseInfo;

/**
 * ClarificationStreaming displays live agent output during the clarification exploration phase.
 * Shows streaming text, tool use indicators, thinking blocks, and progress phases.
 */
export const ClarificationStreaming = memo(
  ({
    activeTools = [],
    agentName = 'Clarification Agent',
    className,
    error,
    isRetrying = false,
    isStreaming = false,
    maxRetries = 3,
    onCancel,
    onClarificationError,
    onQuestionsReady,
    onRetry,
    onSkipClarification,
    onSkipReady,
    outcome,
    phase = 'idle',
    retryCount = 0,
    sessionId,
    status,
    text = '',
    thinking = [],
    ...props
  }: ClarificationStreamingProps): ReactElement => {
    const [isThinkingOpen, setIsThinkingOpen] = useState(true);

    // Compute retry-related state from outcome or props
    const effectiveRetryCount = outcome?.retryCount ?? retryCount;
    const isRetryLimitReached = effectiveRetryCount >= maxRetries;
    const canRetry = onRetry && !isRetryLimitReached && !isRetrying;
    const canSkip = onSkipClarification && (outcome?.skipFallbackAvailable !== false);

    // Determine visual status based on state
    const resolvedStatus = useMemo(() => {
      if (status) return status;
      if (error) return 'error';
      if (isStreaming) return 'running';
      if (outcome?.type === 'ERROR' || outcome?.type === 'TIMEOUT') return 'error';
      if (outcome?.type === 'QUESTIONS_FOR_USER' || outcome?.type === 'SKIP_CLARIFICATION') return 'success';
      return 'default';
    }, [status, error, isStreaming, outcome]);

    const isRunning = isStreaming || phase === 'executing' || phase === 'loading_agent';
    const isError = resolvedStatus === 'error';
    const isComplete = outcome?.type === 'QUESTIONS_FOR_USER' || outcome?.type === 'SKIP_CLARIFICATION';
    const hasActiveTools = activeTools.length > 0;
    const isIdle = !isRunning && !isError && !isComplete;
    const isErrorWithDetails = isError && (error || outcome?.type === 'ERROR' || outcome?.type === 'TIMEOUT');
    const isEmptyState = !isRunning && !text && !isError && phase === 'idle';

    // Handle outcome callbacks
    useEffect(() => {
      if (!outcome) return;

      if (outcome.type === 'QUESTIONS_FOR_USER' && onQuestionsReady) {
        onQuestionsReady(outcome.questions);
      } else if (outcome.type === 'SKIP_CLARIFICATION' && onSkipReady) {
        onSkipReady(outcome.reason);
      } else if ((outcome.type === 'ERROR' || outcome.type === 'TIMEOUT') && onClarificationError) {
        onClarificationError(outcome.error);
      }
    }, [outcome, onQuestionsReady, onSkipReady, onClarificationError]);

    const handleCancelClick = useCallback(() => {
      onCancel?.();
    }, [onCancel]);

    const handleRetryClick = useCallback(() => {
      onRetry?.();
    }, [onRetry]);

    const handleSkipClick = useCallback(() => {
      const errorMessage = error ?? (outcome?.type === 'ERROR' || outcome?.type === 'TIMEOUT' ? outcome.error : '');
      onSkipClarification?.(`Skipped due to error: ${errorMessage}`);
    }, [onSkipClarification, error, outcome]);

    const handleToggleThinking = useCallback((open: boolean) => {
      setIsThinkingOpen(open);
    }, []);

    return (
      <div className={cn(clarificationStreamingVariants({ status: resolvedStatus }), className)} {...props}>
        {/* Header Section */}
        <div className={'flex items-center justify-between border-b border-border/50 px-4 py-3'}>
          {/* Agent Name and Status */}
          <div className={'flex items-center gap-3'}>
            {isRunning && <Loader2 className={'size-4 animate-spin text-accent'} />}
            {isError && <AlertCircle className={'size-4 text-destructive'} />}
            {isComplete && <BrainIcon className={'size-4 text-green-500'} />}
            {isIdle && <BrainIcon className={'size-4 text-muted-foreground'} />}

            <div className={'flex flex-col'}>
              <span className={'text-sm font-medium'}>
                {isRunning ? (
                  <Shimmer duration={1.5}>{agentName} is analyzing...</Shimmer>
                ) : (
                  <Fragment>
                    {agentName}
                    {isComplete && ' - Complete'}
                    {isError && ' - Error'}
                  </Fragment>
                )}
              </span>
              <span className={'text-xs text-muted-foreground'}>{PHASE_LABELS[phase] ?? phase}</span>
            </div>
          </div>

          {/* Cancel Button */}
          {isRunning && onCancel && (
            <Button onClick={handleCancelClick} size={'sm'} type={'button'} variant={'ghost'}>
              <StopCircle className={'mr-1 size-4'} />
              Cancel
            </Button>
          )}
        </div>

        {/* Active Tools Section */}
        {hasActiveTools && (
          <div className={'border-b border-border/50 px-4 py-2'}>
            <div className={'flex flex-wrap items-center gap-2'}>
              {activeTools.map((tool) => (
                <ToolIndicator key={tool.toolUseId} tool={tool} />
              ))}
            </div>
          </div>
        )}

        {/* Thinking Section (Collapsible) */}
        {thinking.length > 0 && (
          <Collapsible onOpenChange={handleToggleThinking} open={isThinkingOpen}>
            <div className={'border-b border-border/50'}>
              <CollapsibleTrigger
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground',
                  'transition-colors hover:text-foreground'
                )}
                isHideChevron
                variant={'ghost'}
              >
                <BrainIcon className={'size-4'} />
                <span className={'flex-1 text-left'}>
                  {isStreaming ? (
                    <Shimmer duration={1}>Thinking...</Shimmer>
                  ) : (
                    `Reasoning (${thinking.length} ${thinking.length === 1 ? 'block' : 'blocks'})`
                  )}
                </span>
                <ChevronDownIcon
                  className={cn('size-4 transition-transform', isThinkingOpen ? 'rotate-180' : 'rotate-0')}
                />
              </CollapsibleTrigger>
              <CollapsibleContent
                className={cn(
                  'text-sm text-muted-foreground outline-none',
                  'data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-top-2',
                  'data-open:animate-in data-open:slide-in-from-top-2'
                )}
              >
                <div className={'max-h-48 space-y-2 overflow-y-auto px-4 pb-3'}>
                  {thinking.map((block, index) => (
                    <div className={'rounded-md bg-muted/50 p-2 text-xs'} key={index}>
                      <p className={'whitespace-pre-wrap'}>{block}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* Main Streaming Content */}
        <div className={'flex-1'}>
          <StickToBottom className={'relative h-64 overflow-y-hidden'} initial={'smooth'} resize={'smooth'}>
            <StickToBottom.Content className={'flex flex-col p-4'}>
              {/* Loading State */}
              {isRunning && !text && (
                <div className={'flex items-center gap-2 text-sm text-muted-foreground'}>
                  <Loader2 className={'size-4 animate-spin'} />
                  <span>Analyzing codebase and feature request...</span>
                </div>
              )}

              {/* Streaming Text */}
              {text && (
                <div className={'text-sm text-foreground'}>
                  <p className={'whitespace-pre-wrap'}>
                    {text}
                    {isStreaming && <span className={'ml-0.5 animate-pulse'}>|</span>}
                  </p>
                </div>
              )}

              {/* Error State with Retry/Skip Options */}
              {isErrorWithDetails && (
                <div className={'space-y-3'}>
                  <div className={'flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive'}>
                    <XCircle className={'mt-0.5 size-4 shrink-0'} />
                    <div className={'flex-1'}>
                      <p className={'font-medium'}>
                        {outcome?.type === 'TIMEOUT' ? 'Operation timed out' : 'An error occurred'}
                      </p>
                      <p className={'mt-1 text-xs opacity-80'}>
                        {error ?? (outcome?.type === 'ERROR' || outcome?.type === 'TIMEOUT' ? outcome.error : '')}
                      </p>
                      {effectiveRetryCount > 0 && (
                        <p className={'mt-1 text-xs opacity-60'}>
                          Attempt {effectiveRetryCount} of {maxRetries}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Retry and Skip Actions */}
                  {(canRetry || canSkip) && (
                    <div className={'flex items-center gap-2'}>
                      {canRetry && (
                        <Button
                          disabled={isRetrying}
                          onClick={handleRetryClick}
                          size={'sm'}
                          type={'button'}
                          variant={'outline'}
                        >
                          {isRetrying ? (
                            <Fragment>
                              <Loader2 className={'mr-1.5 size-4 animate-spin'} />
                              Retrying...
                            </Fragment>
                          ) : (
                            <Fragment>
                              <RefreshCw className={'mr-1.5 size-4'} />
                              Retry
                            </Fragment>
                          )}
                        </Button>
                      )}
                      {canSkip && (
                        <Button
                          disabled={isRetrying}
                          onClick={handleSkipClick}
                          size={'sm'}
                          type={'button'}
                          variant={'ghost'}
                        >
                          <SkipForward className={'mr-1.5 size-4'} />
                          Skip Clarification
                        </Button>
                      )}
                      {isRetryLimitReached && (
                        <span className={'text-xs text-muted-foreground'}>
                          Maximum retry attempts reached
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {isEmptyState && (
                <div className={'text-sm text-muted-foreground'}>Ready to start analysis...</div>
              )}
            </StickToBottom.Content>
            <StreamingScrollButton />
          </StickToBottom>
        </div>

        {/* Session Info (Debug) */}
        {sessionId && (
          <div className={'border-t border-border/50 px-4 py-2'}>
            <span className={'text-xs text-muted-foreground'}>Session: {sessionId.slice(0, 8)}...</span>
          </div>
        )}
      </div>
    );
  }
);

ClarificationStreaming.displayName = 'ClarificationStreaming';

/**
 * ToolIndicator displays an active tool operation with its file path or search pattern.
 */
interface ToolIndicatorProps {
  tool: ActiveTool;
}

const ToolIndicator = memo(({ tool }: ToolIndicatorProps): ReactElement => {
  const config = TOOL_CONFIG[tool.toolName] ?? { icon: File, label: tool.toolName };
  const Icon = config.icon;

  // Extract relevant info from tool input
  const displayPath = useMemo(() => {
    const input = tool.toolInput;
    if (typeof input.file_path === 'string') {
      return formatPath(input.file_path);
    }
    if (typeof input.path === 'string') {
      return formatPath(input.path);
    }
    if (typeof input.pattern === 'string') {
      return input.pattern;
    }
    return null;
  }, [tool.toolInput]);

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-1',
        'animate-in text-xs text-accent fade-in-0 slide-in-from-left-2'
      )}
    >
      <Icon className={'size-3'} />
      <span className={'font-medium'}>{config.label}</span>
      {displayPath && (
        <Fragment>
          <span className={'text-muted-foreground'}>-</span>
          <span className={'max-w-48 truncate text-muted-foreground'}>{displayPath}</span>
        </Fragment>
      )}
    </div>
  );
});

ToolIndicator.displayName = 'ToolIndicator';

/**
 * StreamingScrollButton for auto-scrolling to bottom.
 */
const StreamingScrollButton = memo((): null | ReactElement => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  const scrollContainerRef = useRef<HTMLButtonElement>(null);

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  if (isAtBottom) {
    return null;
  }

  return (
    <Button
      className={'absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full'}
      onClick={handleScrollToBottom}
      ref={scrollContainerRef}
      size={'sm'}
      type={'button'}
      variant={'outline'}
    >
      Scroll to bottom
    </Button>
  );
});

StreamingScrollButton.displayName = 'StreamingScrollButton';

/**
 * Formats a file path for display by extracting the last 2-3 segments.
 */
function formatPath(path: string): string {
  const segments = path.split(/[/\\]/);
  const lastSegments = segments.slice(-3);
  return lastSegments.join('/');
}
