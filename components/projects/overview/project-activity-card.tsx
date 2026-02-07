'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { CheckCircle, Clock, History, XCircle } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { type KeyboardEvent, Fragment, useCallback, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatWorkflowDuration } from '@/lib/workflow-stats';

type WorkflowData = {
  completedAt: null | string;
  createdAt: string;
  durationMs: null | number;
  featureName: string;
  id: number;
  startedAt: null | string;
  status: string;
  type: string;
  updatedAt: string;
};

type ProjectActivityCardProps = {
  onViewAllClick: () => void;
  workflows: WorkflowData[];
};

/**
 * Formats a timestamp to relative time (e.g., "2 hours ago")
 *
 * SQLite CURRENT_TIMESTAMP returns UTC time in format 'YYYY-MM-DD HH:MM:SS' without
 * timezone indicator. We normalize this to ISO 8601 with 'Z' suffix so date-fns
 * correctly interprets it as UTC rather than local time.
 */
const formatRelativeTime = (timestamp: null | string): string => {
  if (!timestamp) {
    return 'Unknown';
  }

  // Normalize SQLite timestamp to ISO 8601 UTC format
  const normalizedDate = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T') + 'Z';
  return formatDistanceToNow(parseISO(normalizedDate), { addSuffix: true });
};

/**
 * Maps workflow status to badge variant
 */
const getStatusVariant = (status: string): 'completed' | 'default' | 'failed' | 'pending' | 'running' => {
  switch (status) {
    case 'cancelled':
    case 'failed':
      return 'failed';
    case 'completed':
      return 'completed';
    case 'paused':
      return 'pending';
    case 'running':
      return 'running';
    default:
      return 'default';
  }
};

/**
 * Formats status for display
 */
const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Renders the appropriate icon for a workflow status
 */
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'cancelled':
    case 'failed':
      return <XCircle aria-hidden={'true'} className={'size-3'} />;
    case 'completed':
      return <CheckCircle aria-hidden={'true'} className={'size-3'} />;
    case 'running':
      return <span aria-hidden={'true'} className={'inline-block size-2 animate-pulse rounded-full bg-blue-500'} />;
    default:
      return <Clock aria-hidden={'true'} className={'size-3'} />;
  }
};

/** Displays recent workflow activity for a project with clickable rows, status badges, and relative timestamps. */
export const ProjectActivityCard = ({ onViewAllClick, workflows }: ProjectActivityCardProps) => {
  const router = useRouter();

  const sortedWorkflows = useMemo(() => {
    return [...workflows]
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [workflows]);

  const handleWorkflowClick = useCallback(
    (workflowId: number) => {
      router.push(
        $path({
          route: '/workflows/[id]',
          routeParams: { id: String(workflowId) },
        })
      );
    },
    [router]
  );

  const hasWorkflows = sortedWorkflows.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className={'flex items-center gap-2'}>
          <History aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <CardDescription>Latest workflow activity for this project</CardDescription>
      </CardHeader>
      <CardContent>
        {hasWorkflows ? (
          <Fragment>
            {/* Workflow List */}
            <div className={'-mx-6 -mb-6'}>
              {sortedWorkflows.map((workflow) => {
                const statusVariant = getStatusVariant(workflow.status);
                const formattedStatus = formatStatus(workflow.status);
                const relativeTime = formatRelativeTime(workflow.updatedAt);
                const duration = formatWorkflowDuration(workflow.durationMs);

                const handleClick = () => {
                  handleWorkflowClick(workflow.id);
                };

                const handleKeyDown = (event: KeyboardEvent) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleClick();
                  }
                };

                return (
                  <div
                    aria-label={`View workflow: ${workflow.featureName}`}
                    className={`
                      cursor-pointer border-b border-card-border p-3
                      transition-all duration-150 last:border-b-0 hover:bg-muted/50
                      focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset
                      active:bg-muted/70
                    `}
                    key={workflow.id}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    role={'button'}
                    tabIndex={0}
                  >
                    {/* Header Row */}
                    <div className={'flex items-center justify-between gap-2'}>
                      <div className={'min-w-0 flex-1'}>
                        <h4 className={'truncate text-sm font-medium'}>{workflow.featureName}</h4>
                      </div>
                      <Badge size={'sm'} variant={statusVariant}>
                        {formattedStatus}
                      </Badge>
                    </div>

                    {/* Footer Row */}
                    <div className={'mt-2 flex items-center justify-between text-xs text-muted-foreground'}>
                      <span className={'flex items-center gap-1'}>
                        <StatusIcon status={workflow.status} />
                        {relativeTime}
                      </span>
                      <span className={'flex items-center gap-3'}>
                        <span className={'tabular-nums'}>{duration}</span>
                        <span className={'capitalize'}>{workflow.type}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All Link */}
            <div className={'mt-9 flex justify-center'}>
              <button
                className={'cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground'}
                onClick={onViewAllClick}
                type={'button'}
              >
                View all workflows
              </button>
            </div>
          </Fragment>
        ) : (
          <EmptyState
            description={'Create a workflow to get started.'}
            icon={<History aria-hidden={'true'} className={'size-6'} />}
            title={'No workflows yet'}
          />
        )}
      </CardContent>
    </Card>
  );
};
