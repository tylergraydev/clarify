'use client';

import type { ComponentPropsWithRef } from 'react';

import { useCallback, useMemo, useState } from 'react';

import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';
import type { ClarificationAnswers, ClarificationStepOutput } from '@/lib/validations/clarification';

import { useCompleteStep, useSkipStep, useStepsByWorkflow, useUpdateStep } from '@/hooks/queries/use-steps';
import { useWorkflow } from '@/hooks/queries/use-workflows';
import { usePipelineStore } from '@/lib/stores/pipeline-store';
import { cn } from '@/lib/utils';

import type { StepMetrics } from './pipeline-step-metrics';

import { PipelineProgressBar } from './pipeline-progress-bar';
import { PipelineStep, type PipelineStepStatus, type PipelineStepType } from './pipeline-step';
import { VerticalConnector, type VerticalConnectorState } from './vertical-connector';

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
      const answeredCount = output.answers ? Object.values(output.answers).filter((v) => v && v.length > 0).length : 0;
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

  const { data: steps, isLoading: isLoadingSteps } = useStepsByWorkflow(workflowId);
  const { data: workflow, isLoading: isLoadingWorkflow } = useWorkflow(workflowId);

  const updateStep = useUpdateStep();
  const completeStep = useCompleteStep();
  const skipStep = useSkipStep();

  const { expandedStepId, toggleStep } = usePipelineStore();

  const sortedSteps = useMemo(() => (steps ? sortStepsByNumber(steps) : []), [steps]);

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
        await skipStep.mutateAsync(stepId);
      } finally {
        setSubmittingStepId(null);
      }
    },
    [skipStep]
  );

  const isLoading = isLoadingSteps || isLoadingWorkflow;
  const isWorkflowCreated = workflow?.status === 'created';
  const isStepsEmpty = sortedSteps.length === 0;

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
      <div
        aria-label={'Workflow pipeline'}
        className={'flex flex-1 flex-col items-center overflow-y-auto py-6'}
        role={'list'}
      >
        <div className={'w-full max-w-4xl px-4'}>
          {/* Empty State - Workflow created but no steps yet */}
          {isStepsEmpty && !isLoading && (
            <div className={'flex min-h-24 w-full items-center justify-center text-muted-foreground'} role={'listitem'}>
              {isWorkflowCreated ? (
                <p className={'text-sm'}>Workflow is ready. Start the workflow to create pipeline steps.</p>
              ) : (
                <p className={'text-sm'}>No steps available for this workflow.</p>
              )}
            </div>
          )}

          {/* Pipeline Steps */}
          {sortedSteps.map((step, index) => {
            const stepState = deriveStepState(step.status);
            const connectorState = deriveConnectorState(stepState);
            const isExpanded = expandedStepId === step.id;
            const isFirstStep = index === 0;
            const isLastStep = index === sortedSteps.length - 1;

            // Get the step type safely, defaulting to DEFAULT_STEP_TYPE if not a valid PipelineStepType
            const stepType = (step.stepType as PipelineStepType) || DEFAULT_STEP_TYPE;

            // Cast outputStructured from unknown to ClarificationStepOutput for clarification steps
            const isClarificationStep = stepType === 'clarification';
            const outputStructured = isClarificationStep
              ? (step.outputStructured as ClarificationStepOutput | null)
              : null;

            // Determine if clarification handlers can be provided
            const isSubmittable = isClarificationStep && outputStructured;

            // Compute metrics for this step
            const metrics = computeStepMetrics(step);

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
                  aria-setsize={sortedSteps.length}
                  isExpanded={isExpanded}
                  isSubmitting={submittingStepId === step.id}
                  metrics={metrics}
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
