"use client";

import type { ComponentPropsWithRef, RefObject } from "react";

import { AlertCircle, Bot } from "lucide-react";
import { useRef } from "react";

import type { Agent } from "@/types/electron";

import { AgentCard } from "@/components/agents/agent-card";
import { ProjectAgentEditorDialog } from "@/components/projects/project-agent-editor-dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useActivateAgent,
  useAgents,
  useAgentsByProject,
  useDeactivateAgent,
  useResetAgent,
} from "@/hooks/queries/use-agents";
import { cn } from "@/lib/utils";

interface SettingsTabContentProps extends ComponentPropsWithRef<"div"> {
  /** The ID of the project to display settings for */
  projectId: number;
}

/**
 * Settings tab content for project detail page.
 * Displays project-specific agent configurations grouped by type.
 */
export const SettingsTabContent = ({
  className,
  projectId,
  ref,
  ...props
}: SettingsTabContentProps) => {
  const {
    data: projectAgents,
    error: projectAgentsError,
    isLoading: isProjectAgentsLoading,
  } = useAgentsByProject(projectId);
  const {
    data: globalAgents,
    error: globalAgentsError,
    isLoading: isGlobalAgentsLoading,
  } = useAgents();

  const activateAgentMutation = useActivateAgent();
  const deactivateAgentMutation = useDeactivateAgent();
  const resetAgentMutation = useResetAgent();

  const handleToggleActive = (agentId: number, isActive: boolean) => {
    if (isActive) {
      activateAgentMutation.mutate(agentId);
    } else {
      deactivateAgentMutation.mutate(agentId);
    }
  };

  const handleReset = (agentId: number) => {
    resetAgentMutation.mutate(agentId);
  };

  // Derived state
  const isLoading = isProjectAgentsLoading || isGlobalAgentsLoading;
  const hasError = !isLoading && (projectAgentsError || globalAgentsError);
  const isTogglingAgent =
    activateAgentMutation.isPending || deactivateAgentMutation.isPending;
  const isResettingAgent = resetAgentMutation.isPending;

  // Build a map of project-specific agent overrides keyed by parentAgentId
  const projectAgentOverrides = new Map<number, Agent>();
  projectAgents?.forEach((agent) => {
    if (agent.parentAgentId !== null) {
      projectAgentOverrides.set(agent.parentAgentId, agent);
    }
  });

  // Get global agents (those without projectId) filtered to exclude deactivated
  const activeGlobalAgents =
    globalAgents?.filter(
      (agent) => agent.projectId === null && agent.deactivatedAt === null
    ) ?? [];

  // Group global agents by type
  const agentGroups = {
    planning: activeGlobalAgents.filter((agent) => agent.type === "planning"),
    review: activeGlobalAgents.filter((agent) => agent.type === "review"),
    specialist: activeGlobalAgents.filter(
      (agent) => agent.type === "specialist"
    ),
  };

  const hasAgents = activeGlobalAgents.length > 0;
  const isAgentsEmpty = !isLoading && !hasError && !hasAgents;

  // Loading State
  if (isLoading) {
    return (
      <div
        className={cn("flex flex-col gap-6", className)}
        ref={ref}
        {...props}
      >
        {/* Section Skeleton */}
        {["Planning Agents", "Specialist Agents", "Review Agents"].map(
          (title) => (
            <div className={"space-y-4"} key={title}>
              <div className={"h-6 w-40 animate-pulse rounded-sm bg-muted"} />
              <div className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
                {Array.from({ length: 2 }).map((_, index) => (
                  <AgentCardSkeleton key={index} />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  // Error State
  if (hasError) {
    return (
      <div
        className={cn("flex flex-col gap-4", className)}
        ref={ref}
        {...props}
      >
        <EmptyState
          description={"Failed to load agent configurations. Please try again."}
          icon={<AlertCircle aria-hidden={"true"} className={"size-6"} />}
          title={"Error Loading Settings"}
        />
      </div>
    );
  }

  // Empty State
  if (isAgentsEmpty) {
    return (
      <div
        className={cn("flex flex-col gap-4", className)}
        ref={ref}
        {...props}
      >
        <EmptyState
          description={
            "No agents are available to configure. Agents will appear here once they are set up."
          }
          icon={<Bot aria-hidden={"true"} className={"size-6"} />}
          title={"No Agents Available"}
        />
      </div>
    );
  }

  // Content State
  return (
    <div className={cn("flex flex-col gap-8", className)} ref={ref} {...props}>
      {/* Header Description */}
      <div className={"space-y-1"}>
        <p className={"text-sm text-muted-foreground"}>
          {
            "Customize agent configurations for this project. Changes here override the global agent settings."
          }
        </p>
      </div>

      {/* Planning Agents Section */}
      {agentGroups.planning.length > 0 && (
        <AgentSection
          agents={agentGroups.planning}
          isResetting={isResettingAgent}
          isToggling={isTogglingAgent}
          onReset={handleReset}
          onToggleActive={handleToggleActive}
          projectAgentOverrides={projectAgentOverrides}
          projectId={projectId}
          title={"Planning Agents"}
        />
      )}

      {/* Specialist Agents Section */}
      {agentGroups.specialist.length > 0 && (
        <AgentSection
          agents={agentGroups.specialist}
          isResetting={isResettingAgent}
          isToggling={isTogglingAgent}
          onReset={handleReset}
          onToggleActive={handleToggleActive}
          projectAgentOverrides={projectAgentOverrides}
          projectId={projectId}
          title={"Specialist Agents"}
        />
      )}

      {/* Review Agents Section */}
      {agentGroups.review.length > 0 && (
        <AgentSection
          agents={agentGroups.review}
          isResetting={isResettingAgent}
          isToggling={isTogglingAgent}
          onReset={handleReset}
          onToggleActive={handleToggleActive}
          projectAgentOverrides={projectAgentOverrides}
          projectId={projectId}
          title={"Review Agents"}
        />
      )}
    </div>
  );
};

interface AgentSectionProps {
  agents: Array<Agent>;
  isResetting: boolean;
  isToggling: boolean;
  onReset: (agentId: number) => void;
  onToggleActive: (agentId: number, isActive: boolean) => void;
  projectAgentOverrides: Map<number, Agent>;
  projectId: number;
  title: string;
}

/**
 * Renders a section of agents grouped by type.
 */
const AgentSection = ({
  agents,
  isResetting,
  isToggling,
  onReset,
  onToggleActive,
  projectAgentOverrides,
  projectId,
  title,
}: AgentSectionProps) => {
  return (
    <section className={"space-y-4"}>
      {/* Section Header */}
      <h2 className={"text-lg font-semibold text-foreground"}>{title}</h2>

      {/* Agent Cards Grid */}
      <div className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
        {agents.map((globalAgent) => {
          // Check if there's a project-specific override for this agent
          const projectOverride = projectAgentOverrides.get(globalAgent.id);
          // Use the project override if it exists, otherwise use the global agent
          const displayAgent = projectOverride ?? globalAgent;
          const isCustomized = projectOverride !== undefined;

          return (
            <AgentGridItem
              agent={displayAgent}
              globalAgent={globalAgent}
              isCustomized={isCustomized}
              isResetting={isResetting}
              isToggling={isToggling}
              key={globalAgent.id}
              onReset={onReset}
              onToggleActive={onToggleActive}
              projectId={projectId}
            />
          );
        })}
      </div>
    </section>
  );
};

interface AgentGridItemProps {
  agent: Agent;
  globalAgent: Agent;
  isCustomized: boolean;
  isResetting: boolean;
  isToggling: boolean;
  onReset: (agentId: number) => void;
  onToggleActive: (agentId: number, isActive: boolean) => void;
  projectId: number;
}

/**
 * Renders an AgentCard with a ProjectAgentEditorDialog.
 * The Edit button in the card triggers the dialog via a hidden trigger element.
 */
const AgentGridItem = ({
  agent,
  globalAgent,
  isCustomized,
  isResetting,
  isToggling,
  onReset,
  onToggleActive,
  projectId,
}: AgentGridItemProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleEditClick = () => {
    // Programmatically click the hidden dialog trigger
    triggerRef.current?.click();
  };

  return (
    <div className={"relative"}>
      {/* Customization Indicator Overlay */}
      {isCustomized && (
        <div
          className={
            "absolute -top-2 -right-2 z-10 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm"
          }
        >
          {"Customized"}
        </div>
      )}

      <AgentCard
        agent={agent}
        isResetting={isResetting}
        isToggling={isToggling}
        onEdit={handleEditClick}
        onReset={onReset}
        onToggleActive={onToggleActive}
      />

      {/* Hidden dialog trigger */}
      <ProjectAgentEditorDialog
        agent={globalAgent}
        projectId={projectId}
        trigger={
          <button
            aria-hidden={"true"}
            className={"sr-only"}
            ref={triggerRef as RefObject<HTMLButtonElement>}
            tabIndex={-1}
            type={"button"}
          >
            {"Edit agent"}
          </button>
        }
      />
    </div>
  );
};

/**
 * Skeleton loading placeholder for an agent card.
 */
export const AgentCardSkeleton = () => {
  return (
    <Card className={"animate-pulse"}>
      {/* Header */}
      <CardHeader>
        <div className={"flex items-start justify-between gap-2"}>
          <div className={"flex items-center gap-2"}>
            {/* Color indicator */}
            <div className={"size-3 shrink-0 rounded-full bg-muted"} />
            {/* Title */}
            <div className={"h-5 w-32 rounded-sm bg-muted"} />
          </div>
          {/* Type badge */}
          <div className={"h-5 w-16 rounded-full bg-muted"} />
        </div>
        {/* Description */}
        <div className={"mt-1.5 space-y-1"}>
          <div className={"h-4 w-full rounded-sm bg-muted"} />
          <div className={"h-4 w-3/4 rounded-sm bg-muted"} />
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className={"flex flex-1 flex-col gap-3"}>
        {/* Status row with label and switch */}
        <div className={"flex items-center justify-between"}>
          <div className={"h-4 w-16 rounded-sm bg-muted"} />
          <div className={"h-5 w-9 rounded-full bg-muted"} />
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className={"gap-2"}>
        {/* Edit button */}
        <div className={"h-8 w-16 rounded-md bg-muted"} />
        {/* Reset button */}
        <div className={"h-8 w-16 rounded-md bg-muted"} />
      </CardFooter>
    </Card>
  );
};
