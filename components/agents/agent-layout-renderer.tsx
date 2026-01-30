'use client';

import type { ComponentPropsWithoutRef } from 'react';

import type { Agent } from '@/db/schema';

import { AgentGridItem } from '@/components/agents/agent-grid-item';
import { AgentList } from '@/components/agents/agent-list';
import { AgentTable } from '@/components/agents/agent-table';
import { useAgentLayoutStore } from '@/lib/stores/agent-layout-store';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface AgentLayoutRendererProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'onReset'> {
  /** Array of agents to render */
  agents: Array<Agent>;
  /** Whether an override creation is in progress */
  isCreatingOverride?: boolean;
  /** Whether a deletion is in progress */
  isDeleting?: boolean;
  /** Whether a duplication is in progress */
  isDuplicating?: boolean;
  /** Whether a reset is in progress */
  isResetting?: boolean;
  /** Whether a toggle is in progress */
  isToggling?: boolean;
  /** Handler for creating a project override of a global agent */
  onCreateOverride?: (agent: Agent) => void;
  /** Handler for deleting an agent */
  onDelete?: (agentId: number) => void;
  /** Handler for duplicating an agent */
  onDuplicate?: (agent: Agent) => void;
  /** Handler for resetting an agent to its default configuration */
  onReset?: (agentId: number) => void;
  /** Handler for toggling an agent's active status */
  onToggleActive?: (agentId: number, isActive: boolean) => void;
  /** The currently selected project ID, used to determine if override action is available */
  selectedProjectId?: null | number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Conditionally renders agents in the appropriate layout based on user preference.
 *
 * Reads the layout preference from `useAgentLayoutStore` and renders:
 * - "card" layout: Responsive grid of AgentGridItem cards
 * - "list" layout: Compact vertical list via AgentList
 * - "table" layout: Data-dense table via AgentTable
 *
 * All action handlers are passed through to the underlying layout component,
 * providing consistent functionality across all view types.
 *
 * @example
 * ```tsx
 * <AgentLayoutRenderer
 *   agents={agents}
 *   isDeleting={isDeleting}
 *   onDelete={handleDelete}
 *   onDuplicate={handleDuplicate}
 *   onToggleActive={handleToggle}
 *   selectedProjectId={selectedProjectId}
 * />
 * ```
 */
export const AgentLayoutRenderer = ({
  agents,
  className,
  isCreatingOverride = false,
  isDeleting = false,
  isDuplicating = false,
  isResetting = false,
  isToggling = false,
  onCreateOverride,
  onDelete,
  onDuplicate,
  onReset,
  onToggleActive,
  selectedProjectId,
  ...props
}: AgentLayoutRendererProps) => {
  const { layout } = useAgentLayoutStore();

  // Card layout: Render responsive grid of AgentGridItem components
  if (layout === 'card') {
    return (
      <div
        className={cn(
          'grid gap-4',
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className
        )}
        {...props}
      >
        {agents.map((agent) => (
          <AgentGridItem
            agent={agent}
            isCreatingOverride={isCreatingOverride}
            isDeleting={isDeleting}
            isDuplicating={isDuplicating}
            isResetting={isResetting}
            isToggling={isToggling}
            key={agent.id}
            onCreateOverride={onCreateOverride}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onReset={onReset}
            onToggleActive={onToggleActive}
            selectedProjectId={selectedProjectId}
          />
        ))}
      </div>
    );
  }

  // List layout: Render compact vertical list
  if (layout === 'list') {
    return (
      <AgentList
        agents={agents}
        className={className}
        isCreatingOverride={isCreatingOverride}
        isDeleting={isDeleting}
        isDuplicating={isDuplicating}
        isResetting={isResetting}
        isToggling={isToggling}
        onCreateOverride={onCreateOverride}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onReset={onReset}
        onToggleActive={onToggleActive}
        selectedProjectId={selectedProjectId}
      />
    );
  }

  // Table layout: Render data-dense table view
  return (
    <AgentTable
      agents={agents}
      className={className}
      isCreatingOverride={isCreatingOverride}
      isDeleting={isDeleting}
      isDuplicating={isDuplicating}
      isResetting={isResetting}
      isToggling={isToggling}
      onCreateOverride={onCreateOverride}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onReset={onReset}
      onToggleActive={onToggleActive}
      selectedProjectId={selectedProjectId}
    />
  );
};
