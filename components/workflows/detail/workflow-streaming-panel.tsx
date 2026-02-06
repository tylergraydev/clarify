'use client';

import type { ComponentPropsWithRef, PointerEvent as ReactPointerEvent } from 'react';

import { Activity, ChevronDown, ChevronUp, Loader2, Wrench } from 'lucide-react';
import { Fragment, useCallback, useRef } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';

import type { WorkflowDetailStepTab } from '@/lib/stores/workflow-detail-store';
import type { ClarificationServicePhase } from '@/types/electron';
import type { StreamToolEvent } from '@/types/workflow-stream';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTrigger } from '@/components/ui/tabs';
import { useTick } from '@/hooks/use-tick';
import { PHASE_LABELS } from '@/lib/constants/clarification';
import { useWorkflowDetailStore } from '@/lib/stores/workflow-detail-store';
import { cn, formatElapsed } from '@/lib/utils';

import { useClarificationStreamContext } from './clarification-stream-provider';

// =============================================================================
// Constants
// =============================================================================

const PLACEHOLDER_LOGS: Record<Exclude<WorkflowDetailStepTab, 'clarification'>, Array<string>> = {
  discovery: [
    '[00:00:01] Starting file discovery agent...',
    '[00:00:02] Scanning repository structure...',
    '[00:00:03] Analyzing imports and dependencies...',
    '[00:00:04] Found 12 relevant files across 4 directories.',
    '[00:00:05] Mapping file relationships...',
    '[00:00:06] Identified 3 schema files, 4 components, 2 services.',
    '[00:00:07] Ranking files by relevance score...',
    '[00:00:08] File discovery complete. 12 files catalogued.',
  ],
  planning: [
    '[00:00:01] Starting implementation planning agent...',
    '[00:00:02] Loading refined feature request and discovered files...',
    '[00:00:03] Generating implementation steps...',
    '[00:00:04] Step 1: Create database schema migration.',
    '[00:00:05] Step 2: Implement repository layer.',
    '[00:00:06] Step 3: Add IPC handlers.',
    '[00:00:07] Step 4: Build UI components.',
    '[00:00:08] Step 5: Add validation and error handling.',
    '[00:00:09] Defining quality gates for each step...',
    '[00:00:10] Implementation plan complete. 5 steps generated.',
  ],
  refinement: [
    '[00:00:01] Starting refinement agent...',
    '[00:00:02] Loading clarification responses...',
    '[00:00:03] Enriching feature request with project context...',
    '[00:00:04] Analyzing existing codebase patterns...',
    '[00:00:05] Adding technical constraints and requirements...',
    '[00:00:06] Incorporating team conventions...',
    '[00:00:07] Refined feature request generated.',
    '[00:00:08] Refinement complete. Ready for file discovery.',
  ],
};

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

type WorkflowStreamingPanelProps = ComponentPropsWithRef<'div'>;

export const WorkflowStreamingPanel = ({ className, ref, ...props }: WorkflowStreamingPanelProps) => {
  const {
    activeStreamingTab,
    isStreamingPanelCollapsed,
    setActiveStreamingTab,
    setStreamingPanelHeight,
    streamingPanelHeight,
    toggleStreamingPanel,
  } = useWorkflowDetailStore();

  const clarificationStream = useClarificationStreamContext();

  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

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
            </TabsPanel>

            {/* Placeholder Tab Panels */}
            {TAB_ORDER.filter((tab) => tab.value !== 'clarification').map((tab) => (
              <TabsPanel className={'min-h-0 flex-1 overflow-auto p-3'} key={tab.value} value={tab.value}>
                <div className={'font-mono text-xs text-muted-foreground'}>
                  {PLACEHOLDER_LOGS[tab.value as Exclude<WorkflowDetailStepTab, 'clarification'>].map((line) => (
                    <div className={'py-0.5'} key={line}>
                      {line}
                    </div>
                  ))}
                </div>
              </TabsPanel>
            ))}
          </TabsRoot>
        </Fragment>
      )}
    </div>
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
}

/**
 * Renders a workflow step's stream output with auto-scrolling.
 * Shows a phase indicator with elapsed time, streamed text, tool events
 * with per-tool durations, and thinking content.
 * Step-agnostic — works for clarification, refinement, discovery, and planning.
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
