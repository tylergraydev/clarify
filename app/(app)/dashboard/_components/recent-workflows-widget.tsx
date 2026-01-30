"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { CheckCircle, Clock, History, Plus, XCircle } from "lucide-react";
import { $path } from "next-typesafe-url";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useMemo } from "react";

import type { Project, Workflow } from "@/types/electron";

import { QueryErrorBoundary } from "@/components/data/query-error-boundary";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useProjects } from "@/hooks/queries/use-projects";
import { useWorkflows } from "@/hooks/queries/use-workflows";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type RecentWorkflowsWidgetProps = ClassName;

type WorkflowItemProps = ClassName<{
  onClick: () => void;
  projectName: string;
  workflow: Workflow;
}>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats a timestamp to relative time (e.g., "2 hours ago")
 */
const formatRelativeTime = (timestamp: null | string): string => {
  if (!timestamp) {
    return "Unknown";
  }

  return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
};

/**
 * Formats duration in milliseconds to human-readable format (e.g., "8m 32s")
 */
const formatDuration = (durationMs: null | number): string => {
  if (!durationMs) {
    return "-";
  }

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Maps workflow status to badge variant
 */
const getStatusVariant = (
  status: string
): "completed" | "default" | "failed" => {
  switch (status) {
    case "cancelled":
    case "failed":
      return "failed";
    case "completed":
      return "completed";
    default:
      return "default";
  }
};

/**
 * Formats status for display
 */
const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// ============================================================================
// Status Icon Component
// ============================================================================

/**
 * Renders the appropriate icon for a workflow status
 */
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "cancelled":
    case "failed":
      return <XCircle aria-hidden={"true"} className={"size-3"} />;
    case "completed":
      return <CheckCircle aria-hidden={"true"} className={"size-3"} />;
    default:
      return <Clock aria-hidden={"true"} className={"size-3"} />;
  }
};

// ============================================================================
// Skeleton Components
// ============================================================================

const WorkflowItemSkeleton = () => {
  return (
    <div
      aria-busy={"true"}
      aria-label={"Loading workflow"}
      className={
        "animate-pulse border-b border-card-border p-3 last:border-b-0"
      }
      role={"article"}
    >
      {/* Header Row - matches h4 (text-sm font-medium) + p (text-xs) */}
      <div className={"flex items-center justify-between gap-2"}>
        <div className={"min-w-0 flex-1 space-y-1"}>
          <div className={"h-4 w-40 rounded-sm bg-muted"} />
          <div className={"h-3 w-24 rounded-sm bg-muted"} />
        </div>
        <div className={"h-5 w-16 rounded-full bg-muted"} />
      </div>

      {/* Footer Row - matches mt-2 text-xs layout with icon */}
      <div className={"mt-2 flex items-center justify-between"}>
        <div className={"flex items-center gap-1"}>
          <div className={"size-3 rounded-sm bg-muted"} />
          <div className={"h-3 w-16 rounded-sm bg-muted"} />
        </div>
        <div className={"h-3 w-14 rounded-sm bg-muted"} />
      </div>
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div
      aria-busy={"true"}
      aria-label={"Loading recent workflows"}
      aria-live={"polite"}
      className={"-mx-6 -mb-6"}
      role={"status"}
    >
      <WorkflowItemSkeleton />
      <WorkflowItemSkeleton />
      <WorkflowItemSkeleton />
      <WorkflowItemSkeleton />
      <WorkflowItemSkeleton />
    </div>
  );
};

// ============================================================================
// Workflow Item Component
// ============================================================================

const WorkflowItem = ({
  className,
  onClick,
  projectName,
  workflow,
}: WorkflowItemProps) => {
  const statusVariant = getStatusVariant(workflow.status);
  const formattedStatus = formatStatus(workflow.status);
  const relativeTime = formatRelativeTime(workflow.updatedAt);
  const duration = formatDuration(workflow.durationMs);

  const handleClick = () => {
    onClick();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      aria-label={`View workflow: ${workflow.featureName}`}
      className={cn(
        `
          cursor-pointer border-b border-card-border p-3
          transition-all duration-150 last:border-b-0 hover:bg-muted/50
          focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset
          active:bg-muted/70
        `,
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={"button"}
      tabIndex={0}
    >
      {/* Header Row */}
      <div className={"flex items-center justify-between gap-2"}>
        <div className={"min-w-0 flex-1"}>
          <h4 className={"truncate text-sm font-medium"}>
            {workflow.featureName}
          </h4>
          <p className={"text-xs text-muted-foreground"}>{projectName}</p>
        </div>
        <Badge size={"sm"} variant={statusVariant}>
          {formattedStatus}
        </Badge>
      </div>

      {/* Footer Row */}
      <div
        className={
          "mt-2 flex items-center justify-between text-xs text-muted-foreground"
        }
      >
        <span className={"flex items-center gap-1"}>
          <StatusIcon status={workflow.status} />
          {relativeTime}
        </span>
        <span className={"flex items-center gap-3"}>
          <span className={"tabular-nums"}>{duration}</span>
          <span className={"capitalize"}>{workflow.type}</span>
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// Main Widget Content
// ============================================================================

const RecentWorkflowsContent = () => {
  const router = useRouter();
  const { data: workflows = [], isLoading: isWorkflowsLoading } =
    useWorkflows();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  const isLoading = isWorkflowsLoading || isProjectsLoading;

  // Filter for recent workflows (completed, failed, or cancelled) and sort by updatedAt descending
  const recentWorkflows = useMemo(() => {
    return workflows
      .filter(
        (workflow) =>
          workflow.status === "completed" ||
          workflow.status === "failed" ||
          workflow.status === "cancelled"
      )
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [workflows]);

  // Create a map of project IDs to project names
  const projectMap = useMemo(() => {
    return projects.reduce<Record<number, Project>>((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {});
  }, [projects]);

  /**
   * Navigate to workflow detail page
   * Note: Requires /workflows/[id] route to be implemented
   */
  const handleWorkflowClick = (workflowId: number) => {
    router.push(
      $path({
        route: "/workflows/[id]",
        routeParams: { id: String(workflowId) },
      })
    );
  };

  const hasRecentWorkflows = recentWorkflows.length > 0;

  // Loading State
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Empty State
  if (!hasRecentWorkflows) {
    return (
      <EmptyState
        action={
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href={$path({ route: "/workflows/new" })}
          >
            <Plus aria-hidden={"true"} className={"size-4"} />
            Start Workflow
          </Link>
        }
        description={"Completed workflows will appear here."}
        icon={<History aria-hidden={"true"} className={"size-6"} />}
        title={"No recent workflows"}
      />
    );
  }

  // Workflows List
  return (
    <div aria-live={"polite"} className={"-mx-6 -mb-6"}>
      {recentWorkflows.map((workflow) => (
        <WorkflowItem
          key={workflow.id}
          onClick={() => handleWorkflowClick(workflow.id)}
          projectName={
            projectMap[workflow.projectId]?.name ?? "Unknown Project"
          }
          workflow={workflow}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Main Export
// ============================================================================

export const RecentWorkflowsWidget = ({
  className,
}: RecentWorkflowsWidgetProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className={"flex items-center gap-2"}>
          <History
            aria-hidden={"true"}
            className={"size-5 text-muted-foreground"}
          />
          <CardTitle>Recent Workflows</CardTitle>
        </div>
        <CardDescription>
          Recently completed, failed, or cancelled workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QueryErrorBoundary>
          <RecentWorkflowsContent />
        </QueryErrorBoundary>
      </CardContent>
    </Card>
  );
};
