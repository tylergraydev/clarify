'use client';

import type { VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';

import { FileEdit, FolderSearch, ListTodo, MessageSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';

import type { accordionItemVariants } from '@/components/ui/accordion';
import type { badgeVariants } from '@/components/ui/badge';

import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useClarificationStep } from '@/hooks/queries/use-clarification';
import { useWorkflow } from '@/hooks/queries/use-workflows';
import { useWorkflowDetailStore } from '@/lib/stores/workflow-detail-store';
import { cn } from '@/lib/utils';
import { clarificationStepOutputSchema } from '@/lib/validations/clarification';

import { ClarificationStepContent } from './steps/clarification-step-content';
import { FileDiscoveryStepContent } from './steps/file-discovery-step-content';
import { ImplementationPlanningStepContent } from './steps/implementation-planning-step-content';
import { RefinementStepContent } from './steps/refinement-step-content';

// ============================================================================
// Types
// ============================================================================

type AccordionItemStatus = NonNullable<VariantProps<typeof accordionItemVariants>['status']>;
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

interface WorkflowStepAccordionProps extends ComponentPropsWithRef<typeof AccordionRoot> {
  workflowId: number;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Compute a dynamic summary text for the clarification step based on its
 * status and parsed output data.
 */
function computeClarificationSummary(status: string, outputStructured: null | Record<string, unknown>): string {
  if (status === 'pending') return 'Waiting...';
  if (status === 'running') return 'Analyzing feature request...';
  if (status === 'failed') return 'Step failed';

  if (status === 'skipped') return 'Skipped';

  // For completed status, inspect the structured output
  if (status === 'completed' && outputStructured) {
    const parsed = clarificationStepOutputSchema.safeParse(outputStructured);

    if (parsed.success) {
      if (parsed.data.skipped) return 'Skipped - feature is clear';

      const questionCount = parsed.data.questions?.length ?? 0;

      if (questionCount > 0) {
        const answerCount = parsed.data.answers ? Object.keys(parsed.data.answers).length : 0;

        if (answerCount > 0) {
          return `${answerCount} question${answerCount !== 1 ? 's' : ''} answered`;
        }

        return `${questionCount} question${questionCount !== 1 ? 's' : ''} awaiting answers`;
      }

      return 'No questions needed';
    }
  }

  return 'Waiting...';
}

/**
 * Determine which step should be auto-expanded based on workflow state.
 */
function getActiveStepId(clarificationStatus: string, skipClarification: boolean): string {
  if (skipClarification || clarificationStatus === 'completed' || clarificationStatus === 'skipped') {
    return 'refinement';
  }

  return 'clarification';
}

/**
 * Map a step status string to a valid AccordionItem status variant.
 */
function mapStepStatusToAccordionStatus(status: string): AccordionItemStatus {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'default';
    case 'paused':
      return 'paused';
    case 'running':
      return 'running';
    case 'skipped':
      return 'skipped';
    default:
      return 'pending';
  }
}

/**
 * Map a step status string to a human-readable badge label.
 */
function mapStepStatusToBadgeLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'editing':
      return 'Editing';
    case 'failed':
      return 'Failed';
    case 'paused':
      return 'Paused';
    case 'running':
      return 'Running';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Pending';
  }
}

/**
 * Map a step status string to a Badge variant.
 */
function mapStepStatusToBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'running':
      return 'running';
    case 'skipped':
      return 'completed';
    default:
      return 'pending';
  }
}

// ============================================================================
// Component
// ============================================================================

