'use client';

import type { RowSelectionState } from '@tanstack/react-table';

import { useCallback, useMemo, useState } from 'react';

import { AgentTable } from '@/components/agents/agent-table';
import { AgentTableToolbar } from '@/components/agents/agent-table-toolbar';
import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { useAgentActions } from '@/hooks/agents/use-agent-actions';
import { useAgentDialogs } from '@/hooks/agents/use-agent-dialogs';
import { useAgentFilters } from '@/hooks/agents/use-agent-filters';
import { useAgentImportExport } from '@/hooks/agents/use-agent-import-export';
import { useFilteredAgents } from '@/hooks/agents/use-filtered-agents';
import { useAllAgents } from '@/hooks/queries/use-agents';
import { useProjects } from '@/hooks/queries/use-projects';

import { AgentsDialogs } from '../../../components/agents/agents-dialogs';
import { AgentsPageHeader } from '../../../components/agents/agents-page-header';
import { AgentsPageSkeleton } from '../../../components/agents/agents-page-skeleton';

// ============================================================================
// Component
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
 * - Import and export agents as markdown files
 */
const AgentsPage = () => {
  // Row selection state for batch operations
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filter state management
  const {
    colorFilter,
    isShowingBuiltIn,
    isShowingDeactivated,
    onResetFilters,
    projectFilter,
    searchFilter,
    setColorFilter,
    setIsShowingBuiltIn,
    setIsShowingDeactivated,
    setProjectFilter,
    setSearchFilter,
    setStatusFilter,
    setTypeFilter,
    statusFilter,
    typeFilter,
  } = useAgentFilters();

  // Dialog state management
  const {
    dialogState,
    dispatchDialog,
    onDeleteDialogOpenChange,
    onImportDialogOpenChange,
    onOpenDeleteDialog,
    onOpenImportDialog,
    onProjectDialogOpenChange,
  } = useAgentDialogs();

  // Data fetching
  const { data: allAgents, isLoading: isLoadingAgents } = useAllAgents({
    includeDeactivated: isShowingDeactivated,
    includeHooks: true,
    includeSkills: true,
    includeTools: true,
  });
  const { data: projects, isLoading: isLoadingProjects } = useProjects();

  // Combined loading state
  const isLoading = isLoadingAgents || isLoadingProjects;

  // Client-side filtering
  const { filteredAgents, filteredCount, isFiltered, totalCount } = useFilteredAgents({
    agents: allAgents,
    colorFilter,
    isShowingBuiltIn,
    projectFilter,
    searchFilter,
    statusFilter,
    typeFilter,
  });

  // Action handlers
  const {
    loadingState,
    onCopyToProject,
    onDeleteClick,
    onDeleteConfirm,
    onDuplicate,
    onMoveToProject,
    onProjectDialogSelect,
    onReset,
    onToggleActive,
  } = useAgentActions({
    agents: allAgents,
    onCloseDeleteDialog: () => dispatchDialog({ type: 'CLOSE_DELETE_DIALOG' }),
    onCloseProjectDialog: () => dispatchDialog({ type: 'CLOSE_PROJECT_DIALOG' }),
    onOpenCopyDialog: (agent) => dispatchDialog({ payload: { agent, mode: 'copy' }, type: 'OPEN_PROJECT_DIALOG' }),
    onOpenDeleteDialog,
    onOpenMoveDialog: (agent) => dispatchDialog({ payload: { agent, mode: 'move' }, type: 'OPEN_PROJECT_DIALOG' }),
  });

  // Import/Export handlers
  const { isExporting, isImporting, onExportSelected, onExportSingle, onImportClick, onImportConfirm } =
    useAgentImportExport({
      onCloseImportDialog: () => dispatchDialog({ type: 'CLOSE_IMPORT_DIALOG' }),
      onOpenImportDialog,
      rowSelection,
      setRowSelection,
    });

  // Row selection handlers
  const handleRowSelectionChange = useCallback(
    (updater: ((prev: RowSelectionState) => RowSelectionState) | RowSelectionState) => {
      setRowSelection((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    },
    []
  );

  // Computed selected count
  const selectedCount = useMemo(() => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]).length;
  }, [rowSelection]);

  // Wrap delete confirm to pass the agent from dialog state
  const handleDeleteConfirm = useCallback(() => {
    onDeleteConfirm(dialogState.delete.agent);
  }, [dialogState.delete.agent, onDeleteConfirm]);

  // Wrap project dialog select to pass the agent and mode from dialog state
  const handleProjectDialogSelect = useCallback(
    (targetProjectId: null | number) => {
      onProjectDialogSelect(dialogState.project.agent, dialogState.project.mode, targetProjectId);
    },
    [dialogState.project.agent, dialogState.project.mode, onProjectDialogSelect]
  );

  // Loading state
  if (isLoading) {
    return <AgentsPageSkeleton />;
  }

  return (
    <QueryErrorBoundary>
      <main aria-label={'Agent management'} className={'space-y-6'}>
        {/* Page Header */}
        <AgentsPageHeader filteredCount={filteredCount} isFiltered={isFiltered} totalCount={totalCount} />

        {/* Agent Table with Toolbar */}
        <section aria-label={'Agents list'} aria-live={'polite'} id={'agent-content'}>
          <AgentTable
            agents={filteredAgents}
            isCopyingToProject={loadingState.isCopyingToProject}
            isDeleting={loadingState.isDeleting}
            isDuplicating={loadingState.isDuplicating}
            isExporting={isExporting}
            isMovingToProject={loadingState.isMovingToProject}
            isResetting={loadingState.isResetting}
            isRowSelectionEnabled={true}
            isToggling={loadingState.isToggling}
            onCopyToProject={onCopyToProject}
            onDelete={onDeleteClick}
            onDuplicate={onDuplicate}
            onExport={onExportSingle}
            onGlobalFilterChange={setSearchFilter}
            onMoveToProject={onMoveToProject}
            onReset={onReset}
            onRowSelectionChange={handleRowSelectionChange}
            onToggleActive={onToggleActive}
            projects={projects ?? []}
            rowSelection={rowSelection}
            toolbarContent={
              <AgentTableToolbar
                colorFilter={colorFilter}
                isShowingBuiltIn={isShowingBuiltIn}
                isShowingDeactivated={isShowingDeactivated}
                onColorFilterChange={setColorFilter}
                onExportSelected={onExportSelected}
                onImport={onImportClick}
                onIsShowingBuiltInChange={setIsShowingBuiltIn}
                onIsShowingDeactivatedChange={setIsShowingDeactivated}
                onProjectFilterChange={setProjectFilter}
                onResetFilters={onResetFilters}
                onStatusFilterChange={setStatusFilter}
                onTypeFilterChange={setTypeFilter}
                projectFilter={projectFilter}
                projects={projects ?? []}
                selectedCount={selectedCount}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
              />
            }
          />
        </section>

        {/* Dialogs */}
        <AgentsDialogs
          deleteDialog={dialogState.delete}
          importDialog={dialogState.import}
          isCopyingToProject={loadingState.isCopyingToProject}
          isDeleting={loadingState.isDeleting}
          isImporting={isImporting}
          isMovingToProject={loadingState.isMovingToProject}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteDialogOpenChange={onDeleteDialogOpenChange}
          onImportConfirm={onImportConfirm}
          onImportDialogOpenChange={onImportDialogOpenChange}
          onProjectDialogOpenChange={onProjectDialogOpenChange}
          onProjectDialogSelect={handleProjectDialogSelect}
          projectDialog={dialogState.project}
          projects={projects ?? []}
        />
      </main>
    </QueryErrorBoundary>
  );
};

export default AgentsPage;
