'use client';

import type { ComponentPropsWithRef, PointerEvent as ReactPointerEvent } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Activity, ChevronDown, ChevronUp, Coins, Loader2, Wrench } from 'lucide-react';
import { Fragment, useCallback, useMemo, useRef } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';

import type { WorkflowDetailStepTab } from '@/lib/stores/workflow-detail-store';
import type { ClarificationServicePhase } from '@/types/electron';
import type { StreamToolEvent } from '@/types/workflow-stream';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTrigger } from '@/components/ui/tabs';
import { useAgentActivityByStepId } from '@/hooks/queries/use-agent-activity';
import { useElectronDb } from '@/hooks/use-electron';
import { useTick } from '@/hooks/use-tick';
import { PHASE_LABELS } from '@/lib/constants/clarification';
import { stepKeys } from '@/lib/queries/steps';
import { useWorkflowDetailStore } from '@/lib/stores/workflow-detail-store';
import { cn, formatElapsed } from '@/lib/utils';
import { type ActivityUsageSummary, transformActivityToStreamState } from '@/lib/utils/agent-activity-transform';

import { useClarificationStreamContext } from './clarification-stream-provider';

// =============================================================================
// Constants
// =============================================================================

/**
 * Phases considered terminal (agent is no longer active).
 */
const TERMINAL_DISPLAY_PHASES = new Set<ClarificationServicePhase>([
  'cancelled',
  'complete',
  'error',
  'timeout',
  'waiting_for_user',
]);

const TAB_ORDER: Array<{ label: string; value: WorkflowDetailStepTab }> = [
  { label: 'Clarification', value: 'clarification' },
  { label: 'Refinement', value: 'refinement' },
  { label: 'File Discovery', value: 'discovery' },
  { label: 'Planning', value: 'planning' },
];

/**
 * Maps a tab value to the corresponding workflow step type.
 */
const TAB_TO_STEP_TYPE: Record<WorkflowDetailStepTab, string> = {
  clarification: 'clarification',
  discovery: 'discovery',
  planning: 'planning',
  refinement: 'refinement',
};

interface WorkflowStreamingPanelProps extends ComponentPropsWithRef<'div'> {
  workflowId: number;
}

