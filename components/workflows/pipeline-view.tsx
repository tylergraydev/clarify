'use client';

import type { ComponentPropsWithRef } from 'react';

import { useCallback, useMemo } from 'react';

import { useClarificationPipeline } from '@/hooks/workflows/use-clarification-pipeline';
import { usePipelineData } from '@/hooks/workflows/use-pipeline-data';
import { useRefinementPipeline } from '@/hooks/workflows/use-refinement-pipeline';
import { usePipelineStore } from '@/lib/stores/pipeline-store';
import { cn } from '@/lib/utils';
import { formatClarificationContextForDisplay } from '@/lib/utils/clarification-context';

import { ClarificationWorkspace } from './clarification-workspace';
import { DiscoveryWorkspace } from './discovery-workspace';
import { PipelineProgressBar } from './pipeline-progress-bar';
import { PipelineStepsList } from './pipeline-steps-list';
import { RefinementWorkspace } from './refinement-workspace';

interface PipelineViewProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The workflow ID to fetch steps for */
  workflowId: number;
}

/**
 * Main pipeline view component that orchestrates step layout, state management,
 * and data fetching for the workflow visualization.
 *
 * Displays workflow steps in a vertical accordion layout with a sticky progress bar.
 * Each step's visual state is derived from its database status.
 * Handles empty state gracefully when workflow is in 'created' status.
 *
 * @example
 * ```tsx
 * <PipelineView workflowId={123} />
 * ```
 */
