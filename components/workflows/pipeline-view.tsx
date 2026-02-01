'use client';

import type { ComponentPropsWithRef } from 'react';

import { Fragment, useCallback, useState } from 'react';

import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';
import type { ClarificationAnswers, ClarificationStepOutput } from '@/lib/validations/clarification';

import { useCompleteStep, useSkipStep, useStepsByWorkflow, useUpdateStep } from '@/hooks/queries/use-steps';
import { useWorkflow } from '@/hooks/queries/use-workflows';
import { usePipelineStore } from '@/lib/stores/pipeline-store';
import { cn } from '@/lib/utils';

import { PipelineConnector } from './pipeline-connector';
import { PipelineStep, type PipelineStepStatus, type PipelineStepType } from './pipeline-step';

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
 * Displays workflow steps fetched from the database with connectors between them.
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

  const sortedSteps = steps ? sortStepsByNumber(steps) : [];

  const handleToggleStep = (stepId: number) => {
    toggleStep(stepId);
  };

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
  const hasNoSteps = sortedSteps.length === 0;

  return (
    <div
      aria-label={'Workflow pipeline'}
      className={cn('flex items-center gap-4 overflow-x-auto py-4', className)}
      ref={ref}
      role={'list'}
      {...props}
    >
      {/* Empty State - Workflow created but no steps yet */}
      {hasNoSteps && !isLoading && (
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
        const isExpanded = expandedStepId === step.id;
        const isConnectorCompleted = stepState === 'completed';
        const isLastStep = index === sortedSteps.length - 1;

        // Get the step type safely, defaulting to 'clarification' if not a valid PipelineStepType
        const stepType = (step.stepType as PipelineStepType) || 'clarification';

        // Cast outputStructured from unknown to ClarificationStepOutput for clarification steps
        const isClarificationStep = stepType === 'clarification';
        const outputStructured = isClarificationStep
          ? (step.outputStructured as ClarificationStepOutput | null)
          : null;

        // Determine if clarification handlers can be provided
        const isSubmittable = isClarificationStep && outputStructured;

        return (
          <Fragment key={step.id}>
            {/* Step Card */}
            <div className={'min-w-64 shrink-0'} role={'listitem'}>
              <PipelineStep
                aria-posinset={index + 1}
                aria-setsize={sortedSteps.length}
                isExpanded={isExpanded}
                isSubmitting={submittingStepId === step.id}
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

            {/* Connector (not after last step) */}
            {!isLastStep && <PipelineConnector className={'min-w-8'} isCompleted={isConnectorCompleted} />}
          </Fragment>
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
