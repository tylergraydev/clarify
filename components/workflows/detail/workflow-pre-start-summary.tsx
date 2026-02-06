'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useStartWorkflow, useWorkflow } from '@/hooks/queries';

// ============================================================================
// Pause Behavior Labels
// ============================================================================

const pauseBehaviorLabels: Record<string, string> = {
  auto_pause: 'Auto Pause',
  continuous: 'Continuous',
  gates_only: 'Gates Only',
};

// ============================================================================
// Summary Field
// ============================================================================

const SummaryField = ({ label, value }: { label: string; value: string }) => (
  <div className={'flex flex-col gap-1'}>
    <span className={'text-sm font-medium text-muted-foreground'}>{label}</span>
    <span className={'text-sm whitespace-pre-wrap text-foreground'}>{value}</span>
  </div>
);

// ============================================================================
// Component
// ============================================================================

/**
 * Read-only summary card displayed when a workflow has been created but not yet started.
 * Shows the workflow configuration and provides a button to start execution.
 */
export const WorkflowPreStartSummary = ({ workflowId }: { workflowId: number }) => {
  const { data: workflow } = useWorkflow(workflowId);
  const startWorkflow = useStartWorkflow();

  if (!workflow) return null;

  return (
    <div className={'mx-auto max-w-2xl'}>
      <Card>
        <CardHeader>
          <CardTitle>Workflow Summary</CardTitle>
        </CardHeader>

        <CardContent>
          <div className={'flex flex-col gap-4'}>
            <SummaryField label={'Feature Name'} value={workflow.featureName} />
            <SummaryField label={'Feature Request'} value={workflow.featureRequest} />
            <SummaryField
              label={'Pause Behavior'}
              value={pauseBehaviorLabels[workflow.pauseBehavior] ?? workflow.pauseBehavior}
            />
            <SummaryField label={'Skip Clarification'} value={workflow.skipClarification ? 'Yes' : 'No'} />
          </div>
        </CardContent>

        <CardFooter className={'justify-end'}>
          <Button disabled={startWorkflow.isPending} onClick={() => startWorkflow.mutate(workflowId)}>
            {startWorkflow.isPending && <Loader2 className={'mr-2 size-4 animate-spin'} />}
            Start Workflow
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
