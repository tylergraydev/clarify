'use client';

import type { ComponentPropsWithRef, ReactElement } from 'react';

import { ArrowRight, FolderSearch, Plus, RefreshCw, Timer } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DiscoveredFile } from '@/db/schema';
import type { FileDiscoveryStreamMessage } from '@/types/electron';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddFileDialog } from '@/components/workflows/add-file-dialog';
import { DiscoveredFilesTable } from '@/components/workflows/discovered-files-table';
import { DiscoveryStreaming } from '@/components/workflows/discovery-streaming';
import { DiscoveryTableToolbar } from '@/components/workflows/discovery-table-toolbar';
import { StaleDiscoveryIndicator } from '@/components/workflows/stale-discovery-indicator';
import {
  useCancelDiscovery,
  useDiscoveredFiles,
  useDiscoveryStream,
  useRediscover,
  useStartDiscovery,
} from '@/hooks/queries/use-discovered-files';
import { useDiscoveryStore } from '@/lib/stores/discovery-store';
import { cn } from '@/lib/utils';

/**
 * Phase display labels for the discovery workspace.
 */
const PHASE_LABELS: Record<string, string> = {
  complete: 'Discovery complete',
  error: 'Error occurred',
  idle: 'Ready to discover',
  reviewing: 'Reviewing files',
  streaming: 'Discovering files...',
} as const;

/**
 * Props for the DiscoveryWorkspace component.
 */
interface DiscoveryWorkspaceProps extends Omit<ComponentPropsWithRef<'section'>, 'children'> {
  /** The agent ID to use for file discovery */
  agentId: number;
  /** Timestamp when the discovery was completed */
  discoveryCompletedAt?: Date | null | string;
  /** Callback when step completes */
  onComplete: () => void;
  /** The refined feature request text from the refinement step */
  refinedFeatureRequest: string;
  /** Timestamp when the refinement was last updated */
  refinementUpdatedAt?: Date | null | string;
  /** The repository path for file discovery */
  repositoryPath: string;
  /** The workflow step ID */
  stepId: number;
  /** The workflow ID */
  workflowId: number;
}

/**
 * Rediscovery mode options.
 */
type RediscoverMode = 'additive' | 'replace';

/**
 * Formats elapsed time in milliseconds to a human-readable string (e.g., "2m 30s" or "45s").
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
 * DiscoveryWorkspace orchestrates the file discovery step UI.
 * It composes streaming output, stale indicator, discovered files table, and action controls.
 *
 * Layout:
 * - Streaming area (top): Shows DiscoveryStreaming during discovery
 * - Stale indicator: Shows StaleDiscoveryIndicator when applicable
 * - File table (main): Shows DiscoveredFilesTable with DiscoveryTableToolbar
 * - Action bar (bottom): "Continue to Planning" button, "Re-discover" button
 *
 * @example
 * ```tsx
 * <DiscoveryWorkspace
 *   discoveryCompletedAt={step.discoveryCompletedAt}
 *   onComplete={handleStepComplete}
 *   refinementUpdatedAt={step.refinementUpdatedAt}
 *   stepId={step.id}
 *   workflowId={workflow.id}
 * />
 * ```
 */
