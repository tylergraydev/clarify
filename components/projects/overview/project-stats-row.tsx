'use client';

import { CheckCircle2, Clock, FolderGit2, Workflow } from 'lucide-react';
import { useMemo } from 'react';

import { calculateAverageDuration, calculateCompletionRate, formatDuration } from '@/lib/workflow-stats';

type ProjectStatsRowProps = {
  repositories: Array<unknown>;
  workflows: Array<{
    completedAt: null | string;
    durationMs: null | number;
    startedAt: null | string;
    status: string;
  }>;
};

/** Displays a row of 4 statistic metric cards for a project overview. */
export const ProjectStatsRow = ({ repositories, workflows }: ProjectStatsRowProps) => {
  const statistics = useMemo(() => {
    return {
      averageDuration: formatDuration(calculateAverageDuration(workflows)),
      completionRate: calculateCompletionRate(workflows),
      repositoryCount: repositories.length,
      totalWorkflows: workflows.length,
    };
  }, [repositories, workflows]);

  return (
    <div
      aria-label={'Project statistics'}
      className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'}
      role={'region'}
    >
      {/* Total Workflows */}
      <div className={'flex items-center gap-4 rounded-lg border border-card-border bg-card p-4'}>
        <div
          className={`
            flex size-10 shrink-0 items-center justify-center rounded-full
            bg-accent/10 text-accent
          `}
        >
          <Workflow aria-hidden={'true'} className={'size-5'} />
        </div>
        <div className={'min-w-0 flex-1'}>
          <p className={'text-sm text-muted-foreground'}>Total Workflows</p>
          <p className={'text-2xl font-semibold tracking-tight'}>{statistics.totalWorkflows}</p>
          <p className={'text-xs text-muted-foreground'}>All time workflows</p>
        </div>
      </div>

      {/* Completion Rate */}
      <div className={'flex items-center gap-4 rounded-lg border border-card-border bg-card p-4'}>
        <div
          className={`
            flex size-10 shrink-0 items-center justify-center rounded-full
            bg-accent/10 text-accent
          `}
        >
          <CheckCircle2 aria-hidden={'true'} className={'size-5'} />
        </div>
        <div className={'min-w-0 flex-1'}>
          <p className={'text-sm text-muted-foreground'}>Completion Rate</p>
          <p className={'text-2xl font-semibold tracking-tight'}>{statistics.completionRate}%</p>
          <p className={'text-xs text-muted-foreground'}>Successfully completed</p>
        </div>
      </div>

      {/* Avg Duration */}
      <div className={'flex items-center gap-4 rounded-lg border border-card-border bg-card p-4'}>
        <div
          className={`
            flex size-10 shrink-0 items-center justify-center rounded-full
            bg-accent/10 text-accent
          `}
        >
          <Clock aria-hidden={'true'} className={'size-5'} />
        </div>
        <div className={'min-w-0 flex-1'}>
          <p className={'text-sm text-muted-foreground'}>Avg Duration</p>
          <p className={'text-2xl font-semibold tracking-tight'}>{statistics.averageDuration}</p>
          <p className={'text-xs text-muted-foreground'}>Per completed workflow</p>
        </div>
      </div>

      {/* Repositories */}
      <div className={'flex items-center gap-4 rounded-lg border border-card-border bg-card p-4'}>
        <div
          className={`
            flex size-10 shrink-0 items-center justify-center rounded-full
            bg-accent/10 text-accent
          `}
        >
          <FolderGit2 aria-hidden={'true'} className={'size-5'} />
        </div>
        <div className={'min-w-0 flex-1'}>
          <p className={'text-sm text-muted-foreground'}>Repositories</p>
          <p className={'text-2xl font-semibold tracking-tight'}>{statistics.repositoryCount}</p>
          <p className={'text-xs text-muted-foreground'}>Connected repositories</p>
        </div>
      </div>
    </div>
  );
};
