'use client';

import { Plus } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { AgentWithRelations } from '@/components/agents/agent-table';

import { AgentEditorDialog } from '@/components/agents/agent-editor-dialog';
import { AgentTable } from '@/components/agents/agent-table';
import { AgentTableToolbar } from '@/components/agents/agent-table-toolbar';
import { ConfirmDeleteAgentDialog } from '@/components/agents/confirm-delete-agent-dialog';
import { SelectProjectDialog } from '@/components/agents/select-project-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useActivateAgent,
  useAllAgents,
  useCopyAgentToProject,
  useDeactivateAgent,
  useDeleteAgent,
  useDuplicateAgent,
  useMoveAgent,
  useResetAgent,
} from '@/hooks/queries/use-agents';
import { useProjects } from '@/hooks/queries/use-projects';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcut';
import { useAgentLayoutStore } from '@/lib/stores/agent-layout-store';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type ProjectFilterValue = null | string;
type StatusFilterValue = null | string;
type TypeFilterValue = null | string;

// ============================================================================
// Main Component
// ============================================================================

/**
 * Agents page - Unified view for managing all agents.
 *
 * Features:
 * - Single unified DataTable displaying all agents (global and project-scoped)
 * - Faceted filters for type, project, and status
 * - Toggle switches for showing built-in and deactivated agents
 * - Full CRUD operations: create, edit, duplicate, delete
 * - Move and copy agents between projects
 * - Keyboard shortcuts (Ctrl+N for create)
 */
