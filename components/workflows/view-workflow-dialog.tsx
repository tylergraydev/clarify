'use client';

import type { ReactNode } from 'react';

import type { Workflow } from '@/db/schema/workflows.schema';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAgent } from '@/hooks/queries/use-agents';
import { useProject } from '@/hooks/queries/use-projects';
import { useWorktree } from '@/hooks/queries/use-worktrees';
import { capitalizeFirstLetter, formatDateTime, formatDuration, getWorkflowStatusVariant } from '@/lib/utils';

interface ViewWorkflowDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The workflow to display */
  workflow: null | Workflow;
}

const PAUSE_BEHAVIOR_LABELS: Record<string, string> = {
  auto_pause: 'Auto Pause (pause after each step)',
  continuous: 'Continuous (no pauses)',
};

const FieldRow = ({ label, value }: { label: string; value: ReactNode }) => {
  return (
    <div className={'grid grid-cols-[140px_1fr] gap-x-4 py-1.5'}>
      <dt className={'text-sm text-muted-foreground'}>{label}</dt>
      <dd className={'text-sm text-foreground'}>{value}</dd>
    </div>
  );
};

const SectionHeading = ({ children }: { children: string }) => {
  return <h3 className={'mt-4 mb-2 border-b border-border pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:mt-0'}>{children}</h3>;
};

const ResolvedProjectName = ({ projectId }: { projectId: number }) => {
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) return <span className={'text-muted-foreground'}>Loading...</span>;

  return <span>{project?.name ?? 'Unknown Project'}</span>;
};

const ResolvedAgentName = ({ agentId }: { agentId: number }) => {
  const { data: agent, isLoading } = useAgent(agentId);

  if (isLoading) return <span className={'text-muted-foreground'}>Loading...</span>;

  return <span>{agent?.name ?? 'Unknown Agent'}</span>;
};

const ResolvedWorktreePath = ({ worktreeId }: { worktreeId: number }) => {
  const { data: worktree, isLoading } = useWorktree(worktreeId);

  if (isLoading) return <span className={'text-muted-foreground'}>Loading...</span>;

  return <span className={'break-all'}>{worktree?.path ?? 'Unknown Worktree'}</span>;
};

export const ViewWorkflowDialog = ({ isOpen, onOpenChange, workflow }: ViewWorkflowDialogProps) => {
  if (!workflow) return null;

  const hasError = workflow.errorMessage !== null;
  const progressText = `${workflow.currentStepNumber ?? 0} / ${workflow.totalSteps ?? '-'}`;

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'dialog'} scrollable={true} size={'xl'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle id={'view-workflow-title'}>Workflow Details</DialogTitle>
            <DialogDescription id={'view-workflow-description'}>{workflow.featureName}</DialogDescription>
          </DialogHeader>

          {/* Body */}
          <DialogBody aria-describedby={'view-workflow-description'} aria-labelledby={'view-workflow-title'} className={'px-2'}>
            <dl>
              {/* Core Information Section */}
              <SectionHeading>Core Information</SectionHeading>
              <FieldRow label={'Feature Name'} value={workflow.featureName} />
              <FieldRow
                label={'Feature Request'}
                value={<span className={'whitespace-pre-wrap'}>{workflow.featureRequest}</span>}
              />
              <FieldRow
                label={'Type'}
                value={
                  <Badge size={'sm'} variant={'default'}>
                    {capitalizeFirstLetter(workflow.type)}
                  </Badge>
                }
              />
              <FieldRow
                label={'Status'}
                value={
                  <Badge size={'sm'} variant={getWorkflowStatusVariant(workflow.status)}>
                    {capitalizeFirstLetter(workflow.status)}
                  </Badge>
                }
              />

              {/* Configuration Section */}
              <SectionHeading>Configuration</SectionHeading>
              <FieldRow
                label={'Pause Behavior'}
                value={PAUSE_BEHAVIOR_LABELS[workflow.pauseBehavior] ?? capitalizeFirstLetter(workflow.pauseBehavior)}
              />
              <FieldRow label={'Skip Clarification'} value={workflow.skipClarification ? 'Yes' : 'No'} />
              <FieldRow
                label={'Clarification Agent'}
                value={
                  workflow.clarificationAgentId
                    ? <ResolvedAgentName agentId={workflow.clarificationAgentId} />
                    : <span className={'text-muted-foreground'}>None</span>
                }
              />

              {/* Related Entities Section */}
              <SectionHeading>Related Entities</SectionHeading>
              <FieldRow
                label={'Project'}
                value={<ResolvedProjectName projectId={workflow.projectId} />}
              />
              <FieldRow
                label={'Worktree'}
                value={
                  workflow.worktreeId
                    ? <ResolvedWorktreePath worktreeId={workflow.worktreeId} />
                    : <span className={'text-muted-foreground'}>None</span>
                }
              />

              {/* Progress & Timing Section */}
              <SectionHeading>Progress & Timing</SectionHeading>
              <FieldRow label={'Progress'} value={progressText} />
              <FieldRow label={'Started At'} value={formatDateTime(workflow.startedAt)} />
              <FieldRow label={'Completed At'} value={formatDateTime(workflow.completedAt)} />
              <FieldRow label={'Duration'} value={formatDuration(workflow.durationMs)} />

              {/* Error Section (conditional) */}
              {hasError && (
                <div>
                  <SectionHeading>Error</SectionHeading>
                  <div className={'rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'}>
                    {workflow.errorMessage}
                  </div>
                </div>
              )}

              {/* Metadata Section */}
              <SectionHeading>Metadata</SectionHeading>
              <FieldRow label={'Created At'} value={formatDateTime(workflow.createdAt)} />
              <FieldRow label={'Updated At'} value={formatDateTime(workflow.updatedAt)} />
              <FieldRow
                label={'Workflow ID'}
                value={<span className={'font-mono text-xs'}>{workflow.id}</span>}
              />
            </dl>
          </DialogBody>

          {/* Footer */}
          <DialogFooter>
            <DialogClose>
              <Button type={'button'} variant={'outline'}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