export const DiscoveryWorkspace = ({
  agentId,
  className,
  discoveryCompletedAt,
  onComplete,
  ref,
  refinedFeatureRequest,
  refinementUpdatedAt,
  repositoryPath,
  stepId,
  workflowId,
  ...props
}: DiscoveryWorkspaceProps): ReactElement => {
  // 1. useState hooks
  const [isAddFileDialogOpen, setIsAddFileDialogOpen] = useState(false);
  const [isRediscoverDialogOpen, setIsRediscoverDialogOpen] = useState(false);
  const [extendedThinkingElapsedMs, setExtendedThinkingElapsedMs] = useState<number | undefined>(undefined);

  // 2. Other hooks (useContext, useQuery, etc.)
  const discoveredFilesQuery = useDiscoveredFiles(stepId);
  const startDiscoveryMutation = useStartDiscovery();
  const cancelDiscoveryMutation = useCancelDiscovery();
  const rediscoverMutation = useRediscover();

  const {
    activeTools,
    addActiveTool,
    appendStreamingText,
    clearActiveTools,
    error,
    phase,
    removeActiveTool,
    reset: resetStore,
    sessionId,
    setError,
    setPhase,
    setSessionId,
    streamingText,
  } = useDiscoveryStore();

  const {
    onMessage,
    outcome,
    phase: streamPhase,
    reset: resetStream,
    setSessionId: setStreamSessionId,
  } = useDiscoveryStream();

  // 3. useMemo hooks
  const files = useMemo<Array<DiscoveredFile>>(() => discoveredFilesQuery.data ?? [], [discoveredFilesQuery.data]);

  const includedFilesCount = useMemo(() => files.filter((f) => f.includedAt !== null).length, [files]);

  const totalFilesCount = files.length;

  const progressPercent = useMemo(() => {
    if (totalFilesCount === 0) return 0;
    return Math.round((includedFilesCount / totalFilesCount) * 100);
  }, [includedFilesCount, totalFilesCount]);

  const isStreaming = phase === 'streaming';
  const isComplete = phase === 'complete' || (files.length > 0 && !isStreaming);
  const isIdle = phase === 'idle' && files.length === 0;
  const hasFiles = files.length > 0;
  const canContinue = includedFilesCount > 0;
  const isMutating = startDiscoveryMutation.isPending || rediscoverMutation.isPending;

  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const statusVariant = isStreaming ? 'pending' : isComplete ? 'completed' : 'default';

  // 4. useEffect hooks

  // Handle stream messages to update store
  useEffect(() => {
    const unsubscribe = onMessage((message: FileDiscoveryStreamMessage) => {
      switch (message.type) {
        case 'complete':
          setPhase('complete');
          clearActiveTools();
          break;

        case 'error':
          setError(message.error);
          setPhase('error');
          break;

        case 'extended_thinking_heartbeat':
          setExtendedThinkingElapsedMs(message.elapsedMs);
          break;

        case 'phase_change':
          setPhase(message.phase as 'complete' | 'error' | 'idle' | 'reviewing' | 'streaming');
          break;

        case 'text_delta':
          appendStreamingText(message.delta);
          break;

        case 'tool_finish':
          removeActiveTool(message.toolUseId);
          break;

        case 'tool_start':
          addActiveTool({
            id: message.toolUseId,
            name: message.toolName,
            startedAt: new Date(),
          });
          break;
      }
    });

    return unsubscribe;
  }, [onMessage, appendStreamingText, addActiveTool, removeActiveTool, setPhase, setError, clearActiveTools]);

  // Sync stream phase to store phase
  useEffect(() => {
    if (streamPhase === 'complete') {
      setPhase('complete');
    } else if (streamPhase === 'error') {
      setPhase('error');
    }
  }, [streamPhase, setPhase]);

  // 5. Utility functions (none)

  // 6. Event handlers (useCallback)
  const handleStartDiscovery = useCallback(async () => {
    // Reset state for new discovery
    resetStore();
    resetStream();
    setPhase('streaming');

    try {
      const result = await startDiscoveryMutation.mutateAsync({
        agentId,
        refinedFeatureRequest,
        repositoryPath,
        stepId,
        workflowId,
      });

      if (result.sdkSessionId) {
        setSessionId(result.sdkSessionId);
        setStreamSessionId(result.sdkSessionId);
      }

      if (result.type === 'SUCCESS') {
        setPhase('complete');
      } else if (result.type === 'ERROR' || result.type === 'TIMEOUT') {
        setError(result.error);
        setPhase('error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start discovery';
      setError(errorMessage);
      setPhase('error');
    }
  }, [
    agentId,
    refinedFeatureRequest,
    repositoryPath,
    resetStore,
    resetStream,
    setError,
    setPhase,
    setSessionId,
    setStreamSessionId,
    startDiscoveryMutation,
    stepId,
    workflowId,
  ]);

  const handleCancelDiscovery = useCallback(() => {
    if (sessionId) {
      cancelDiscoveryMutation.mutate({ sessionId, stepId });
    }
  }, [sessionId, stepId, cancelDiscoveryMutation]);

  const handleOpenRediscoverDialog = useCallback(() => {
    setIsRediscoverDialogOpen(true);
  }, []);

  const handleCloseRediscoverDialog = useCallback(() => {
    setIsRediscoverDialogOpen(false);
  }, []);

  const handleRediscover = useCallback(
    async (mode: RediscoverMode) => {
      setIsRediscoverDialogOpen(false);

      // Reset state for re-discovery
      resetStore();
      resetStream();
      setPhase('streaming');

      try {
        const result = await rediscoverMutation.mutateAsync({
          agentId,
          mode,
          refinedFeatureRequest,
          repositoryPath,
          stepId,
          workflowId,
        });

        if (result.sdkSessionId) {
          setSessionId(result.sdkSessionId);
          setStreamSessionId(result.sdkSessionId);
        }

        if (result.type === 'SUCCESS') {
          setPhase('complete');
        } else if (result.type === 'ERROR' || result.type === 'TIMEOUT') {
          setError(result.error);
          setPhase('error');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to re-discover files';
        setError(errorMessage);
        setPhase('error');
      }
    },
    [
      agentId,
      rediscoverMutation,
      refinedFeatureRequest,
      repositoryPath,
      resetStore,
      resetStream,
      setError,
      setPhase,
      setSessionId,
      setStreamSessionId,
      stepId,
      workflowId,
    ]
  );

  const handleRediscoverReplace = useCallback(() => {
    void handleRediscover('replace');
  }, [handleRediscover]);

  const handleRediscoverAdditive = useCallback(() => {
    void handleRediscover('additive');
  }, [handleRediscover]);

  const handleContinueToPlanning = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleFileToggle = useCallback((file: DiscoveredFile) => {
    // File toggle is handled by the table internally
    // This callback is for any additional logic needed
    console.log('File toggled:', file.id);
  }, []);

  const handleAddFileDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsAddFileDialogOpen(isOpen);
  }, []);

  const handleAddFileSuccess = useCallback(() => {
    // Refresh the files list after adding
    void discoveredFilesQuery.refetch();
  }, [discoveredFilesQuery]);

  // 7. Derived variables for conditional rendering
  const progressLabel = totalFilesCount > 0 ? `${includedFilesCount} of ${totalFilesCount} included` : 'No files yet';
  const shouldShowElapsedTime = extendedThinkingElapsedMs !== undefined && isStreaming;
  const shouldShowStreamingSection = isStreaming || Boolean(streamingText) || Boolean(error);

  return (
    <section aria-label={'Discovery workspace'} className={cn('w-full', className)} ref={ref} {...props}>
      {/* Header Card */}
      <div className={'rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm sm:p-8'}>
        <div className={'flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'}>
          {/* Title Section */}
          <div className={'flex items-start gap-4'}>
            {/* Icon */}
            <div className={'mt-1 flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent'}>
              <FolderSearch className={'size-5'} />
            </div>

            {/* Title and Description */}
            <div className={'space-y-2'}>
              {/* Title with Status Badge */}
              <div className={'flex flex-wrap items-center gap-2'}>
                <h2 className={'text-lg font-semibold text-foreground'}>File Discovery</h2>
                <Badge size={'sm'} variant={statusVariant}>
                  {phaseLabel}
                </Badge>
                {shouldShowElapsedTime && (
                  <span className={'flex items-center gap-1 text-xs text-muted-foreground'}>
                    <Timer className={'size-3.5'} />
                    {formatElapsedTime(extendedThinkingElapsedMs)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className={'max-w-2xl text-sm text-muted-foreground'}>
                Analyze the codebase to identify files relevant to the feature request.
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
      </div>

      {/* Stale Discovery Indicator */}
      <StaleDiscoveryIndicator
        className={'mt-4'}
        discoveryCompletedAt={discoveryCompletedAt}
        isRediscovering={isMutating}
        onRediscover={handleOpenRediscoverDialog}
        refinementUpdatedAt={refinementUpdatedAt}
      />

      {/* Streaming Output Section */}
      {shouldShowStreamingSection && (
        <div className={'mt-6'}>
          <DiscoveryStreaming
            activeTools={activeTools}
            agentName={'Discovery Agent'}
            className={'min-h-64'}
            error={error}
            extendedThinkingElapsedMs={extendedThinkingElapsedMs}
            isStreaming={isStreaming}
            layout={isStreaming ? 'primary' : 'summary'}
            onCancel={handleCancelDiscovery}
            outcome={outcome}
            phase={phase}
            sessionId={sessionId}
            streamingText={streamingText}
          />
        </div>
      )}

      {/* Files Section */}
      <div className={'mt-6 rounded-2xl border border-border/60 bg-background/80 shadow-sm'}>
        {/* Toolbar */}
        <div className={'border-b border-border/50 p-4'}>
          <DiscoveryTableToolbar files={files} />
        </div>

        {/* Table or Empty State */}
        {hasFiles ? (
          <DiscoveredFilesTable files={files} onFileToggle={handleFileToggle} />
        ) : (
          <div className={'flex flex-col items-center justify-center px-6 py-16 text-center'}>
            {/* Status Badge */}
            <div className={'rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground'}>
              {isStreaming ? 'Discovering...' : 'No files discovered'}
            </div>

            {/* Heading */}
            <h3 className={'mt-4 text-base font-semibold text-foreground'}>
              {isStreaming ? 'Discovery in progress' : 'Ready to discover files'}
            </h3>

            {/* Description */}
            <p className={'mt-2 max-w-sm text-sm text-muted-foreground'}>
              {isStreaming
                ? 'The agent is analyzing the codebase to find relevant files. This may take a moment.'
                : 'Start the discovery process to identify files relevant to the feature request.'}
            </p>

            {/* Loading Placeholders (when streaming) */}
            {isStreaming && (
              <div className={'mt-6 w-full max-w-md space-y-3'}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    className={'h-4 w-full animate-pulse rounded-full bg-muted/60'}
                    key={`discovery-placeholder-${index}`}
                    style={{ width: `${90 - index * 12}%` }}
                  />
                ))}
              </div>
            )}

            {/* Start Discovery Button (when idle) */}
            {isIdle && (
              <Button className={'mt-6'} disabled={isMutating} onClick={handleStartDiscovery} type={'button'}>
                <FolderSearch className={'mr-2 size-4'} />
                Start Discovery
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className={'mt-6 flex items-center justify-between gap-4'}>
        {/* Left Actions */}
        <div className={'flex items-center gap-3'}>
          {/* Add File Button */}
          <Button onClick={() => setIsAddFileDialogOpen(true)} size={'sm'} type={'button'} variant={'outline'}>
            <Plus className={'mr-1.5 size-4'} />
            Add File
          </Button>

          {/* Re-discover Button */}
          {hasFiles && (
            <Button
              disabled={isMutating || isStreaming}
              onClick={handleOpenRediscoverDialog}
              size={'sm'}
              type={'button'}
              variant={'outline'}
            >
              <RefreshCw className={cn('mr-1.5 size-4', isMutating && 'animate-spin')} />
              Re-discover
            </Button>
          )}
        </div>

        {/* Right Actions */}
        <div className={'flex items-center gap-3'}>
          {/* Continue Button */}
          <Button disabled={!canContinue || isStreaming} onClick={handleContinueToPlanning} type={'button'}>
            Continue to Planning
            <ArrowRight className={'ml-2 size-4'} />
          </Button>
        </div>
      </div>

      {/* Add File Dialog */}
      <AddFileDialog
        onOpenChange={handleAddFileDialogOpenChange}
        onSuccess={handleAddFileSuccess}
        open={isAddFileDialogOpen}
        stepId={stepId}
      />

      {/* Re-discover Mode Selection Dialog */}
      <DialogRoot onOpenChange={handleCloseRediscoverDialog} open={isRediscoverDialogOpen}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup>
            {/* Header */}
            <DialogHeader>
              <DialogTitle>Re-discover Files</DialogTitle>
              <DialogDescription>Choose how to handle the existing discovered files.</DialogDescription>
            </DialogHeader>

            {/* Content */}
            <div className={'mt-4 space-y-3'}>
              <p className={'text-sm text-muted-foreground'}>
                Running discovery again will analyze the codebase with the current feature refinement.
              </p>

              <div className={'space-y-2'}>
                {/* Replace Mode */}
                <button
                  className={cn(
                    'w-full rounded-lg border border-border p-4 text-left transition-colors',
                    'hover:border-accent hover:bg-accent/5',
                    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
                  )}
                  onClick={handleRediscoverReplace}
                  type={'button'}
                >
                  <div className={'font-medium text-foreground'}>Replace existing files</div>
                  <p className={'mt-1 text-sm text-muted-foreground'}>
                    Clear all currently discovered files and start fresh with new results.
                  </p>
                </button>

                {/* Additive Mode */}
                <button
                  className={cn(
                    'w-full rounded-lg border border-border p-4 text-left transition-colors',
                    'hover:border-accent hover:bg-accent/5',
                    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
                  )}
                  onClick={handleRediscoverAdditive}
                  type={'button'}
                >
                  <div className={'font-medium text-foreground'}>Add to existing files</div>
                  <p className={'mt-1 text-sm text-muted-foreground'}>
                    Keep current files and add any newly discovered files to the list.
                  </p>
                </button>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter sticky={false}>
              <DialogClose>
                <Button type={'button'} variant={'outline'}>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
    </section>
  );
};