export const WorkflowStreamingPanel = ({ className, ref, workflowId, ...props }: WorkflowStreamingPanelProps) => {
  const {
    activeStreamingTab,
    isStreamingPanelCollapsed,
    setActiveStreamingTab,
    setStreamingPanelHeight,
    streamingPanelHeight,
    toggleStreamingPanel,
  } = useWorkflowDetailStore();

  const clarificationStream = useClarificationStreamContext();
  const { isElectron, steps } = useElectronDb();

  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

  // Fetch workflow steps to resolve step IDs for each tab
  const { data: workflowSteps } = useQuery({
    ...stepKeys.listByWorkflow(workflowId),
    enabled: isElectron && workflowId > 0,
    queryFn: () => steps.list(workflowId),
  });

  const stepIdByTab = useMemo(() => {
    const map: Partial<Record<WorkflowDetailStepTab, number>> = {};
    if (workflowSteps) {
      for (const step of workflowSteps) {
        for (const [tab, stepType] of Object.entries(TAB_TO_STEP_TYPE)) {
          if (step.stepType === stepType) {
            map[tab as WorkflowDetailStepTab] = step.id;
          }
        }
      }
    }
    return map;
  }, [workflowSteps]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      startYRef.current = event.clientY;
      startHeightRef.current = streamingPanelHeight;

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const deltaY = startYRef.current - moveEvent.clientY;
        const computedStyle = getComputedStyle(document.documentElement);
        const minHeight = parseInt(computedStyle.getPropertyValue('--workflow-streaming-panel-min-height'), 10);
        const maxHeight = parseInt(computedStyle.getPropertyValue('--workflow-streaming-panel-max-height'), 10);
        const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeightRef.current + deltaY));
        setStreamingPanelHeight(newHeight);
      };

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [setStreamingPanelHeight, streamingPanelHeight]
  );

  const handleTabChange = useCallback(
    (value: null | WorkflowDetailStepTab) => {
      if (value) {
        setActiveStreamingTab(value);
      }
    },
    [setActiveStreamingTab]
  );

  const handleToggleClick = () => {
    toggleStreamingPanel();
  };

  // Resolve the phase label for the clarification step
  const phaseLabel = clarificationStream.currentPhase ? PHASE_LABELS[clarificationStream.currentPhase] : null;

  const isTerminal = clarificationStream.currentPhase
    ? TERMINAL_DISPLAY_PHASES.has(clarificationStream.currentPhase)
    : false;

  // Determine whether clarification is actively streaming with live data
  const isClarificationLive = clarificationStream.isStreaming || clarificationStream.toolEvents.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col border-t border-border bg-background',
        'transition-[height] duration-200 ease-out',
        className
      )}
      ref={ref}
      style={{
        height: isStreamingPanelCollapsed ? 'var(--workflow-streaming-panel-collapsed-height)' : streamingPanelHeight,
      }}
      {...props}
    >
      {/* Collapsed bar - always visible */}
      <div className={'relative flex min-h-(--workflow-streaming-panel-collapsed-height) items-center px-4'}>
        <div className={'flex items-center gap-2'}>
          <Activity aria-hidden={'true'} className={'size-3.5 text-muted-foreground'} />
          <span className={'text-xs font-medium text-muted-foreground'}>Agent Activity</span>
        </div>
        <div className={'absolute inset-x-0 flex justify-center'}>
          <button
            aria-label={isStreamingPanelCollapsed ? 'Expand streaming panel' : 'Collapse streaming panel'}
            className={cn(
              'inline-flex h-8 items-center justify-center rounded-md px-6',
              'text-muted-foreground transition-colors',
              'hover:bg-muted hover:text-foreground',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none'
            )}
            onClick={handleToggleClick}
          >
            {isStreamingPanelCollapsed ? (
              <ChevronUp aria-hidden={'true'} className={'size-5'} />
            ) : (
              <ChevronDown aria-hidden={'true'} className={'size-5'} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {!isStreamingPanelCollapsed && (
        <Fragment>
          {/* Drag handle for resizing */}
          <div
            aria-label={'Resize streaming panel'}
            className={cn(
              'h-(--workflow-drag-handle-height) cursor-row-resize',
              'flex items-center justify-center',
              'transition-colors hover:bg-muted'
            )}
            onPointerDown={handlePointerDown}
            role={'separator'}
          >
            <div className={'h-0.5 w-8 rounded-full bg-border'} />
          </div>

          <Separator />

          {/* Tab Content */}
          <TabsRoot
            className={'flex min-h-0 flex-1 flex-col'}
            onValueChange={handleTabChange}
            value={activeStreamingTab}
          >
            {/* Tab List */}
            <TabsList>
              {TAB_ORDER.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
              <TabsIndicator />
            </TabsList>

            {/* Clarification Tab Panel */}
            <TabsPanel className={'min-h-0 flex-1 overflow-hidden'} value={'clarification'}>
              {isClarificationLive ? (
                <StepStreamContent
                  isStreaming={clarificationStream.isStreaming}
                  isTerminal={isTerminal}
                  phaseLabel={phaseLabel}
                  sessionEndedAt={clarificationStream.sessionEndedAt}
                  sessionStartedAt={clarificationStream.sessionStartedAt}
                  textContent={clarificationStream.textContent}
                  thinkingContent={clarificationStream.thinkingContent}
                  toolEvents={clarificationStream.toolEvents}
                />
              ) : (
                <HistoricalStepContent
                  isStreaming={clarificationStream.isStreaming}
                  stepId={stepIdByTab.clarification}
                />
              )}
            </TabsPanel>

            {/* Historical Tab Panels */}
            {TAB_ORDER.filter((tab) => tab.value !== 'clarification').map((tab) => (
              <TabsPanel className={'min-h-0 flex-1 overflow-hidden'} key={tab.value} value={tab.value}>
                <HistoricalStepContent
                  isStreaming={false}
                  stepId={stepIdByTab[tab.value]}
                />
              </TabsPanel>
            ))}
          </TabsRoot>
        </Fragment>
      )}
    </div>
  );
};

// =============================================================================
// Historical Step Content
// =============================================================================

interface HistoricalStepContentProps {
  isStreaming: boolean;
  stepId: number | undefined;
}

/**
 * Loads persisted agent activity for a completed or previously-navigated-away-from
 * step and renders it via `StepStreamContent`. When `isStreaming` is true, defers
 * to the live stream by showing a "Streaming live..." indicator. When no data is
 * available, shows an empty state message.
 */
const HistoricalStepContent = ({ isStreaming, stepId }: HistoricalStepContentProps) => {
  const { data: activities } = useAgentActivityByStepId(stepId ?? 0, {
    enabled: !isStreaming && stepId !== undefined && stepId > 0,
  });

  const transformed = useMemo(() => {
    if (!activities || activities.length === 0) return null;
    return transformActivityToStreamState(activities);
  }, [activities]);

  if (isStreaming) {
    return (
      <div className={'flex h-full items-center justify-center p-3'}>
        <Loader2 aria-hidden={'true'} className={'mr-2 size-3 animate-spin text-accent'} />
        <span className={'text-xs text-muted-foreground'}>Streaming live...</span>
      </div>
    );
  }

  if (!stepId) {
    return (
      <div className={'flex h-full items-center justify-center p-3'}>
        <span className={'text-xs text-muted-foreground'}>No activity recorded</span>
      </div>
    );
  }

  if (!transformed) {
    return (
      <div className={'flex h-full items-center justify-center p-3'}>
        <span className={'text-xs text-muted-foreground'}>No activity recorded</span>
      </div>
    );
  }

  return (
    <StepStreamContent
      isStreaming={false}
      isTerminal={true}
      phaseLabel={null}
      sessionEndedAt={null}
      sessionStartedAt={null}
      textContent={transformed.textContent}
      thinkingContent={transformed.thinkingContent}
      toolEvents={transformed.toolEvents}
      usageSummary={transformed.usageSummary}
    />
  );
};

// =============================================================================
// Step Stream Content (step-agnostic)
// =============================================================================

interface StepStreamContentProps {
  isStreaming: boolean;
  isTerminal: boolean;
  phaseLabel: null | string;
  sessionEndedAt: null | number;
  sessionStartedAt: null | number;
  textContent: string;
  thinkingContent: string;
  toolEvents: Array<StreamToolEvent>;
  usageSummary?: ActivityUsageSummary | null;
}

/**
 * Renders a workflow step's stream output with auto-scrolling.
 * Shows a phase indicator with elapsed time, streamed text, tool events
 * with per-tool durations, thinking content, and an optional usage summary.
 * Step-agnostic -- works for clarification, refinement, discovery, and planning.
 */
const StepStreamContent = ({
  isStreaming,
  isTerminal,
  phaseLabel,
  sessionEndedAt,
  sessionStartedAt,
  textContent,
  thinkingContent,
  toolEvents,
  usageSummary,
}: StepStreamContentProps) => {
  const isEmptyState = !phaseLabel && !textContent && !thinkingContent && toolEvents.length === 0;

  if (isEmptyState) {
    return (
      <div className={'flex h-full items-center justify-center p-3'}>
        <span className={'text-xs text-muted-foreground'}>No activity yet</span>
      </div>
    );
  }

  return (
    <StickToBottom className={'relative h-full overflow-y-hidden'} initial={'smooth'} resize={'smooth'}>
      <StickToBottom.Content className={'flex flex-col gap-2 p-3'}>
        {/* Phase Indicator */}
        {phaseLabel && (
          <StepPhaseIndicator
            isStreaming={isStreaming}
            isTerminal={isTerminal}
            phaseLabel={phaseLabel}
            sessionEndedAt={sessionEndedAt}
            sessionStartedAt={sessionStartedAt}
          />
        )}

        {/* Thinking Content */}
        {thinkingContent && (
          <div className={'rounded-md border border-border bg-muted/50 p-2'}>
            <span className={'mb-1 block text-[10px] font-medium tracking-wider text-muted-foreground uppercase'}>
              Thinking
            </span>
            <pre className={'font-mono text-xs whitespace-pre-wrap text-muted-foreground'}>{thinkingContent}</pre>
          </div>
        )}

        {/* Tool Events */}
        {toolEvents.length > 0 && (
          <div className={'flex flex-col gap-1'}>
            {toolEvents.map((event) => (
              <StepToolEventRow event={event} key={event.toolUseId} />
            ))}
          </div>
        )}

        {/* Streamed Text */}
        {textContent && <pre className={'font-mono text-xs whitespace-pre-wrap text-foreground'}>{textContent}</pre>}

        {/* Usage Summary */}
        {usageSummary && <UsageSummaryDisplay usageSummary={usageSummary} />}
      </StickToBottom.Content>
      <StreamScrollButton />
    </StickToBottom>
  );
};

// =============================================================================
// Phase Indicator
// =============================================================================

interface StepPhaseIndicatorProps {
  isStreaming: boolean;
  isTerminal: boolean;
  phaseLabel: string;
  sessionEndedAt: null | number;
  sessionStartedAt: null | number;
}

/**
 * Displays the current step phase with an animated spinner when actively
 * streaming, and the session elapsed time that ticks live.
 */
const StepPhaseIndicator = ({
  isStreaming,
  isTerminal,
  phaseLabel,
  sessionEndedAt,
  sessionStartedAt,
}: StepPhaseIndicatorProps) => {
  const isActivelyRunning = isStreaming && !isTerminal;

  // Tick every second while actively running to update elapsed time.
  // `now` is stored in state so we avoid calling Date.now() during render.
  const now = useTick({ enabled: isActivelyRunning });

  const endTime = sessionEndedAt ?? now;
  const elapsedMs = sessionStartedAt ? endTime - sessionStartedAt : null;
  const elapsedLabel = formatElapsed(elapsedMs);

  return (
    <div className={'flex items-center gap-2 py-1'}>
      {isActivelyRunning ? (
        <Loader2 aria-hidden={'true'} className={'size-3 animate-spin text-accent'} />
      ) : (
        <div className={cn('size-2 rounded-full', isTerminal ? 'bg-muted-foreground' : 'bg-accent')} />
      )}
      <span className={'text-xs font-medium text-muted-foreground'}>{phaseLabel}</span>
      {elapsedLabel && <span className={'text-xs text-muted-foreground/70 tabular-nums'}>{elapsedLabel}</span>}
    </div>
  );
};

// =============================================================================
// Tool Event Row
// =============================================================================

interface StepToolEventRowProps {
  event: StreamToolEvent;
}

/**
 * Renders a single tool event as a compact row showing tool name,
 * a running/completed indicator, summarized input, and duration.
 */
const StepToolEventRow = ({ event }: StepToolEventRowProps) => {
  const isRunning = event.stoppedAt === null;

  // Tick every second while tool is running to update duration.
  // `now` is stored in state so we avoid calling Date.now() during render.
  const now = useTick({ enabled: isRunning });

  const inputSummary = summarizeToolInput(event.input);

  const endTime = event.stoppedAt ?? now;
  const durationMs = endTime - event.startedAt;
  const durationLabel = formatElapsed(durationMs);

  return (
    <div className={'flex items-start gap-2 font-mono text-xs text-muted-foreground'}>
      {/* Tool Icon */}
      {isRunning ? (
        <Loader2 aria-hidden={'true'} className={'mt-0.5 size-3 shrink-0 animate-spin'} />
      ) : (
        <Wrench aria-hidden={'true'} className={'mt-0.5 size-3 shrink-0'} />
      )}

      {/* Tool Name */}
      <span className={'shrink-0 font-medium'}>{event.toolName}</span>

      {/* Input Summary */}
      {inputSummary && <span className={'min-w-0 flex-1 truncate text-muted-foreground/70'}>{inputSummary}</span>}

      {/* Duration */}
      {durationLabel && (
        <span className={'ml-auto shrink-0 text-muted-foreground/70 tabular-nums'}>{durationLabel}</span>
      )}
    </div>
  );
};

// =============================================================================
// Scroll Button
// =============================================================================

/**
 * Scroll-to-bottom button that appears when the user scrolls up
 * in the streaming content area.
 */
const StreamScrollButton = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottomClick = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  if (isAtBottom) {
    return null;
  }

  return (
    <div className={'absolute inset-x-0 bottom-2 flex justify-center'}>
      <Button
        className={'rounded-full shadow-md'}
        onClick={handleScrollToBottomClick}
        size={'icon'}
        type={'button'}
        variant={'outline'}
      >
        <ChevronDown aria-hidden={'true'} className={'size-4'} />
      </Button>
    </div>
  );
};

