'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Agent } from '@/db/schema/agents.schema';
import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';
import type { useCancelRefinement, useRegenerateRefinement } from '@/hooks/queries/use-refinement';
import type { useCompleteStep, useSkipStep, useUpdateStep } from '@/hooks/queries/use-steps';
import type { ClarificationStepOutput } from '@/lib/validations/clarification';
import type { RefinementStreamMessage } from '@/types/electron';

import { useRefinementStore } from '@/lib/stores/refinement-store';
import { buildClarificationContextForRefinement } from '@/lib/utils/clarification-context';

interface UseRefinementPipelineOptions {
  activeRefinementStep: null | WorkflowStep;
  cancelRefinement: ReturnType<typeof useCancelRefinement>;
  clarificationOutputForRefinement: ClarificationStepOutput | null;
  completeStep: ReturnType<typeof useCompleteStep>;
  primaryRepositoryPath: string | undefined;
  refinementAgent: Agent | undefined;
  refinementAgentId: null | number;
  regenerateRefinement: ReturnType<typeof useRegenerateRefinement>;
  skipStep: ReturnType<typeof useSkipStep>;
  updateStep: ReturnType<typeof useUpdateStep>;
  workflowFeatureRequest: string | undefined;
  workflowId: number;
}

/**
 * Encapsulates all refinement domain logic: state, handlers, and streaming effects.
 */
