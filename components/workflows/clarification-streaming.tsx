'use client';

import type { ComponentProps, ReactElement } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertCircle,
  Bot,
  BrainIcon,
  ChevronDownIcon,
  File,
  Globe,
  History,
  Loader2,
  RefreshCw,
  Search,
  SkipForward,
  StopCircle,
  Terminal,
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
  Bash: { icon: Terminal, label: 'Running command' },
  Edit: { icon: File, label: 'Editing' },
  Glob: { icon: Search, label: 'Finding files' },
  Grep: { icon: Search, label: 'Searching' },
  Read: { icon: File, label: 'Reading' },
  StructuredOutput: { icon: File, label: 'Structuring output' },
  Task: { icon: Bot, label: 'Delegating' },
  WebFetch: { icon: Globe, label: 'Fetching web' },
  WebSearch: { icon: Globe, label: 'Searching web' },
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
  executing_extended_thinking: 'Deep reasoning in progress...',
  idle: 'Ready',
  loading_agent: 'Loading agent...',
  processing_response: 'Processing response...',
  timeout: 'Timed out',
  waiting_for_user: 'Waiting for input',
};

export const clarificationStreamingVariants = cva(
  `
    relative flex min-h-0 flex-col overflow-hidden rounded-2xl border transition-all
    duration-200
  `,
  {
    defaultVariants: {
      layout: 'primary',
      status: 'default',
    },
    variants: {
      layout: {
        primary: 'bg-background/80 shadow-sm',
        summary: 'bg-muted/30',
      },
      status: {
        default: 'border-border/60',
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
  extends Omit<ComponentProps<'div'>, 'onError'>, VariantProps<typeof clarificationStreamingVariants> {
  /** Active tool calls in progress */
  activeTools?: Array<ActiveTool>;
  /** Name of the agent being used */
  agentName?: string;
  /** Error message if something went wrong */
  error?: null | string;
  /** Elapsed time in milliseconds for extended thinking mode */
  extendedThinkingElapsedMs?: number;
  /** Whether a retry operation is in progress */
  isRetrying?: boolean;
  /** Whether the stream is currently running */
  isStreaming?: boolean;
  /** Maximum number of retry attempts allowed */
  maxRetries?: number;
  /** Maximum thinking tokens budget */
  maxThinkingTokens?: null | number;
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
  /** History of all tool calls from the session */
  toolHistory?: Array<ActiveTool>;
}

/**
 * Extended outcome that may include pause and retry information.
 */
type ExtendedClarificationOutcome = ClarificationOutcome & ClarificationOutcomePauseInfo;

/**
 * Formats elapsed time from milliseconds into human-readable format.
 * @param ms - Elapsed time in milliseconds
 * @returns Formatted string like "3m 24s" or "42s"
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
 * ClarificationStreaming displays live agent output during the clarification exploration phase.
 * Shows streaming text, tool use indicators, thinking blocks, and progress phases.
 */
export const ClarificationStreaming = memo(
  ({
    activeTools = [],
    agentName = 'Clarification Agent',
    className,
    error,
    extendedThinkingElapsedMs,
    isRetrying = false,
    isStreaming = false,
    layout = 'primary',
    maxRetries = 3,
    maxThinkingTokens,
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
    toolHistory = [],
    ...props
  }: ClarificationStreamingProps): ReactElement => {
    const [isThinkingOpen, setIsThinkingOpen] = useState(layout !== 'summary');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const handledOutcomeRef = useRef<null | string>(null);

    // Compute retry-related state from outcome or props
    const effectiveRetryCount = outcome?.retryCount ?? retryCount;
    const isRetryLimitReached = effectiveRetryCount >= maxRetries;
    const canRetry = onRetry && !isRetryLimitReached && !isRetrying;
    const canSkip = onSkipClarification && outcome?.skipFallbackAvailable !== false;

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

    // Compute past tools (tools in history that are no longer active)
    const activeToolIds = useMemo(() => new Set(activeTools.map((t) => t.toolUseId)), [activeTools]);
    const pastTools = useMemo(
      () => toolHistory.filter((t) => !activeToolIds.has(t.toolUseId)),
      [toolHistory, activeToolIds]
    );
    const hasPastTools = pastTools.length > 0;
    const isErrorWithDetails = isError && (error || outcome?.type === 'ERROR' || outcome?.type === 'TIMEOUT');
    const isEmptyState = !isRunning && !text && !isError && phase === 'idle';
    const isExtendedThinking =
      maxThinkingTokens && maxThinkingTokens > 0 && (phase === 'executing' || phase === 'executing_extended_thinking');
    const shouldShowElapsedTime = isExtendedThinking && extendedThinkingElapsedMs !== undefined;
    const streamHeightClass = layout === 'summary' ? 'min-h-0' : 'min-h-[16rem]';
    const headerTitle = !isRunning && layout === 'summary' ? `${agentName} · Summary` : agentName;

    // Handle outcome callbacks
    useEffect(() => {
      if (!outcome) {
        handledOutcomeRef.current = null;
        return;
      }

      if (handledOutcomeRef.current === outcome.type) {
        return;
      }

      handledOutcomeRef.current = outcome.type;

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

    const handleToggleHistory = useCallback((open: boolean) => {
      setIsHistoryOpen(open);
    }, []);

    return (
      <div className={cn(clarificationStreamingVariants({ layout, status: resolvedStatus }), className)} {...props}>
        {/* Header Section */}
        <div className={'flex items-center justify-between border-b border-border/50 px-4 py-3'}>
          {/* Agent Name and Status */}
          <div className={'flex items-center gap-3'}>
            {isRunning && !isExtendedThinking && <Loader2 className={'size-4 animate-spin text-accent'} />}
            {isRunning && isExtendedThinking && <BrainIcon className={'size-4 animate-pulse text-amber-600'} />}
            {isError && <AlertCircle className={'size-4 text-destructive'} />}
            {isComplete && <BrainIcon className={'size-4 text-green-500'} />}
            {isIdle && <BrainIcon className={'size-4 text-muted-foreground'} />}

            <div className={'flex flex-col'}>
              <span className={'text-sm font-medium'}>
                {isRunning ? (
                  <Shimmer duration={isExtendedThinking ? 2.5 : 1.5}>
                    {agentName} is {isExtendedThinking ? 'deeply reasoning' : 'analyzing'}...
                  </Shimmer>
                ) : (
                  <Fragment>
                    {headerTitle}
                    {isComplete && ' - Complete'}
                    {isError && ' - Error'}
                  </Fragment>
                )}
              </span>
              <span className={'text-xs text-muted-foreground'}>
                {PHASE_LABELS[phase] ?? phase}
                {shouldShowElapsedTime && <Fragment> · {formatElapsedTime(extendedThinkingElapsedMs)}</Fragment>}
              </span>
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

        {/* Extended Thinking Banner */}
        {isExtendedThinking && (
          <div className={'border-b border-amber-500/30 bg-amber-500/10 px-4 py-3'}>
            <div className={'flex items-center gap-3'}>
              <BrainIcon className={'size-5 animate-pulse text-amber-600'} />
              <div className={'flex-1'}>
                <div className={'flex items-center gap-2'}>
                  <span className={'text-sm font-medium text-amber-900 dark:text-amber-100'}>
                    Extended Thinking Mode Active
                  </span>
                  {extendedThinkingElapsedMs !== undefined && (
                    <span className={'text-xs text-amber-700 dark:text-amber-300'}>
                      {formatElapsedTime(extendedThinkingElapsedMs)} elapsed
                    </span>
                  )}
                </div>
                <p className={'mt-1 text-xs text-amber-700 dark:text-amber-300'}>
                  The agent is performing deep reasoning with up to {maxThinkingTokens?.toLocaleString()} thinking
                  tokens. Real-time text streaming is disabled - the complete response will appear when reasoning
                  finishes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Tools Section */}
        <div className={'border-b border-border/50 px-4 py-2'}>
          {hasActiveTools ? (
            <div className={'flex flex-wrap items-center gap-2'}>
              {activeTools.map((tool) => (
                <ToolIndicator key={tool.toolUseId} tool={tool} />
              ))}
            </div>
          ) : (
            <span className={'text-xs text-muted-foreground'}>Waiting for tool execution</span>
          )}
        </div>

        {/* Tool History Section (Collapsible) */}
        {hasPastTools && (
          <Collapsible onOpenChange={handleToggleHistory} open={isHistoryOpen}>
            <div className={'border-b border-border/50'}>
              <CollapsibleTrigger
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground',
                  'transition-colors hover:text-foreground'
                )}
                isHideChevron
                variant={'ghost'}
              >
                <History className={'size-4'} />
                <span className={'flex-1 text-left'}>
                  Tool history ({pastTools.length} {pastTools.length === 1 ? 'tool' : 'tools'})
                </span>
                <ChevronDownIcon
                  className={cn('size-4 transition-transform', isHistoryOpen ? 'rotate-180' : 'rotate-0')}
                />
              </CollapsibleTrigger>
              <CollapsibleContent
                className={cn(
                  'text-sm text-muted-foreground outline-none',
                  'data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-top-2',
                  'data-open:animate-in data-open:slide-in-from-top-2'
                )}
              >
                <div className={'max-h-64 space-y-2 overflow-y-auto px-4 pb-3'}>
                  {/* Reverse to show newest first */}
                  {[...pastTools].reverse().map((tool) => (
                    <ToolIndicator key={tool.toolUseId} tool={tool} variant={'history'} />
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
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
          <StickToBottom
            className={cn('relative min-h-0 flex-1 overflow-y-hidden', streamHeightClass)}
            initial={'smooth'}
            resize={'smooth'}
          >
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
                        <span className={'text-xs text-muted-foreground'}>Maximum retry attempts reached</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {isEmptyState && <div className={'text-sm text-muted-foreground'}>Ready to start analysis...</div>}
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

interface ToolDetail {
  label: string;
  value: string;
}

/**
 * ToolIndicator displays an active tool operation with detailed input context.
 */
interface ToolIndicatorProps {
  tool: ActiveTool;
  /** Variant for styling: 'active' for current tools, 'history' for past tools */
  variant?: 'active' | 'history';
}

const ToolIndicator = memo(({ tool, variant = 'active' }: ToolIndicatorProps): ReactElement => {
  const config = TOOL_CONFIG[tool.toolName] ?? { icon: File, label: tool.toolName };
  const Icon = config.icon;
  const { details, label, rawPreview, summary } = useMemo(() => buildToolDisplay(tool), [tool]);

  const _hasNoFormattedContent = !summary && details.length === 0;
  const _shouldShowRawPreview = _hasNoFormattedContent && rawPreview;
  const _shouldShowPreparingMessage = _hasNoFormattedContent && !rawPreview;

  const isHistory = variant === 'history';

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs',
        isHistory
          ? 'border-border/40 bg-muted/20 text-muted-foreground'
          : 'min-w-[220px] flex-1 animate-in border-accent/30 bg-accent/5 text-accent fade-in-0 slide-in-from-left-2'
      )}
    >
      <div className={'flex items-center gap-2'}>
        <Icon className={'size-3.5'} />
        <span className={cn('font-medium', isHistory ? 'text-foreground/70' : 'text-foreground')}>{label}</span>
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] tracking-wide uppercase',
            isHistory ? 'bg-muted/40 text-muted-foreground' : 'bg-accent/20 text-accent'
          )}
        >
          Tool
        </span>
        <span className={'font-mono text-[11px] text-muted-foreground'}>{tool.toolName}</span>
      </div>

      {summary && <div className={cn('text-xs', isHistory ? 'text-foreground/60' : 'text-foreground')}>{summary}</div>}

      {details.length > 0 && (
        <div className={'flex flex-wrap gap-1'}>
          {details.map((detail, index) => (
            <span
              className={'rounded-md bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground'}
              key={`${detail.label}-${index}`}
            >
              <span className={'font-medium text-foreground/70'}>{detail.label}:</span> {detail.value}
            </span>
          ))}
        </div>
      )}

      {_shouldShowRawPreview && (
        <div className={'rounded-md bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground'}>
          {rawPreview}
        </div>
      )}

      {_shouldShowPreparingMessage && !isHistory && (
        <div className={'text-[11px] text-muted-foreground'}>Preparing tool input...</div>
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

const TOOL_DETAIL_LIMIT = 8;
const TOOL_PREVIEW_LIMIT = 180;
const TOOL_TEXT_LIMIT = 90;

function buildToolDetails(input: Record<string, unknown>): {
  details: Array<ToolDetail>;
  rawPreview: null | string;
} {
  const details: Array<ToolDetail> = [];
  const usedKeys = new Set<string>();

  const addDetail = (label: string, value: null | string, keys: Array<string> = []): void => {
    if (!value) return;
    details.push({ label, value });
    keys.forEach((key) => usedKeys.add(key));
  };

  const addKey = (key: string): void => {
    usedKeys.add(key);
  };

  const filePath = getString(input, 'file_path');
  if (filePath) {
    addDetail('file', formatPath(filePath), ['file_path']);
  } else {
    const pathValue = getString(input, 'path') ?? getString(input, 'file');
    if (pathValue) {
      addDetail('file', formatPath(pathValue), ['path', 'file']);
    }
  }

  const directory = getString(input, 'directory') ?? getString(input, 'cwd');
  if (directory) {
    addDetail('dir', formatPath(directory), ['directory', 'cwd']);
  }

  const pattern = getString(input, 'pattern') ?? getString(input, 'glob') ?? getString(input, 'regex');
  if (pattern) {
    addDetail('pattern', truncateText(pattern, TOOL_TEXT_LIMIT), ['pattern', 'glob', 'regex']);
  }

  const query = getString(input, 'query') ?? getString(input, 'search') ?? getString(input, 'q');
  if (query) {
    addDetail('query', truncateText(query, TOOL_TEXT_LIMIT), ['query', 'search', 'q']);
  }

  const url = getString(input, 'url');
  if (url) {
    addDetail('url', truncateText(url, TOOL_TEXT_LIMIT), ['url']);
  }

  const command = getString(input, 'command') ?? getString(input, 'cmd');
  if (command) {
    addDetail('command', truncateText(command, TOOL_TEXT_LIMIT), ['command', 'cmd']);
  }

  const offset = getNumber(input, 'offset');
  if (offset !== null) {
    addDetail('offset', String(offset), ['offset']);
  }

  const limit = getNumber(input, 'limit');
  if (limit !== null) {
    addDetail('limit', String(limit), ['limit']);
  }

  const startLine = getNumber(input, 'start_line') ?? getNumber(input, 'start');
  if (startLine !== null) {
    addDetail('start', String(startLine), ['start_line', 'start']);
  }

  const endLine = getNumber(input, 'end_line') ?? getNumber(input, 'end');
  if (endLine !== null) {
    addDetail('end', String(endLine), ['end_line', 'end']);
  }

  const line = getNumber(input, 'line');
  if (line !== null) {
    addDetail('line', String(line), ['line']);
  }

  const replaceAll = getBoolean(input, 'replace_all');
  if (replaceAll !== null) {
    addDetail('replace', replaceAll ? 'all' : 'first', ['replace_all']);
  }

  const caseSensitive = getBoolean(input, 'case_sensitive');
  if (caseSensitive !== null) {
    addDetail('case', caseSensitive ? 'sensitive' : 'insensitive', ['case_sensitive']);
  }

  const edits = input.edits;
  if (Array.isArray(edits)) {
    addDetail('edits', `${edits.length}`, ['edits']);
  }

  const fileCount = input.files;
  if (Array.isArray(fileCount)) {
    addDetail('files', `${fileCount.length}`, ['files']);
  }

  const pathList = input.paths;
  if (Array.isArray(pathList)) {
    addDetail('paths', `${pathList.length}`, ['paths']);
  }

  const longTextFields: Array<{ key: string; label: string }> = [
    { key: 'content', label: 'content' },
    { key: 'old_string', label: 'old' },
    { key: 'new_string', label: 'new' },
    { key: 'text', label: 'text' },
    { key: 'prompt', label: 'prompt' },
    { key: 'instructions', label: 'instructions' },
    { key: 'schema', label: 'schema' },
    { key: 'code', label: 'code' },
  ];

  longTextFields.forEach(({ key, label }) => {
    const value = getString(input, key);
    if (value) {
      addDetail(label, formatCharCount(value), [key]);
    }
  });

  Object.entries(input).forEach(([key, value]) => {
    if (details.length >= TOOL_DETAIL_LIMIT) return;
    if (usedKeys.has(key)) return;
    if (key === '_partialJson') return;
    const formatted = formatToolValue(value);
    if (formatted) {
      addDetail(formatToolName(key), formatted, [key]);
    } else {
      addKey(key);
    }
  });

  const rawPreview = buildToolInputPreview(input, details.length);
  return { details, rawPreview };
}

function buildToolDisplay(tool: ActiveTool): {
  details: Array<ToolDetail>;
  label: string;
  rawPreview: null | string;
  summary: null | string;
} {
  const config = TOOL_CONFIG[tool.toolName];
  const label = config?.label ?? formatToolName(tool.toolName);
  const normalizedInput = normalizeToolInput(tool.toolInput);
  const summary = buildToolSummary(tool.toolName, normalizedInput);
  const { details, rawPreview } = buildToolDetails(normalizedInput);

  return { details, label, rawPreview, summary };
}

function buildToolInputPreview(input: Record<string, unknown>, detailCount: number): null | string {
  const partialJson = typeof input._partialJson === 'string' ? input._partialJson : null;
  if (detailCount === 0 && partialJson) {
    return `input (partial): ${truncateText(partialJson, TOOL_PREVIEW_LIMIT)}`;
  }

  if (detailCount >= 3) {
    return null;
  }

  const previewSource = Object.fromEntries(Object.entries(input).filter(([key]) => key !== '_partialJson'));
  const preview = safeStringify(previewSource);
  if (!preview || preview === '{}') return null;
  return `input: ${truncateText(preview, TOOL_PREVIEW_LIMIT)}`;
}

function buildToolSummary(toolName: string, input: Record<string, unknown>): null | string {
  const filePath = getString(input, 'file_path') ?? getString(input, 'path') ?? getString(input, 'file');
  const pattern = getString(input, 'pattern') ?? getString(input, 'glob') ?? getString(input, 'regex');
  const query = getString(input, 'query') ?? getString(input, 'search') ?? getString(input, 'q');
  const url = getString(input, 'url');
  const command = getString(input, 'command') ?? getString(input, 'cmd');
  const offset = getNumber(input, 'offset');
  const limit = getNumber(input, 'limit');

  switch (toolName) {
    case 'Bash': {
      return command ? `Running "${truncateText(command, TOOL_TEXT_LIMIT)}"` : 'Running command';
    }
    case 'Edit': {
      if (!filePath) return null;
      const edits = Array.isArray(input.edits) ? input.edits.length : null;
      const replaceAll = getBoolean(input, 'replace_all');
      const editHint = edits ? `${edits} edits` : replaceAll ? 'replace all' : null;
      return editHint ? `Editing ${formatPath(filePath)} (${editHint})` : `Editing ${formatPath(filePath)}`;
    }
    case 'Glob': {
      if (!pattern) return null;
      return `Finding files matching "${truncateText(pattern, TOOL_TEXT_LIMIT)}"`;
    }
    case 'Grep': {
      if (!pattern) return null;
      return `Searching for "${truncateText(pattern, TOOL_TEXT_LIMIT)}"`;
    }
    case 'Read': {
      if (!filePath) return null;
      const range = offset !== null || limit !== null ? ` (offset ${offset ?? 0}, limit ${limit ?? 'auto'})` : '';
      return `Reading ${formatPath(filePath)}${range}`;
    }
    case 'StructuredOutput': {
      return 'Generating structured output';
    }
    case 'Task': {
      const description = getString(input, 'description') ?? getString(input, 'task') ?? getString(input, 'prompt');
      return description ? `Delegating "${truncateText(description, TOOL_TEXT_LIMIT)}"` : 'Delegating to sub-agent';
    }
    case 'WebFetch': {
      return url ? `Fetching ${truncateText(url, TOOL_TEXT_LIMIT)}` : 'Fetching from the web';
    }
    case 'WebSearch': {
      return query ? `Searching the web for "${truncateText(query, TOOL_TEXT_LIMIT)}"` : 'Searching the web';
    }
    case 'Write': {
      if (!filePath) return null;
      const content = getString(input, 'content');
      return content
        ? `Writing ${formatCharCount(content)} to ${formatPath(filePath)}`
        : `Writing to ${formatPath(filePath)}`;
    }
    default: {
      if (filePath) {
        return `Using ${formatToolName(toolName)} on ${formatPath(filePath)}`;
      }
      return null;
    }
  }
}

function formatCharCount(value: string): string {
  return `${value.length} chars`;
}

function formatToolName(name: string): string {
  if (!name) return 'Tool';
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}

function formatToolValue(value: unknown): null | string {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return truncateText(value, TOOL_TEXT_LIMIT);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '0';
    }
    if (value.length <= 3 && value.every((entry) => typeof entry === 'string')) {
      return truncateText(value.join(', '), TOOL_TEXT_LIMIT);
    }
    return `${value.length} items`;
  }
  if (typeof value === 'object') {
    const preview = safeStringify(value);
    return preview ? truncateText(preview, TOOL_TEXT_LIMIT) : null;
  }
  return null;
}

function getBoolean(input: Record<string, unknown>, key: string): boolean | null {
  const value = input[key];
  if (typeof value === 'boolean') {
    return value;
  }
  return null;
}

function getNumber(input: Record<string, unknown>, key: string): null | number {
  const value = input[key];
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  return null;
}

function getString(input: Record<string, unknown>, key: string): null | string {
  const value = input[key];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return null;
}

function normalizeToolInput(toolInput: Record<string, unknown>): Record<string, unknown> {
  const input = toolInput ?? {};
  const partialJson = typeof input._partialJson === 'string' ? input._partialJson : null;
  if (partialJson) {
    const parsed = safeParseJson(partialJson);
    if (parsed) {
      return { ...parsed, _partialJson: partialJson };
    }
  }
  return input;
}

function safeParseJson(value: string): null | Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function safeStringify(value: unknown): null | string {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}
