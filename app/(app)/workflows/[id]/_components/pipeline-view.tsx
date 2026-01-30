'use client';

import { GitBranch } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';
import type { stepStatuses, stepTypes } from '@/db/schema/workflow-steps.schema';

import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

import { EditStepDialog } from './edit-step-dialog';
import { PipelineStepNode } from './pipeline-step-node';
import { StepDetailPanel } from './step-detail-panel';

interface PipelineViewProps {
  className?: string;
  isLoading?: boolean;
  steps: Array<WorkflowStep>;
}
type StepStatus = (typeof stepStatuses)[number];

// ============================================================================
// Types
// ============================================================================

type StepType = (typeof stepTypes)[number];

// ============================================================================
// Skeleton Components
// ============================================================================

const PipelineStepSkeleton = () => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading step'}
      className={`
        animate-pulse rounded-lg border border-border bg-card
      `}
      role={'article'}
    >
      {/* Step Header */}
      <div className={'flex items-center gap-3 p-3'}>
        {/* Step Number */}
        <div className={'size-6 rounded-full bg-muted'} />

        {/* Step Type Icon */}
        <div className={'size-4 rounded-sm bg-muted'} />

        {/* Step Title */}
        <div className={'h-4 flex-1 rounded-sm bg-muted'} />

        {/* Status Badge */}
        <div className={'h-5 w-16 rounded-full bg-muted'} />
      </div>
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading pipeline'}
      aria-live={'polite'}
      className={'relative flex flex-col'}
      role={'status'}
    >
      {/* Connecting Line */}
      <div
        className={`
          absolute inset-y-0 left-3 w-0.5 bg-border
        `}
      />

      {/* Skeleton Steps */}
      <div className={'flex flex-col gap-3 pl-8'}>
        <PipelineStepSkeleton />
        <PipelineStepSkeleton />
        <PipelineStepSkeleton />
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const PipelineView = ({ className, isLoading = false, steps }: PipelineViewProps) => {
  const [editingStep, setEditingStep] = useState<null | WorkflowStep>(null);

  // Sort steps by stepNumber
  const sortedSteps = useMemo(() => {
    return [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
  }, [steps]);

  // Derived state
  const hasSteps = sortedSteps.length > 0;
  const runningStepIndex = sortedSteps.findIndex((step) => step.status === 'running');

  const handleEditClick = (step: WorkflowStep) => {
    setEditingStep(step);
  };

  const handleEditDialogClose = () => {
    setEditingStep(null);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className={cn('flex flex-col', className)}>
        <LoadingSkeleton />
      </div>
    );
  }

  // Empty State
  if (!hasSteps) {
    return (
      <div className={cn('flex flex-col', className)}>
        <EmptyState
          description={'Steps will appear here once the workflow begins execution.'}
          icon={<GitBranch aria-hidden={'true'} className={'size-6'} />}
          title={'No steps yet'}
        />
      </div>
    );
  }

  // Pipeline View
  return (
    <div aria-label={'Workflow pipeline'} className={cn('relative flex flex-col', className)} role={'list'}>
      {/* Connecting Line */}
      <div
        aria-hidden={'true'}
        className={`
          absolute inset-y-6 left-3 w-0.5 bg-border
        `}
      />

      {/* Step Nodes */}
      <div className={'flex flex-col gap-3 pl-8'}>
        {sortedSteps.map((step, index) => {
          const isActive = step.status === 'running' || step.status === 'editing';
          const isCurrentRunningStep = index === runningStepIndex;

          return (
            <div
              aria-current={isCurrentRunningStep ? 'step' : undefined}
              className={'relative'}
              key={step.id}
              role={'listitem'}
            >
              {/* Connector Dot */}
              <div
                aria-hidden={'true'}
                className={cn(
                  'absolute top-4 -left-8 size-2.5 rounded-full border-2',
                  'transition-colors',
                  isActive
                    ? 'border-purple-500 bg-purple-500 dark:border-purple-400 dark:bg-purple-400'
                    : step.status === 'completed'
                      ? 'border-green-500 bg-green-500 dark:border-green-400 dark:bg-green-400'
                      : step.status === 'failed'
                        ? 'border-red-500 bg-red-500 dark:border-red-400 dark:bg-red-400'
                        : 'border-border bg-background'
                )}
              />

              {/* Step Node */}
              <PipelineStepNode
                isDefaultOpen={isActive}
                status={step.status as StepStatus}
                stepNumber={step.stepNumber}
                stepType={step.stepType as StepType}
                title={step.title}
              >
                <StepDetailPanel onEditClick={() => handleEditClick(step)} step={step} />
              </PipelineStepNode>
            </div>
          );
        })}
      </div>

      {/* Edit Step Dialog */}
      {editingStep && (
        <EditStepDialog
          currentOutput={editingStep.outputText}
          isOpen={Boolean(editingStep)}
          onOpenChange={(open) => {
            if (!open) handleEditDialogClose();
          }}
          originalOutput={editingStep.originalOutputText}
          stepId={editingStep.id}
          stepTitle={editingStep.title}
        />
      )}
    </div>
  );
};