export function useRefinementPipeline({
  activeRefinementStep,
  cancelRefinement,
  clarificationOutputForRefinement,
  completeStep,
  primaryRepositoryPath,
  refinementAgent,
  refinementAgentId,
  regenerateRefinement,
  skipStep,
  updateStep,
  workflowFeatureRequest,
  workflowId,
}: UseRefinementPipelineOptions) {
  const [submittingStepId, setSubmittingStepId] = useState<null | number>(null);
  const [refinementStepId, setRefinementStepId] = useState<null | number>(null);
  const refinementStartedRef = useRef<null | number>(null);

  const refinementStore = useRefinementStore();
  const activeRefinementStepId = activeRefinementStep?.id ?? null;

  const handleSaveRefinement = useCallback(
    async (text: string) => {
      if (!activeRefinementStepId) return;

      try {
        await updateStep.mutateAsync({
          data: { outputText: text },
          id: activeRefinementStepId,
        });

        // Transition step to completed
        await completeStep.mutateAsync({ id: activeRefinementStepId });

        // Reset refinement state
        useRefinementStore.getState().reset();
        setRefinementStepId(null);
        refinementStartedRef.current = null;
      } catch (error) {
        console.error('Failed to save refinement:', error);
        useRefinementStore.getState().setError(error instanceof Error ? error.message : 'Failed to save refinement');
      }
    },
    [activeRefinementStepId, completeStep, updateStep]
  );

  const handleRevertRefinement = useCallback(() => {
    // No-op: the store's outcome already holds the original refinedText
  }, []);

  const handleRegenerateRefinement = useCallback(
    async (guidance: string) => {
      if (!activeRefinementStepId) return;

      const previousOutcome = useRefinementStore.getState().outcome;

      try {
        // Reset streaming state for regeneration via store
        const store = useRefinementStore.getState();
        store.startSession(store.sessionId ?? '');

        await regenerateRefinement.mutateAsync({
          guidance,
          stepId: activeRefinementStepId,
          workflowId,
        });
      } catch (error) {
        console.error('Failed to regenerate refinement:', error);
        const storeOnError = useRefinementStore.getState();
        storeOnError.setOutcome(previousOutcome);
        storeOnError.setError(error instanceof Error ? error.message : 'Failed to regenerate');
        storeOnError.updatePhase('error');
      }
    },
    [activeRefinementStepId, regenerateRefinement, workflowId]
  );

  const handleSkipRefinement = useCallback(async () => {
    if (!activeRefinementStepId) return;

    setSubmittingStepId(activeRefinementStepId);
    try {
      // Skip the step (proceed with original feature request)
      await skipStep.mutateAsync(activeRefinementStepId);

      // Reset refinement state
      useRefinementStore.getState().reset();
      setRefinementStepId(null);
      refinementStartedRef.current = null;
    } catch (error) {
      console.error('Failed to skip refinement:', error);
    } finally {
      setSubmittingStepId(null);
    }
  }, [activeRefinementStepId, skipStep]);

  const handleCancelRefinement = useCallback(async () => {
    const store = useRefinementStore.getState();
    if (!store.sessionId || !activeRefinementStepId) return;

    try {
      await cancelRefinement.mutateAsync({
        sessionId: store.sessionId,
        stepId: activeRefinementStepId,
        workflowId,
      });

      // Reset state
      useRefinementStore.getState().reset();
      setRefinementStepId(null);
      refinementStartedRef.current = null;
    } catch (error) {
      console.error('Failed to cancel refinement:', error);
    }
  }, [activeRefinementStepId, cancelRefinement, workflowId]);

  const handleRefinementError = useCallback((error: string) => {
    const store = useRefinementStore.getState();
    store.setError(error);
    store.updatePhase('error');
  }, []);

  // Effect to start refinement when a refinement step becomes active
  useEffect(() => {
    const isStepRunning = activeRefinementStep && activeRefinementStep.status !== 'pending';
    const isAlreadyStarted = refinementStartedRef.current === activeRefinementStep?.id;
    const hasRefinedText = activeRefinementStep?.outputText;

    // Don't start if already started, not running, or refinement already complete
    if (!isStepRunning || isAlreadyStarted || hasRefinedText) {
      return;
    }

    // Need repository path, workflow feature request, and clarification context
    if (!primaryRepositoryPath || !workflowFeatureRequest) {
      return;
    }

    // Get clarification context (required for refinement)
    const clarificationContext = buildClarificationContextForRefinement(clarificationOutputForRefinement);

    const startRefinementProcess = async () => {
      if (typeof window === 'undefined' || !window.electronAPI?.refinement) {
        return;
      }

      // Check if we have a valid refinement agent ID
      if (!refinementAgentId) {
        console.error('No refinement agent configured');
        return;
      }

      // Mark as started
      refinementStartedRef.current = activeRefinementStep.id;

      // Set initial streaming state via store
      const rStore = useRefinementStore.getState();
      rStore.reset();
      rStore.setAgentName(refinementAgent?.displayName ?? refinementAgent?.name ?? 'Refinement Agent');
      rStore.setMaxThinkingTokens(refinementAgent?.maxThinkingTokens ?? null);
      rStore.updatePhase('loading_agent');
      setRefinementStepId(activeRefinementStep.id);

      // Subscribe to streaming events BEFORE starting
      const unsubscribe = window.electronAPI.refinement.onStreamMessage((message: RefinementStreamMessage) => {
        const store = useRefinementStore.getState();
        switch (message.type) {
          case 'extended_thinking_heartbeat':
            store.setExtendedThinkingElapsedMs(message.elapsedMs);
            store.setMaxThinkingTokens(message.maxThinkingTokens);
            store.updatePhase('executing_extended_thinking');
            break;

          case 'phase_change':
            store.updatePhase(message.phase);
            break;

          case 'text_delta':
            store.appendText(message.delta);
            break;

          case 'thinking_delta':
            store.appendThinking(message.blockIndex, message.delta);
            break;

          case 'thinking_start':
            store.startThinkingBlock(message.blockIndex);
            break;

          case 'tool_start':
            store.addTool({
              id: message.toolUseId,
              name: message.toolName,
              startedAt: new Date(),
              toolInput: message.toolInput,
            });
            break;

          case 'tool_stop':
            store.removeTool(message.toolUseId);
            break;

          case 'tool_update':
            store.updateToolInput(message.toolUseId, message.toolInput);
            break;
        }
      });

      try {
        // Build clarification context - use empty defaults if none available
        const refinementClarificationContext = clarificationContext ?? {
          answers: {},
          questions: [],
        };

        // Start the refinement session
        const result = await window.electronAPI.refinement.start({
          agentId: refinementAgentId,
          clarificationContext: refinementClarificationContext,
          featureRequest: workflowFeatureRequest,
          repositoryPath: primaryRepositoryPath,
          stepId: activeRefinementStep.id,
          timeoutSeconds: 180,
          workflowId,
        });

        // Cleanup subscription
        unsubscribe();

        // Handle outcome
        const storeAfter = useRefinementStore.getState();
        const { outcome } = result;
        if (outcome.type === 'SUCCESS') {
          const { refinedText } = outcome;
          storeAfter.setOutcome({ refinedText, type: 'SUCCESS' });
          storeAfter.updatePhase('complete');

          // Update step output
          await updateStep.mutateAsync({
            data: { outputText: refinedText },
            id: activeRefinementStep.id,
          });
        } else if (outcome.type === 'CANCELLED') {
          storeAfter.setError(outcome.reason ?? 'Refinement was cancelled');
          storeAfter.updatePhase('cancelled');
        } else if (outcome.type === 'TIMEOUT') {
          storeAfter.setError(`Refinement timed out after ${outcome.elapsedSeconds}s: ${outcome.error}`);
          storeAfter.updatePhase('timeout');
        } else if (outcome.type === 'ERROR') {
          storeAfter.setError(outcome.error);
          storeAfter.updatePhase('error');
        }
      } catch (error) {
        // Cleanup subscription on error
        unsubscribe();

        const storeOnError = useRefinementStore.getState();
        storeOnError.setError(error instanceof Error ? error.message : 'Unknown error occurred');
        storeOnError.updatePhase('error');
      }
    };

    void startRefinementProcess();
  }, [
    activeRefinementStep,
    clarificationOutputForRefinement,
    primaryRepositoryPath,
    refinementAgent,
    refinementAgentId,
    updateStep,
    workflowFeatureRequest,
    workflowId,
  ]);

  // Reset refinement state when step changes or completes
  useEffect(() => {
    if (!activeRefinementStep && refinementStepId !== null) {
      useRefinementStore.getState().reset();
      setRefinementStepId(null);
      refinementStartedRef.current = null;
    }
  }, [activeRefinementStep, refinementStepId]);

  return {
    handleCancelRefinement,
    handleRefinementError,
    handleRegenerateRefinement,
    handleRevertRefinement,
    handleSaveRefinement,
    handleSkipRefinement,
    refinementStepId,
    refinementStore,
    submittingStepId,
  };
}
