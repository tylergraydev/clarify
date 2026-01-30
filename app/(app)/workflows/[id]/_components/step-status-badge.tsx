"use client";

import type { ComponentPropsWithRef } from "react";

import type { stepStatuses } from "@/db/schema/workflow-steps.schema";

import { Badge, type badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

type StepStatus = (typeof stepStatuses)[number];

const stepStatusVariantMap: Record<StepStatus, BadgeVariant> = {
  completed: "completed",
  editing: "clarifying",
  failed: "failed",
  paused: "draft",
  pending: "default",
  running: "planning",
  skipped: "stale",
};

/**
 * Get the badge variant for a given step status.
 * @param status - The step status value
 * @returns The corresponding badge variant
 */
export const getStepStatusVariant = (status: StepStatus): BadgeVariant => {
  return stepStatusVariantMap[status] ?? "default";
};

/**
 * Format the step status label for display.
 * @param status - The step status value
 * @returns The formatted label with first letter capitalized
 */
const formatStepStatusLabel = (status: StepStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

interface StepStatusBadgeProps extends Omit<
  ComponentPropsWithRef<typeof Badge>,
  "variant"
> {
  status: StepStatus;
}

export const StepStatusBadge = ({
  ref,
  status,
  ...props
}: StepStatusBadgeProps) => {
  return (
    <Badge ref={ref} variant={getStepStatusVariant(status)} {...props}>
      {formatStepStatusLabel(status)}
    </Badge>
  );
};
