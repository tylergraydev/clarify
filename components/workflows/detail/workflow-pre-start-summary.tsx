'use client';

import { Loader2, Play, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useStartWorkflow, useWorkflow } from '@/hooks/queries';
import { cn } from '@/lib/utils';

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

const SummaryField = ({
  className,
  label,
  multiline = false,
  value,
}: {
  className?: string;
  label: string;
  multiline?: boolean;
  value: string;
}) => (
  <div className={cn('rounded-lg border border-border/70 bg-muted/20 p-4', className)}>
    <span className={'text-xs font-semibold tracking-wide text-muted-foreground uppercase'}>{label}</span>
    <p className={cn('mt-2 text-sm text-foreground', multiline && 'leading-relaxed whitespace-pre-wrap')}>{value}</p>
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

  const pauseBehaviorLabel = pauseBehaviorLabels[workflow.pauseBehavior] ?? workflow.pauseBehavior;
  const skipClarificationLabel = workflow.skipClarification ? 'Yes' : 'No';

  return (
    <div className={'mx-auto w-full max-w-4xl space-y-6'}>
      <div className={'space-y-3'}>
        <Badge className={'w-fit'} variant={'pending'}>
          Ready to Start
        </Badge>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight text-foreground'}>{workflow.featureName}</h1>
          <p className={'text-sm text-muted-foreground'}>
            Review the workflow configuration below and launch when you are ready.
          </p>
        </div>
      </div>

      <Card className={'border-border/80 shadow-lg'}>
        <CardHeader className={'space-y-4 border-b border-border/70 pb-5'}>
          <div className={'flex flex-wrap items-start justify-between gap-3'}>
            <div className={'space-y-1'}>
              <CardTitle className={'text-xl'}>Workflow Summary</CardTitle>
              <p className={'text-sm text-muted-foreground'}>
                This run is configured and waiting for your confirmation.
              </p>
            </div>
            <div
              className={`
                inline-flex items-center gap-1.5 rounded-full border border-border/70
                bg-muted/40 px-3 py-1 text-xs text-muted-foreground
              `}
            >
              <Sparkles aria-hidden={'true'} className={'size-3.5 text-accent'} />
              Pending Launch
            </div>
          </div>
        </CardHeader>

        <CardContent className={'pt-5'}>
          <div className={'grid gap-3 sm:grid-cols-2'}>
            <SummaryField className={'sm:col-span-2'} label={'Feature Name'} value={workflow.featureName} />
            <SummaryField label={'Pause Behavior'} value={pauseBehaviorLabel} />
            <SummaryField label={'Skip Clarification'} value={skipClarificationLabel} />
            <SummaryField className={'sm:col-span-2'} label={'Feature Request'} multiline value={workflow.featureRequest} />
          </div>
        </CardContent>

        <CardFooter
          className={`
            flex-col gap-3 border-t border-border/70 pt-5
            sm:flex-row sm:items-center sm:justify-between
          `}
        >
          <p className={'text-xs text-muted-foreground'}>
            You can pause or cancel this workflow at any time after it starts.
          </p>
          <Button className={'w-full sm:w-auto'} disabled={startWorkflow.isPending} onClick={() => startWorkflow.mutate(workflowId)}>
            {startWorkflow.isPending && <Loader2 className={'mr-2 size-4 animate-spin'} />}
            {!startWorkflow.isPending && <Play aria-hidden={'true'} className={'size-4'} />}
            Start Workflow
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
