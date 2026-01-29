"use client";

import type { ComponentPropsWithRef } from "react";

import { formatDistanceToNow } from "date-fns";
import { Eye, X } from "lucide-react";

import type { Workflow } from "@/types/electron";

import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BadgeVariant = NonNullable<
  Parameters<typeof badgeVariants>[0]
>["variant"];

type WorkflowStatus = Workflow["status"];

const CANCELLABLE_STATUSES: Array<WorkflowStatus> = [
  "created",
  "running",
  "paused",
];

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

const formatStatusLabel = (status: WorkflowStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

interface WorkflowCardProps
  extends Omit<ComponentPropsWithRef<"div">, "onClick"> {
  onCancel?: (workflowId: number) => void;
  onViewDetails?: (workflowId: number) => void;
  projectName?: string;
  workflow: Workflow;
}

export const WorkflowCard = ({
  className,
  onCancel,
  onViewDetails,
  projectName,
  ref,
  workflow,
  ...props
}: WorkflowCardProps) => {
  const isCancellable = CANCELLABLE_STATUSES.includes(
    workflow.status as WorkflowStatus
  );

  const handleCancelClick = () => {
    onCancel?.(workflow.id);
  };

  const handleViewDetailsClick = () => {
    onViewDetails?.(workflow.id);
  };

  const progressPercentage =
    workflow.totalSteps && workflow.totalSteps > 0
      ? Math.round(
          ((workflow.currentStepNumber ?? 0) / workflow.totalSteps) * 100
        )
      : 0;

  const elapsedTime = workflow.startedAt
    ? formatDistanceToNow(new Date(workflow.startedAt), { addSuffix: false })
    : null;

  const createdDate = formatDistanceToNow(new Date(workflow.createdAt), {
    addSuffix: true,
  });

  return (
    <Card
      className={cn("flex flex-col transition-opacity", className)}
      ref={ref}
      {...props}
    >
      {/* Header */}
      <CardHeader>
        <div className={"flex items-start justify-between gap-2"}>
          <CardTitle className={"line-clamp-1"}>
            {workflow.featureName}
          </CardTitle>
          <Badge variant={getStatusVariant(workflow.status as WorkflowStatus)}>
            {formatStatusLabel(workflow.status as WorkflowStatus)}
          </Badge>
        </div>
        {projectName && (
          <CardDescription className={"line-clamp-1"}>
            {projectName}
          </CardDescription>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className={"flex flex-1 flex-col gap-3"}>
        {/* Workflow Type */}
        <div className={"flex items-center gap-2"}>
          <span className={"text-xs text-muted-foreground"}>{"Type:"}</span>
          <Badge size={"sm"} variant={"default"}>
            {workflow.type.charAt(0).toUpperCase() + workflow.type.slice(1)}
          </Badge>
        </div>

        {/* Progress */}
        <div className={"flex flex-col gap-1.5"}>
          <div className={"flex items-center justify-between"}>
            <span className={"text-xs text-muted-foreground"}>
              {"Progress"}
            </span>
            <span className={"text-xs font-medium"}>
              {workflow.currentStepNumber ?? 0}
              {"/"}
              {workflow.totalSteps ?? "?"}
              {" ("}
              {progressPercentage}
              {"%)"}
            </span>
          </div>
          <div
            className={
              "h-2 w-full overflow-hidden rounded-full bg-muted"
            }
          >
            <div
              className={cn(
                "h-full rounded-full bg-accent transition-all duration-300",
                workflow.status === "failed" && "bg-destructive",
                workflow.status === "completed" && "bg-green-500"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Timing Info */}
        <div className={"flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"}>
          <span>{"Created "}{createdDate}</span>
          {elapsedTime && (
            <span>{"Duration: "}{elapsedTime}</span>
          )}
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className={"gap-2"}>
        <Button
          aria-label={"View workflow details"}
          onClick={handleViewDetailsClick}
          size={"sm"}
          variant={"outline"}
        >
          <Eye aria-hidden={"true"} className={"size-4"} />
          {"View"}
        </Button>
        {isCancellable && (
          <Button
            aria-label={"Cancel workflow"}
            onClick={handleCancelClick}
            size={"sm"}
            variant={"ghost"}
          >
            <X aria-hidden={"true"} className={"size-4"} />
            {"Cancel"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
