import type { PipelineStepStatus, PipelineStepType } from '@/components/workflows/pipeline-step';
import type { StepMetrics } from '@/components/workflows/pipeline-step-metrics';
import type { VerticalConnectorState } from '@/components/workflows/vertical-connector';
import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';
import type { ClarificationStepOutput } from '@/lib/validations/clarification';

/**
 * Default step type used when step.stepType is not a valid PipelineStepType.
 */
export const DEFAULT_STEP_TYPE: PipelineStepType = 'clarification';

/**
 * Database step statuses that map to the 'running' visual state.
 */
export const RUNNING_STATUSES = ['running', 'paused', 'editing'] as const;

/**
 * Database step statuses that map to the 'completed' visual state.
 */
export const COMPLETED_STATUSES = ['completed', 'failed', 'skipped'] as const;

/**
 * Computes metrics for a workflow step based on its type.
 *
 * @param step - The workflow step to compute metrics for
 * @returns Metrics object with type-specific data
 */
export function computeStepMetrics(step: WorkflowStep): StepMetrics {
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
      return {
        discovery: {
          includedCount: 0,
        },
      };
    }

    case 'planning': {
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
export function deriveConnectorState(status: PipelineStepStatus): VerticalConnectorState {
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
export function deriveStepState(status?: string): PipelineStepStatus {
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
export function sortStepsByNumber(steps: Array<WorkflowStep>): Array<WorkflowStep> {
  return [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
}
