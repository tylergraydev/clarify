'use client';

import type { ComponentPropsWithRef } from 'react';

import { Badge } from '@/components/ui/badge';

import type { PipelineStepStatus, PipelineStepType } from './pipeline-step';

/**
 * Metrics data structure for different step types.
 * Each step type has its own set of metrics relevant to its function.
 */
export interface StepMetrics {
  /** Metrics for clarification steps */
  clarification?: {
    /** Number of questions that have been answered */
    answeredCount: number;
    /** Whether the clarification was skipped */
    skipped?: boolean;
    /** Total number of questions */
    totalCount?: number;
  };
  /** Metrics for discovery steps */
  discovery?: {
    /** Number of files included in the discovery */
    includedCount: number;
    /** Total number of files discovered */
    totalCount?: number;
  };
  /** Metrics for planning steps */
  planning?: {
    /** Number of tasks/steps in the plan */
    taskCount: number;
  };
}

interface PipelineStepMetricsProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Metrics data to display */
  metrics: StepMetrics;
  /** Current status of the step */
  status: PipelineStepStatus;
  /** Type of the pipeline step */
  stepType: PipelineStepType;
}

/**
 * Displays contextual metrics for a pipeline step based on its type.
 *
 * Shows different information depending on step type:
 * - Clarification: "X questions answered", "Awaiting answers", or "Skipped"
 * - Discovery: "X files discovered"
 * - Planning: "X tasks planned"
 * - Refinement: "Refined" badge when completed
 *
 * @example
 * ```tsx
 * <PipelineStepMetrics
 *   stepType="clarification"
 *   status="completed"
 *   metrics={{ clarification: { answeredCount: 3, skipped: false } }}
 * />
 * ```
 */
export const PipelineStepMetrics = ({ metrics, status, stepType, ...props }: PipelineStepMetricsProps) => {
  // Don't show metrics for pending steps
  if (status === 'pending') {
    return null;
  }

  const getMetricText = (): null | string => {
    switch (stepType) {
      case 'clarification': {
        if (metrics.clarification?.skipped) {
          return 'Skipped';
        }
        if (metrics.clarification) {
          const { answeredCount } = metrics.clarification;
          if (status === 'running') {
            return answeredCount > 0 ? `${answeredCount} answered` : 'Awaiting answers';
          }
          return answeredCount > 0 ? `${answeredCount} question${answeredCount === 1 ? '' : 's'} answered` : 'Skipped';
        }
        return null;
      }

      case 'discovery': {
        if (metrics.discovery) {
          const { includedCount } = metrics.discovery;
          return `${includedCount} file${includedCount === 1 ? '' : 's'} discovered`;
        }
        return null;
      }

      case 'planning': {
        if (metrics.planning) {
          const { taskCount } = metrics.planning;
          return `${taskCount} task${taskCount === 1 ? '' : 's'} planned`;
        }
        return null;
      }

      case 'refinement': {
        return status === 'completed' ? 'Refined' : null;
      }

      default:
        return null;
    }
  };

  const metricText = getMetricText();
  if (!metricText) {
    return null;
  }

  // Determine badge variant based on content and status
  const getBadgeVariant = () => {
    if (metricText === 'Skipped') {
      return 'default';
    }
    if (metricText === 'Awaiting answers') {
      return 'pending';
    }
    if (status === 'completed') {
      return 'completed';
    }
    return 'default';
  };

  return (
    <Badge size={'sm'} variant={getBadgeVariant()} {...props}>
      {metricText}
    </Badge>
  );
};