export const WorkflowStepAccordion = ({ className, ref, workflowId, ...props }: WorkflowStepAccordionProps) => {
  const expandedSteps = useWorkflowDetailStore((state) => state.expandedSteps);
  const setExpandedSteps = useWorkflowDetailStore((state) => state.setExpandedSteps);

  const { data: workflow } = useWorkflow(workflowId);
  const { data: clarificationStep } = useClarificationStep(workflowId);

  const clarificationStatus = clarificationStep?.status ?? 'pending';

  // Auto-expand the active step once per workflow visit
  const autoExpandedForRef = useRef<null | number>(null);

  useEffect(() => {
    if (autoExpandedForRef.current === workflowId) return;
    if (!workflow) return;

    const activeStepId = getActiveStepId(clarificationStatus, workflow.skipClarification);
    setExpandedSteps([activeStepId]);
    autoExpandedForRef.current = workflowId;
  }, [workflowId, workflow, clarificationStatus, setExpandedSteps]);

  const clarificationAccordionStatus = mapStepStatusToAccordionStatus(clarificationStatus);
  const clarificationBadgeVariant = mapStepStatusToBadgeVariant(clarificationStatus);
  const clarificationBadgeLabel = mapStepStatusToBadgeLabel(clarificationStatus);
  const clarificationSummary = computeClarificationSummary(
    clarificationStatus,
    (clarificationStep?.outputStructured as null | Record<string, unknown>) ?? null
  );

  const handleValueChange = (value: Array<unknown>) => {
    setExpandedSteps(value as Array<string>);
  };

  return (
    <AccordionRoot
      className={cn('flex flex-col', className)}
      multiple
      onValueChange={handleValueChange}
      ref={ref}
      value={expandedSteps}
      {...props}
    >
      {/* Clarification Step */}
      <AccordionItem status={clarificationAccordionStatus} value={'clarification'}>
        <AccordionHeader>
          <AccordionTrigger>
            <MessageSquare aria-hidden={'true'} className={'size-4 shrink-0 text-muted-foreground'} />
            <span className={'text-sm font-medium'}>Clarification</span>
            <Badge size={'sm'} variant={clarificationBadgeVariant}>
              {clarificationBadgeLabel}
            </Badge>
            <span className={'text-xs text-muted-foreground'}>{clarificationSummary}</span>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel variant={'padded'}>
          <ClarificationStepContent workflowId={workflowId} />
        </AccordionPanel>
      </AccordionItem>

      {/* Refinement Step */}
      <AccordionItem status={'running'} value={'refinement'}>
        <AccordionHeader>
          <AccordionTrigger>
            <FileEdit aria-hidden={'true'} className={'size-4 shrink-0 text-muted-foreground'} />
            <span className={'text-sm font-medium'}>Refinement</span>
            <Badge size={'sm'} variant={'running'}>
              Running
            </Badge>
            <span className={'text-xs text-muted-foreground'}>Refining feature request...</span>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel variant={'padded'}>
          <RefinementStepContent />
        </AccordionPanel>
      </AccordionItem>

      {/* File Discovery Step */}
      <AccordionItem status={'pending'} value={'discovery'}>
        <AccordionHeader>
          <AccordionTrigger>
            <FolderSearch aria-hidden={'true'} className={'size-4 shrink-0 text-muted-foreground'} />
            <span className={'text-sm font-medium'}>File Discovery</span>
            <Badge size={'sm'} variant={'pending'}>
              Pending
            </Badge>
            <span className={'text-xs text-muted-foreground'}>Waiting...</span>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel variant={'padded'}>
          <FileDiscoveryStepContent />
        </AccordionPanel>
      </AccordionItem>

      {/* Implementation Planning Step */}
      <AccordionItem status={'pending'} value={'planning'}>
        <AccordionHeader>
          <AccordionTrigger>
            <ListTodo aria-hidden={'true'} className={'size-4 shrink-0 text-muted-foreground'} />
            <span className={'text-sm font-medium'}>Implementation Planning</span>
            <Badge size={'sm'} variant={'pending'}>
              Pending
            </Badge>
            <span className={'text-xs text-muted-foreground'}>Waiting...</span>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel variant={'padded'}>
          <ImplementationPlanningStepContent />
        </AccordionPanel>
      </AccordionItem>
    </AccordionRoot>
  );
};
