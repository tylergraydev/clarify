"use client";

import { Bot, FolderOpen, Plus, Search } from "lucide-react";
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
  useDeactivateAgent,
  useDeleteAgent,
  useDuplicateAgent,
  useProjectAgents,
  useResetAgent,
} from "@/hooks/queries/use-agents";
import { useAgentLayoutStore } from "@/lib/stores/agent-layout-store";

// ============================================================================
// Types
// ============================================================================

interface ProjectAgentsTabContentProps {
  filters?: {
    includeDeactivated?: boolean;
    search?: string;
    showBuiltIn?: boolean;
    type?: string;
  };
  projectId: number;
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
 * Project agents tab content component.
 *
 * Displays agents that are scoped to a specific project.
 * These agents can be customizations of global agents or
 * entirely project-specific agents.
 *
 * Features:
 * - Displays project-specific agents in a responsive grid
 * - Supports client-side search filtering
 * - Provides empty states for no project selected, no agents, and no search results
 * - Handles agent activation, deactivation, editing, duplication, reset, and deletion
 */
export const ProjectAgentsTabContent = ({
  filters,
  projectId,
}: ProjectAgentsTabContentProps) => {
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [duplicatedAgent, setDuplicatedAgent] = useState<Agent | null>(null);

  const { layout } = useAgentLayoutStore();

  const isDeleteDialogOpen = agentToDelete !== null;
  const isDuplicatedDialogOpen = duplicatedAgent !== null;
  const isProjectSelected = projectId > 0;

  // Data fetching - only enabled when a project is selected
  const { data: agents, isLoading } = useProjectAgents(projectId, {
    includeDeactivated: filters?.includeDeactivated,
    type: filters?.type,
  });

  // Mutations
  const activateAgentMutation = useActivateAgent();
  const deactivateAgentMutation = useDeactivateAgent();
  const deleteAgentMutation = useDeleteAgent();
  const duplicateAgentMutation = useDuplicateAgent();
  const resetAgentMutation = useResetAgent();

  // Client-side filtering (search and showBuiltIn)
  const filteredAgents = agents?.filter((agent) => {
    // Filter by showBuiltIn preference
    if (filters?.showBuiltIn === false && agent.builtInAt !== null) {
      return false;
    }

    // Filter by search term
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
    resetAgentMutation.mutate({ id: agentId, projectId });
  };

  const handleDeleteClick = (agentId: number) => {
    const agent = agents?.find((a) => a.id === agentId);
    if (agent) {
      setAgentToDelete(agent);
    }
  };

  const handleConfirmDelete = () => {
    if (agentToDelete) {
      deleteAgentMutation.mutate(
        {
          id: agentToDelete.id,
          projectId: agentToDelete.projectId ?? undefined,
        },
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
    duplicateAgentMutation.mutate(agent.id, {
      onSuccess: (result) => {
        // Auto-open edit dialog for the newly duplicated agent
        if (result.success && result.agent) {
          setDuplicatedAgent(result.agent);
        }
      },
    });
  };

  const handleDuplicatedDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setDuplicatedAgent(null);
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
  const isDeletingAgent = deleteAgentMutation.isPending;
  const isDuplicatingAgent = duplicateAgentMutation.isPending;
  const isResettingAgent = resetAgentMutation.isPending;
  const isTogglingAgent =
    activateAgentMutation.isPending || deactivateAgentMutation.isPending;

  // Result count
  const filteredCount = filteredAgents?.length ?? 0;

  // Show prompt to select a project when none is selected
  if (!isProjectSelected) {
    return (
      <EmptyState
        description={
          "Select a project from the dropdown above to view and manage project-specific agent configurations."
        }
        icon={<FolderOpen aria-hidden={"true"} className={"size-6"} />}
        title={"Select a project"}
      />
    );
  }

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
              aria-label={"Loading project agents"}
              className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}
              role={"status"}
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <AgentCardSkeleton key={index} />
              ))}
            </div>
          )
        ) : hasNoAgents ? (
          // Empty state when no project agents exist
          <EmptyState
            action={
              <AgentEditorDialog
                mode={"create"}
                projectId={projectId}
                trigger={
                  <Button>
                    <Plus aria-hidden={"true"} className={"size-4"} />
                    {"Create project agent"}
                  </Button>
                }
              />
            }
            description={
              "Project-specific agents allow you to customize AI behavior for this project. Create a new agent or customize a global agent for this project."
            }
            icon={<Bot aria-hidden={"true"} className={"size-6"} />}
            title={"No project agents yet"}
          />
        ) : hasNoFilteredAgents ? (
          // Empty state when filters hide all agents
          <EmptyState
            description={
              "No project agents match your current filters. Try adjusting your search criteria."
            }
            icon={<Search aria-hidden={"true"} className={"size-6"} />}
            title={"No matching project agents"}
          />
        ) : (
          // Agent layout (card/list/table based on user preference)
          <AgentLayoutRenderer
            agents={filteredAgents ?? []}
            aria-label={`${filteredCount} project agents`}
            isDeleting={isDeletingAgent}
            isDuplicating={isDuplicatingAgent}
            isResetting={isResettingAgent}
            isToggling={isTogglingAgent}
            onDelete={handleDeleteClick}
            onDuplicate={handleDuplicateClick}
            onReset={handleReset}
            onToggleActive={handleToggleActive}
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

      {/* Edit Dialog for Duplicated Agent */}
      {duplicatedAgent && (
        <AgentEditorDialog
          agent={duplicatedAgent}
          isOpen={isDuplicatedDialogOpen}
          mode={"edit"}
          onOpenChange={handleDuplicatedDialogOpenChange}
        />
      )}
    </Fragment>
  );
};
