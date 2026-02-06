'use client';

import type { ComponentPropsWithRef, PointerEvent as ReactPointerEvent } from 'react';

import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { Fragment, useCallback, useRef } from 'react';

import type { WorkflowDetailStepTab } from '@/lib/stores/workflow-detail-store';

import { IconButton } from '@/components/ui/icon-button';
import { Separator } from '@/components/ui/separator';
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflowDetailStore } from '@/lib/stores/workflow-detail-store';
import { cn } from '@/lib/utils';

const PLACEHOLDER_LOGS: Record<WorkflowDetailStepTab, Array<string>> = {
  clarification: [
    '[00:00:01] Starting clarification agent...',
    '[00:00:02] Analyzing feature request for ambiguity...',
    '[00:00:03] Identified 3 areas requiring clarification.',
    '[00:00:04] Generating targeted questions...',
    '[00:00:05] Question 1: What is the expected input format?',
    '[00:00:06] Question 2: Should this support batch processing?',
    '[00:00:07] Question 3: What error handling strategy is preferred?',
    '[00:00:08] Clarification complete. Awaiting user responses.',
  ],
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

  return (
    <div
      className={cn(
        'flex flex-col border-t border-border bg-background',
        'transition-[height] duration-200 ease-out',
        className
      )}
      ref={ref}
      style={{
        height: isStreamingPanelCollapsed
          ? 'var(--workflow-streaming-panel-collapsed-height)'
          : streamingPanelHeight,
      }}
      {...props}
    >
      {/* Collapsed bar - always visible */}
      <div className={'flex min-h-(--workflow-streaming-panel-collapsed-height) items-center justify-between px-4'}>
        <div className={'flex items-center gap-2'}>
          <Activity aria-hidden={'true'} className={'size-3.5 text-muted-foreground'} />
          <span className={'text-xs font-medium text-muted-foreground'}>Agent Activity</span>
        </div>
        <IconButton
          aria-label={isStreamingPanelCollapsed ? 'Expand streaming panel' : 'Collapse streaming panel'}
          className={'size-6'}
          onClick={handleToggleClick}
        >
          {isStreamingPanelCollapsed ? (
            <ChevronUp aria-hidden={'true'} className={'size-4'} />
          ) : (
            <ChevronDown aria-hidden={'true'} className={'size-4'} />
          )}
        </IconButton>
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

            {/* Tab Panels */}
            {TAB_ORDER.map((tab) => (
              <TabsPanel className={'min-h-0 flex-1 overflow-auto p-3'} key={tab.value} value={tab.value}>
                <div className={'font-mono text-xs text-muted-foreground'}>
                  {PLACEHOLDER_LOGS[tab.value].map((line) => (
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
