'use client';

import type { ComponentPropsWithRef, ReactElement } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertCircle,
  BrainIcon,
  ChevronDownIcon,
  File,
  Globe,
  History,
  Loader2,
  Search,
  StopCircle,
  Terminal,
} from 'lucide-react';
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';

import type { DiscoveryActiveTool, DiscoveryPhase } from '@/lib/stores/discovery-store';
import type { FileDiscoveryOutcome, FileDiscoveryServicePhase } from '@/types/electron';

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
  Task: { icon: File, label: 'Delegating' },
  WebFetch: { icon: Globe, label: 'Fetching web' },
  WebSearch: { icon: Globe, label: 'Searching web' },
  Write: { icon: File, label: 'Writing' },
};

/**
 * Phase display configuration for discovery.
 */
const PHASE_LABELS: Record<DiscoveryPhase | FileDiscoveryServicePhase | string, string> = {
  cancelled: 'Cancelled',
  complete: 'Discovery complete',
  error: 'Error occurred',
  executing: 'Discovering files...',
  executing_extended_thinking: 'Deep reasoning in progress...',
  idle: 'Ready',
  loading_agent: 'Loading agent...',
  processing_response: 'Processing response...',
  reviewing: 'Reviewing files',
  streaming: 'Discovering files...',
  timeout: 'Timed out',
};

