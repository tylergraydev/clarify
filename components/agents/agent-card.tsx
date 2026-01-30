"use client";

import type { ComponentPropsWithRef } from "react";

import { Copy, FolderPlus, Pencil, RotateCcw, Trash2 } from "lucide-react";

import type { Agent } from "@/db/schema";

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
import { Switch } from "@/components/ui/switch";
import { getAgentColorClass } from "@/lib/colors/agent-colors";
import { cn } from "@/lib/utils";

type AgentType = Agent["type"];
type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

const getTypeVariant = (type: AgentType): BadgeVariant => {
  const typeVariantMap: Record<string, BadgeVariant> = {
    planning: "planning",
    review: "review",
    specialist: "specialist",
    utility: "default",
  };

  return typeVariantMap[type ?? ""] ?? "default";
};

const formatTypeLabel = (type: AgentType): string => {
  if (!type) return "Unknown";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

interface AgentCardProps extends Omit<
  ComponentPropsWithRef<"div">,
  "onClick" | "onReset"
> {
  agent: Agent;
  isCreatingOverride?: boolean;
  isDeleting?: boolean;
  isDuplicating?: boolean;
  isResetting?: boolean;
  isToggling?: boolean;
  onCreateOverride?: (agent: Agent) => void;
  onDelete?: (agentId: number) => void;
  onDuplicate?: (agent: Agent) => void;
  onEdit?: (agentId: number) => void;
  onReset?: (agentId: number) => void;
  onToggleActive?: (agentId: number, isActive: boolean) => void;
  /** The currently selected project ID, used to determine if override action is available */
  selectedProjectId?: null | number;
}

export const AgentCard = ({
  agent,
  className,
  isCreatingOverride = false,
  isDeleting = false,
  isDuplicating = false,
  isResetting = false,
  isToggling = false,
  onCreateOverride,
  onDelete,
  onDuplicate,
  onEdit,
  onReset,
  onToggleActive,
  ref,
  selectedProjectId,
  ...props
}: AgentCardProps) => {
  const isActive = agent.deactivatedAt === null;
  const isCustomAgent = agent.builtInAt === null;
  const isCustomized = agent.parentAgentId !== null;
  const isGlobalAgent = agent.projectId === null;
  const isProjectScoped = agent.projectId !== null;

  // Show override action only for global agents when a project is selected
  const isOverrideAvailable =
    isGlobalAgent &&
    selectedProjectId !== null &&
    selectedProjectId !== undefined;

  const handleCreateOverrideClick = () => {
    onCreateOverride?.(agent);
  };

  const handleDeleteClick = () => {
    onDelete?.(agent.id);
  };

  const handleDuplicateClick = () => {
    onDuplicate?.(agent);
  };

  const handleEditClick = () => {
    onEdit?.(agent.id);
  };

  const handleResetClick = () => {
    onReset?.(agent.id);
  };

  const handleToggleChange = (checked: boolean) => {
    onToggleActive?.(agent.id, checked);
  };

  const isActionDisabled =
    isCreatingOverride ||
    isDeleting ||
    isDuplicating ||
    isResetting ||
    isToggling;

  return (
    <Card
      className={cn(
        "flex flex-col transition-opacity",
        !isActive && "opacity-60",
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Header */}
      <CardHeader className={"overflow-hidden"}>
        <div
          className={"flex items-start justify-between gap-2 overflow-hidden"}
        >
          <div className={"flex min-w-0 flex-1 items-center gap-2"}>
            {/* Color Indicator */}
            <div
              aria-hidden={"true"}
              className={cn(
                "size-3 shrink-0 rounded-full",
                getAgentColorClass(agent.color)
              )}
            />
            <CardTitle className={"truncate"}>{agent.displayName}</CardTitle>
          </div>
          <Badge className={"shrink-0"} variant={getTypeVariant(agent.type)}>
            {formatTypeLabel(agent.type)}
          </Badge>
        </div>
        {agent.description && (
          <CardDescription className={"line-clamp-2"}>
            {agent.description}
          </CardDescription>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className={"flex flex-1 flex-col gap-3"}>
        {/* Status Indicator */}
        <div className={"flex items-center justify-between"}>
          <span className={"text-sm text-muted-foreground"}>
            {isActive ? "Active" : "Deactivated"}
          </span>
          <Switch
            aria-label={isActive ? "Deactivate agent" : "Activate agent"}
            checked={isActive}
            disabled={isToggling}
            onCheckedChange={handleToggleChange}
            size={"sm"}
          />
        </div>

        {/* Agent Origin Indicator */}
        <div className={"flex items-center gap-1"}>
          {isProjectScoped && (
            <Badge size={"sm"} variant={"project"}>
              {"Project"}
            </Badge>
          )}
          {isCustomAgent && (
            <Badge size={"sm"} variant={"custom"}>
              {"Custom"}
            </Badge>
          )}
          {isCustomized && (
            <Badge size={"sm"} variant={"default"}>
              {"Customized"}
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className={"gap-2"}>
        <Button
          aria-label={"Edit agent"}
          disabled={isActionDisabled}
          onClick={handleEditClick}
          size={"sm"}
          variant={"outline"}
        >
          <Pencil aria-hidden={"true"} className={"size-4"} />
          {"Edit"}
        </Button>
        <Button
          aria-label={"Duplicate agent"}
          disabled={isActionDisabled}
          onClick={handleDuplicateClick}
          size={"sm"}
          variant={"ghost"}
        >
          <Copy aria-hidden={"true"} className={"size-4"} />
          {"Duplicate"}
        </Button>
        {isOverrideAvailable && (
          <Button
            aria-label={"Create project override for this agent"}
            disabled={isActionDisabled}
            onClick={handleCreateOverrideClick}
            size={"sm"}
            variant={"ghost"}
          >
            <FolderPlus aria-hidden={"true"} className={"size-4"} />
            {"Override"}
          </Button>
        )}
        {isCustomized && (
          <Button
            aria-label={"Reset agent to default"}
            disabled={isActionDisabled}
            onClick={handleResetClick}
            size={"sm"}
            variant={"ghost"}
          >
            <RotateCcw aria-hidden={"true"} className={"size-4"} />
            {"Reset"}
          </Button>
        )}
        {isCustomAgent && (
          <Button
            aria-label={"Delete agent"}
            disabled={isActionDisabled}
            onClick={handleDeleteClick}
            size={"sm"}
            variant={"ghost"}
          >
            <Trash2
              aria-hidden={"true"}
              className={"size-4 text-destructive"}
            />
            {"Delete"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
