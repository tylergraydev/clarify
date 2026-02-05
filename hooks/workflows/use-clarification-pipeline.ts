'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Agent } from '@/db/schema/agents.schema';
import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';
import type { useCompleteStep, useSkipStep, useUpdateStep } from '@/hooks/queries/use-steps';
import type {
  ClarificationAnswers,
  ClarificationOutcome,
  ClarificationOutcomeQuestions,
  ClarificationQuestion,
  ClarificationStepOutput,
} from '@/lib/validations/clarification';

import { useClarificationStore } from '@/lib/stores/clarification-store';
import { formatClarificationContext } from '@/lib/utils/clarification-context';

interface UseClarificationPipelineOptions {
  activeClarificationStep: null | WorkflowStep;
  clarificationAgent: Agent | undefined;
  completeStep: ReturnType<typeof useCompleteStep>;
  primaryRepositoryPath: string | undefined;
  skipStep: ReturnType<typeof useSkipStep>;
  updateStep: ReturnType<typeof useUpdateStep>;
  workflowFeatureRequest: string | undefined;
  workflowId: number;
}

/**
 * Encapsulates all clarification domain logic: state, handlers, and streaming effects.
 */
export function useClarificationPipeline({
  activeClarificationStep,
  clarificationAgent,
  completeStep,
  primaryRepositoryPath,
  skipStep,
  updateStep,
  workflowFeatureRequest,
  workflowId,
}: UseClarificationPipelineOptions) {
  const [submittingStepId, setSubmittingStepId] = useState<null | number>(null);
  const [clarificationStepId, setClarificationStepId] = useState<null | number>(null);
  const [clarificationAction, setClarificationAction] = useState<null | { stepId: number; type: 'more' | 'rerun' }>(
    null
  );
  const clarificationStartedRef = useRef<null | number>(null);

  const clarificationStore = useClarificationStore();
  const activeClarificationStepId = activeClarificationStep?.id ?? null;

  const resetClarificationStep = useCallback(
    async (step: WorkflowStep, action: 'more' | 'rerun', inputText: null | string) => {
      setClarificationAction({ stepId: step.id, type: action });
      useClarificationStore.getState().reset();
      setClarificationStepId(null);
      clarificationStartedRef.current = null;

      try {
        await updateStep.mutateAsync({
          data: {
            completedAt: null,
            errorMessage: null,
            inputText,
            outputStructured: null,
            outputText: null,
            startedAt: new Date().toISOString(),
            status: 'running',
          },
          id: step.id,
        });
      } finally {
        setClarificationAction(null);
      }
    },
    [updateStep]
  );

  const handleRerunClarification = useCallback(
    async (step: WorkflowStep) => {
      await resetClarificationStep(step, 'rerun', null);
    },
    [resetClarificationStep]
  );

  const handleGenerateClarifications = useCallback(
    async (step: WorkflowStep, output: ClarificationStepOutput | null) => {
      const context = formatClarificationContext(output);
      await resetClarificationStep(step, 'more', context);
    },
    [resetClarificationStep]
  );

  const handleSubmitClarification = useCallback(
    async (stepId: number, currentOutput: ClarificationStepOutput, answers: ClarificationAnswers) => {
      setSubmittingStepId(stepId);
      try {
        // Merge answers into existing outputStructured
        const updatedOutput: ClarificationStepOutput = {
          ...currentOutput,
          answers,
        };

        // Update step with answers
        await updateStep.mutateAsync({
          data: { outputStructured: updatedOutput },
          id: stepId,
        });

        // Transition step to completed
        await completeStep.mutateAsync({ id: stepId });
      } finally {
        setSubmittingStepId(null);
      }
    },
    [updateStep, completeStep]
  );

  const handleSkipClarification = useCallback(
    async (stepId: number) => {
      setSubmittingStepId(stepId);
      try {
        const stepOutput: ClarificationStepOutput = {
          questions: [],
          skipped: true,
          skipReason: 'User skipped clarification',
        };

        await updateStep.mutateAsync({
          data: { outputStructured: stepOutput },
          id: stepId,
        });

        await skipStep.mutateAsync(stepId);
      } finally {
        setSubmittingStepId(null);
      }
    },
    [skipStep, updateStep]
  );

  const handleQuestionsReady = useCallback(
    async (questions: Array<ClarificationQuestion>) => {
      if (!activeClarificationStepId) return;

      // Normalize questions to ensure they have required fields
      const normalizedQuestions: Array<ClarificationQuestion> = questions.map((q) => {
        const questionType = (q as unknown as Record<string, unknown>).questionType ?? 'radio';

        return {
          ...q,
          allowOther: questionType !== 'text',
          questionType,
        };
      }) as Array<ClarificationQuestion>;

      // Update the step's outputStructured with the questions
      const stepOutput: ClarificationStepOutput = {
        questions: normalizedQuestions,
      };

      await updateStep.mutateAsync({
        data: { outputStructured: stepOutput },
        id: activeClarificationStepId,
      });

      // Update store state to stop streaming phase
      useClarificationStore.getState().updatePhase('waiting_for_user');
    },
    [activeClarificationStepId, updateStep]
  );

  const handleSkipReady = useCallback(
    async (reason: string) => {
      if (!activeClarificationStepId) return;

      // Update the step's outputStructured with skip info
      const stepOutput: ClarificationStepOutput = {
        questions: [],
        skipped: true,
        skipReason: reason,
      };

      await updateStep.mutateAsync({
        data: { outputStructured: stepOutput },
        id: activeClarificationStepId,
      });

      // Mark step as skipped
      await skipStep.mutateAsync(activeClarificationStepId);

      // Reset clarification state
      useClarificationStore.getState().reset();
      setClarificationStepId(null);
      clarificationStartedRef.current = null;
    },
    [activeClarificationStepId, updateStep, skipStep]
  );

  const handleClarificationError = useCallback((error: string) => {
    const store = useClarificationStore.getState();
    store.setError(error);
    store.updatePhase('error');
  }, []);

  const handleClarificationCancel = useCallback(async () => {
    // Call the skip IPC to cancel the session
    if (typeof window !== 'undefined' && window.electronAPI?.clarification) {
      const { sessionId } = useClarificationStore.getState();
      if (sessionId) {
        await window.electronAPI.clarification.skip(sessionId, 'User cancelled');
      }
    }

    // Reset state
    useClarificationStore.getState().reset();
    setClarificationStepId(null);
    clarificationStartedRef.current = null;
  }, []);

  // Effect to start clarification when a clarification step becomes active
  useEffect(() => {
    const isStepRunning = activeClarificationStep && activeClarificationStep.status !== 'pending';
    const isAlreadyStarted = clarificationStartedRef.current === activeClarificationStep?.id;
    const hasQuestions =
      activeClarificationStep?.outputStructured &&
      (activeClarificationStep.outputStructured as ClarificationStepOutput | null)?.questions?.length;

    // Don't start if already started, not running, or questions already exist
    if (!isStepRunning || isAlreadyStarted || hasQuestions) {
      return;
    }

    // Need repository path and workflow feature request
    if (!primaryRepositoryPath || !workflowFeatureRequest) {
      return;
    }

    const startClarification = async () => {
      if (typeof window === 'undefined' || !window.electronAPI?.clarification) {
        return;
      }

      // Mark as started
      clarificationStartedRef.current = activeClarificationStep.id;

      // Set initial streaming state via store
      const cStore = useClarificationStore.getState();
      cStore.reset();
      cStore.setAgentName(clarificationAgent?.displayName ?? clarificationAgent?.name ?? 'Clarification Agent');
      cStore.setMaxThinkingTokens(clarificationAgent?.maxThinkingTokens ?? null);
      cStore.updatePhase('loading_agent');
      setClarificationStepId(activeClarificationStep.id);

      // Subscribe to streaming events BEFORE starting
      const unsubscribe = window.electronAPI.clarification.onStreamMessage((message) => {
        const store = useClarificationStore.getState();
        // Update state based on message type
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
        const clarificationContext = activeClarificationStep.inputText?.trim();
        const featureRequest = clarificationContext
          ? `${workflowFeatureRequest}\n\nPrevious clarification answers:\n${clarificationContext}`
          : workflowFeatureRequest;

        // Start the clarification session
        const outcome = await window.electronAPI.clarification.start({
          featureRequest,
          repositoryPath: primaryRepositoryPath,
          stepId: activeClarificationStep.id,
          timeoutSeconds: 120,
          workflowId,
        });

        // Cleanup subscription
        unsubscribe();

        // Normalize outcome to fix type mismatch between electron.d.ts (old) and lib/validations/clarification.ts (new)
        let normalizedOutcome: ClarificationOutcome;
        if (outcome.type === 'QUESTIONS_FOR_USER') {
          normalizedOutcome = {
            assessment: outcome.assessment,
            questions: outcome.questions.map((q) => {
              const questionType = (q as unknown as Record<string, unknown>).questionType ?? 'radio';

              return {
                ...q,
                allowOther: questionType !== 'text',
                questionType,
              };
            }) as Array<ClarificationQuestion>,
            type: 'QUESTIONS_FOR_USER',
          };
        } else {
          normalizedOutcome = outcome as ClarificationOutcome;
        }

        // Update store with outcome
        const storeAfter = useClarificationStore.getState();
        storeAfter.setOutcome(normalizedOutcome);
        storeAfter.updatePhase(
          outcome.type === 'QUESTIONS_FOR_USER' || outcome.type === 'SKIP_CLARIFICATION' ? 'complete' : 'error'
        );

        // Handle outcome directly here since ClarificationStreaming will unmount
        // when isStreaming becomes false, so its useEffect won't fire
        if (outcome.type === 'QUESTIONS_FOR_USER') {
          // Use normalized questions from above
          const normalizedQuestions = (normalizedOutcome as ClarificationOutcomeQuestions).questions;

          // Update the step's outputStructured with the questions
          const stepOutput: ClarificationStepOutput = {
            questions: normalizedQuestions,
          };

          await updateStep.mutateAsync({
            data: { outputStructured: stepOutput },
            id: activeClarificationStep.id,
          });

          // Update store state to show the form
          useClarificationStore.getState().updatePhase('waiting_for_user');
        } else if (outcome.type === 'SKIP_CLARIFICATION') {
          // Update the step's outputStructured with skip info
          const stepOutput: ClarificationStepOutput = {
            questions: [],
            skipped: true,
            skipReason: outcome.reason,
          };

          await updateStep.mutateAsync({
            data: { outputStructured: stepOutput },
            id: activeClarificationStep.id,
          });

          // Mark step as skipped
          await skipStep.mutateAsync(activeClarificationStep.id);

          // Reset clarification state
          useClarificationStore.getState().reset();
          setClarificationStepId(null);
          clarificationStartedRef.current = null;
        }
      } catch (error) {
        // Cleanup subscription on error
        unsubscribe();

        const storeOnError = useClarificationStore.getState();
        storeOnError.setError(error instanceof Error ? error.message : 'Unknown error occurred');
        storeOnError.updatePhase('error');
      }
    };

    void startClarification();
  }, [
    activeClarificationStep,
    clarificationAgent,
    primaryRepositoryPath,
    skipStep,
    updateStep,
    workflowFeatureRequest,
    workflowId,
  ]);

  // Reset clarification state when step changes or completes
  useEffect(() => {
    if (!activeClarificationStep && clarificationStepId !== null) {
      useClarificationStore.getState().reset();
      setClarificationStepId(null);
      clarificationStartedRef.current = null;
    }
  }, [activeClarificationStep, clarificationStepId]);

  return {
    clarificationAction,
    clarificationStepId,
    clarificationStore,
    handleClarificationCancel,
    handleClarificationError,
    handleGenerateClarifications,
    handleQuestionsReady,
    handleRerunClarification,
    handleSkipClarification,
    handleSkipReady,
    handleSubmitClarification,
    submittingStepId,
  };
}
