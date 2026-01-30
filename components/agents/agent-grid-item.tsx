'use client';

import { useState } from 'react';

import type { Agent } from '@/types/electron';

import { AgentCard } from '@/components/agents/agent-card';
import { AgentEditorDialog } from '@/components/agents/agent-editor-dialog';

// ============================================================================
// Types
// ============================================================================

export interface AgentGridItemProps {
  agent: Agent;
  isCreatingOverride?: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
  isResetting: boolean;
  isToggling: boolean;
  onCreateOverride?: (agent: Agent) => void;
  onDelete: (agentId: number) => void;
  onDuplicate: (agent: Agent) => void;
  onReset: (agentId: number) => void;
  onToggleActive: (agentId: number, isActive: boolean) => void;
  selectedProjectId?: null | number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Renders an AgentCard with an AgentEditorDialog.
 * Uses controlled state to open the dialog when Edit is clicked.
 *
 * This is a shared component used by both GlobalAgentsTabContent and
 * ProjectAgentsTabContent to reduce code duplication.
 */
export const AgentGridItem = ({
  agent,
  isCreatingOverride,
  isDeleting,
  isDuplicating,
  isResetting,
  isToggling,
  onCreateOverride,
  onDelete,
  onDuplicate,
  onReset,
  onToggleActive,
  selectedProjectId,
}: AgentGridItemProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      {/* Agent Card */}
      <AgentCard
        agent={agent}
        isCreatingOverride={isCreatingOverride}
        isDeleting={isDeleting}
        isDuplicating={isDuplicating}
        isResetting={isResetting}
        isToggling={isToggling}
        onCreateOverride={onCreateOverride}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onEdit={handleEditClick}
        onReset={onReset}
        onToggleActive={onToggleActive}
        selectedProjectId={selectedProjectId}
      />

      {/* Edit Dialog */}
      <AgentEditorDialog
        agent={agent}
        isOpen={isEditDialogOpen}
        mode={'edit'}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
};