export default function AgentsPage() {
  // Filter state
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>(null);
  const [projectFilter, setProjectFilter] = useState<ProjectFilterValue>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(null);

  // Persisted state from Zustand store
  const { setShowBuiltIn, setShowDeactivated, showBuiltIn, showDeactivated } =
    useAgentLayoutStore();

  // Dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<AgentWithRelations | null>(
    null
  );
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState<'copy' | 'move'>(
    'move'
  );
  const [agentForProjectDialog, setAgentForProjectDialog] =
    useState<AgentWithRelations | null>(null);

  // Create dialog ref
  const createDialogTriggerRef = useRef<HTMLButtonElement>(null);

  // Data fetching
  const { data: allAgents } = useAllAgents({
    includeDeactivated: showDeactivated,
  });
  const { data: projects } = useProjects();

  // Mutations
  const activateMutation = useActivateAgent();
  const copyToProjectMutation = useCopyAgentToProject();
  const deactivateMutation = useDeactivateAgent();
  const deleteMutation = useDeleteAgent();
  const duplicateMutation = useDuplicateAgent();
  const moveAgentMutation = useMoveAgent();
  const resetMutation = useResetAgent();

  // Keyboard shortcuts
  const openCreateDialog = useCallback(() => {
    createDialogTriggerRef.current?.click();
  }, []);

  useKeyboardShortcuts([
    { callback: openCreateDialog, options: { key: 'n', modifiers: ['ctrl'] } },
  ]);

  // Filter handlers
  const handleTypeFilterChange = (value: null | string) => {
    setTypeFilter(value);
  };

  const handleProjectFilterChange = (value: null | string) => {
    setProjectFilter(value);
  };

  const handleStatusFilterChange = (value: null | string) => {
    setStatusFilter(value);
  };

  const handleShowBuiltInChange = (value: boolean) => {
    setShowBuiltIn(value);
  };

  const handleShowDeactivatedChange = (value: boolean) => {
    setShowDeactivated(value);
  };

  // Agent action handlers
  const handleToggleActive = useCallback(
    (agentId: number, isActive: boolean) => {
      if (isActive) {
        activateMutation.mutate(agentId);
      } else {
        deactivateMutation.mutate(agentId);
      }
    },
    [activateMutation, deactivateMutation]
  );

  const handleDuplicate = useCallback(
    (agent: AgentWithRelations) => {
      duplicateMutation.mutate(agent.id);
    },
    [duplicateMutation]
  );

  const handleReset = useCallback(
    (agentId: number) => {
      const agent = allAgents?.find((a) => a.id === agentId);
      resetMutation.mutate({
        id: agentId,
        projectId: agent?.projectId ?? undefined,
      });
    },
    [allAgents, resetMutation]
  );

  const handleDeleteClick = useCallback((agentId: number) => {
    // Find the agent to get its name
    const agent = allAgents?.find((a) => a.id === agentId);
    if (agent) {
      setAgentToDelete(agent);
      setIsDeleteDialogOpen(true);
    }
  }, [allAgents]);

  const handleDeleteConfirm = useCallback(() => {
    if (agentToDelete) {
      deleteMutation.mutate(
        { id: agentToDelete.id, projectId: agentToDelete.projectId ?? undefined },
        {
          onSettled: () => {
            setIsDeleteDialogOpen(false);
            setAgentToDelete(null);
          },
        }
      );
    }
  }, [agentToDelete, deleteMutation]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setAgentToDelete(null);
  }, []);

  // Move/Copy handlers - projectId parameter is ignored since we show a selection dialog
  const handleMoveToProject: (
    agent: AgentWithRelations,
    projectId: null | number
  ) => void = useCallback((agent) => {
    // Open project selection dialog for move
    setAgentForProjectDialog(agent);
    setProjectDialogMode('move');
    setIsProjectDialogOpen(true);
  }, []);

  const handleCopyToProject: (
    agent: AgentWithRelations,
    projectId: number
  ) => void = useCallback((agent) => {
    // Open project selection dialog for copy
    setAgentForProjectDialog(agent);
    setProjectDialogMode('copy');
    setIsProjectDialogOpen(true);
  }, []);

  const handleProjectDialogSelect = useCallback(
    (targetProjectId: null | number) => {
      if (!agentForProjectDialog) return;

      const closeDialog = () => {
        setIsProjectDialogOpen(false);
        setAgentForProjectDialog(null);
      };

      if (projectDialogMode === 'move') {
        moveAgentMutation.mutate(
          { agentId: agentForProjectDialog.id, targetProjectId },
          { onSettled: closeDialog }
        );
      } else {
        // Copy mode - targetProjectId cannot be null for copy
        if (targetProjectId !== null) {
          copyToProjectMutation.mutate(
            { agentId: agentForProjectDialog.id, targetProjectId },
            { onSettled: closeDialog }
          );
        }
      }
    },
    [
      agentForProjectDialog,
      copyToProjectMutation,
      moveAgentMutation,
      projectDialogMode,
    ]
  );

  const handleProjectDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setAgentForProjectDialog(null);
      }
      setIsProjectDialogOpen(open);
    },
    []
  );

  // Client-side filtering
  const filteredAgents = useMemo(() => {
    if (!allAgents) return [];

    return allAgents.filter((agent) => {
      // Filter by showBuiltIn preference
      if (!showBuiltIn && agent.builtInAt !== null) {
        return false;
      }

      // Filter by type
      if (typeFilter && agent.type !== typeFilter) {
        return false;
      }

      // Filter by project
      if (projectFilter === 'global' && agent.projectId !== null) {
        return false;
      } else if (
        projectFilter &&
        projectFilter !== 'global' &&
        agent.projectId !== Number(projectFilter)
      ) {
        return false;
      }

      // Filter by status
      if (statusFilter === 'active' && agent.deactivatedAt !== null) {
        return false;
      } else if (statusFilter === 'inactive' && agent.deactivatedAt === null) {
        return false;
      }

      return true;
    });
  }, [allAgents, projectFilter, showBuiltIn, statusFilter, typeFilter]);

  // Derived state
  const totalCount = allAgents?.length ?? 0;
  const filteredCount = filteredAgents.length;
  const hasActiveFilters = Boolean(typeFilter || projectFilter || statusFilter);
  const isFiltered = hasActiveFilters && filteredCount !== totalCount;

  // Loading states
  const isToggling =
    activateMutation.isPending || deactivateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isDuplicating = duplicateMutation.isPending;
  const isResetting = resetMutation.isPending;
  const isMovingToProject = moveAgentMutation.isPending;
  const isCopyingToProject = copyToProjectMutation.isPending;

  return (
    <main aria-label={'Agent management'} className={'space-y-6'}>
      {/* Skip link for keyboard navigation */}
      <a
        className={cn(
          'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
          'z-50 rounded-md bg-background px-4 py-2 text-sm font-medium',
          'ring-2 ring-accent ring-offset-2'
        )}
        href={'#agent-content'}
      >
        {'Skip to agent content'}
      </a>

      {/* Page heading */}
      <header className={'flex items-start justify-between gap-4'}>
        <div className={'space-y-1'}>
          <div className={'flex items-center gap-3'}>
            <h1 className={'text-2xl font-semibold tracking-tight'}>
              {'Agents'}
            </h1>
            {/* Result count badge */}
            <Badge size={'sm'} variant={'default'}>
              {isFiltered
                ? `${filteredCount} of ${totalCount}`
                : `${filteredCount}`}
            </Badge>
          </div>
          <p className={'text-muted-foreground'}>
            {'Manage and customize AI agents for your workflows.'}
          </p>
        </div>

        {/* Create Agent Button */}
        <AgentEditorDialog
          mode={'create'}
          trigger={
            <Button ref={createDialogTriggerRef}>
              <Plus aria-hidden={'true'} className={'size-4'} />
              {'Create Agent'}
              <kbd
                className={
                  'ml-2 hidden rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground md:inline-block'
                }
              >
                {'Ctrl+N'}
              </kbd>
            </Button>
          }
        />
      </header>

      {/* Agent Table with Toolbar */}
      <section
        aria-label={'Agents list'}
        aria-live={'polite'}
        id={'agent-content'}
      >
        <AgentTable
          agents={filteredAgents}
          isCopyingToProject={isCopyingToProject}
          isDeleting={isDeleting}
          isDuplicating={isDuplicating}
          isMovingToProject={isMovingToProject}
          isResetting={isResetting}
          isToggling={isToggling}
          onCopyToProject={handleCopyToProject}
          onDelete={handleDeleteClick}
          onDuplicate={handleDuplicate}
          onMoveToProject={handleMoveToProject}
          onReset={handleReset}
          onToggleActive={handleToggleActive}
          projects={projects ?? []}
          toolbarContent={
            <AgentTableToolbar
              onProjectFilterChange={handleProjectFilterChange}
              onShowBuiltInChange={handleShowBuiltInChange}
              onShowDeactivatedChange={handleShowDeactivatedChange}
              onStatusFilterChange={handleStatusFilterChange}
              onTypeFilterChange={handleTypeFilterChange}
              projectFilter={projectFilter}
              projects={projects ?? []}
              showBuiltIn={showBuiltIn}
              showDeactivated={showDeactivated}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
            />
          }
        />
      </section>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteAgentDialog
        agentName={agentToDelete?.displayName ?? ''}
        isLoading={isDeleting}
        isOpen={isDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            handleDeleteCancel();
          }
        }}
      />

      {/* Project Selection Dialog */}
      <SelectProjectDialog
        isLoading={isMovingToProject || isCopyingToProject}
        isOpen={isProjectDialogOpen}
        mode={projectDialogMode}
        onOpenChange={handleProjectDialogOpenChange}
        onSelect={handleProjectDialogSelect}
        projects={projects ?? []}
        sourceAgent={agentForProjectDialog}
      />
    </main>
  );
}
