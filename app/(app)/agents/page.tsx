'use client';

import type { RowSelectionState } from '@tanstack/react-table';

import { Plus } from 'lucide-react';
import { useCallback, useMemo, useReducer, useState } from 'react';

import type { AgentWithRelations } from '@/components/agents/agent-table';
import type { ParsedAgentMarkdown } from '@/lib/utils/agent-markdown';
import type { AgentImportValidationResult } from '@/lib/validations/agent-import';

import { AgentEditorDialog } from '@/components/agents/agent-editor-dialog';
import { AgentTable } from '@/components/agents/agent-table';
import { AgentTableToolbar } from '@/components/agents/agent-table-toolbar';
import { ConfirmDeleteAgentDialog } from '@/components/agents/confirm-delete-agent-dialog';
import { ImportAgentDialog } from '@/components/agents/import-agent-dialog';
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
  useExportAgent,
  useExportAgentsBatch,
  useImportAgent,
  useMoveAgent,
  useResetAgent,
} from '@/hooks/queries/use-agents';
import { useProjects } from '@/hooks/queries/use-projects';
import { useElectron } from '@/hooks/use-electron';
import { useToast } from '@/hooks/use-toast';
import { useAgentLayoutStore } from '@/lib/stores/agent-layout-store';
import { cn } from '@/lib/utils';
import { parseAgentMarkdown } from '@/lib/utils/agent-markdown';
import { prepareAgentImportData, validateAgentImport } from '@/lib/validations/agent-import';

// ============================================================================
// Types
// ============================================================================

interface DeleteDialogState {
  agent: AgentWithRelations | null;
  isOpen: boolean;
}
type DialogAction =
  | { payload: { agent: AgentWithRelations; mode: 'copy' | 'move' }; type: 'OPEN_PROJECT_DIALOG' }
  | { payload: { agent: AgentWithRelations }; type: 'OPEN_DELETE_DIALOG' }
  | {
      payload: { parsedData: ParsedAgentMarkdown; validationResult: AgentImportValidationResult };
      type: 'OPEN_IMPORT_DIALOG';
    }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'CLOSE_IMPORT_DIALOG' }
  | { type: 'CLOSE_PROJECT_DIALOG' };
interface DialogState {
  delete: DeleteDialogState;
  import: ImportDialogState;
  project: ProjectDialogState;
}

type FilterValue = null | string;

interface ImportDialogState {
  isOpen: boolean;
  parsedData: null | ParsedAgentMarkdown;
  validationResult: AgentImportValidationResult | null;
}

interface ProjectDialogState {
  agent: AgentWithRelations | null;
  isOpen: boolean;
  mode: 'copy' | 'move';
}

// ============================================================================
// Dialog State Reducer
// ============================================================================

const initialDialogState: DialogState = {
  delete: { agent: null, isOpen: false },
  import: { isOpen: false, parsedData: null, validationResult: null },
  project: { agent: null, isOpen: false, mode: 'move' },
};

/**
 * Agents page - Unified view for managing all agents.
 *
 * Features:
 * - Single unified DataTable displaying all agents (global and project-scoped)
 * - Faceted filters for type, project, and status
 * - Toggle switches for showing built-in and deactivated agents
 * - Full CRUD operations: create, edit, duplicate, delete
 * - Move and copy agents between projects
 */
