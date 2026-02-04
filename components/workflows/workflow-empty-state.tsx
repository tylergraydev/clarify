'use client';

import type { ComponentPropsWithRef } from 'react';

import { AlertCircle, ArrowRight, Bot, MessageSquare, Settings, Sparkles } from 'lucide-react';

import type { Workflow } from '@/db/schema/workflows.schema';

import { useAgent } from '@/hooks/queries/use-agents';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

/**
 * Pause behavior type for workflow configuration.
 */
type PauseBehavior = 'auto_pause' | 'continuous' | 'gates_only';

/**
 * Props for the WorkflowEmptyState component.
 */
interface WorkflowEmptyStateProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * Workflow information to display.
   */
  workflow: Pick<
    Workflow,
    'clarificationAgentId' | 'featureRequest' | 'pauseBehavior' | 'skipClarification' | 'status'
  >;
}

/**
 * Mapping of pause behavior values to human-readable labels.
 */
const PAUSE_BEHAVIOR_LABELS: Record<PauseBehavior, string> = {
  auto_pause: 'Auto Pause',
  continuous: 'Continuous',
  gates_only: 'Gates Only',
};

/**
 * Displays workflow information in an informational card layout when no pipeline steps exist yet.
 * Shows the feature description, configuration details, and next steps for getting started.
 *
 * @example
 * ```tsx
 * <WorkflowEmptyState
 *   workflow={{
 *     clarificationAgentId: 1,
 *     featureRequest: 'Add user authentication',
 *     pauseBehavior: 'auto_pause',
 *     skipClarification: false,
 *     status: 'created',
 *   }}
 * />
 * ```
 */
export const WorkflowEmptyState = ({ className, ref, workflow, ...props }: WorkflowEmptyStateProps) => {
  // Fetch agent data if clarification is enabled and agent ID is provided
  const { data: agent } = useAgent(workflow.clarificationAgentId ?? 0);

  // Derived state
  const isCreatedStatus = workflow.status === 'created';
  const pauseBehaviorLabel = PAUSE_BEHAVIOR_LABELS[workflow.pauseBehavior as PauseBehavior] || workflow.pauseBehavior;

  // Determine clarification agent display text
  const _clarificationAgentText = workflow.skipClarification
    ? 'None (skipped)'
    : workflow.clarificationAgentId === null
      ? 'Default Agent'
      : agent?.displayName || agent?.name || 'Loading...';

  // Determine card title and description based on status
  const _cardTitle = isCreatedStatus ? 'Workflow Ready' : 'No Steps Available';
  const _cardDescription = isCreatedStatus
    ? 'Your workflow is configured and ready to start. Begin execution to create the initial planning steps.'
    : 'This workflow does not have any pipeline steps yet.';

  // Determine icon based on status
  const StatusIcon = isCreatedStatus ? Sparkles : AlertCircle;

  return (
    <div className={cn('flex items-center justify-center py-12', className)} ref={ref} {...props}>
      <Card className={'mx-auto max-w-2xl'}>
        {/* Header */}
        <CardHeader>
          <div className={'flex items-start gap-3'}>
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                isCreatedStatus ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              <StatusIcon className={'size-5'} />
            </div>
            <div className={'flex-1 space-y-1.5'}>
              <CardTitle>{_cardTitle}</CardTitle>
              <CardDescription>{_cardDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className={'space-y-6 p-6 sm:p-8'}>
          {/* Feature Description Section */}
          <div className={'space-y-2'}>
            <h3 className={'text-sm font-medium text-foreground'}>Feature Request</h3>
            <p className={'line-clamp-3 text-sm text-muted-foreground'}>{workflow.featureRequest}</p>
          </div>

          {/* Configuration Section */}
          <div className={'space-y-3'}>
            <h3 className={'text-sm font-medium text-foreground'}>Configuration</h3>
            <dl className={'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
              {/* Pause Behavior */}
              <div className={'flex items-start gap-2'}>
                <Settings className={'mt-0.5 size-4 shrink-0 text-muted-foreground'} />
                <div className={'min-w-0 flex-1'}>
                  <dt className={'text-xs font-medium text-muted-foreground'}>Pause Behavior</dt>
                  <dd className={'mt-1 text-sm text-foreground'}>{pauseBehaviorLabel}</dd>
                </div>
              </div>

              {/* Skip Clarification */}
              <div className={'flex items-start gap-2'}>
                <MessageSquare className={'mt-0.5 size-4 shrink-0 text-muted-foreground'} />
                <div className={'min-w-0 flex-1'}>
                  <dt className={'text-xs font-medium text-muted-foreground'}>Skip Clarification</dt>
                  <dd className={'mt-1 text-sm text-foreground'}>{workflow.skipClarification ? 'Yes' : 'No'}</dd>
                </div>
              </div>

              {/* Clarification Agent */}
              <div className={'flex items-start gap-2'}>
                <Bot className={'mt-0.5 size-4 shrink-0 text-muted-foreground'} />
                <div className={'min-w-0 flex-1'}>
                  <dt className={'text-xs font-medium text-muted-foreground'}>Clarification Agent</dt>
                  <dd className={'mt-1 text-sm text-foreground'}>{_clarificationAgentText}</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Next Steps Section (only for 'created' status) */}
          {isCreatedStatus && (
            <div className={'space-y-3'}>
              <h3 className={'flex items-center gap-2 text-sm font-medium text-foreground'}>
                <ArrowRight className={'size-4'} />
                Next Steps
              </h3>
              <ol className={'space-y-2 pl-6 text-sm text-muted-foreground'}>
                <li className={'list-decimal'}>Click the &ldquo;Start&rdquo; button to begin the workflow</li>
                <li className={'list-decimal'}>The pipeline will create the initial planning steps</li>
                <li className={'list-decimal'}>You can pause, review, and modify outputs at each step</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
