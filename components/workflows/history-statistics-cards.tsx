"use client";

import { Ban, CheckCircle2, Clock, Percent, XCircle } from "lucide-react";
import { type ReactNode } from "react";

import type { WorkflowStatistics } from "@/types/electron";

import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type HistoryStatisticsCardsProps = ClassName<{
  isLoading?: boolean;
  statistics: undefined | WorkflowStatistics;
}>;

type StatisticCardProps = ClassName<{
  description: string;
  icon: ReactNode;
  iconColorClass: string;
  isLoading?: boolean;
  title: string;
  value: string;
}>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats duration in milliseconds to a human-readable string
 */
const formatDuration = (durationMs: null | number): string => {
  if (durationMs === null || durationMs === 0) {
    return "N/A";
  }

  const minutes = Math.round(durationMs / 60000);

  if (minutes === 0) {
    return "<1m";
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

// ============================================================================
// Skeleton Component
// ============================================================================

const StatisticCardSkeleton = () => {
  return (
    <div
      aria-busy={"true"}
      aria-label={"Loading statistic"}
      className={`
        flex animate-pulse items-center gap-4 rounded-lg border border-card-border
        bg-card p-4
      `}
      role={"article"}
    >
      {/* Icon placeholder */}
      <div className={"size-10 shrink-0 rounded-full bg-muted"} />

      {/* Content placeholder */}
      <div className={"min-w-0 flex-1 space-y-1.5"}>
        <div className={"h-4 w-20 rounded-sm bg-muted"} />
        <div className={"h-7 w-16 rounded-sm bg-muted"} />
        <div className={"h-3 w-28 rounded-sm bg-muted"} />
      </div>
    </div>
  );
};

// ============================================================================
// Statistic Card Component
// ============================================================================

const StatisticCard = ({
  className,
  description,
  icon,
  iconColorClass,
  isLoading = false,
  title,
  value,
}: StatisticCardProps) => {
  if (isLoading) {
    return <StatisticCardSkeleton />;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border border-card-border bg-card p-4",
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          iconColorClass
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className={"min-w-0 flex-1"}>
        <p className={"text-sm text-muted-foreground"}>{title}</p>
        <p className={"text-2xl font-semibold tracking-tight"}>{value}</p>
        <p className={"text-xs text-muted-foreground"}>{description}</p>
      </div>
    </div>
  );
};

// ============================================================================
// Main Export
// ============================================================================

export const HistoryStatisticsCards = ({
  className,
  isLoading = false,
  statistics,
}: HistoryStatisticsCardsProps) => {
  const completedCount = statistics?.completedCount ?? 0;
  const failedCount = statistics?.failedCount ?? 0;
  const cancelledCount = statistics?.cancelledCount ?? 0;
  const successRate = statistics?.successRate ?? 0;
  const averageDurationMs = statistics?.averageDurationMs ?? null;

  return (
    <div
      aria-busy={isLoading}
      aria-label={
        isLoading ? "Loading statistics" : "Workflow history statistics"
      }
      aria-live={"polite"}
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-5", className)}
      role={"region"}
    >
      {/* Completed Count */}
      <StatisticCard
        description={"Successfully finished"}
        icon={<CheckCircle2 aria-hidden={"true"} className={"size-5"} />}
        iconColorClass={"bg-green-500/10 text-green-600 dark:text-green-400"}
        isLoading={isLoading}
        title={"Completed"}
        value={completedCount.toString()}
      />

      {/* Failed Count */}
      <StatisticCard
        description={"Ended with errors"}
        icon={<XCircle aria-hidden={"true"} className={"size-5"} />}
        iconColorClass={"bg-red-500/10 text-red-600 dark:text-red-400"}
        isLoading={isLoading}
        title={"Failed"}
        value={failedCount.toString()}
      />

      {/* Cancelled Count */}
      <StatisticCard
        description={"Manually stopped"}
        icon={<Ban aria-hidden={"true"} className={"size-5"} />}
        iconColorClass={"bg-amber-500/10 text-amber-600 dark:text-amber-400"}
        isLoading={isLoading}
        title={"Cancelled"}
        value={cancelledCount.toString()}
      />

      {/* Success Rate */}
      <StatisticCard
        description={"Completion ratio"}
        icon={<Percent aria-hidden={"true"} className={"size-5"} />}
        iconColorClass={"bg-accent/10 text-accent"}
        isLoading={isLoading}
        title={"Success Rate"}
        value={`${successRate}%`}
      />

      {/* Average Duration */}
      <StatisticCard
        description={"Per workflow"}
        icon={<Clock aria-hidden={"true"} className={"size-5"} />}
        iconColorClass={"bg-accent/10 text-accent"}
        isLoading={isLoading}
        title={"Avg Duration"}
        value={formatDuration(averageDurationMs)}
      />
    </div>
  );
};
