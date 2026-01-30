"use client";

import type { ComponentPropsWithRef } from "react";

import { differenceInHours, differenceInMinutes, parseISO } from "date-fns";
import {
  Clock,
  Eye,
  FileCode,
  GitBranch,
  Pause,
  Play,
  XCircle,
} from "lucide-react";
import { Fragment } from "react";

import type { Workflow } from "@/types/electron";

import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ActiveWorkflowCardProps extends Omit<
  ComponentPropsWithRef<"div">,
  "onClick"
> {
  currentStepName?: null | string;
  isCancelPending?: boolean;
  isPausePending?: boolean;
  isResumePending?: boolean;
  onCancelWorkflow?: (workflowId: number) => void;
  onPauseWorkflow?: (workflowId: number) => void;
  onResumeWorkflow?: (workflowId: number) => void;
  onViewWorkflow?: (workflowId: number) => void;
  projectName?: string;
  workflow: Workflow;
}

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

type WorkflowStatus = Workflow["status"];

// ============================================================================
// Constants
// ============================================================================

const CANCELLABLE_STATUSES: Array<WorkflowStatus> = [
  "created",
  "paused",
  "running",
];

const PAUSABLE_STATUSES: Array<WorkflowStatus> = ["running"];

const RESUMABLE_STATUSES: Array<WorkflowStatus> = ["paused"];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Maps workflow status to badge variant
 */
const getStatusVariant = (status: WorkflowStatus): BadgeVariant => {
  const statusVariantMap: Record<WorkflowStatus, BadgeVariant> = {
    cancelled: "stale",
    completed: "completed",
    created: "default",
    editing: "clarifying",
    failed: "failed",
    paused: "draft",
    running: "planning",
  };

  return statusVariantMap[status] ?? "default";
};

/**
 * Formats status for display
 */
