"use client";

import { Bot, Plus, Search } from "lucide-react";
import { Fragment, useState } from "react";

import type { Agent } from "@/types/electron";

import { AgentEditorDialog } from "@/components/agents/agent-editor-dialog";
import { AgentLayoutRenderer } from "@/components/agents/agent-layout-renderer";
import { AgentListSkeleton } from "@/components/agents/agent-list-skeleton";
import { AgentTableSkeleton } from "@/components/agents/agent-table-skeleton";
import { ConfirmDeleteAgentDialog } from "@/components/agents/confirm-delete-agent-dialog";
import { QueryErrorBoundary } from "@/components/data/query-error-boundary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useActivateAgent,
  useCreateAgentOverride,
  useDeactivateAgent,
  useDeleteAgent,
  useDuplicateAgent,
  useGlobalAgents,
  useResetAgent,
} from "@/hooks/queries/use-agents";
import { useAgentLayoutStore } from "@/lib/stores/agent-layout-store";
import { useShellStore } from "@/lib/stores/shell-store";

// ============================================================================
// Types
// ============================================================================

interface GlobalAgentsTabContentProps {
  filters?: {
    includeDeactivated?: boolean;
    search?: string;
    type?: string;
  };
}

// ============================================================================
// Sub-Components
// ============================================================================

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

// ============================================================================
// Main Component
// ============================================================================

/**
 * Global agents tab content component.
 *
 * Displays agents that have no project association (global scope).
 * These agents are available across all projects and serve as
 * base configurations that can be customized at the project level.
 *
 * Features:
 * - Displays global agents in a responsive grid
 * - Supports client-side search filtering
 * - Provides empty states for no agents and no search results
 * - Handles agent activation, deactivation, editing, duplication, reset, and deletion
 */
export const GlobalAgentsTabContent = ({
  filters,
}: GlobalAgentsTabContentProps) => {
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const { layout } = useAgentLayoutStore();
  const selectedProjectId = useShellStore((state) => state.selectedProjectId);

  const isDeleteDialogOpen = agentToDelete !== null;

  // Data fetching
  const { data: agents, isLoading } = useGlobalAgents({
    includeDeactivated: filters?.includeDeactivated,
    type: filters?.type,
  });

  // Mutations
  const activateAgentMutation = useActivateAgent();
  const createOverrideMutation = useCreateAgentOverride();
  const deactivateAgentMutation = useDeactivateAgent();
  const deleteAgentMutation = useDeleteAgent();
  const duplicateAgentMutation = useDuplicateAgent();
  const resetAgentMutation = useResetAgent();

  // Client-side search filtering
  const filteredAgents = agents?.filter((agent) => {
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
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
  const handleToggleActive = (agentId: number, isActive: boolean) => {
    if (isActive) {
      activateAgentMutation.mutate(agentId);
    } else {
      deactivateAgentMutation.mutate(agentId);
    }
  };

  const handleReset = (agentId: number) => {
    // Global agents don't have projectId
    resetAgentMutation.mutate({ id: agentId });
  };

  const handleDeleteClick = (agentId: number) => {
    const agent = agents?.find((a) => a.id === agentId);
    if (agent) {
      setAgentToDelete(agent);
    }
  };

  const handleConfirmDelete = () => {
    if (agentToDelete) {
      // Global agents don't have projectId
      deleteAgentMutation.mutate(
        { id: agentToDelete.id },
        {
          onSettled: () => {
            setAgentToDelete(null);
          },
        }
      );
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

  const handleCreateOverrideClick = (agent: Agent) => {
    if (selectedProjectId) {
      createOverrideMutation.mutate({
        agentId: agent.id,
        projectId: selectedProjectId,
      });
    }
  };

  // Derived state
  const hasActiveFilters = Boolean(filters?.type) || Boolean(filters?.search);
  const hasNoAgents =
    !isLoading && agents && agents.length === 0 && !hasActiveFilters;
  const hasNoFilteredAgents =
    !isLoading &&
    agents &&
    agents.length > 0 &&
    filteredAgents &&
    filteredAgents.length === 0;
  const isCreatingOverrideAgent = createOverrideMutation.isPending;
  const isDeletingAgent = deleteAgentMutation.isPending;
  const isDuplicatingAgent = duplicateAgentMutation.isPending;
  const isResettingAgent = resetAgentMutation.isPending;
  const isTogglingAgent =
    activateAgentMutation.isPending || deactivateAgentMutation.isPending;

  // Result count
  const filteredCount = filteredAgents?.length ?? 0;

  return (
    <Fragment>
      <QueryErrorBoundary>
        {isLoading ? (
          // Loading skeletons - render appropriate skeleton based on current layout
          layout === "list" ? (
            <AgentListSkeleton count={6} />
          ) : layout === "table" ? (
            <AgentTableSkeleton count={6} />
          ) : (
            <div
              aria-busy={"true"}
              aria-label={"Loading global agents"}
              className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}
              role={"status"}
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <AgentCardSkeleton key={index} />
              ))}
            </div>
          )
        ) : hasNoAgents ? (
          // Empty state when no global agents exist
          <EmptyState
            action={
              <AgentEditorDialog
                mode={"create"}
                trigger={
                  <Button>
                    <Plus aria-hidden={"true"} className={"size-4"} />
                    {"Create your first global agent"}
                  </Button>
                }
              />
            }
            description={
              "Global agents are available across all projects. Create one to get started with AI-assisted workflows."
            }
            icon={<Bot aria-hidden={"true"} className={"size-6"} />}
            title={"No global agents yet"}
          />
        ) : hasNoFilteredAgents ? (
          // Empty state when filters hide all agents
          <EmptyState
            description={
              "No global agents match your current filters. Try adjusting your search criteria."
            }
            icon={<Search aria-hidden={"true"} className={"size-6"} />}
            title={"No matching global agents"}
          />
        ) : (
          // Agent layout (card/list/table based on user preference)
          <AgentLayoutRenderer
            agents={filteredAgents ?? []}
            aria-label={`${filteredCount} global agents`}
            isCreatingOverride={isCreatingOverrideAgent}
            isDeleting={isDeletingAgent}
            isDuplicating={isDuplicatingAgent}
            isResetting={isResettingAgent}
            isToggling={isTogglingAgent}
            onCreateOverride={handleCreateOverrideClick}
            onDelete={handleDeleteClick}
            onDuplicate={handleDuplicateClick}
            onReset={handleReset}
            onToggleActive={handleToggleActive}
            selectedProjectId={selectedProjectId}
          />
        )}
      </QueryErrorBoundary>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteAgentDialog
        agentName={agentToDelete?.displayName ?? ""}
        isLoading={isDeletingAgent}
        isOpen={isDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onOpenChange={handleDeleteDialogOpenChange}
      />
    </Fragment>
  );
};
