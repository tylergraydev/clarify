"use client";

import type { RefObject } from "react";

import { Bot, Search } from "lucide-react";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import { useRef } from "react";

import type { Agent, AgentListFilters } from "@/types/electron";

import { AgentCard } from "@/components/agents/agent-card";
import { AgentEditorDialog } from "@/components/agents/agent-editor-dialog";
import { QueryErrorBoundary } from "@/components/data/query-error-boundary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { agentTypes } from "@/db/schema/agents.schema";
import {
  useActivateAgent,
  useAgents,
  useDeactivateAgent,
  useResetAgent,
} from "@/hooks/queries/use-agents";
import { cn } from "@/lib/utils";

/**
 * Loading skeleton for the agents grid view.
 * Matches the visual structure of AgentCard with animated placeholders.
 */
const AgentCardSkeleton = () => {
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

/**
 * Format agent type for display
 */
const formatTypeLabel = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

interface AgentGridItemProps {
  agent: Agent;
  isResetting: boolean;
  isToggling: boolean;
  onReset: (agentId: number) => void;
  onToggleActive: (agentId: number, isActive: boolean) => void;
}

/**
 * Renders an AgentCard with an AgentEditorDialog.
 * The Edit button in the card triggers the dialog via a hidden trigger element.
 */
const AgentGridItem = ({
  agent,
  isResetting,
  isToggling,
  onReset,
  onToggleActive,
}: AgentGridItemProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleEditClick = () => {
    // Programmatically click the hidden dialog trigger
    triggerRef.current?.click();
  };

  return (
    <div>
      <AgentCard
        agent={agent}
        isResetting={isResetting}
        isToggling={isToggling}
        onEdit={handleEditClick}
        onReset={onReset}
        onToggleActive={onToggleActive}
      />
      {/* Hidden dialog trigger */}
      <AgentEditorDialog
        agent={agent}
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
 * Agents page - Main entry point for agent management.
 *
 * Features:
 * - Search by name and description
 * - Type filter
 * - Show/hide deactivated toggle
 * - Edit agent via dialog
 * - Reset agent to defaults
 * - Activate/deactivate agents
 * - Empty states
 */
export default function AgentsPage() {
  // URL state management with nuqs
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [typeFilter, setTypeFilter] = useQueryState("type", parseAsString);
  const [isShowDeactivated, setIsShowDeactivated] = useQueryState(
    "showDeactivated",
    parseAsBoolean.withDefault(false)
  );

  // Data fetching - pass both includeDeactivated and type filters to the server
  const { data: agents, isLoading } = useAgents({
    includeDeactivated: isShowDeactivated,
    type: typeFilter as AgentListFilters["type"],
  });

  // Mutations
  const activateAgentMutation = useActivateAgent();
  const deactivateAgentMutation = useDeactivateAgent();
  const resetAgentMutation = useResetAgent();

  // Client-side filtering by search only (type filtering is handled server-side)
  const filteredAgents = agents?.filter((agent) => {
    // Filter by search term (case-insensitive, matches displayName and description)
    if (search) {
      const searchLower = search.toLowerCase();
      const isMatchesName = agent.displayName
        .toLowerCase()
        .includes(searchLower);
      const isMatchesDescription =
        agent.description?.toLowerCase().includes(searchLower) ?? false;
      if (!isMatchesName && !isMatchesDescription) {
        return false;
      }
    }

    return true;
  });

  // Handlers
  const handleSearchChange = (newSearch: string) => {
    void setSearch(newSearch || null);
  };

  const handleTypeChange = (newType: null | string) => {
    if (!newType) {
      void setTypeFilter(null);
    } else {
      void setTypeFilter(newType);
    }
  };

  const handleShowDeactivatedChange = (isChecked: boolean) => {
    void setIsShowDeactivated(isChecked);
  };

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
  const hasNoAgents = !isLoading && agents && agents.length === 0;
  const hasNoFilteredAgents =
    !isLoading &&
    agents &&
    agents.length > 0 &&
    filteredAgents &&
    filteredAgents.length === 0;
  const isTogglingAgent =
    activateAgentMutation.isPending || deactivateAgentMutation.isPending;
  const isResettingAgent = resetAgentMutation.isPending;

  return (
    <div className={"space-y-6"}>
      {/* Page heading */}
      <div className={"space-y-1"}>
        <h1 className={"text-2xl font-semibold tracking-tight"}>{"Agents"}</h1>
        <p className={"text-muted-foreground"}>
          {"Configure and customize AI agents for your workflows."}
        </p>
      </div>

      {/* Filters */}
      {!hasNoAgents && (
        <div className={"flex flex-wrap items-center gap-4"}>
          {/* Type filter */}
          <SelectRoot
            onValueChange={(newValue) => handleTypeChange(newValue)}
            value={typeFilter ?? ""}
          >
            <SelectTrigger
              aria-label={"Filter by type"}
              className={"w-40"}
              size={"sm"}
            >
              <SelectValue placeholder={"All types"} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={"sm"}>
                  <SelectList>
                    <SelectItem size={"sm"} value={""}>
                      {"All types"}
                    </SelectItem>
                    {agentTypes.map((type) => (
                      <SelectItem key={type} size={"sm"} value={type}>
                        {formatTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>

          {/* Search input */}
          <div className={"relative flex-1 md:max-w-xs"}>
            <Search
              aria-hidden={"true"}
              className={cn(
                "absolute top-1/2 left-2.5 size-4 -translate-y-1/2",
                "text-muted-foreground"
              )}
            />
            <Input
              aria-label={"Search agents"}
              className={"pl-8"}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={"Search by name or description..."}
              size={"sm"}
              type={"search"}
              value={search}
            />
          </div>

          {/* Show deactivated toggle */}
          <div className={"flex items-center gap-2"}>
            <Switch
              aria-label={"Show deactivated agents"}
              checked={isShowDeactivated}
              onCheckedChange={handleShowDeactivatedChange}
              size={"sm"}
            />
            <span className={"text-sm text-muted-foreground"}>
              {"Show deactivated"}
            </span>
          </div>
        </div>
      )}

      {/* Agents content */}
      <QueryErrorBoundary>
        {isLoading ? (
          // Loading skeletons
          <div className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
            {Array.from({ length: 6 }).map((_, index) => (
              <AgentCardSkeleton key={index} />
            ))}
          </div>
        ) : hasNoAgents ? (
          // Empty state when no agents exist
          <EmptyState
            description={
              "No agents have been configured yet. Agents will appear here once they are set up."
            }
            icon={<Bot aria-hidden={"true"} className={"size-6"} />}
            title={"No agents yet"}
          />
        ) : hasNoFilteredAgents ? (
          // Empty state when filters hide all agents
          <EmptyState
            action={
              <Button
                onClick={() => {
                  void setSearch(null);
                  void setTypeFilter(null);
                }}
                variant={"outline"}
              >
                {"Clear filters"}
              </Button>
            }
            description={
              "No agents match your current filters. Try adjusting your search criteria."
            }
            icon={<Search aria-hidden={"true"} className={"size-6"} />}
            title={"No matching agents"}
          />
        ) : (
          // Agent grid
          <div className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
            {filteredAgents?.map((agent) => (
              <AgentGridItem
                agent={agent}
                isResetting={isResettingAgent}
                isToggling={isTogglingAgent}
                key={agent.id}
                onReset={handleReset}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </QueryErrorBoundary>
    </div>
  );
}
