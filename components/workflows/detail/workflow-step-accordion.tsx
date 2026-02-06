'use client';

import type { ComponentPropsWithRef } from 'react';

import { FileEdit, FolderSearch, ListTodo, MessageSquare } from 'lucide-react';

import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useWorkflowDetailStore } from '@/lib/stores/workflow-detail-store';
import { cn } from '@/lib/utils';

import { ClarificationStepContent } from './steps/clarification-step-content';
import { FileDiscoveryStepContent } from './steps/file-discovery-step-content';
import { ImplementationPlanningStepContent } from './steps/implementation-planning-step-content';
import { RefinementStepContent } from './steps/refinement-step-content';

type WorkflowStepAccordionProps = ComponentPropsWithRef<typeof AccordionRoot>;

export const WorkflowStepAccordion = ({ className, ref, ...props }: WorkflowStepAccordionProps) => {
  const expandedSteps = useWorkflowDetailStore((state) => state.expandedSteps);
  const setExpandedSteps = useWorkflowDetailStore((state) => state.setExpandedSteps);

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
      <AccordionItem status={'completed'} value={'clarification'}>
        <AccordionHeader>
          <AccordionTrigger>
            <MessageSquare aria-hidden={'true'} className={'size-4 shrink-0 text-muted-foreground'} />
            <span className={'text-sm font-medium'}>Clarification</span>
            <Badge size={'sm'} variant={'completed'}>Completed</Badge>
            <span className={'text-xs text-muted-foreground'}>3 questions answered</span>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel variant={'padded'}>
          <ClarificationStepContent />
        </AccordionPanel>
      </AccordionItem>

      {/* Refinement Step */}
      <AccordionItem status={'running'} value={'refinement'}>
        <AccordionHeader>
          <AccordionTrigger>
            <FileEdit aria-hidden={'true'} className={'size-4 shrink-0 text-muted-foreground'} />
            <span className={'text-sm font-medium'}>Refinement</span>
            <Badge size={'sm'} variant={'running'}>Running</Badge>
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
            <Badge size={'sm'} variant={'pending'}>Pending</Badge>
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
            <Badge size={'sm'} variant={'pending'}>Pending</Badge>
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
