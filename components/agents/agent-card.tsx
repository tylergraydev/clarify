"use client";

import type { ComponentPropsWithRef } from "react";

import { Pencil, RotateCcw } from "lucide-react";

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
  isResetting?: boolean;
  isToggling?: boolean;
  onEdit?: (agentId: number) => void;
  onReset?: (agentId: number) => void;
  onToggleActive?: (agentId: number, isActive: boolean) => void;
}

export const AgentCard = ({
  agent,
  className,
  isResetting = false,
  isToggling = false,
  onEdit,
  onReset,
  onToggleActive,
  ref,
  ...props
}: AgentCardProps) => {
  const isActive = agent.deactivatedAt === null;
  const isCustomized = agent.parentAgentId !== null;

  const handleEditClick = () => {
    onEdit?.(agent.id);
  };

  const handleResetClick = () => {
    onReset?.(agent.id);
  };

  const handleToggleChange = (checked: boolean) => {
    onToggleActive?.(agent.id, checked);
  };

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
      <CardHeader>
        <div className={"flex items-start justify-between gap-2"}>
          <div className={"flex items-center gap-2"}>
            {/* Color Indicator */}
            <div
              aria-hidden={"true"}
              className={cn(
                "size-3 shrink-0 rounded-full",
                getAgentColorClass(agent.color)
              )}
            />
            <CardTitle className={"line-clamp-1"}>
              {agent.displayName}
            </CardTitle>
          </div>
          <Badge variant={getTypeVariant(agent.type)}>
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

        {/* Customization Indicator */}
        {isCustomized && (
          <div className={"flex items-center gap-1"}>
            <Badge size={"sm"} variant={"default"}>
              {"Customized"}
            </Badge>
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className={"gap-2"}>
        <Button
          aria-label={"Edit agent"}
          disabled={isToggling || isResetting}
          onClick={handleEditClick}
          size={"sm"}
          variant={"outline"}
        >
          <Pencil aria-hidden={"true"} className={"size-4"} />
          {"Edit"}
        </Button>
        {isCustomized && (
          <Button
            aria-label={"Reset agent to default"}
            disabled={isToggling || isResetting}
            onClick={handleResetClick}
            size={"sm"}
            variant={"ghost"}
          >
            <RotateCcw aria-hidden={"true"} className={"size-4"} />
            {"Reset"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
