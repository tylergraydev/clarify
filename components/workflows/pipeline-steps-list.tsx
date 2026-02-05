'use client';

import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';
import type { Workflow } from '@/db/schema/workflows.schema';
import type { ClarificationStore } from '@/lib/stores/clarification-store';
import type { ClarificationStepOutput } from '@/lib/validations/clarification';
import type { ClarificationAnswers } from '@/lib/validations/clarification';

import { cn } from '@/lib/utils';
import {
  computeStepMetrics,
  DEFAULT_STEP_TYPE,
  deriveConnectorState,
  deriveStepState,
} from '@/lib/utils/pipeline-step-utils';

import { PipelineStep, type PipelineStepStatus, type PipelineStepType } from './pipeline-step';
import { VerticalConnector } from './vertical-connector';
import { WorkflowEmptyState } from './workflow-empty-state';

interface PipelineStepsListProps {
  /** Current clarification action in progress */
  clarificationAction: null | { stepId: number; type: 'more' | 'rerun' };
  /** The tracked clarification step ID */
  clarificationStepId: null | number;
  /** The clarification store state */
  clarificationStore: ClarificationStore;
  /** ID of the currently expanded step */
  expandedStepId: null | number;
  /** Whether any step is currently running */
  hasRunningStep: boolean;
  /** Whether any workspace is active */
  isAnyWorkspaceActive: boolean;
  /** Whether data is loading */
  isLoading: boolean;
  /** Handler for cancelling clarification */
  onClarificationCancel: () => Promise<void>;
  /** Handler for clarification errors */
  onClarificationError: (error: string) => void;
  /** Handler for generating more clarifications */
  onGenerateClarifications: (step: WorkflowStep, output: ClarificationStepOutput | null) => Promise<void>;
  /** Handler for when questions are ready from streaming */
  onQuestionsReady: (questions: Array<import('@/lib/validations/clarification').ClarificationQuestion>) => Promise<void>;
  /** Handler for rerunning clarification */
  onRerunClarification: (step: WorkflowStep) => Promise<void>;
  /** Handler for skipping clarification */
  onSkipClarification: (stepId: number) => Promise<void>;
  /** Handler for when skip is ready */
  onSkipReady: (reason: string) => Promise<void>;
  /** Handler for starting a step */
  onStartStep: (stepId: number) => Promise<void>;
  /** Handler for submitting clarification answers */
  onSubmitClarification: (
    stepId: number,
    currentOutput: ClarificationStepOutput,
    answers: ClarificationAnswers
  ) => Promise<void>;
  /** Handler for toggling step expansion */
  onToggleStep: (stepId: number) => void;
  /** Pause behavior from workflow */
  pauseBehavior: string;
  /** All sorted steps (for previousStep lookups) */
  sortedSteps: Array<WorkflowStep>;
  /** The submitting step ID for clarification */
  submittingStepId: null | number;
  /** Visible steps to render */
  visibleSteps: Array<WorkflowStep>;
  /** The workflow */
  workflow: null | undefined | Workflow;
}

/**
 * Renders the pipeline steps list with connectors and step cards.
 * Handles empty state, per-step state derivation, and step-specific handlers.
 */
export const PipelineStepsList = ({
  clarificationAction,
  clarificationStepId,
  clarificationStore,
  expandedStepId,
  hasRunningStep,
  isAnyWorkspaceActive,
  isLoading,
  onClarificationCancel,
  onClarificationError,
  onGenerateClarifications,
  onQuestionsReady,
  onRerunClarification,
  onSkipClarification,
  onSkipReady,
  onStartStep,
  onSubmitClarification,
  onToggleStep,
  pauseBehavior,
  sortedSteps,
  submittingStepId,
  visibleSteps,
  workflow,
}: PipelineStepsListProps) => {
  const isStepsEmpty = visibleSteps.length === 0;
  const shouldShowEmptyState = isStepsEmpty && !isLoading && !isAnyWorkspaceActive && Boolean(workflow);

  return (
    <div
      aria-label={'Workflow pipeline'}
      className={cn('w-full px-4', isAnyWorkspaceActive ? 'mt-10 max-w-4xl' : 'max-w-4xl')}
      role={'list'}
    >
      {/* Empty State - Workflow created but no steps yet */}
      {shouldShowEmptyState && workflow && <WorkflowEmptyState workflow={workflow} />}

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
        const isActiveClarification = isClarificationStep && clarificationStepId === step.id;
        const clarificationStreamingProps = isActiveClarification
          ? {
              clarificationActiveTools: clarificationStore.activeTools.map((tool) => ({
                toolInput: tool.toolInput,
                toolName: tool.name,
                toolUseId: tool.id,
              })),
              clarificationAgentName: clarificationStore.agentName,
              clarificationError: clarificationStore.error,
              clarificationOutcome: clarificationStore.outcome,
              clarificationPhase: clarificationStore.phase,
              clarificationSessionId: clarificationStore.sessionId,
              clarificationText: clarificationStore.text,
              clarificationThinking: clarificationStore.thinking,
              clarificationToolHistory: clarificationStore.toolHistory.map((tool) => ({
                toolInput: tool.toolInput,
                toolName: tool.name,
                toolUseId: tool.id,
              })),
              extendedThinkingElapsedMs: clarificationStore.extendedThinkingElapsedMs,
              isClarificationStreaming: clarificationStore.isStreaming,
              maxThinkingTokens: clarificationStore.maxThinkingTokens,
              onClarificationCancel,
              onClarificationError,
              onQuestionsReady,
              onSkipReady,
            }
          : {};

        const isGeneratingClarification =
          clarificationAction?.stepId === step.id && clarificationAction?.type === 'more';
        const isRerunningClarification =
          clarificationAction?.stepId === step.id && clarificationAction?.type === 'rerun';

        return (
          <div className={'relative mb-4 last:mb-0'} key={step.id} role={'listitem'}>
            {/* Vertical Connector */}
            <VerticalConnector isFirst={isFirstStep} isLast={isLastStep} state={connectorState} stepNumber={index + 1} />

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
                isClarificationStep ? () => onGenerateClarifications(step, outputStructured) : undefined
              }
              onRerunClarification={isClarificationStep ? () => onRerunClarification(step) : undefined}
              onSkipStep={isClarificationStep ? () => onSkipClarification(step.id) : undefined}
              onStart={canStartStep ? () => onStartStep(step.id) : undefined}
              onSubmitClarification={
                isSubmittable
                  ? (answers: ClarificationAnswers) => onSubmitClarification(step.id, outputStructured, answers)
                  : undefined
              }
              onToggle={() => onToggleStep(step.id)}
              output={step.outputText ?? undefined}
              outputStructured={outputStructured}
              status={stepState as PipelineStepStatus}
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
  );
};
