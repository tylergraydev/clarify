'use client';

import type { ComponentPropsWithRef } from 'react';

import { FileText, Lightbulb, MessageSquare, Search } from 'lucide-react';
import { Fragment } from 'react';

import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';

import { useStepsByWorkflow } from '@/hooks/queries/use-steps';
import { usePipelineStore } from '@/lib/stores/pipeline-store';
import { cn } from '@/lib/utils';

import { PipelineConnector } from './pipeline-connector';
import { PipelineStep, type PipelineStepStatus, type PipelineStepType } from './pipeline-step';

/**
 * Configuration for an orchestration step.
 */
interface OrchestrationStepConfig {
  /** Icon component for the step */
  icon: typeof MessageSquare;
  /** Unique identifier for the step (0-based index) */
  id: number;
  /** Human-readable title for the step */
  title: string;
  /** Step type matching database schema */
  type: PipelineStepType;
}

/**
 * Hardcoded orchestration steps for the planning workflow.
 * These four steps represent the planning phase of workflow execution.
 */
const ORCHESTRATION_STEPS: Array<OrchestrationStepConfig> = [
  {
    icon: MessageSquare,
    id: 0,
    title: 'Clarification',
    type: 'clarification',
  },
  {
    icon: Lightbulb,
    id: 1,
    title: 'Refinement',
    type: 'refinement',
  },
  {
    icon: Search,
    id: 2,
    title: 'Discovery',
    type: 'discovery',
  },
  {
    icon: FileText,
    id: 3,
    title: 'Planning',
    type: 'planning',
  },
];

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
 * Finds a workflow step by its type from the fetched steps array.
 *
 * @param steps - Array of workflow steps from the database
 * @param stepType - The step type to find
 * @returns The matching step or undefined
 */
function findStepByType(steps: Array<WorkflowStep> | undefined, stepType: PipelineStepType): undefined | WorkflowStep {
  return steps?.find((step) => step.stepType === stepType);
}

/**
 * Main pipeline view component that orchestrates step layout, state management,
 * and data fetching for the workflow visualization.
 *
 * Displays four hardcoded orchestration steps (clarification, refinement,
 * discovery, planning) with connectors between them. Each step's visual state
 * is derived from the fetched database step data.
 *
 * @example
 * ```tsx
 * <PipelineView workflowId={123} />
 * ```
 */
export const PipelineView = ({ className, ref, workflowId, ...props }: PipelineViewProps) => {
  const { data: steps, isLoading } = useStepsByWorkflow(workflowId);

  const { expandedStepId, toggleStep } = usePipelineStore();

  const handleToggleStep = (stepId: number) => {
    toggleStep(stepId);
  };

  return (
    <div
      aria-label={'Workflow pipeline'}
      className={cn('flex items-center gap-4 overflow-x-auto py-4', className)}
      ref={ref}
      role={'list'}
      {...props}
    >
      {ORCHESTRATION_STEPS.map((stepConfig, index) => {
        const dbStep = findStepByType(steps, stepConfig.type);
        const stepState = deriveStepState(dbStep?.status);
        const isExpanded = expandedStepId === stepConfig.id;

        const isConnectorCompleted = stepState === 'completed';
        const isLastStep = index === ORCHESTRATION_STEPS.length - 1;

        return (
          <Fragment key={stepConfig.id}>
            {/* Step Card */}
            <div className={'min-w-64 shrink-0'} role={'listitem'}>
              <PipelineStep
                aria-posinset={index + 1}
                aria-setsize={ORCHESTRATION_STEPS.length}
                isExpanded={isExpanded}
                onToggle={() => handleToggleStep(stepConfig.id)}
                output={dbStep?.outputText ?? undefined}
                status={stepState}
                stepType={stepConfig.type}
                title={stepConfig.title}
              />
            </div>

            {/* Connector (not after last step) */}
            {!isLastStep && (
              <PipelineConnector
                className={'min-w-8'}
                isCompleted={isConnectorCompleted}
              />
            )}
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
