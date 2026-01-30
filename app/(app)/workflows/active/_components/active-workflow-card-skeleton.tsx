"use client";

import type { ComponentPropsWithRef } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type ActiveWorkflowCardSkeletonProps = ComponentPropsWithRef<"div">;

// ============================================================================
// Component
// ============================================================================

export const ActiveWorkflowCardSkeleton = ({
  className,
  ref,
  ...props
}: ActiveWorkflowCardSkeletonProps) => {
  return (
    <Card
      aria-busy={"true"}
      aria-label={"Loading workflow card"}
      className={cn("flex flex-col", className)}
      ref={ref}
      role={"article"}
      {...props}
    >
      {/* Header */}
      <CardHeader>
        <div className={"flex items-start justify-between gap-2"}>
          <div className={"flex min-w-0 flex-1 items-start gap-2"}>
            {/* Workflow Type Icon Placeholder */}
            <div
              className={
                "mt-0.5 size-5 shrink-0 animate-pulse rounded-sm bg-muted"
              }
            />
            <div className={"min-w-0 flex-1 space-y-1.5"}>
              {/* Title Placeholder */}
              <div className={"h-5 w-3/4 animate-pulse rounded-sm bg-muted"} />
              {/* Project Name Placeholder */}
              <div className={"h-4 w-1/2 animate-pulse rounded-sm bg-muted"} />
            </div>
          </div>
          {/* Status Badge Placeholder */}
          <div className={"h-5 w-16 animate-pulse rounded-full bg-muted"} />
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className={"flex flex-1 flex-col gap-3"}>
        {/* Progress Bar with Step Indicator */}
        <div className={"flex flex-col gap-1.5"}>
          <div className={"flex items-center justify-between"}>
            {/* Step Indicator Placeholder */}
            <div className={"h-3 w-28 animate-pulse rounded-sm bg-muted"} />
            {/* Progress Percentage Placeholder */}
            <div className={"h-3 w-8 animate-pulse rounded-sm bg-muted"} />
          </div>
          {/* Progress Bar Placeholder */}
          <div className={"h-2 w-full animate-pulse rounded-full bg-muted"} />
        </div>

        {/* Elapsed Time Placeholder */}
        <div className={"flex items-center gap-1"}>
          {/* Clock Icon Placeholder */}
          <div className={"size-3 animate-pulse rounded-sm bg-muted"} />
          {/* Time Text Placeholder */}
          <div className={"h-3 w-20 animate-pulse rounded-sm bg-muted"} />
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className={"flex-wrap gap-2"}>
        {/* View Button Placeholder */}
        <div className={"h-8 w-16 animate-pulse rounded-md bg-muted"} />
        {/* Additional Action Button Placeholder */}
        <div className={"h-8 w-16 animate-pulse rounded-md bg-muted"} />
        {/* Cancel Button Placeholder */}
        <div className={"h-8 w-18 animate-pulse rounded-md bg-muted"} />
      </CardFooter>
    </Card>
  );
};
