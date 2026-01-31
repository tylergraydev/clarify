'use client';

import type { ComponentPropsWithRef } from 'react';

import { useState } from 'react';

import type { Agent } from '@/types/electron';

import { AgentCard } from '@/components/agents/agent-card';
import { AgentEditorDialog } from '@/components/agents/agent-editor-dialog';
import { cn } from '@/lib/utils';

interface AgentGridItemProps extends Omit<ComponentPropsWithRef<'div'>, 'onReset'> {
  agent: Agent;
  isDeleting?: boolean;
  isDuplicating?: boolean;
  isResetting?: boolean;
  isToggling?: boolean;
  onDelete?: (agentId: number) => void;
  onDuplicate?: (agent: Agent) => void;
  onReset?: (agentId: number) => void;
  onToggleActive?: (agentId: number, isActive: boolean) => void;
}

/**
 * Renders an AgentCard with an AgentEditorDialog.
 * Uses controlled state to open the dialog when Edit is clicked.
 *
 * This is a shared component used by both GlobalAgentsTabContent and
 * ProjectAgentsTabContent to reduce code duplication.
 */
export const AgentGridItem = ({
  agent,
  className,
  isDeleting,
  isDuplicating,
  isResetting,
  isToggling,
  onDelete,
  onDuplicate,
  onReset,
  onToggleActive,
  ref,
  ...props
}: AgentGridItemProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  return (
    <div className={cn(className)} ref={ref} {...props}>
      {/* Agent Card */}
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

      {/* Edit Dialog */}
      <AgentEditorDialog agent={agent} isOpen={isEditDialogOpen} mode={'edit'} onOpenChange={setIsEditDialogOpen} />
    </div>
  );
};
