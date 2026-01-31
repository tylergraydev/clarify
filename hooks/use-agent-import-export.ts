'use client';

import type { RowSelectionState } from '@tanstack/react-table';

import { useCallback } from 'react';

import type { AgentWithRelations } from '@/components/agents/agent-table';
import type { ParsedAgentMarkdown } from '@/lib/utils/agent-markdown';
import type { AgentImportValidationResult } from '@/lib/validations/agent-import';

import { useExportAgent, useExportAgentsBatch, useImportAgent } from '@/hooks/queries/use-agents';
import { useElectron } from '@/hooks/use-electron';
import { useToast } from '@/hooks/use-toast';
import { parseAgentMarkdown } from '@/lib/utils/agent-markdown';
import { prepareAgentImportData, validateAgentImport } from '@/lib/validations/agent-import';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the useAgentImportExport hook.
 */
export interface UseAgentImportExportOptions {
  /** Callback to close the import dialog */
  onCloseImportDialog: () => void;
  /** Callback to open the import dialog with parsed data */
  onOpenImportDialog: (parsedData: ParsedAgentMarkdown, validationResult: AgentImportValidationResult) => void;
  /** Current row selection state */
  rowSelection: RowSelectionState;
  /** Callback to update row selection */
  setRowSelection: (value: RowSelectionState) => void;
}

/**
 * Return type for the useAgentImportExport hook.
 */
export interface UseAgentImportExportReturn {
  /** Whether export operation is pending */
  isExporting: boolean;
  /** Whether import operation is pending */
  isImporting: boolean;
  /** Handle exporting selected agents (batch export) */
  onExportSelected: () => Promise<void>;
  /** Handle exporting a single agent */
  onExportSingle: (agent: AgentWithRelations) => Promise<void>;
  /** Handle clicking the import button */
  onImportClick: () => Promise<void>;
  /** Handle confirming the import */
  onImportConfirm: (data: ParsedAgentMarkdown) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing agent import and export operations.
 *
 * Handles file dialog interactions, markdown parsing, validation,
 * and mutation calls for importing and exporting agents.
 *
 * @param options - Options including dialog callbacks and row selection
 * @returns Import/export handlers and loading states
 *
 * @example
 * ```tsx
 * const {
 *   handleImportClick,
 *   handleImportConfirm,
 *   handleExportSingle,
 *   handleExportSelected,
 *   isImporting,
 *   isExporting,
 * } = useAgentImportExport({
 *   rowSelection,
 *   setRowSelection,
 *   onOpenImportDialog,
 *   onCloseImportDialog,
 * });
 * ```
 */
export const useAgentImportExport = ({
  onCloseImportDialog,
  onOpenImportDialog,
  rowSelection,
  setRowSelection,
}: UseAgentImportExportOptions): UseAgentImportExportReturn => {
  // Hooks for API access
  const { api } = useElectron();
  const toast = useToast();

  // Mutations
  const exportAgentMutation = useExportAgent();
  const exportAgentsBatchMutation = useExportAgentsBatch();
  const importAgentMutation = useImportAgent();

  // Import click handler - opens file dialog and parses markdown
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
      onOpenImportDialog(parsed, validationResult);
    } catch (error) {
      toast.error({
        description: error instanceof Error ? error.message : 'Failed to parse markdown',
        title: 'Parse Failed',
      });
    }
  }, [api, onOpenImportDialog, toast]);

  // Import confirm handler
  const handleImportConfirm = useCallback(
    (data: ParsedAgentMarkdown) => {
      importAgentMutation.mutate(data, {
        onSettled: () => {
          onCloseImportDialog();
          // Clear row selection
          setRowSelection({});
        },
      });
    },
    [importAgentMutation, onCloseImportDialog, setRowSelection]
  );

  // Export single agent handler
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

  // Export selected agents handler (batch export)
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
  }, [api, exportAgentsBatchMutation, rowSelection, setRowSelection, toast]);

  return {
    isExporting: exportAgentMutation.isPending || exportAgentsBatchMutation.isPending,
    isImporting: importAgentMutation.isPending,
    onExportSelected: handleExportSelected,
    onExportSingle: handleExportSingle,
    onImportClick: handleImportClick,
    onImportConfirm: handleImportConfirm,
  };
};
