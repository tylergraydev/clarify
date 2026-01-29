import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import type { badgeVariants } from '@/components/ui/badge';
import type { Workflow } from '@/types/electron';

// ============================================================================
// Workflow Status Types
// ============================================================================

/**
 * All possible workflow status values from the database schema
 */
export const WORKFLOW_STATUSES = [
  'created',
  'running',
  'paused',
  'editing',
  'completed',
  'failed',
  'cancelled',
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

/**
 * Active workflow statuses - workflows that are currently in progress
 */
export const ACTIVE_WORKFLOW_STATUSES = ['running', 'paused', 'editing'] as const;

export type ActiveWorkflowStatus = (typeof ACTIVE_WORKFLOW_STATUSES)[number];

/**
 * Terminal workflow statuses - workflows that have finished
 */
export const TERMINAL_WORKFLOW_STATUSES = ['completed', 'failed', 'cancelled'] as const;

export type TerminalWorkflowStatus = (typeof TERMINAL_WORKFLOW_STATUSES)[number];

// ============================================================================
// Workflow Type Types
// ============================================================================

/**
 * All possible workflow type values from the database schema
 */
export const WORKFLOW_TYPES = ['planning', 'implementation'] as const;

/**
 * Available badge variants extracted from the Badge component
 */
export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Data structure for displaying a statistic in the statistics widget
 */
export interface StatisticData {
  /** Detailed description of the statistic */
  description: string;
  /** Icon to display next to the statistic */
  icon: ReactNode;
  /** Label for the statistic */
  title: string;
  /** The value to display (already formatted as a string) */
  value: string;
}

// ============================================================================
// Widget Data Types
// ============================================================================

/**
 * Data structure for displaying a workflow card in widgets
 * Contains all the information needed to render a workflow summary
 */
export interface WorkflowCardData {
  /** Current step number in the workflow */
  currentStep: null | number;
  /** Elapsed time string (e.g., "2h 30m") */
  elapsedTime: string;
  /** The name of the feature being worked on */
  featureName: string;
  /** Unique identifier for the workflow */
  id: number;
  /** Calculated progress percentage (0-100) */
  progress: number;
  /** Name of the project this workflow belongs to */
  projectName: string;
  /** Current status of the workflow */
  status: WorkflowStatus;
  /** Total number of steps in the workflow */
  totalSteps: null | number;
  /** Type of workflow (planning or implementation) */
  type: WorkflowType;
  /** Last update timestamp */
  updatedAt: null | string;
}

/**
 * Minimal workflow data required for duration calculations
 * Used by statistics and average duration utilities
 */
export type WorkflowDurationData = Pick<
  Workflow,
  'completedAt' | 'durationMs' | 'startedAt' | 'status'
>;

// ============================================================================
// Badge Variant Types
// ============================================================================

/**
 * Minimal workflow data required for progress calculations
 */
export type WorkflowProgressData = Pick<Workflow, 'currentStepNumber' | 'totalSteps'>;

/**
 * Badge variants that are used for workflow status display
 */
export type WorkflowStatusBadgeVariant =
  | 'clarifying'
  | 'completed'
  | 'default'
  | 'failed'
  | 'planning';

// ============================================================================
// Workflow Utility Types
// ============================================================================

/**
 * Filter options for workflow status filtering
 */
export type WorkflowStatusFilter = 'active' | 'all' | 'completed' | 'failed' | WorkflowStatus;

export type WorkflowType = (typeof WORKFLOW_TYPES)[number];