const formatStatusLabel = (status: WorkflowStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Formats elapsed time from a start date to now in a human-readable format
 */
const formatElapsedTime = (startedAt: null | string): string => {
  if (!startedAt) {
    return "Not started";
  }

  const startDate = parseISO(startedAt);
  const now = new Date();
  const hours = differenceInHours(now, startDate);
  const minutes = differenceInMinutes(now, startDate) % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

/**
 * Calculates progress percentage from current step and total steps
 */
const calculateProgress = (
  currentStep: null | number | undefined,
  totalSteps: null | number | undefined
): number => {
  if (!currentStep || !totalSteps || totalSteps === 0) {
    return 0;
  }

  return Math.round((currentStep / totalSteps) * 100);
};

/**
 * Renders the appropriate icon for workflow type
 */
const WorkflowTypeIcon = ({
  className,
  type,
}: {
  className?: string;
  type: string;
}) => {
  const iconClassName =
    className ?? "mt-0.5 size-5 shrink-0 text-muted-foreground";

  if (type === "implementation") {
    return <FileCode aria-hidden={"true"} className={iconClassName} />;
  }

  return <GitBranch aria-hidden={"true"} className={iconClassName} />;
};

// ============================================================================
// Component
// ============================================================================

export const ActiveWorkflowCard = ({
  className,
  currentStepName,
  isCancelPending = false,
  isPausePending = false,
  isResumePending = false,
  onCancelWorkflow,
  onPauseWorkflow,
  onResumeWorkflow,
  onViewWorkflow,
  projectName,
  ref,
  workflow,
  ...props
}: ActiveWorkflowCardProps) => {
  const isPausable = PAUSABLE_STATUSES.includes(
    workflow.status as WorkflowStatus
  );
  const isResumable = RESUMABLE_STATUSES.includes(
    workflow.status as WorkflowStatus
  );
  const isCancellable = CANCELLABLE_STATUSES.includes(
    workflow.status as WorkflowStatus
  );

  const progress = calculateProgress(
    workflow.currentStepNumber,
    workflow.totalSteps
  );
  const elapsedTime = formatElapsedTime(workflow.startedAt);

  const handleViewClick = () => {
    onViewWorkflow?.(workflow.id);
  };

  const handlePauseClick = () => {
    onPauseWorkflow?.(workflow.id);
  };

  const handleResumeClick = () => {
    onResumeWorkflow?.(workflow.id);
  };

  const handleCancelClick = () => {
    onCancelWorkflow?.(workflow.id);
  };

  return (
    <Card
      aria-label={`${workflow.featureName} workflow - ${formatStatusLabel(workflow.status as WorkflowStatus)}`}
      className={cn(
        "flex flex-col transition-all duration-150",
        "hover:border-accent hover:shadow-sm",
        "focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20",
        className
      )}
      ref={ref}
      role={"article"}
      {...props}
    >
      {/* Header */}
      <CardHeader>
        <div className={"flex items-start justify-between gap-2"}>
          <div className={"flex min-w-0 flex-1 items-start gap-2"}>
            <WorkflowTypeIcon type={workflow.type} />
            <div className={"min-w-0 flex-1"}>
              <CardTitle className={"line-clamp-1"}>
                {workflow.featureName}
              </CardTitle>
              {projectName && (
                <p className={"line-clamp-1 text-sm text-muted-foreground"}>
                  {projectName}
                </p>
              )}
            </div>
          </div>
          <Badge variant={getStatusVariant(workflow.status as WorkflowStatus)}>
            {formatStatusLabel(workflow.status as WorkflowStatus)}
          </Badge>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className={"flex flex-1 flex-col gap-3"}>
        {/* Progress Bar with Step Indicator */}
        <div className={"flex flex-col gap-1.5"}>
          <div className={"flex items-center justify-between gap-2"}>
            <span
              className={
                "min-w-0 flex-1 truncate text-xs text-muted-foreground"
              }
            >
              {"Step "}
              {workflow.currentStepNumber ?? 0}
              {" of "}
              {workflow.totalSteps ?? "?"}
              {workflow.currentStepNumber && workflow.totalSteps && (
                <Fragment>
                  {": "}
                  <span
                    className={"font-medium text-foreground"}
                    title={
                      currentStepName ??
                      getStepLabel(workflow.currentStepNumber)
                    }
                  >
                    {currentStepName ??
                      getStepLabel(workflow.currentStepNumber)}
                  </span>
                </Fragment>
              )}
            </span>
            <span className={"shrink-0 text-xs font-medium"}>
              {progress}
              {"%"}
            </span>
          </div>
          <div
            aria-label={`Workflow progress: ${progress}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className={"h-2 w-full overflow-hidden rounded-full bg-muted"}
            role={"progressbar"}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                workflow.status === "running" && "bg-accent",
                workflow.status === "paused" && "bg-yellow-500",
                workflow.status === "completed" && "bg-green-500",
                workflow.status === "failed" && "bg-destructive",
                !["completed", "failed", "paused", "running"].includes(
                  workflow.status
                ) && "bg-accent"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Elapsed Time */}
        <div
          className={"flex items-center gap-1 text-xs text-muted-foreground"}
        >
          <Clock aria-hidden={"true"} className={"size-3"} />
          <span>
            {"Elapsed: "}
            {elapsedTime}
          </span>
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className={"flex-wrap gap-2"}>
        {/* View Button */}
        <Button
          aria-label={"View workflow details"}
          onClick={handleViewClick}
          size={"sm"}
          variant={"outline"}
        >
          <Eye aria-hidden={"true"} className={"size-4"} />
          {"View"}
        </Button>

        {/* Pause Button - Shows for running workflows */}
        {isPausable && (
          <Button
            aria-label={"Pause workflow"}
            disabled={isPausePending}
            onClick={handlePauseClick}
            size={"sm"}
            variant={"outline"}
          >
            <Pause aria-hidden={"true"} className={"size-4"} />
            {isPausePending ? "Pausing..." : "Pause"}
          </Button>
        )}

        {/* Resume Button - Shows for paused workflows */}
        {isResumable && (
          <Button
            aria-label={"Resume workflow"}
            disabled={isResumePending}
            onClick={handleResumeClick}
            size={"sm"}
            variant={"outline"}
          >
            <Play aria-hidden={"true"} className={"size-4"} />
            {isResumePending ? "Resuming..." : "Resume"}
          </Button>
        )}

        {/* Cancel Button - Shows for cancellable statuses */}
        {isCancellable && (
          <Button
            aria-label={"Cancel workflow"}
            disabled={isCancelPending}
            onClick={handleCancelClick}
            size={"sm"}
            variant={"destructive"}
          >
            <XCircle aria-hidden={"true"} className={"size-4"} />
            {isCancelPending ? "Cancelling..." : "Cancel"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Returns a human-readable label for the current step
 * This maps step numbers to meaningful step names based on workflow type
 */
const getStepLabel = (stepNumber: number): string => {
  // Planning workflow steps
  const planningSteps: Record<number, string> = {
    1: "Clarification",
    2: "Refinement",
    3: "File Discovery",
    4: "Plan Generation",
    5: "Review",
  };

  // Implementation workflow steps
  const implementationSteps: Record<number, string> = {
    1: "Routing",
    2: "Specialist Work",
    3: "Quality Gate",
    4: "Integration",
    5: "Verification",
  };

  // Default to planning steps, but this could be enhanced
  // to use workflow.type to determine which mapping to use
  return (
    planningSteps[stepNumber] ??
    implementationSteps[stepNumber] ??
    `Step ${stepNumber}`
  );
};
