'use client';

import type { ComponentPropsWithRef } from 'react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';
import type { RefinementActiveTool } from '@/lib/stores/refinement-store';
import type {
  ClarificationAnswers,
  ClarificationOutcome,
  ClarificationOutcomeQuestions,
  ClarificationQuestion,
  ClarificationServicePhase,
  ClarificationStepOutput,
} from '@/lib/validations/clarification';
import type { RefinementServicePhase, RefinementStreamMessage } from '@/types/electron';

import { useAgent, useAgents } from '@/hooks/queries/use-agents';
import { useDefaultClarificationAgent } from '@/hooks/queries/use-default-clarification-agent';
import { useDefaultRefinementAgent } from '@/hooks/queries/use-default-refinement-agent';
import { useCancelRefinement, useRegenerateRefinement } from '@/hooks/queries/use-refinement';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import {
  useCompleteStep,
  useSkipStep,
  useStartStep,
  useStepsByWorkflow,
  useUpdateStep,
} from '@/hooks/queries/use-steps';
import { useWorkflow } from '@/hooks/queries/use-workflows';
import { usePipelineStore } from '@/lib/stores/pipeline-store';
import { cn } from '@/lib/utils';

import type { StepMetrics } from './pipeline-step-metrics';

import { ClarificationWorkspace } from './clarification-workspace';
import { DiscoveryWorkspace } from './discovery-workspace';
import { PipelineProgressBar } from './pipeline-progress-bar';
import { PipelineStep, type PipelineStepStatus, type PipelineStepType } from './pipeline-step';
import { RefinementWorkspace } from './refinement-workspace';
import { VerticalConnector, type VerticalConnectorState } from './vertical-connector';
import { WorkflowEmptyState } from './workflow-empty-state';

/**
 * Active tool indicator for displaying current tool operations.
 */
interface ActiveTool {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
}

/**
 * State for clarification streaming during exploration phase.
 */
interface ClarificationSessionState {
  activeTools: Array<ActiveTool>;
  agentName: string;
  error: null | string;
  extendedThinkingElapsedMs?: number;
  isStreaming: boolean;
  maxThinkingTokens?: null | number;
  outcome: ClarificationOutcome | null;
  phase: ClarificationServicePhase;
  sessionId: null | string;
  stepId: null | number;
  text: string;
  thinking: Array<string>;
  toolHistory: Array<ActiveTool>;
}

/**
 * Initial state for clarification session.
 */
const INITIAL_CLARIFICATION_STATE: ClarificationSessionState = {
  activeTools: [],
  agentName: 'Clarification Agent',
  error: null,
  extendedThinkingElapsedMs: undefined,
  isStreaming: false,
  maxThinkingTokens: null,
  outcome: null,
  phase: 'idle',
  sessionId: null,
  stepId: null,
  text: '',
  thinking: [],
  toolHistory: [],
};

/**
 * State for refinement streaming during execution phase.
 */
interface RefinementSessionState {
  activeTools: Array<RefinementActiveTool>;
  agentName: string;
  error: null | string;
  extendedThinkingElapsedMs?: number;
  isStreaming: boolean;
  maxThinkingTokens?: null | number;
  phase: RefinementServicePhase;
  refinedText: null | string;
  sessionId: null | string;
  stepId: null | number;
  text: string;
  thinking: Array<string>;
  toolHistory: Array<RefinementActiveTool>;
}

/**
 * Initial state for refinement session.
 */
const INITIAL_REFINEMENT_STATE: RefinementSessionState = {
  activeTools: [],
  agentName: 'Refinement Agent',
  error: null,
  extendedThinkingElapsedMs: undefined,
  isStreaming: false,
  maxThinkingTokens: null,
  phase: 'idle',
  refinedText: null,
  sessionId: null,
  stepId: null,
  text: '',
  thinking: [],
  toolHistory: [],
};

/**
 * Default step type used when step.stepType is not a valid PipelineStepType.
 */
const DEFAULT_STEP_TYPE: PipelineStepType = 'clarification';

/**
 * Database step statuses that map to the 'running' visual state.
 */
const RUNNING_STATUSES = ['running', 'paused', 'editing'] as const;

/**
 * Database step statuses that map to the 'completed' visual state.
 */
const COMPLETED_STATUSES = ['completed', 'failed', 'skipped'] as const;

interface PipelineViewProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The workflow ID to fetch steps for */
  workflowId: number;
}

/**
 * Computes metrics for a workflow step based on its type.
 *
 * @param step - The workflow step to compute metrics for
 * @returns Metrics object with type-specific data
 */
function computeStepMetrics(step: WorkflowStep): StepMetrics {
  const stepType = step.stepType as PipelineStepType;

  switch (stepType) {
    case 'clarification': {
      const output = step.outputStructured as ClarificationStepOutput | null;
      if (!output) {
        return {};
      }
      // Count answered questions - check if answer exists and has content based on type
      const answeredCount = output.answers
        ? Object.values(output.answers).filter((answer) => {
            if (!answer) return false;
            switch (answer.type) {
              case 'checkbox':
                return answer.selected.length > 0;
              case 'radio':
                return answer.selected.length > 0;
              case 'text':
                return answer.text.length > 0;
              default:
                return false;
            }
          }).length
        : 0;
      return {
        clarification: {
          answeredCount,
          skipped: output.skipped,
          totalCount: output.questions?.length,
        },
      };
    }

    case 'discovery': {
      // Discovery metrics would come from discoveredFiles table
      // For now, return placeholder - will be enhanced when discovery data is available
      return {
        discovery: {
          includedCount: 0,
        },
      };
    }

    case 'planning': {
      // Planning metrics would come from implementationPlanSteps table
      // For now, return placeholder - will be enhanced when planning data is available
      return {
        planning: {
          taskCount: 0,
        },
      };
    }

    default:
      return {};
  }
}

