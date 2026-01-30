"use client";

import type { RefObject } from "react";

import { Bot, Plus, Search } from "lucide-react";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useCallback, useRef, useState } from "react";

import type { Agent } from "@/types/electron";

import { AgentCard } from "@/components/agents/agent-card";
import { AgentEditorDialog } from "@/components/agents/agent-editor-dialog";
import { ConfirmDeleteAgentDialog } from "@/components/agents/confirm-delete-agent-dialog";
import { QueryErrorBoundary } from "@/components/data/query-error-boundary";
import { Badge } from "@/components/ui/badge";
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
  useDeleteAgent,
  useDuplicateAgent,
  useResetAgent,
} from "@/hooks/queries/use-agents";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcut";
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
  isDeleting: boolean;
  isDuplicating: boolean;
  isResetting: boolean;
  isToggling: boolean;
  onDelete: (agentId: number) => void;
  onDuplicate: (agent: Agent) => void;
  onReset: (agentId: number) => void;
  onToggleActive: (agentId: number, isActive: boolean) => void;
}

/**
 * Renders an AgentCard with an AgentEditorDialog.
 * The Edit button in the card triggers the dialog via a hidden trigger element.
 */
const AgentGridItem = ({
  agent,
  isDeleting,
  isDuplicating,
  isResetting,
  isToggling,
  onDelete,
  onDuplicate,
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
        isDeleting={isDeleting}
        isDuplicating={isDuplicating}
        isResetting={isResetting}
        isToggling={isToggling}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onEdit={handleEditClick}
        onReset={onReset}
        onToggleActive={onToggleActive}
      />
      {/* Hidden dialog trigger */}
      <AgentEditorDialog
        agent={agent}
        mode={"edit"}
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
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringLiteral([...agentTypes])
  );
  const [isShowDeactivated, setIsShowDeactivated] = useQueryState(
    "showDeactivated",
    parseAsBoolean.withDefault(false)
  );

  // Create agent dialog control
  const createDialogTriggerRef = useRef<HTMLButtonElement>(null);

  // Delete confirmation dialog state
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const isDeleteDialogOpen = agentToDelete !== null;

  // Data fetching - pass both includeDeactivated and type filters to the server
  const { data: agents, isLoading } = useAgents({
    includeDeactivated: isShowDeactivated,
    type: typeFilter ?? undefined,
  });

  // Mutations
  const activateAgentMutation = useActivateAgent();
  const deactivateAgentMutation = useDeactivateAgent();
  const deleteAgentMutation = useDeleteAgent();
  const duplicateAgentMutation = useDuplicateAgent();
  const resetAgentMutation = useResetAgent();

  // Keyboard shortcut handlers
  const openCreateDialog = useCallback(() => {
    createDialogTriggerRef.current?.click();
  }, []);

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    { callback: openCreateDialog, options: { key: "n", modifiers: ["ctrl"] } },
  ]);

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
      void setTypeFilter(newType as (typeof agentTypes)[number]);
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

  const handleDeleteClick = (agentId: number) => {
    const agent = agents?.find((a) => a.id === agentId);
    if (agent) {
      setAgentToDelete(agent);
    }
  };

  const handleConfirmDelete = () => {
    if (agentToDelete) {
      deleteAgentMutation.mutate(agentToDelete.id, {
        onSettled: () => {
          setAgentToDelete(null);
        },
      });
    }
  };

  const handleDeleteDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAgentToDelete(null);
    }
  };

  const handleDuplicateClick = (agent: Agent) => {
    duplicateAgentMutation.mutate(agent.id);
  };

  // Derived state
  const hasActiveFilters = Boolean(typeFilter) || Boolean(search);
  const hasNoAgents =
    !isLoading && agents && agents.length === 0 && !hasActiveFilters;
  const hasNoFilteredAgents =
    !isLoading &&
    agents &&
    agents.length > 0 &&
    filteredAgents &&
    filteredAgents.length === 0;
  const isDeletingAgent = deleteAgentMutation.isPending;
  const isDuplicatingAgent = duplicateAgentMutation.isPending;
  const isResettingAgent = resetAgentMutation.isPending;
  const isTogglingAgent =
    activateAgentMutation.isPending || deactivateAgentMutation.isPending;

  // Result counts for display
  const totalCount = agents?.length ?? 0;
  const filteredCount = filteredAgents?.length ?? 0;
  const isFiltered = hasActiveFilters && filteredCount !== totalCount;

  return (
    <main aria-label={"Agent management"} className={"space-y-6"}>
      {/* Skip link for keyboard navigation */}
      <a
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
          "z-50 rounded-md bg-background px-4 py-2 text-sm font-medium",
          "ring-2 ring-accent ring-offset-2"
        )}
        href={"#agent-content"}
      >
        {"Skip to agent content"}
      </a>

      {/* Page heading */}
      <header className={"flex items-start justify-between gap-4"}>
        <div className={"space-y-1"}>
          <div className={"flex items-center gap-3"}>
            <h1 className={"text-2xl font-semibold tracking-tight"}>
              {"Agents"}
            </h1>
            {/* Result count badge */}
            {!isLoading && !hasNoAgents && (
              <Badge size={"sm"} variant={"default"}>
                {isFiltered
                  ? `${filteredCount} of ${totalCount}`
                  : `${totalCount}`}
              </Badge>
            )}
          </div>
          <p className={"text-muted-foreground"}>
            {"Configure and customize AI agents for your workflows."}
          </p>
        </div>
        <AgentEditorDialog
          mode={"create"}
          trigger={
            <Button ref={createDialogTriggerRef}>
              <Plus aria-hidden={"true"} className={"size-4"} />
              {"Create Agent"}
              <kbd
                className={
                  "ml-2 hidden rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground md:inline-block"
                }
              >
                {"Ctrl+N"}
              </kbd>
            </Button>
          }
        />
      </header>

      {/* Filters - show when there are agents OR when filters are active (so users can clear them) */}
      {(!hasNoAgents || hasActiveFilters) && (
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
                      <SelectItem
                        key={type}
                        label={formatTypeLabel(type)}
                        size={"sm"}
                        value={type}
                      >
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
      <section
        aria-label={"Agents list"}
        aria-live={"polite"}
        id={"agent-content"}
      >
        <QueryErrorBoundary>
          {isLoading ? (
            // Loading skeletons
            <div
              aria-busy={"true"}
              aria-label={"Loading agents"}
              className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}
              role={"status"}
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <AgentCardSkeleton key={index} />
              ))}
            </div>
          ) : hasNoAgents ? (
            // Empty state when no agents exist
            <EmptyState
              action={
                <AgentEditorDialog
                  mode={"create"}
                  trigger={
                    <Button>
                      <Plus aria-hidden={"true"} className={"size-4"} />
                      {"Create your first agent"}
                    </Button>
                  }
                />
              }
              description={
                "Get started by creating your first agent to customize your workflows."
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
            <ul
              aria-label={`${filteredCount} agents`}
              className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}
              role={"list"}
            >
              {filteredAgents?.map((agent) => (
                <li key={agent.id}>
                  <AgentGridItem
                    agent={agent}
                    isDeleting={isDeletingAgent}
                    isDuplicating={isDuplicatingAgent}
                    isResetting={isResettingAgent}
                    isToggling={isTogglingAgent}
                    onDelete={handleDeleteClick}
                    onDuplicate={handleDuplicateClick}
                    onReset={handleReset}
                    onToggleActive={handleToggleActive}
                  />
                </li>
              ))}
            </ul>
          )}
        </QueryErrorBoundary>
      </section>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteAgentDialog
        agentName={agentToDelete?.displayName ?? ""}
        isLoading={isDeletingAgent}
        isOpen={isDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onOpenChange={handleDeleteDialogOpenChange}
      />
    </main>
  );
}
