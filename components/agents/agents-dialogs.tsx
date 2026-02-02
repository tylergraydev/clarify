'use client';

import { Fragment } from 'react';

import type { AgentWithRelations } from '@/components/agents/agent-table';
import type { Project } from '@/db/schema';
import type { ParsedAgentMarkdown } from '@/lib/utils/agent-markdown';
import type { AgentImportValidationResult } from '@/lib/validations/agent-import';

import { ConfirmDeleteAgentDialog } from '@/components/agents/confirm-delete-agent-dialog';
import { ImportAgentDialog } from '@/components/agents/import-agent-dialog';
import { SelectProjectDialog } from '@/components/agents/select-project-dialog';

// ============================================================================
// Types
// ============================================================================

interface AgentsDialogsProps {
  /** Delete dialog state */
  deleteDialog: {
    agent: AgentWithRelations | null;
    isOpen: boolean;
  };
  /** Import dialog state */
  importDialog: {
    isOpen: boolean;
    parsedData: null | ParsedAgentMarkdown;
    validationResult: AgentImportValidationResult | null;
  };
  /** Whether copying to project is in progress */
  isCopyingToProject: boolean;
  /** Whether delete operation is in progress */
  isDeleting: boolean;
  /** Whether import operation is in progress */
  isImporting: boolean;
  /** Whether moving to project is in progress */
  isMovingToProject: boolean;
  /** Callback when delete is confirmed */
  onDeleteConfirm: () => void;
  /** Callback when delete dialog open state changes */
  onDeleteDialogOpenChange: (isOpen: boolean) => void;
  /** Callback when import is confirmed */
  onImportConfirm: (data: ParsedAgentMarkdown) => void;
  /** Callback when import dialog open state changes */
  onImportDialogOpenChange: (isOpen: boolean) => void;
  /** Callback when project dialog open state changes */
  onProjectDialogOpenChange: (isOpen: boolean) => void;
  /** Callback when a project is selected in the project dialog */
  onProjectDialogSelect: (targetProjectId: null | number) => void;
  /** Project dialog state */
  projectDialog: {
    agent: AgentWithRelations | null;
    isOpen: boolean;
    mode: 'copy' | 'move';
  };
  /** List of projects for the project selection dialog */
  projects: Array<Project>;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Container component for all agent-related dialogs.
 *
 * Renders:
 * - ConfirmDeleteAgentDialog for delete confirmation
 * - SelectProjectDialog for moving/copying agents to projects
 * - ImportAgentDialog for importing agents from markdown
 *
 * @example
 * ```tsx
 * <AgentsDialogs
 *   deleteDialog={dialogState.delete}
 *   projectDialog={dialogState.project}
 *   importDialog={dialogState.import}
 *   projects={projects}
 *   isDeleting={isDeleting}
 *   isMovingToProject={isMovingToProject}
 *   isCopyingToProject={isCopyingToProject}
 *   isImporting={isImporting}
 *   onDeleteConfirm={handleDeleteConfirm}
 *   onDeleteDialogOpenChange={handleDeleteDialogOpenChange}
 *   onProjectDialogSelect={handleProjectDialogSelect}
 *   onProjectDialogOpenChange={handleProjectDialogOpenChange}
 *   onImportConfirm={handleImportConfirm}
 *   onImportDialogOpenChange={handleImportDialogOpenChange}
 * />
 * ```
 */
export const AgentsDialogs = ({
  deleteDialog,
  importDialog,
  isCopyingToProject,
  isDeleting,
  isImporting,
  isMovingToProject,
  onDeleteConfirm,
  onDeleteDialogOpenChange,
  onImportConfirm,
  onImportDialogOpenChange,
  onProjectDialogOpenChange,
  onProjectDialogSelect,
  projectDialog,
  projects,
}: AgentsDialogsProps) => {
  return (
    <Fragment>
      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteAgentDialog
        agentName={deleteDialog.agent?.displayName ?? ''}
        isLoading={isDeleting}
        isOpen={deleteDialog.isOpen}
        onConfirm={onDeleteConfirm}
        onOpenChange={onDeleteDialogOpenChange}
      />

      {/* Project Selection Dialog */}
      <SelectProjectDialog
        isLoading={isMovingToProject || isCopyingToProject}
        isOpen={projectDialog.isOpen}
        mode={projectDialog.mode}
        onOpenChange={onProjectDialogOpenChange}
        onSelect={onProjectDialogSelect}
        projects={projects}
        sourceAgent={projectDialog.agent}
      />

      {/* Import Agent Dialog */}
      <ImportAgentDialog
        isLoading={isImporting}
        isOpen={importDialog.isOpen}
        onImport={onImportConfirm}
        onOpenChange={onImportDialogOpenChange}
        parsedData={importDialog.parsedData}
        validationResult={importDialog.validationResult}
      />
    </Fragment>
  );
};