export const discoveryStreamingVariants = cva(
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

interface DiscoveryStreamingProps
  extends Omit<ComponentPropsWithRef<'div'>, 'onError'>, VariantProps<typeof discoveryStreamingVariants> {
  /** Active tool calls in progress */
  activeTools?: Array<DiscoveryActiveTool>;
  /** Name of the agent being used */
  agentName?: string;
  /** Error message if something went wrong */
  error?: null | string;
  /** Elapsed time in milliseconds for extended thinking mode */
  extendedThinkingElapsedMs?: number;
  /** Whether the stream is currently running */
  isStreaming?: boolean;
  /** Maximum thinking tokens budget */
  maxThinkingTokens?: null | number;
  /** Callback when cancel button is clicked */
  onCancel?: () => void;
  /** Callback when discovery completes successfully */
  onComplete?: (outcome: FileDiscoveryOutcome) => void;
  /** Callback when a discovery error occurs */
  onError?: (error: string) => void;
  /** Outcome of the discovery process */
  outcome?: FileDiscoveryOutcome | null;
  /** Current phase of execution */
  phase?: DiscoveryPhase | FileDiscoveryServicePhase;
  /** Session ID for the current streaming session */
  sessionId?: null | string;
  /** Streaming text output */
  streamingText?: string;
  /** Thinking/reasoning blocks from the agent */
  thinking?: Array<string>;
  /** History of all tool calls from the session */
  toolHistory?: Array<DiscoveryActiveTool>;
}

/**
 * DiscoveryStreaming displays live agent output during the file discovery phase.
 * Shows streaming text, tool use indicators, thinking blocks, and progress phases.
 */
export const DiscoveryStreaming = memo(
  ({
    activeTools = [],
    agentName = 'Discovery Agent',
    className,
    error,
    extendedThinkingElapsedMs,
    isStreaming = false,
    layout = 'primary',
    maxThinkingTokens,
    onCancel,
    onComplete,
    onError,
    outcome,
    phase = 'idle',
    ref,
    sessionId,
    status,
    streamingText = '',
    thinking = [],
    toolHistory = [],
    ...props
  }: DiscoveryStreamingProps): ReactElement => {
    const [isThinkingOpen, setIsThinkingOpen] = useState(layout !== 'summary');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const handledOutcomeRef = useRef<null | string>(null);

    // Determine visual status based on state
    const resolvedStatus = useMemo(() => {
      if (status) return status;
      if (error) return 'error';
      if (isStreaming) return 'running';
      if (outcome?.type === 'ERROR' || outcome?.type === 'TIMEOUT') return 'error';
      if (outcome?.type === 'SUCCESS') return 'success';
      return 'default';
    }, [status, error, isStreaming, outcome]);

    const isRunning = isStreaming || phase === 'streaming' || phase === 'executing';
    const isError = resolvedStatus === 'error';
    const isComplete = outcome?.type === 'SUCCESS';
    const hasActiveTools = activeTools.length > 0;
    const isIdle = !isRunning && !isError && !isComplete;

    // Compute past tools (tools in history that are no longer active)
    const activeToolIds = useMemo(() => new Set(activeTools.map((t) => t.id)), [activeTools]);
    const pastTools = useMemo(() => toolHistory.filter((t) => !activeToolIds.has(t.id)), [toolHistory, activeToolIds]);
    const hasPastTools = pastTools.length > 0;
    const isErrorWithDetails = isError && (error || outcome?.type === 'ERROR' || outcome?.type === 'TIMEOUT');
    const isEmptyState = !isRunning && !streamingText && !isError && phase === 'idle';
    const isExtendedThinking =
      maxThinkingTokens && maxThinkingTokens > 0 && (phase === 'executing' || phase === 'streaming');
    const shouldShowElapsedTime = isExtendedThinking && extendedThinkingElapsedMs !== undefined;
    const streamHeightClass = layout === 'summary' ? 'min-h-0' : 'min-h-[16rem]';
    const headerTitle = !isRunning && layout === 'summary' ? `${agentName} - Summary` : agentName;

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

      if (outcome.type === 'SUCCESS' && onComplete) {
        onComplete(outcome);
      } else if ((outcome.type === 'ERROR' || outcome.type === 'TIMEOUT') && onError) {
        onError(outcome.error);
      }
    }, [outcome, onComplete, onError]);

    const handleCancelClick = useCallback(() => {
      onCancel?.();
    }, [onCancel]);

    const handleToggleThinking = useCallback((open: boolean) => {
      setIsThinkingOpen(open);
    }, []);

    const handleToggleHistory = useCallback((open: boolean) => {
      setIsHistoryOpen(open);
    }, []);

    return (
      <div
        className={cn(discoveryStreamingVariants({ layout, status: resolvedStatus }), className)}
        ref={ref}
        {...props}
      >
        {/* Header Section */}
        <div className={'flex items-center justify-between border-b border-border/50 px-4 py-3'}>
          {/* Agent Name and Status */}
          <div className={'flex items-center gap-3'}>
            {isRunning && !isExtendedThinking && <Loader2 className={'size-4 animate-spin text-accent'} />}
            {isRunning && isExtendedThinking && <BrainIcon className={'size-4 animate-pulse text-amber-600'} />}
            {isError && <AlertCircle className={'size-4 text-destructive'} />}
            {isComplete && <Search className={'size-4 text-green-500'} />}
            {isIdle && <Search className={'size-4 text-muted-foreground'} />}

            <div className={'flex flex-col'}>
              <span className={'text-sm font-medium'}>
                {isRunning ? (
                  <Shimmer duration={isExtendedThinking ? 2.5 : 1.5}>
                    {agentName} is {isExtendedThinking ? 'deeply reasoning' : 'discovering files'}...
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
                {shouldShowElapsedTime && <Fragment> - {formatElapsedTime(extendedThinkingElapsedMs)}</Fragment>}
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
                <ToolIndicator key={tool.id} tool={tool} />
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
                    <ToolIndicator key={tool.id} tool={tool} variant={'history'} />
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
              {isRunning && !streamingText && (
                <div className={'flex items-center gap-2 text-sm text-muted-foreground'}>
                  <Loader2 className={'size-4 animate-spin'} />
                  <span>Discovering files relevant to the feature request...</span>
                </div>
              )}

              {/* Streaming Text */}
              {streamingText && (
                <div className={'text-sm text-foreground'}>
                  <p className={'whitespace-pre-wrap'}>
                    {streamingText}
                    {isStreaming && <span className={'ml-0.5 animate-pulse'}>|</span>}
                  </p>
                </div>
              )}

              {/* Error State */}
              {isErrorWithDetails && (
                <div className={'space-y-3'}>
                  <div className={'flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive'}>
                    <AlertCircle className={'mt-0.5 size-4 shrink-0'} />
                    <div className={'flex-1'}>
                      <p className={'font-medium'}>
                        {outcome?.type === 'TIMEOUT' ? 'Operation timed out' : 'An error occurred'}
                      </p>
                      <p className={'mt-1 text-xs opacity-80'}>
                        {error ?? (outcome?.type === 'ERROR' || outcome?.type === 'TIMEOUT' ? outcome.error : '')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {isEmptyState && <div className={'text-sm text-muted-foreground'}>Ready to start file discovery...</div>}
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

DiscoveryStreaming.displayName = 'DiscoveryStreaming';

/**
 * ToolIndicator displays an active tool operation with name and status.
 */
interface ToolIndicatorProps {
  tool: DiscoveryActiveTool;
  /** Variant for styling: 'active' for current tools, 'history' for past tools */
  variant?: 'active' | 'history';
}

const ToolIndicator = memo(({ tool, variant = 'active' }: ToolIndicatorProps): ReactElement => {
  const config = TOOL_CONFIG[tool.name] ?? { icon: File, label: tool.name };
  const Icon = config.icon;
  const isHistory = variant === 'history';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
        isHistory
          ? 'border-border/40 bg-muted/20 text-muted-foreground'
          : 'min-w-[160px] animate-in border-accent/30 bg-accent/5 text-accent fade-in-0 slide-in-from-left-2'
      )}
    >
      <Icon className={'size-3.5'} />
      <span className={cn('font-medium', isHistory ? 'text-foreground/70' : 'text-foreground')}>{config.label}</span>
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[10px] tracking-wide uppercase',
          isHistory ? 'bg-muted/40 text-muted-foreground' : 'bg-accent/20 text-accent'
        )}
      >
        {tool.name}
      </span>
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