export default function AgentsPage() {
  // Filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterValue>(null);
  const [projectFilter, setProjectFilter] = useState<FilterValue>(null);
  const [statusFilter, setStatusFilter] = useState<FilterValue>(null);

  // Persisted state from Zustand store
  const { setShowBuiltIn, setShowDeactivated, showBuiltIn, showDeactivated } = useAgentLayoutStore();

  // Consolidated dialog state using reducer
  const [dialogState, dispatchDialog] = useReducer(dialogReducer, initialDialogState);

  // Row selection state for batch operations
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Hooks for API access
  const { api } = useElectron();
  const toast = useToast();

  // Data fetching
  const { data: allAgents } = useAllAgents({
    includeDeactivated: showDeactivated,
    includeSkills: true,
    includeTools: true,
  });
  const { data: projects } = useProjects();

  // Mutations
  const activateMutation = useActivateAgent();
  const copyToProjectMutation = useCopyAgentToProject();
  const deactivateMutation = useDeactivateAgent();
  const deleteMutation = useDeleteAgent();
  const duplicateMutation = useDuplicateAgent();
  const exportAgentMutation = useExportAgent();
  const exportAgentsBatchMutation = useExportAgentsBatch();
  const importAgentMutation = useImportAgent();
  const moveAgentMutation = useMoveAgent();
  const resetMutation = useResetAgent();

  // Filter handlers - using state setters directly (stable references)
  const handleResetFilters = useCallback(() => {
    setTypeFilter(null);
    setProjectFilter(null);
    setStatusFilter(null);
  }, []);

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

  const handleDeleteClick = useCallback(
    (agentId: number) => {
      const agent = allAgents?.find((a) => a.id === agentId);
      if (agent) {
        dispatchDialog({ payload: { agent }, type: 'OPEN_DELETE_DIALOG' });
      }
    },
    [allAgents]
  );

  const handleDeleteConfirm = useCallback(() => {
    const agentToDelete = dialogState.delete.agent;
    if (agentToDelete) {
      deleteMutation.mutate(
        { id: agentToDelete.id, projectId: agentToDelete.projectId ?? undefined },
        {
          onSettled: () => {
            dispatchDialog({ type: 'CLOSE_DELETE_DIALOG' });
          },
        }
      );
    }
  }, [dialogState.delete.agent, deleteMutation]);

  const handleDeleteDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      dispatchDialog({ type: 'CLOSE_DELETE_DIALOG' });
    }
  }, []);

  // Move/Copy handlers - projectId parameter is ignored since we show a selection dialog
  const handleMoveToProject: (agent: AgentWithRelations, projectId: null | number) => void = useCallback((agent) => {
    dispatchDialog({ payload: { agent, mode: 'move' }, type: 'OPEN_PROJECT_DIALOG' });
  }, []);

  const handleCopyToProject: (agent: AgentWithRelations, projectId: number) => void = useCallback((agent) => {
    dispatchDialog({ payload: { agent, mode: 'copy' }, type: 'OPEN_PROJECT_DIALOG' });
  }, []);

  const handleProjectDialogSelect = useCallback(
    (targetProjectId: null | number) => {
      const agentForProjectDialog = dialogState.project.agent;
      const projectDialogMode = dialogState.project.mode;
      if (!agentForProjectDialog) return;

      const closeDialog = () => {
        dispatchDialog({ type: 'CLOSE_PROJECT_DIALOG' });
      };

      if (projectDialogMode === 'move') {
        moveAgentMutation.mutate({ agentId: agentForProjectDialog.id, targetProjectId }, { onSettled: closeDialog });
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
    [dialogState.project.agent, dialogState.project.mode, copyToProjectMutation, moveAgentMutation]
  );

  const handleProjectDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      dispatchDialog({ type: 'CLOSE_PROJECT_DIALOG' });
    }
  }, []);

  // Import/Export handlers
  const handleImportClick = useCallback(async () => {
    if (!api) {
      toast.error({
        description: 'Electron API not available',
        title: 'Import Failed',
      });
      return;
    }

    // Open file dialog with markdown filter
    const filePath = await api.dialog.openFile([{ extensions: ['md'], name: 'Markdown Files' }]);

    if (!filePath) {
      return; // User cancelled
    }

    // Read file content
    const result = await api.fs.readFile(filePath);

    if (!result.success || !result.content) {
      toast.error({
        description: result.error ?? 'Failed to read file',
        title: 'Import Failed',
      });
      return;
    }

    // Parse markdown
    try {
      const parsed = parseAgentMarkdown(result.content);

      // Validate using prepareAgentImportData and validateAgentImport
      const preparedData = prepareAgentImportData(parsed);
      const validationResult = validateAgentImport(preparedData);

      // Open import dialog with parsed data and validation result
      dispatchDialog({
        payload: { parsedData: parsed, validationResult },
        type: 'OPEN_IMPORT_DIALOG',
      });
    } catch (error) {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to parse markdown',
        title: 'Parse Failed',
      });
    }
  }, [api, toast]);

  const handleImportConfirm = useCallback(
    (data: ParsedAgentMarkdown) => {
      importAgentMutation.mutate(data, {
        onSettled: () => {
          dispatchDialog({ type: 'CLOSE_IMPORT_DIALOG' });
          // Clear row selection
          setRowSelection({});
        },
      });
    },
    [importAgentMutation]
  );

  const handleImportDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      dispatchDialog({ type: 'CLOSE_IMPORT_DIALOG' });
    }
  }, []);

  const handleExportSingle = useCallback(
    async (agent: AgentWithRelations) => {
      if (!api) {
        toast.error({
          description: 'Electron API not available',
          title: 'Export Failed',
        });
        return;
      }

      // Get markdown content from mutation
      exportAgentMutation.mutate(agent.id, {
        onSuccess: async (result) => {
          if (!result.success || !result.markdown) {
            toast.error({
              description: result.error ?? 'Failed to export agent',
              title: 'Export Failed',
            });
            return;
          }

          // Open save dialog with default filename
          const defaultFilename = `${agent.name}.md`;
          const savePath = await api.dialog.saveFile(defaultFilename, [{ extensions: ['md'], name: 'Markdown Files' }]);

          if (!savePath) {
            return; // User cancelled
          }

          // Write content to file
          const writeResult = await api.fs.writeFile(savePath, result.markdown);

          if (!writeResult.success) {
            toast.error({
              description: writeResult.error ?? 'Failed to write file',
              title: 'Export Failed',
            });
            return;
          }

          toast.success({
            description: `Exported "${agent.displayName}" successfully`,
            title: 'Export Complete',
          });
        },
      });
    },
    [api, exportAgentMutation, toast]
  );

  const handleExportSelected = useCallback(async () => {
    if (!api) {
      toast.error({
        description: 'Electron API not available',
        title: 'Export Failed',
      });
      return;
    }

    // Get selected agent IDs from rowSelection state (keys where value is true)
    const selectedIds = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => Number(key));

    if (selectedIds.length === 0) {
      toast.error({
        description: 'No agents selected for export',
        title: 'Export Failed',
      });
      return;
    }

    // Open directory dialog
    const directoryPath = await api.dialog.openDirectory();

    if (!directoryPath) {
      return; // User cancelled
    }

    // Get markdown content for all selected agents
    exportAgentsBatchMutation.mutate(selectedIds, {
      onSuccess: async (results) => {
        // Prepare write operations for valid results
        const writeOperations = results
          .filter((item): item is typeof item & { markdown: string } => Boolean(item.success && item.markdown))
          .map((item) => {
            const filename = `${item.agentName}.md`;
            const filePath = `${directoryPath}/${filename}`;
            return api.fs.writeFile(filePath, item.markdown);
          });

        // Count items that failed to export (no markdown)
        const exportFailCount = results.length - writeOperations.length;

        // Execute all file writes in parallel using Promise.allSettled
        const writeResults = await Promise.allSettled(writeOperations);

        // Count successes and failures from write operations
        let successCount = 0;
        let writeFailCount = 0;

        for (const writeResult of writeResults) {
          if (writeResult.status === 'fulfilled' && writeResult.value.success) {
            successCount++;
          } else {
            writeFailCount++;
          }
        }

        const totalFailCount = exportFailCount + writeFailCount;

        // Clear row selection on success
        if (successCount > 0) {
          setRowSelection({});
        }

        // Show toast notification with count
        if (totalFailCount === 0) {
          toast.success({
            description: `Exported ${successCount} agent${successCount !== 1 ? 's' : ''} successfully`,
            title: 'Export Complete',
          });
        } else {
          toast.warning({
            description: `Exported ${successCount} agent${successCount !== 1 ? 's' : ''}, ${totalFailCount} failed`,
            title: 'Export Partial',
          });
        }
      },
    });
  }, [api, exportAgentsBatchMutation, rowSelection, toast]);

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

  // Client-side filtering
  const filteredAgents = useMemo(() => {
    if (!allAgents) return [];

    return allAgents.filter((agent) => {
      // Filter by showBuiltIn preference
      if (!showBuiltIn && agent.builtInAt !== null) {
        return false;
      }

      // Filter by search term (matches name, displayName, or description)
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        const matchesName = agent.name.toLowerCase().includes(searchLower);
        const matchesDisplayName = agent.displayName.toLowerCase().includes(searchLower);
        const matchesDescription = agent.description?.toLowerCase().includes(searchLower) ?? false;
        if (!matchesName && !matchesDisplayName && !matchesDescription) {
          return false;
        }
      }

      // Filter by type
      if (typeFilter && agent.type !== typeFilter) {
        return false;
      }

      // Filter by project
      if (projectFilter === 'global' && agent.projectId !== null) {
        return false;
      } else if (projectFilter && projectFilter !== 'global' && agent.projectId !== Number(projectFilter)) {
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
  }, [allAgents, projectFilter, searchFilter, showBuiltIn, statusFilter, typeFilter]);

  // Derived state
  const totalCount = allAgents?.length ?? 0;
  const filteredCount = filteredAgents.length;
  const hasActiveFilters = Boolean(typeFilter || projectFilter || statusFilter);
  const isFiltered = hasActiveFilters && filteredCount !== totalCount;

  // Loading states
  const isToggling = activateMutation.isPending || deactivateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isDuplicating = duplicateMutation.isPending;
  const isExporting = exportAgentMutation.isPending || exportAgentsBatchMutation.isPending;
  const isImporting = importAgentMutation.isPending;
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
            <h1 className={'text-2xl font-semibold tracking-tight'}>{'Agents'}</h1>
            {/* Result count badge */}
            <Badge size={'sm'} variant={'default'}>
              {isFiltered ? `${filteredCount} of ${totalCount}` : `${filteredCount}`}
            </Badge>
          </div>
          <p className={'text-muted-foreground'}>{'Manage and customize AI agents for your workflows.'}</p>
        </div>

        {/* Create Agent Button */}
        <AgentEditorDialog
          mode={'create'}
          trigger={
            <Button>
              <Plus aria-hidden={'true'} className={'size-4'} />
              {'Create Agent'}
            </Button>
          }
        />
      </header>

      {/* Agent Table with Toolbar */}
      <section aria-label={'Agents list'} aria-live={'polite'} id={'agent-content'}>
        <AgentTable
          agents={filteredAgents}
          isCopyingToProject={isCopyingToProject}
          isDeleting={isDeleting}
          isDuplicating={isDuplicating}
          isExporting={isExporting}
          isMovingToProject={isMovingToProject}
          isResetting={isResetting}
          isRowSelectionEnabled={true}
          isToggling={isToggling}
          onCopyToProject={handleCopyToProject}
          onDelete={handleDeleteClick}
          onDuplicate={handleDuplicate}
          onExport={handleExportSingle}
          onGlobalFilterChange={setSearchFilter}
          onMoveToProject={handleMoveToProject}
          onReset={handleReset}
          onRowSelectionChange={handleRowSelectionChange}
          onToggleActive={handleToggleActive}
          projects={projects ?? []}
          rowSelection={rowSelection}
          toolbarContent={
            <AgentTableToolbar
              onExportSelected={handleExportSelected}
              onImport={handleImportClick}
              onProjectFilterChange={setProjectFilter}
              onResetFilters={handleResetFilters}
              onShowBuiltInChange={setShowBuiltIn}
              onShowDeactivatedChange={setShowDeactivated}
              onStatusFilterChange={setStatusFilter}
              onTypeFilterChange={setTypeFilter}
              projectFilter={projectFilter}
              projects={projects ?? []}
              selectedCount={selectedCount}
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
        agentName={dialogState.delete.agent?.displayName ?? ''}
        isLoading={isDeleting}
        isOpen={dialogState.delete.isOpen}
        onConfirm={handleDeleteConfirm}
        onOpenChange={handleDeleteDialogOpenChange}
      />

      {/* Project Selection Dialog */}
      <SelectProjectDialog
        isLoading={isMovingToProject || isCopyingToProject}
        isOpen={dialogState.project.isOpen}
        mode={dialogState.project.mode}
        onOpenChange={handleProjectDialogOpenChange}
        onSelect={handleProjectDialogSelect}
        projects={projects ?? []}
        sourceAgent={dialogState.project.agent}
      />

      {/* Import Agent Dialog */}
      <ImportAgentDialog
        isLoading={isImporting}
        isOpen={dialogState.import.isOpen}
        onImport={handleImportConfirm}
        onOpenChange={handleImportDialogOpenChange}
        parsedData={dialogState.import.parsedData}
        validationResult={dialogState.import.validationResult}
      />
    </main>
  );
}

function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case 'CLOSE_DELETE_DIALOG':
      return {
        ...state,
        delete: { agent: null, isOpen: false },
      };
    case 'CLOSE_IMPORT_DIALOG':
      return {
        ...state,
        import: { isOpen: false, parsedData: null, validationResult: null },
      };
    case 'CLOSE_PROJECT_DIALOG':
      return {
        ...state,
        project: { ...state.project, agent: null, isOpen: false },
      };
    case 'OPEN_DELETE_DIALOG':
      return {
        ...state,
        delete: { agent: action.payload.agent, isOpen: true },
      };
    case 'OPEN_IMPORT_DIALOG':
      return {
        ...state,
        import: {
          isOpen: true,
          parsedData: action.payload.parsedData,
          validationResult: action.payload.validationResult,
        },
      };
    case 'OPEN_PROJECT_DIALOG':
      return {
        ...state,
        project: { agent: action.payload.agent, isOpen: true, mode: action.payload.mode },
      };
    default:
      return state;
  }
}
