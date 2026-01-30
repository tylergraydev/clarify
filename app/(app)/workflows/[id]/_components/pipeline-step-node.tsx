"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";

import { cva, type VariantProps } from "class-variance-authority";
import {
  Bot,
  Code,
  GitBranch,
  ListTodo,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";

import type {
  stepStatuses,
  stepTypes,
} from "@/db/schema/workflow-steps.schema";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import { StepStatusBadge } from "./step-status-badge";

type StepStatus = (typeof stepStatuses)[number];
type StepType = (typeof stepTypes)[number];

const stepTypeIconMap: Record<StepType, ReactNode> = {
  clarification: <MessageSquare aria-hidden={"true"} className={"size-4"} />,
  discovery: <Search aria-hidden={"true"} className={"size-4"} />,
  gemini_review: <Bot aria-hidden={"true"} className={"size-4"} />,
  implementation: <Code aria-hidden={"true"} className={"size-4"} />,
  planning: <ListTodo aria-hidden={"true"} className={"size-4"} />,
  quality_gate: <Shield aria-hidden={"true"} className={"size-4"} />,
  refinement: <Sparkles aria-hidden={"true"} className={"size-4"} />,
  routing: <GitBranch aria-hidden={"true"} className={"size-4"} />,
};

export const pipelineStepNodeVariants = cva(
  `
    relative flex flex-col rounded-lg border transition-colors
  `,
  {
    defaultVariants: {
      state: "default",
    },
    variants: {
      state: {
        active: `
          border-purple-500/50 bg-purple-500/5
          dark:border-purple-400/50 dark:bg-purple-500/10
        `,
        completed: `
          border-green-500/30 bg-green-500/5
          dark:border-green-400/30 dark:bg-green-500/10
        `,
        default: `
          border-border bg-card
          hover:border-border/80
        `,
        failed: `
          border-red-500/30 bg-red-500/5
          dark:border-red-400/30 dark:bg-red-500/10
        `,
      },
    },
  }
);

/**
 * Map step status to component state variant.
 */
const getStateFromStatus = (
  status: StepStatus
): NonNullable<VariantProps<typeof pipelineStepNodeVariants>["state"]> => {
  switch (status) {
    case "completed":
      return "completed";
    case "editing":
    case "running":
      return "active";
    case "failed":
      return "failed";
    default:
      return "default";
  }
};

interface PipelineStepNodeProps
  extends
    Omit<ComponentPropsWithRef<"div">, "children">,
    VariantProps<typeof pipelineStepNodeVariants> {
  children?: ReactNode;
  isDefaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  status: StepStatus;
  stepNumber: number;
  stepType: StepType;
  title: string;
}

export const PipelineStepNode = ({
  children,
  className,
  isDefaultOpen = false,
  onOpenChange,
  ref,
  state,
  status,
  stepNumber,
  stepType,
  title,
  ...props
}: PipelineStepNodeProps) => {
  const resolvedState = state ?? getStateFromStatus(status);
  const stepIcon = stepTypeIconMap[stepType];
  const isActive = status === "running" || status === "editing";

  return (
    <div
      className={cn(
        pipelineStepNodeVariants({ className, state: resolvedState })
      )}
      ref={ref}
      {...props}
    >
      <Collapsible defaultOpen={isDefaultOpen} onOpenChange={onOpenChange}>
        {/* Step Header */}
        <CollapsibleTrigger
          className={`
            flex w-full items-center gap-3 rounded-t-lg p-3
            hover:bg-muted/50
          `}
          variant={"ghost"}
        >
          {/* Step Number */}
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
              isActive
                ? "bg-purple-500/20 text-purple-700 dark:text-purple-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            {stepNumber}
          </span>

          {/* Step Type Icon */}
          <span
            className={cn(
              "flex shrink-0 items-center text-muted-foreground",
              isActive && "text-purple-700 dark:text-purple-400"
            )}
          >
            {stepIcon}
          </span>

          {/* Step Title */}
          <span className={"flex-1 truncate text-left text-sm font-medium"}>
            {title}
          </span>

          {/* Status Badge */}
          <StepStatusBadge className={"shrink-0"} status={status} />
        </CollapsibleTrigger>

        {/* Step Details */}
        {children && (
          <CollapsibleContent>
            <div className={"border-t border-border p-3"}>{children}</div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};