/**
 * Maps PipelineStepStatus to VerticalConnectorState.
 */
function deriveConnectorState(status: PipelineStepStatus): VerticalConnectorState {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'running':
      return 'active';
    default:
      return 'pending';
  }
}

/**
 * Derives the visual step state from a database step status.
 *
 * Maps:
 * - 'pending' -> 'pending'
 * - 'running', 'paused', 'editing' -> 'running'
 * - 'completed', 'failed', 'skipped' -> 'completed'
 *
 * @param status - The database step status
 * @returns The visual state for rendering
 */
function deriveStepState(status?: string): PipelineStepStatus {
  if (!status) {
    return 'pending';
  }

  if (RUNNING_STATUSES.includes(status as (typeof RUNNING_STATUSES)[number])) {
    return 'running';
  }

  if (COMPLETED_STATUSES.includes(status as (typeof COMPLETED_STATUSES)[number])) {
    return 'completed';
  }

  return 'pending';
}

/**
 * Sorts workflow steps by their stepNumber in ascending order.
 *
 * @param steps - Array of workflow steps to sort
 * @returns New array of steps sorted by stepNumber
 */
function sortStepsByNumber(steps: Array<WorkflowStep>): Array<WorkflowStep> {
  return [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
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
  const [submittingStepId, setSubmittingStepId] = useState<null | number>(null);
  const [clarificationState, setClarificationState] = useState<ClarificationSessionState>(INITIAL_CLARIFICATION_STATE);
  const [clarificationAction, setClarificationAction] = useState<null | { stepId: number; type: 'more' | 'rerun' }>(
    null
  );
  const clarificationStartedRef = useRef<null | number>(null);
  const [refinementState, setRefinementState] = useState<RefinementSessionState>(INITIAL_REFINEMENT_STATE);
  const refinementStartedRef = useRef<null | number>(null);

  const { data: steps, isLoading: isLoadingSteps } = useStepsByWorkflow(workflowId);
  const { data: workflow, isLoading: isLoadingWorkflow } = useWorkflow(workflowId);
  const { agentId: defaultAgentId } = useDefaultClarificationAgent();
  const { agentId: defaultRefinementAgentId } = useDefaultRefinementAgent();

  // Get repositories for this workflow's project to find the primary repository path
  const { data: repositories } = useRepositoriesByProject(workflow?.projectId ?? 0);
  const primaryRepository = useMemo(
    () => repositories?.find((r) => r.setAsDefaultAt !== null) ?? repositories?.[0],
    [repositories]
  );

  const updateStep = useUpdateStep();
  const completeStep = useCompleteStep();
  const startStep = useStartStep();
  const skipStep = useSkipStep();
  const cancelRefinement = useCancelRefinement();
  const regenerateRefinement = useRegenerateRefinement();

  const { expandedStepId, toggleStep } = usePipelineStore();

  // Find the active clarification step to get its agentId
  const activeClarificationStep = useMemo(() => {
    if (!steps) return null;
    return steps.find((step) => step.stepType === 'clarification' && deriveStepState(step.status) === 'running');
  }, [steps]);

  // Find the active refinement step
  const activeRefinementStep = useMemo(() => {
    if (!steps) return null;
    return steps.find((step) => step.stepType === 'refinement' && deriveStepState(step.status) === 'running');
  }, [steps]);

  // Find the active discovery step
  const activeDiscoveryStep = useMemo(() => {
    if (!steps) return null;
    return steps.find((step) => step.stepType === 'discovery' && deriveStepState(step.status) === 'running');
  }, [steps]);

  // Get agent details for the clarification step (either from step.agentId or default)
  const clarificationAgentId = activeClarificationStep?.agentId ?? defaultAgentId;
  const { data: clarificationAgent } = useAgent(clarificationAgentId ?? 0);

  // Get discovery agent for file discovery step
  const { data: agents } = useAgents();
  const discoveryAgent = useMemo(() => agents?.find((a) => a.name === 'file-discovery-agent'), [agents]);
  const discoveryAgentId = discoveryAgent?.id ?? 1;

  // Get refinement agent (from step.agentId or default setting)
  const refinementAgentId = activeRefinementStep?.agentId ?? defaultRefinementAgentId;
  const refinementAgent = useMemo(() => agents?.find((a) => a.id === refinementAgentId), [agents, refinementAgentId]);

  // Get refinement step data for discovery workspace
  const refinementStep = useMemo(() => steps?.find((s) => s.stepType === 'refinement'), [steps]);
  const refinedFeatureRequest = refinementStep?.outputText ?? workflow?.featureRequest ?? '';
  const refinementUpdatedAt = refinementStep?.updatedAt;

  // Get completed clarification step for refinement context
  const completedClarificationStep = useMemo(() => {
    if (!steps) return null;
    return steps.find((step) => step.stepType === 'clarification' && deriveStepState(step.status) === 'completed');
  }, [steps]);
  const clarificationOutputForRefinement = useMemo(() => {
    if (!completedClarificationStep) return null;
    return completedClarificationStep.outputStructured as ClarificationStepOutput | null;
  }, [completedClarificationStep]);

  // Repository path for discovery
  const repositoryPath = primaryRepository?.path ?? '';

  const sortedSteps = useMemo(() => (steps ? sortStepsByNumber(steps) : []), [steps]);
  const pauseBehavior = workflow?.pauseBehavior ?? 'auto_pause';
  const activeClarificationStepId = activeClarificationStep?.id ?? null;
  const activeRefinementStepId = activeRefinementStep?.id ?? null;
  const activeDiscoveryStepId = activeDiscoveryStep?.id ?? null;
  const hasRunningStep = useMemo(
    () => sortedSteps.some((step) => deriveStepState(step.status) === 'running'),
    [sortedSteps]
  );
  const activeClarificationOutput = useMemo(() => {
    if (!activeClarificationStep) return null;
    return activeClarificationStep.outputStructured as ClarificationStepOutput | null;
  }, [activeClarificationStep]);
  const isClarificationWorkspaceActive = Boolean(activeClarificationStepId);
  const isRefinementWorkspaceActive = Boolean(activeRefinementStepId);
  const isDiscoveryWorkspaceActive = Boolean(activeDiscoveryStepId);
  const visibleSteps = useMemo(() => {
    const activeStepIds = [activeClarificationStepId, activeRefinementStepId, activeDiscoveryStepId].filter(Boolean);
    if (activeStepIds.length === 0) return sortedSteps;
    return sortedSteps.filter((step) => !activeStepIds.includes(step.id));
  }, [sortedSteps, activeClarificationStepId, activeRefinementStepId, activeDiscoveryStepId]);

  // Calculate progress metrics
  const completedCount = useMemo(
    () => sortedSteps.filter((step) => deriveStepState(step.status) === 'completed').length,
    [sortedSteps]
  );

  // Find current running step for progress bar title
  const currentStep = useMemo(
    () => sortedSteps.find((step) => deriveStepState(step.status) === 'running'),
    [sortedSteps]
  );

  const handleToggleStep = useCallback(
    (stepId: number) => {
      toggleStep(stepId);
    },
    [toggleStep]
  );

  const handleStartStep = useCallback(
    async (stepId: number) => {
      try {
        await startStep.mutateAsync(stepId);
      } catch (error) {
        console.error('Failed to start step:', error);
      }
    },
    [startStep]
  );

  const formatClarificationContext = useCallback((output: ClarificationStepOutput | null): null | string => {
    if (!output?.questions?.length || !output.answers) {
      return null;
    }

    const lines: Array<string> = [];

    output.questions.forEach((question, index) => {
      const answer = output.answers?.[String(index)];
      if (!answer) {
        return;
      }

      // Extract the selected value(s) based on answer type
      let answerText: string;
      if (answer.type === 'radio') {
        answerText = answer.selected;
        if (answer.other) {
          answerText = `Other: ${answer.other}`;
        }
      } else if (answer.type === 'checkbox') {
        answerText = answer.selected.join(', ');
        if (answer.other) {
          answerText += `, Other: ${answer.other}`;
        }
      } else {
        answerText = answer.text;
      }

      lines.push(`${index + 1}. ${question.header}`);
      lines.push(`Question: ${question.question}`);

      // Try to find the option description if it's a radio/checkbox answer
      if ((answer.type === 'radio' || answer.type === 'checkbox') && question.options) {
        const selectedOption = question.options.find((option) => option.label === answer.selected);
        if (selectedOption?.description) {
          lines.push(`Answer: ${answerText} - ${selectedOption.description}`);
        } else {
          lines.push(`Answer: ${answerText}`);
        }
      } else {
        lines.push(`Answer: ${answerText}`);
      }

      lines.push('');
    });

    const trimmed = lines.join('\n').trim();
    return trimmed.length > 0 ? trimmed : null;
  }, []);

  const resetClarificationStep = useCallback(
    async (step: WorkflowStep, action: 'more' | 'rerun', inputText: null | string) => {
      setClarificationAction({ stepId: step.id, type: action });
      setClarificationState(INITIAL_CLARIFICATION_STATE);
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
    [formatClarificationContext, resetClarificationStep]
  );

  /**
   * Handles clarification form submission by merging answers into outputStructured
   * and transitioning the step to completed status.
   */
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

  /**
   * Handles skipping clarification by transitioning the step to skipped status.
   */
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

  /**
   * Handles when clarification questions are ready from the streaming component.
   */
  const handleQuestionsReady = useCallback(
    async (questions: Array<ClarificationQuestion>) => {
      if (!activeClarificationStepId) return;

      // Normalize questions to ensure they have required fields
      // Type mismatch between electron.d.ts (old) and lib/validations/clarification.ts (new)
      const normalizedQuestions: Array<ClarificationQuestion> = questions.map((q) => {
        const questionType = (q as unknown as Record<string, unknown>).questionType ?? 'radio';

        return {
          ...q,
          allowOther: questionType === 'text' ? false : true,
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

      // Update local state to stop streaming phase
      setClarificationState((prev) => ({
        ...prev,
        isStreaming: false,
        phase: 'waiting_for_user',
      }));
    },
    [activeClarificationStepId, updateStep]
  );

  /**
   * Handles when clarification determines skip is appropriate.
   */
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
      setClarificationState(INITIAL_CLARIFICATION_STATE);
      clarificationStartedRef.current = null;
    },
    [activeClarificationStepId, updateStep, skipStep]
  );

  /**
   * Handles clarification errors from the streaming component.
   */
  const handleClarificationError = useCallback((error: string) => {
    setClarificationState((prev) => ({
      ...prev,
      error,
      isStreaming: false,
      phase: 'error',
    }));
  }, []);

  /**
   * Handles cancellation of clarification from the streaming component.
   */
  const handleClarificationCancel = useCallback(async () => {
    // Call the skip IPC to cancel the session
    if (typeof window !== 'undefined' && window.electronAPI?.clarification) {
      const sessionId = clarificationState.sessionId;
      if (sessionId) {
        await window.electronAPI.clarification.skip(sessionId, 'User cancelled');
      }
    }

    // Reset state
    setClarificationState(INITIAL_CLARIFICATION_STATE);
    clarificationStartedRef.current = null;
  }, [clarificationState.sessionId]);

  /**
   * Handles completion of the discovery step.
   * Transitions the step to completed status.
   */
  const handleDiscoveryComplete = useCallback(async () => {
    if (!activeDiscoveryStepId) return;

    try {
      await completeStep.mutateAsync({ id: activeDiscoveryStepId });
    } catch (error) {
      console.error('Failed to complete discovery step:', error);
    }
  }, [activeDiscoveryStepId, completeStep]);

  /**
   * Formats clarification Q&A pairs into structured context for refinement.
   * Returns an object with questions, answers, and optional assessment.
   */
  const buildClarificationContextForRefinement = useCallback(
    (
      output: ClarificationStepOutput | null
    ): null | {
      answers: Record<string, string>;
      assessment?: { reason: string; score: number };
      questions: Array<{ header: string; options: Array<{ description: string; label: string }>; question: string }>;
    } => {
      if (!output?.questions?.length || !output.answers) {
        return null;
      }

      const answers: Record<string, string> = {};
      const questions = output.questions.map((q, idx) => {
        const answer = output.answers?.[String(idx)];
        let answerText = '';

        if (answer) {
          if (answer.type === 'radio') {
            answerText = answer.other ? `Other: ${answer.other}` : answer.selected;
          } else if (answer.type === 'checkbox') {
            answerText = answer.selected.join(', ');
            if (answer.other) {
              answerText += `, Other: ${answer.other}`;
            }
          } else {
            answerText = answer.text;
          }
        }

        answers[String(idx)] = answerText;

        return {
          header: q.header,
          options: q.options ?? [],
          question: q.question,
        };
      });

      return { answers, questions };
    },
    []
  );

  /**
   * Formats clarification Q&A pairs into a human-readable string for display.
   */
  const formatClarificationContextForDisplay = useCallback((output: ClarificationStepOutput | null): null | string => {
    if (!output?.questions?.length || !output.answers) {
      return null;
    }

    const lines: Array<string> = [];

    output.questions.forEach((question, index) => {
      const answer = output.answers?.[String(index)];
      if (!answer) {
        return;
      }

      let answerText: string;
      if (answer.type === 'radio') {
        answerText = answer.other ? `Other: ${answer.other}` : answer.selected;
      } else if (answer.type === 'checkbox') {
        answerText = answer.selected.join(', ');
        if (answer.other) {
          answerText += `, Other: ${answer.other}`;
        }
      } else {
        answerText = answer.text;
      }

      lines.push(`${index + 1}. ${question.header}`);
      lines.push(`Question: ${question.question}`);
      lines.push(`Answer: ${answerText}`);
      lines.push('');
    });

    const trimmed = lines.join('\n').trim();
    return trimmed.length > 0 ? trimmed : null;
  }, []);

  /**
   * Handles saving refined text to the step output.
   */
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
        setRefinementState(INITIAL_REFINEMENT_STATE);
        refinementStartedRef.current = null;
      } catch (error) {
        console.error('Failed to save refinement:', error);
        setRefinementState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to save refinement',
        }));
      }
    },
    [activeRefinementStepId, completeStep, updateStep]
  );

  /**
   * Handles reverting to the original refined text.
   */
  const handleRevertRefinement = useCallback(() => {
    // Reset the refinement state text to original refined text
    setRefinementState((prev) => ({
      ...prev,
      refinedText: prev.refinedText, // Keep the original
    }));
  }, []);

  /**
   * Handles regenerating refinement with additional guidance.
   */
  const handleRegenerateRefinement = useCallback(
    async (guidance: string) => {
      if (!activeRefinementStepId) return;

      try {
        // Reset streaming state for regeneration
        setRefinementState((prev) => ({
          ...prev,
          activeTools: [],
          error: null,
          isStreaming: true,
          phase: 'loading_agent',
          text: '',
          thinking: [],
          toolHistory: [],
        }));

        await regenerateRefinement.mutateAsync({
          guidance,
          stepId: activeRefinementStepId,
          workflowId,
        });
      } catch (error) {
        console.error('Failed to regenerate refinement:', error);
        setRefinementState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to regenerate',
          isStreaming: false,
          phase: 'error',
        }));
      }
    },
    [activeRefinementStepId, regenerateRefinement, workflowId]
  );

  /**
   * Handles skipping the refinement step.
   */
  const handleSkipRefinement = useCallback(async () => {
    if (!activeRefinementStepId) return;

    setSubmittingStepId(activeRefinementStepId);
    try {
      // Skip the step (proceed with original feature request)
      await skipStep.mutateAsync(activeRefinementStepId);

      // Reset refinement state
      setRefinementState(INITIAL_REFINEMENT_STATE);
      refinementStartedRef.current = null;
    } catch (error) {
      console.error('Failed to skip refinement:', error);
    } finally {
      setSubmittingStepId(null);
    }
  }, [activeRefinementStepId, skipStep]);

  /**
   * Handles cancelling the active refinement session.
   */
  const handleCancelRefinement = useCallback(async () => {
    if (!refinementState.sessionId || !activeRefinementStepId) return;

    try {
      await cancelRefinement.mutateAsync({
        sessionId: refinementState.sessionId,
        stepId: activeRefinementStepId,
        workflowId,
      });

      // Reset state
      setRefinementState(INITIAL_REFINEMENT_STATE);
      refinementStartedRef.current = null;
    } catch (error) {
      console.error('Failed to cancel refinement:', error);
    }
  }, [activeRefinementStepId, cancelRefinement, refinementState.sessionId, workflowId]);

  /**
   * Handles refinement errors.
   */
  const handleRefinementError = useCallback((error: string) => {
    setRefinementState((prev) => ({
      ...prev,
      error,
      isStreaming: false,
      phase: 'error',
    }));
  }, []);

  // Effect to start clarification when a clarification step becomes active
  useEffect(() => {
    const isStepRunning = activeClarificationStep && deriveStepState(activeClarificationStep.status) === 'running';

    const isAlreadyStarted = clarificationStartedRef.current === activeClarificationStep?.id;
    const hasQuestions =
      activeClarificationStep?.outputStructured &&
      (activeClarificationStep.outputStructured as ClarificationStepOutput | null)?.questions?.length;

    // Don't start if already started, not running, or questions already exist
    if (!isStepRunning || isAlreadyStarted || hasQuestions) {
      return;
    }

    // Need repository path and workflow feature request
    if (!primaryRepository?.path || !workflow?.featureRequest) {
      return;
    }

    const startClarification = async () => {
      if (typeof window === 'undefined' || !window.electronAPI?.clarification) {
        return;
      }

      // Mark as started
      clarificationStartedRef.current = activeClarificationStep.id;

      // Set initial streaming state
      setClarificationState({
        activeTools: [],
        agentName: clarificationAgent?.displayName ?? clarificationAgent?.name ?? 'Clarification Agent',
        error: null,
        extendedThinkingElapsedMs: undefined,
        isStreaming: true,
        maxThinkingTokens: clarificationAgent?.maxThinkingTokens ?? null,
        outcome: null,
        phase: 'loading_agent',
        sessionId: null,
        stepId: activeClarificationStep.id,
        text: '',
        thinking: [],
        toolHistory: [],
      });

      // Subscribe to streaming events BEFORE starting
      const unsubscribe = window.electronAPI.clarification.onStreamMessage((message) => {
        // Update state based on message type
        switch (message.type) {
          case 'extended_thinking_heartbeat':
            setClarificationState((prev) => ({
              ...prev,
              extendedThinkingElapsedMs: message.elapsedMs,
              maxThinkingTokens: message.maxThinkingTokens,
              phase: 'executing_extended_thinking',
            }));
            break;

          case 'phase_change':
            setClarificationState((prev) => ({
              ...prev,
              phase: message.phase,
            }));
            break;

          case 'text_delta':
            setClarificationState((prev) => ({
              ...prev,
              text: prev.text + message.delta,
            }));
            break;

          case 'thinking_delta':
            setClarificationState((prev) => {
              const thinking = [...prev.thinking];
              thinking[message.blockIndex] = (thinking[message.blockIndex] || '') + message.delta;
              return { ...prev, thinking };
            });
            break;

          case 'thinking_start':
            setClarificationState((prev) => ({
              ...prev,
              thinking: [...prev.thinking, ''],
            }));
            break;

          case 'tool_start':
            setClarificationState((prev) => {
              const newTool: ActiveTool = {
                toolInput: message.toolInput,
                toolName: message.toolName,
                toolUseId: message.toolUseId,
              };
              return {
                ...prev,
                activeTools: [...prev.activeTools, newTool],
                toolHistory: [...prev.toolHistory, newTool],
              };
            });
            break;
          case 'tool_stop':
            setClarificationState((prev) => ({
              ...prev,
              activeTools: prev.activeTools.filter((t) => t.toolUseId !== message.toolUseId),
            }));
            break;

          case 'tool_update':
            setClarificationState((prev) => {
              const updatedTool: ActiveTool = {
                toolInput: message.toolInput,
                toolName: message.toolName,
                toolUseId: message.toolUseId,
              };

              // Update activeTools
              const activeIndex = prev.activeTools.findIndex((tool) => tool.toolUseId === message.toolUseId);
              let newActiveTools: Array<ActiveTool>;
              if (activeIndex === -1) {
                newActiveTools = [...prev.activeTools, updatedTool];
              } else {
                newActiveTools = [...prev.activeTools];
                newActiveTools[activeIndex] = updatedTool;
              }

              // Update toolHistory
              const historyIndex = prev.toolHistory.findIndex((tool) => tool.toolUseId === message.toolUseId);
              let newToolHistory: Array<ActiveTool>;
              if (historyIndex === -1) {
                newToolHistory = [...prev.toolHistory, updatedTool];
              } else {
                newToolHistory = [...prev.toolHistory];
                newToolHistory[historyIndex] = updatedTool;
              }

              return {
                ...prev,
                activeTools: newActiveTools,
                toolHistory: newToolHistory,
              };
            });
            break;
        }
      });

      try {
        const clarificationContext = activeClarificationStep.inputText?.trim();
        const featureRequest = clarificationContext
          ? `${workflow.featureRequest}\n\nPrevious clarification answers:\n${clarificationContext}`
          : workflow.featureRequest;

        // Start the clarification session
        const outcome = await window.electronAPI.clarification.start({
          featureRequest,
          repositoryPath: primaryRepository.path,
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
                allowOther: questionType === 'text' ? false : true,
                questionType,
              };
            }) as Array<ClarificationQuestion>,
            type: 'QUESTIONS_FOR_USER',
          };
        } else {
          normalizedOutcome = outcome as ClarificationOutcome;
        }

        // Update state with outcome
        setClarificationState((prev) => ({
          ...prev,
          isStreaming: false,
          outcome: normalizedOutcome,
          phase: outcome.type === 'QUESTIONS_FOR_USER' || outcome.type === 'SKIP_CLARIFICATION' ? 'complete' : 'error',
        }));

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

          // Update local state to show the form
          setClarificationState((prev) => ({
            ...prev,
            phase: 'waiting_for_user',
          }));
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
          setClarificationState(INITIAL_CLARIFICATION_STATE);
          clarificationStartedRef.current = null;
        }
      } catch (error) {
        // Cleanup subscription on error
        unsubscribe();

        setClarificationState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          isStreaming: false,
          phase: 'error',
        }));
      }
    };

    void startClarification();
  }, [
    activeClarificationStep,
    clarificationAgent,
    primaryRepository?.path,
    skipStep,
    updateStep,
    workflow?.featureRequest,
    workflowId,
  ]);

  // Reset clarification state when step changes or completes
  useEffect(() => {
    if (!activeClarificationStep && clarificationState.stepId !== null) {
      setClarificationState(INITIAL_CLARIFICATION_STATE);
      clarificationStartedRef.current = null;
    }
  }, [activeClarificationStep, clarificationState.stepId]);

  // Effect to start refinement when a refinement step becomes active
  useEffect(() => {
    const isStepRunning = activeRefinementStep && deriveStepState(activeRefinementStep.status) === 'running';
    const isAlreadyStarted = refinementStartedRef.current === activeRefinementStep?.id;
    const hasRefinedText = activeRefinementStep?.outputText;

    // Don't start if already started, not running, or refinement already complete
    if (!isStepRunning || isAlreadyStarted || hasRefinedText) {
      return;
    }

    // Need repository path, workflow feature request, and clarification context
    if (!primaryRepository?.path || !workflow?.featureRequest) {
      return;
    }

    // Get clarification context (required for refinement)
    const clarificationContext = buildClarificationContextForRefinement(clarificationOutputForRefinement);

    // If clarification was skipped or has no Q&A, we can still proceed with basic refinement
    // but typically refinement uses clarification answers

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

      // Set initial streaming state
      setRefinementState({
        activeTools: [],
        agentName: refinementAgent?.displayName ?? refinementAgent?.name ?? 'Refinement Agent',
        error: null,
        extendedThinkingElapsedMs: undefined,
        isStreaming: true,
        maxThinkingTokens: refinementAgent?.maxThinkingTokens ?? null,
        phase: 'loading_agent',
        refinedText: null,
        sessionId: null,
        stepId: activeRefinementStep.id,
        text: '',
        thinking: [],
        toolHistory: [],
      });

      // Subscribe to streaming events BEFORE starting
      const unsubscribe = window.electronAPI.refinement.onStreamMessage((message: RefinementStreamMessage) => {
        switch (message.type) {
          case 'extended_thinking_heartbeat':
            setRefinementState((prev) => ({
              ...prev,
              extendedThinkingElapsedMs: message.elapsedMs,
              maxThinkingTokens: message.maxThinkingTokens,
              phase: 'executing_extended_thinking',
            }));
            break;

          case 'phase_change':
            setRefinementState((prev) => ({
              ...prev,
              phase: message.phase,
            }));
            break;

          case 'text_delta':
            setRefinementState((prev) => ({
              ...prev,
              text: prev.text + message.delta,
            }));
            break;

          case 'thinking_delta':
            setRefinementState((prev) => {
              const thinking = [...prev.thinking];
              thinking[message.blockIndex] = (thinking[message.blockIndex] || '') + message.delta;
              return { ...prev, thinking };
            });
            break;

          case 'thinking_start':
            setRefinementState((prev) => ({
              ...prev,
              thinking: [...prev.thinking, ''],
            }));
            break;

          case 'tool_start':
            setRefinementState((prev) => {
              const newTool: RefinementActiveTool = {
                id: message.toolUseId,
                name: message.toolName,
                startedAt: new Date(),
                toolInput: message.toolInput,
              };
              return {
                ...prev,
                activeTools: [...prev.activeTools, newTool],
                toolHistory: [...prev.toolHistory, newTool],
              };
            });
            break;

          case 'tool_stop':
            setRefinementState((prev) => ({
              ...prev,
              activeTools: prev.activeTools.filter((t) => t.id !== message.toolUseId),
            }));
            break;

          case 'tool_update':
            setRefinementState((prev) => {
              const updatedTool: RefinementActiveTool = {
                id: message.toolUseId,
                name: message.toolName,
                startedAt: new Date(),
                toolInput: message.toolInput,
              };

              const activeIndex = prev.activeTools.findIndex((tool) => tool.id === message.toolUseId);
              let newActiveTools: Array<RefinementActiveTool>;
              if (activeIndex === -1) {
                newActiveTools = [...prev.activeTools, updatedTool];
              } else {
                newActiveTools = [...prev.activeTools];
                newActiveTools[activeIndex] = updatedTool;
              }

              const historyIndex = prev.toolHistory.findIndex((tool) => tool.id === message.toolUseId);
              let newToolHistory: Array<RefinementActiveTool>;
              if (historyIndex === -1) {
                newToolHistory = [...prev.toolHistory, updatedTool];
              } else {
                newToolHistory = [...prev.toolHistory];
                newToolHistory[historyIndex] = updatedTool;
              }

              return {
                ...prev,
                activeTools: newActiveTools,
                toolHistory: newToolHistory,
              };
            });
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
          featureRequest: workflow.featureRequest,
          repositoryPath: primaryRepository.path,
          stepId: activeRefinementStep.id,
          timeoutSeconds: 180,
          workflowId,
        });

        // Cleanup subscription
        unsubscribe();

        // Handle outcome
        const { outcome } = result;
        if (outcome.type === 'SUCCESS') {
          const { refinedText } = outcome;
          // Update state with refined text
          setRefinementState((prev) => ({
            ...prev,
            isStreaming: false,
            phase: 'complete',
            refinedText,
          }));

          // Update step output
          await updateStep.mutateAsync({
            data: { outputText: refinedText },
            id: activeRefinementStep.id,
          });
        } else if (outcome.type === 'CANCELLED') {
          const errorMsg = outcome.reason ?? 'Refinement was cancelled';
          setRefinementState((prev) => ({
            ...prev,
            error: errorMsg,
            isStreaming: false,
            phase: 'cancelled',
          }));
        } else if (outcome.type === 'TIMEOUT') {
          const errorMsg = `Refinement timed out after ${outcome.elapsedSeconds}s: ${outcome.error}`;
          setRefinementState((prev) => ({
            ...prev,
            error: errorMsg,
            isStreaming: false,
            phase: 'timeout',
          }));
        } else if (outcome.type === 'ERROR') {
          const errorMsg = outcome.error;
          setRefinementState((prev) => ({
            ...prev,
            error: errorMsg,
            isStreaming: false,
            phase: 'error',
          }));
        }
      } catch (error) {
        // Cleanup subscription on error
        unsubscribe();

        setRefinementState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          isStreaming: false,
          phase: 'error',
        }));
      }
    };

    void startRefinementProcess();
  }, [
    activeRefinementStep,
    buildClarificationContextForRefinement,
    clarificationOutputForRefinement,
    primaryRepository?.path,
    refinementAgent,
    refinementAgentId,
    updateStep,
    workflow?.featureRequest,
    workflowId,
  ]);

  // Reset refinement state when step changes or completes
  useEffect(() => {
    if (!activeRefinementStep && refinementState.stepId !== null) {
      setRefinementState(INITIAL_REFINEMENT_STATE);
      refinementStartedRef.current = null;
    }
  }, [activeRefinementStep, refinementState.stepId]);

  const isLoading = isLoadingSteps || isLoadingWorkflow;
  const isStepsEmpty = visibleSteps.length === 0;
  const isAnyWorkspaceActive =
    isClarificationWorkspaceActive || isRefinementWorkspaceActive || isDiscoveryWorkspaceActive;
  const _shouldShowEmptyState = isStepsEmpty && !isLoading && !isAnyWorkspaceActive && Boolean(workflow);
  const _hasQuestionsToSubmit = activeClarificationOutput && activeClarificationOutput.questions?.length;
  const clarificationContextForDisplay = formatClarificationContextForDisplay(clarificationOutputForRefinement);

  return (
    <div className={cn('flex h-full flex-col', className)} ref={ref} {...props}>
      {/* Sticky Progress Bar */}
      {sortedSteps.length > 0 && (
        <div
          className={'sticky top-0 z-10 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80'}
        >
          <PipelineProgressBar
            completedSteps={completedCount}
            currentStepTitle={currentStep?.title}
            totalSteps={sortedSteps.length}
          />
        </div>
      )}

      {/* Vertical Pipeline Container */}
      <div className={'flex flex-1 flex-col items-center overflow-y-auto py-6'}>
        {/* Clarification Workspace */}
        {isClarificationWorkspaceActive && activeClarificationStep && (
          <div className={'w-full max-w-6xl px-4'}>
            <ClarificationWorkspace
              existingAnswers={activeClarificationOutput?.answers}
              extendedThinkingElapsedMs={clarificationState.extendedThinkingElapsedMs}
              featureRequest={workflow?.featureRequest}
              isStreaming={clarificationState.isStreaming}
              isSubmitting={submittingStepId === activeClarificationStep.id}
              onSkip={() => handleSkipClarification(activeClarificationStep.id)}
              onSubmit={
                _hasQuestionsToSubmit
                  ? (answers) =>
                      handleSubmitClarification(activeClarificationStep.id, activeClarificationOutput, answers)
                  : undefined
              }
              phase={clarificationState.phase}
              questions={activeClarificationOutput?.questions ?? []}
              streamingProps={{
                activeTools: clarificationState.activeTools,
                agentName: clarificationState.agentName,
                error: clarificationState.error,
                extendedThinkingElapsedMs: clarificationState.extendedThinkingElapsedMs,
                isStreaming: clarificationState.isStreaming,
                maxThinkingTokens: clarificationState.maxThinkingTokens,
                onCancel: handleClarificationCancel,
                onClarificationError: handleClarificationError,
                onQuestionsReady: handleQuestionsReady,
                onSkipReady: handleSkipReady,
                outcome: clarificationState.outcome,
                phase: clarificationState.phase,
                sessionId: clarificationState.sessionId,
                text: clarificationState.text,
                thinking: clarificationState.thinking,
                toolHistory: clarificationState.toolHistory,
              }}
            />
          </div>
        )}

        {/* Refinement Workspace */}
        {isRefinementWorkspaceActive && activeRefinementStep && (
          <div className={'w-full max-w-6xl px-4'}>
            <RefinementWorkspace
              clarificationContext={clarificationContextForDisplay}
              extendedThinkingElapsedMs={refinementState.extendedThinkingElapsedMs}
              featureRequest={workflow?.featureRequest ?? null}
              isStreaming={refinementState.isStreaming}
              isSubmitting={submittingStepId === activeRefinementStep.id}
              onRegenerate={handleRegenerateRefinement}
              onRevert={handleRevertRefinement}
              onSave={handleSaveRefinement}
              onSkip={handleSkipRefinement}
              phase={refinementState.phase}
              refinedText={refinementState.refinedText}
              streamingProps={{
                activeTools: refinementState.activeTools.map((tool) => ({
                  toolInput: tool.toolInput,
                  toolName: tool.name,
                  toolUseId: tool.id,
                })),
                agentName: refinementState.agentName,
                error: refinementState.error,
                extendedThinkingElapsedMs: refinementState.extendedThinkingElapsedMs,
                isStreaming: refinementState.isStreaming,
                maxThinkingTokens: refinementState.maxThinkingTokens,
                onCancel: handleCancelRefinement,
                onRefinementError: handleRefinementError,
                phase: refinementState.phase,
                text: refinementState.text,
                thinking: refinementState.thinking,
                toolHistory: refinementState.toolHistory.map((tool) => ({
                  toolInput: tool.toolInput,
                  toolName: tool.name,
                  toolUseId: tool.id,
                })),
              }}
            />
          </div>
        )}

        {/* Discovery Workspace */}
        {isDiscoveryWorkspaceActive && activeDiscoveryStep && (
          <div className={'w-full max-w-6xl px-4'}>
            <DiscoveryWorkspace
              agentId={discoveryAgentId}
              discoveryCompletedAt={activeDiscoveryStep.completedAt}
              discoveryStartedAt={activeDiscoveryStep.startedAt}
              onComplete={handleDiscoveryComplete}
              refinedFeatureRequest={refinedFeatureRequest}
              refinementUpdatedAt={refinementUpdatedAt}
              repositoryPath={repositoryPath}
              stepId={activeDiscoveryStep.id}
              workflowId={workflowId}
            />
          </div>
        )}

        <div
          aria-label={'Workflow pipeline'}
          className={cn('w-full px-4', isAnyWorkspaceActive ? 'mt-10 max-w-4xl' : 'max-w-4xl')}
          role={'list'}
        >
          {/* Empty State - Workflow created but no steps yet */}
          {_shouldShowEmptyState && workflow && <WorkflowEmptyState workflow={workflow} />}

          {/* Pipeline Steps */}
          {visibleSteps.map((step, index) => {
            const stepState = deriveStepState(step.status);
            const connectorState = deriveConnectorState(stepState);
            const isExpanded = expandedStepId === step.id;
            const isFirstStep = index === 0;
            const isLastStep = index === visibleSteps.length - 1;

            // Get the step type safely, defaulting to DEFAULT_STEP_TYPE if not a valid PipelineStepType
            const stepType = (step.stepType as PipelineStepType) || DEFAULT_STEP_TYPE;

            // Cast outputStructured from unknown to ClarificationStepOutput for clarification steps
            const isClarificationStep = stepType === 'clarification';
            const outputStructured = isClarificationStep
              ? (step.outputStructured as ClarificationStepOutput | null)
              : null;

            // Determine if clarification handlers can be provided
            const isSubmittable = isClarificationStep && outputStructured;

            const canStartStep = (() => {
              if (stepState !== 'pending' || hasRunningStep) {
                return false;
              }

              if (pauseBehavior === 'continuous') {
                return false;
              }

              if (pauseBehavior === 'gates_only' && step.stepType !== 'quality_gate') {
                return false;
              }

              const previousStep = sortedSteps.find((s) => s.stepNumber === step.stepNumber - 1);
              if (!previousStep) {
                return true;
              }

              return deriveStepState(previousStep.status) === 'completed';
            })();

            // Compute metrics for this step
            const metrics = computeStepMetrics(step);

            // Determine clarification streaming props for this step
            const isActiveClarification = isClarificationStep && clarificationState.stepId === step.id;
            const clarificationStreamingProps = isActiveClarification
              ? {
                  clarificationActiveTools: clarificationState.activeTools,
                  clarificationAgentName: clarificationState.agentName,
                  clarificationError: clarificationState.error,
                  clarificationOutcome: clarificationState.outcome,
                  clarificationPhase: clarificationState.phase,
                  clarificationSessionId: clarificationState.sessionId,
                  clarificationText: clarificationState.text,
                  clarificationThinking: clarificationState.thinking,
                  clarificationToolHistory: clarificationState.toolHistory,
                  extendedThinkingElapsedMs: clarificationState.extendedThinkingElapsedMs,
                  isClarificationStreaming: clarificationState.isStreaming,
                  maxThinkingTokens: clarificationState.maxThinkingTokens,
                  onClarificationCancel: handleClarificationCancel,
                  onClarificationError: handleClarificationError,
                  onQuestionsReady: handleQuestionsReady,
                  onSkipReady: handleSkipReady,
                }
              : {};

            const isGeneratingClarification =
              clarificationAction?.stepId === step.id && clarificationAction?.type === 'more';
            const isRerunningClarification =
              clarificationAction?.stepId === step.id && clarificationAction?.type === 'rerun';

            return (
              <div className={'relative mb-4 last:mb-0'} key={step.id} role={'listitem'}>
                {/* Vertical Connector */}
                <VerticalConnector
                  isFirst={isFirstStep}
                  isLast={isLastStep}
                  state={connectorState}
                  stepNumber={index + 1}
                />

                {/* Step Card */}
                <PipelineStep
                  aria-posinset={index + 1}
                  aria-setsize={visibleSteps.length}
                  canStart={canStartStep}
                  isExpanded={isExpanded}
                  isGeneratingClarification={isGeneratingClarification}
                  isRerunningClarification={isRerunningClarification}
                  isSubmitting={submittingStepId === step.id}
                  metrics={metrics}
                  onGenerateClarifications={
                    isClarificationStep ? () => handleGenerateClarifications(step, outputStructured) : undefined
                  }
                  onStart={canStartStep ? () => handleStartStep(step.id) : undefined}
                  onRerunClarification={isClarificationStep ? () => handleRerunClarification(step) : undefined}
                  onSkipStep={isClarificationStep ? () => handleSkipClarification(step.id) : undefined}
                  onSubmitClarification={
                    isSubmittable
                      ? (answers) => handleSubmitClarification(step.id, outputStructured, answers)
                      : undefined
                  }
                  onToggle={() => handleToggleStep(step.id)}
                  output={step.outputText ?? undefined}
                  outputStructured={outputStructured}
                  status={stepState}
                  stepType={stepType}
                  title={step.title}
                  {...clarificationStreamingProps}
                />
              </div>
            );
          })}

          {/* Loading State Indicator */}
          {isLoading && (
            <div className={'sr-only'} role={'status'}>
              Loading workflow steps...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