// =============================================================================
// Usage Summary Display
// =============================================================================

interface UsageSummaryDisplayProps {
  usageSummary: ActivityUsageSummary;
}

/**
 * Displays token usage and estimated cost from a completed agent step.
 * Rendered as a compact summary row below tool events.
 */
const UsageSummaryDisplay = ({ usageSummary }: UsageSummaryDisplayProps) => {
  const totalTokens =
    usageSummary.inputTokens +
    usageSummary.outputTokens +
    usageSummary.cacheCreationInputTokens +
    usageSummary.cacheReadInputTokens;

  if (totalTokens === 0 && usageSummary.estimatedCost === 0) {
    return null;
  }

  const formattedCost = usageSummary.estimatedCost > 0 ? `$${usageSummary.estimatedCost.toFixed(4)}` : null;
  const hasCacheTokens = usageSummary.cacheCreationInputTokens > 0 || usageSummary.cacheReadInputTokens > 0;

  return (
    <div className={'mt-1 flex items-center gap-3 border-t border-border pt-2 font-mono text-xs text-muted-foreground'}>
      {/* Cost Icon */}
      <Coins aria-hidden={'true'} className={'size-3 shrink-0'} />

      {/* Input Tokens */}
      <span>
        <span className={'font-medium'}>In:</span> {usageSummary.inputTokens.toLocaleString()}
      </span>

      {/* Output Tokens */}
      <span>
        <span className={'font-medium'}>Out:</span> {usageSummary.outputTokens.toLocaleString()}
      </span>

      {/* Cache Tokens */}
      {hasCacheTokens && (
        <span>
          <span className={'font-medium'}>Cache:</span>{' '}
          {(usageSummary.cacheCreationInputTokens + usageSummary.cacheReadInputTokens).toLocaleString()}
        </span>
      )}

      {/* Estimated Cost */}
      {formattedCost && (
        <span className={'ml-auto font-medium'}>
          {formattedCost}
        </span>
      )}
    </div>
  );
};

// =============================================================================
// Utilities
// =============================================================================

/**
 * Produces a short summary string from a tool's input object.
 * Prioritizes common fields like `command`, `path`, `query`, and `pattern`.
 */
function summarizeToolInput(input: Record<string, unknown>): string {
  const priorityKeys = ['command', 'path', 'query', 'pattern', 'file_path', 'filePath'];

  for (const key of priorityKeys) {
    if (typeof input[key] === 'string') {
      const value = input[key] as string;
      return value.length > 80 ? value.slice(0, 80) + '...' : value;
    }
  }

  const keys = Object.keys(input);
  if (keys.length === 0) {
    return '';
  }

  return keys.join(', ');
}
