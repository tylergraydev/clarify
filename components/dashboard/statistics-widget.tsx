'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { differenceInMinutes, parseISO } from 'date-fns';
import { BarChart3, CheckCircle2, Clock, FolderKanban, Workflow } from 'lucide-react';
import { useMemo } from 'react';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/queries/use-projects';
import { useWorkflows } from '@/hooks/queries/use-workflows';
import { cn } from '@/lib/utils';

type StatisticCardProps = ComponentPropsWithRef<'div'> & {
  description: string;
  icon: ReactNode;
  isLoading?: boolean;
  title: string;
  value: string;
};

type StatisticsWidgetProps = ClassName;

/**
 * Calculates the average duration in minutes from completed workflows
 */
const calculateAverageDuration = (
  workflows: Array<{
    completedAt: null | string;
    durationMs: null | number;
    startedAt: null | string;
    status: string;
  }>
): number => {
  const completedWorkflows = workflows.filter((workflow) => workflow.status === 'completed');

  if (completedWorkflows.length === 0) {
    return 0;
  }

  let totalMinutes = 0;
  let validCount = 0;

  for (const workflow of completedWorkflows) {
    // Prefer durationMs if available
    if (workflow.durationMs !== null && workflow.durationMs > 0) {
      totalMinutes += workflow.durationMs / 60000; // Convert ms to minutes
      validCount++;
      continue;
    }

    // Fall back to calculating from startedAt and completedAt
    if (workflow.startedAt && workflow.completedAt) {
      const startDate = parseISO(workflow.startedAt);
      const completedDate = parseISO(workflow.completedAt);
      const minutes = differenceInMinutes(completedDate, startDate);

      if (minutes > 0) {
        totalMinutes += minutes;
        validCount++;
      }
    }
  }

  if (validCount === 0) {
    return 0;
  }

  return Math.round(totalMinutes / validCount);
};

/**
 * Calculates the completion rate as a percentage
 */
const calculateCompletionRate = (workflows: Array<{ status: string }>): number => {
  if (workflows.length === 0) {
    return 0;
  }

  const completedCount = workflows.filter((workflow) => workflow.status === 'completed').length;

  return Math.round((completedCount / workflows.length) * 100);
};

/**
 * Formats duration in minutes to a human-readable string
 */
const formatDuration = (minutes: number): string => {
  if (minutes === 0) {
    return '0m';
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

const StatisticCardSkeleton = () => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading statistic'}
      className={`
        flex animate-pulse items-center gap-4 rounded-lg border border-card-border
        bg-card p-4
      `}
      role={'article'}
    >
      {/* Icon placeholder - matches size-10 */}
      <div className={'size-10 shrink-0 rounded-full bg-muted'} />

      {/* Content placeholder - matches text layout */}
      <div className={'min-w-0 flex-1 space-y-1.5'}>
        <div className={'h-4 w-20 rounded-sm bg-muted'} />
        <div className={'h-7 w-16 rounded-sm bg-muted'} />
        <div className={'h-3 w-28 rounded-sm bg-muted'} />
      </div>
    </div>
  );
};

const StatisticCard = ({
  className,
  description,
  icon,
  isLoading = false,
  ref,
  title,
  value,
  ...props
}: StatisticCardProps) => {
  if (isLoading) {
    return <StatisticCardSkeleton />;
  }

  return (
    <div
      className={cn('flex items-center gap-4 rounded-lg border border-card-border bg-card p-4', className)}
      ref={ref}
      {...props}
    >
      {/* Icon */}
      <div
        className={`
          flex size-10 shrink-0 items-center justify-center rounded-full
          bg-accent/10 text-accent
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <div className={'min-w-0 flex-1'}>
        <p className={'text-sm text-muted-foreground'}>{title}</p>
        <p className={'text-2xl font-semibold tracking-tight'}>{value}</p>
        <p className={'text-xs text-muted-foreground'}>{description}</p>
      </div>
    </div>
  );
};

const StatisticsContent = () => {
  const { data: workflows = [], isLoading: isWorkflowsLoading } = useWorkflows();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  const isLoading = isWorkflowsLoading || isProjectsLoading;

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalProjects = projects.length;
    const totalWorkflows = workflows.length;
    const completionRate = calculateCompletionRate(workflows);
    const averageDuration = calculateAverageDuration(workflows);

    return {
      averageDuration,
      completionRate,
      totalProjects,
      totalWorkflows,
    };
  }, [projects, workflows]);

  return (
    <div
      aria-busy={isLoading}
      aria-label={isLoading ? 'Loading statistics' : 'Statistics overview'}
      aria-live={'polite'}
      className={'grid gap-4 sm:grid-cols-2'}
      role={'region'}
    >
      {/* Total Projects */}
      <StatisticCard
        description={'Configured in the system'}
        icon={<FolderKanban aria-hidden={'true'} className={'size-5'} />}
        isLoading={isLoading}
        title={'Total Projects'}
        value={statistics.totalProjects.toString()}
      />

      {/* Total Workflows */}
      <StatisticCard
        description={'All time workflows'}
        icon={<Workflow aria-hidden={'true'} className={'size-5'} />}
        isLoading={isLoading}
        title={'Total Workflows'}
        value={statistics.totalWorkflows.toString()}
      />

      {/* Completion Rate */}
      <StatisticCard
        description={'Successfully completed'}
        icon={<CheckCircle2 aria-hidden={'true'} className={'size-5'} />}
        isLoading={isLoading}
        title={'Completion Rate'}
        value={`${statistics.completionRate}%`}
      />

      {/* Average Duration */}
      <StatisticCard
        description={'Per completed workflow'}
        icon={<Clock aria-hidden={'true'} className={'size-5'} />}
        isLoading={isLoading}
        title={'Avg Duration'}
        value={formatDuration(statistics.averageDuration)}
      />
    </div>
  );
};

export const StatisticsWidget = ({ className }: StatisticsWidgetProps) => {
  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader>
        <div className={'flex items-center gap-2'}>
          <BarChart3 aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
          <CardTitle>Statistics Overview</CardTitle>
        </div>
        <CardDescription>Key metrics and performance indicators</CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent>
        <QueryErrorBoundary>
          <StatisticsContent />
        </QueryErrorBoundary>
      </CardContent>
    </Card>
  );
};