export const PipelineView = ({ className, ref, workflowId, ...props }: PipelineViewProps) => {
  // 1. Data layer
  const data = usePipelineData({ workflowId });
  const { expandedStepId, toggleStep } = usePipelineStore();

  // 2. Domain hooks
  const clarification = useClarificationPipeline({
    activeClarificationStep: data.activeClarificationStep,
    clarificationAgent: data.clarificationAgent,
    completeStep: data.completeStep,
    primaryRepositoryPath: data.primaryRepository?.path,
    skipStep: data.skipStep,
    updateStep: data.updateStep,
    workflowFeatureRequest: data.workflow?.featureRequest,
    workflowId,
  });

  const refinement = useRefinementPipeline({
    activeRefinementStep: data.activeRefinementStep,
    cancelRefinement: data.cancelRefinement,
    clarificationOutputForRefinement: data.clarificationOutputForRefinement,
    completeStep: data.completeStep,
    primaryRepositoryPath: data.primaryRepository?.path,
    refinementAgent: data.refinementAgent,
    refinementAgentId: data.refinementAgentId,
    regenerateRefinement: data.regenerateRefinement,
    skipStep: data.skipStep,
    updateStep: data.updateStep,
    workflowFeatureRequest: data.workflow?.featureRequest,
    workflowId,
  });

  // 3. Compute visibleSteps (exclude active workspace steps)
  const activeClarificationStepId = data.activeClarificationStep?.id ?? null;
  const activeRefinementStepId = data.activeRefinementStep?.id ?? null;
  const activeDiscoveryStepId = data.activeDiscoveryStep?.id ?? null;
  const isClarificationWorkspaceActive = Boolean(activeClarificationStepId);
  const isRefinementWorkspaceActive = Boolean(activeRefinementStepId);
  const isDiscoveryWorkspaceActive = Boolean(activeDiscoveryStepId);

  const visibleSteps = useMemo(() => {
    const activeStepIds = [activeClarificationStepId, activeRefinementStepId, activeDiscoveryStepId].filter(Boolean);
    if (activeStepIds.length === 0) return data.sortedSteps;
    return data.sortedSteps.filter((step) => !activeStepIds.includes(step.id));
  }, [data.sortedSteps, activeClarificationStepId, activeRefinementStepId, activeDiscoveryStepId]);

  // 4. Simple UI handlers
  const handleToggleStep = useCallback(
    (stepId: number) => {
      toggleStep(stepId);
    },
    [toggleStep]
  );

  const handleStartStep = useCallback(
    async (stepId: number) => {
      try {
        await data.startStep.mutateAsync(stepId);
      } catch (error) {
        console.error('Failed to start step:', error);
      }
    },
    [data.startStep]
  );

  const handleDiscoveryComplete = useCallback(async () => {
    if (!activeDiscoveryStepId) return;

    try {
      await data.completeStep.mutateAsync({ id: activeDiscoveryStepId });
    } catch (error) {
      console.error('Failed to complete discovery step:', error);
    }
  }, [activeDiscoveryStepId, data.completeStep]);

  // 5. Derived display values
  const isAnyWorkspaceActive =
    isClarificationWorkspaceActive || isRefinementWorkspaceActive || isDiscoveryWorkspaceActive;
  const clarificationContextForDisplay = formatClarificationContextForDisplay(data.clarificationOutputForRefinement);
  const hasQuestionsToSubmit =
    data.activeClarificationStepOutput && data.activeClarificationStepOutput.questions?.length;
  const combinedSubmittingStepId = clarification.submittingStepId ?? refinement.submittingStepId;

  // 6. JSX
  return (
    <div className={cn('flex h-full flex-col', className)} ref={ref} {...props}>
      {/* Sticky Progress Bar */}
      {data.sortedSteps.length > 0 && (
        <div
          className={'sticky top-0 z-10 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80'}
        >
          <PipelineProgressBar
            completedSteps={data.completedCount}
            currentStepTitle={data.currentStep?.title}
            totalSteps={data.sortedSteps.length}
          />
        </div>
      )}

      {/* Vertical Pipeline Container */}
      <div className={'flex flex-1 flex-col items-center overflow-y-auto py-6'}>
        {/* Clarification Workspace */}
        {isClarificationWorkspaceActive && data.activeClarificationStep && (
          <div className={'w-full max-w-6xl px-4'}>
            <ClarificationWorkspace
              existingAnswers={data.activeClarificationStepOutput?.answers}
              extendedThinkingElapsedMs={clarification.clarificationStore.extendedThinkingElapsedMs}
              featureRequest={data.workflow?.featureRequest}
              isStreaming={clarification.clarificationStore.isStreaming}
              isSubmitting={combinedSubmittingStepId === data.activeClarificationStep.id}
              onSkip={() => clarification.handleSkipClarification(data.activeClarificationStep!.id)}
              onSubmit={
                hasQuestionsToSubmit
                  ? (answers) =>
                      clarification.handleSubmitClarification(
                        data.activeClarificationStep!.id,
                        data.activeClarificationStepOutput!,
                        answers
                      )
                  : undefined
              }
              phase={clarification.clarificationStore.phase}
              questions={data.activeClarificationStepOutput?.questions ?? []}
              streamingProps={{
                activeTools: clarification.clarificationStore.activeTools.map((tool) => ({
                  toolInput: tool.toolInput,
                  toolName: tool.name,
                  toolUseId: tool.id,
                })),
                agentName: clarification.clarificationStore.agentName,
                error: clarification.clarificationStore.error,
                extendedThinkingElapsedMs: clarification.clarificationStore.extendedThinkingElapsedMs,
                isStreaming: clarification.clarificationStore.isStreaming,
                maxThinkingTokens: clarification.clarificationStore.maxThinkingTokens,
                onCancel: clarification.handleClarificationCancel,
                onClarificationError: clarification.handleClarificationError,
                onQuestionsReady: clarification.handleQuestionsReady,
                onSkipReady: clarification.handleSkipReady,
                outcome: clarification.clarificationStore.outcome,
                phase: clarification.clarificationStore.phase,
                sessionId: clarification.clarificationStore.sessionId,
                text: clarification.clarificationStore.text,
                thinking: clarification.clarificationStore.thinking,
                toolHistory: clarification.clarificationStore.toolHistory.map((tool) => ({
                  toolInput: tool.toolInput,
                  toolName: tool.name,
                  toolUseId: tool.id,
                })),
              }}
            />
          </div>
        )}

        {/* Refinement Workspace */}
        {isRefinementWorkspaceActive && data.activeRefinementStep && (
          <div className={'w-full max-w-6xl px-4'}>
            <RefinementWorkspace
              clarificationContext={clarificationContextForDisplay}
              extendedThinkingElapsedMs={refinement.refinementStore.extendedThinkingElapsedMs}
              featureRequest={data.workflow?.featureRequest ?? null}
              isStreaming={refinement.refinementStore.isStreaming}
              isSubmitting={combinedSubmittingStepId === data.activeRefinementStep.id}
              onRegenerate={refinement.handleRegenerateRefinement}
              onRevert={refinement.handleRevertRefinement}
              onSave={refinement.handleSaveRefinement}
              onSkip={refinement.handleSkipRefinement}
              phase={refinement.refinementStore.phase}
              refinedText={
                refinement.refinementStore.outcome?.type === 'SUCCESS'
                  ? refinement.refinementStore.outcome.refinedText
                  : null
              }
              streamingProps={{
                activeTools: refinement.refinementStore.activeTools.map((tool) => ({
                  toolInput: tool.toolInput,
                  toolName: tool.name,
                  toolUseId: tool.id,
                })),
                agentName: refinement.refinementStore.agentName,
                error: refinement.refinementStore.error,
                extendedThinkingElapsedMs: refinement.refinementStore.extendedThinkingElapsedMs,
                isStreaming: refinement.refinementStore.isStreaming,
                maxThinkingTokens: refinement.refinementStore.maxThinkingTokens,
                onCancel: refinement.handleCancelRefinement,
                onRefinementError: refinement.handleRefinementError,
                phase: refinement.refinementStore.phase,
                text: refinement.refinementStore.text,
                thinking: refinement.refinementStore.thinking,
                toolHistory: refinement.refinementStore.toolHistory.map((tool) => ({
                  toolInput: tool.toolInput,
                  toolName: tool.name,
                  toolUseId: tool.id,
                })),
              }}
            />
          </div>
        )}

        {/* Discovery Workspace */}
        {isDiscoveryWorkspaceActive && data.activeDiscoveryStep && (
          <div className={'w-full max-w-6xl px-4'}>
            <DiscoveryWorkspace
              agentId={data.discoveryAgentId}
              discoveryCompletedAt={data.activeDiscoveryStep.completedAt}
              discoveryStartedAt={data.activeDiscoveryStep.startedAt}
              onComplete={handleDiscoveryComplete}
              refinedFeatureRequest={data.refinedFeatureRequest}
              refinementUpdatedAt={data.refinementUpdatedAt}
              repositoryPath={data.repositoryPath}
              stepId={data.activeDiscoveryStep.id}
              workflowId={workflowId}
            />
          </div>
        )}

        <PipelineStepsList
          clarificationAction={clarification.clarificationAction}
          clarificationStepId={clarification.clarificationStepId}
          clarificationStore={clarification.clarificationStore}
          expandedStepId={expandedStepId}
          hasRunningStep={data.hasRunningStep}
          isAnyWorkspaceActive={isAnyWorkspaceActive}
          isLoading={data.isLoading}
          onClarificationCancel={clarification.handleClarificationCancel}
          onClarificationError={clarification.handleClarificationError}
          onGenerateClarifications={clarification.handleGenerateClarifications}
          onQuestionsReady={clarification.handleQuestionsReady}
          onRerunClarification={clarification.handleRerunClarification}
          onSkipClarification={clarification.handleSkipClarification}
          onSkipReady={clarification.handleSkipReady}
          onStartStep={handleStartStep}
          onSubmitClarification={clarification.handleSubmitClarification}
          onToggleStep={handleToggleStep}
          pauseBehavior={data.pauseBehavior}
          sortedSteps={data.sortedSteps}
          submittingStepId={combinedSubmittingStepId}
          visibleSteps={visibleSteps}
          workflow={data.workflow}
        />
      </div>
    </div>
  );
};
