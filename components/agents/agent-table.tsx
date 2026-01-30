'use client';

import type { ComponentPropsWithRef } from 'react';

import { useState } from 'react';

import { Copy, Eye, FolderPlus, Pencil, RotateCcw, Trash2 } from 'lucide-react';

import type { Agent } from '@/db/schema';

import { AgentEditorDialog } from '@/components/agents/agent-editor-dialog';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getAgentColorClass } from '@/lib/colors/agent-colors';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type AgentType = Agent['type'];
type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];

interface AgentTableProps extends Omit<ComponentPropsWithRef<'div'>, 'onReset'> {
  agents: Agent[];
  isCreatingOverride?: boolean;
  isDeleting?: boolean;
  isDuplicating?: boolean;
  isResetting?: boolean;
  isToggling?: boolean;
  onCreateOverride?: (agent: Agent) => void;
  onDelete?: (agentId: number) => void;
  onDuplicate?: (agent: Agent) => void;
  onReset?: (agentId: number) => void;
  onToggleActive?: (agentId: number, isActive: boolean) => void;
  /** The currently selected project ID, used to determine if override action is available */
  selectedProjectId?: null | number;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getTypeVariant = (type: AgentType): BadgeVariant => {
  const typeVariantMap: Record<string, BadgeVariant> = {
    planning: 'planning',
    review: 'review',
    specialist: 'specialist',
    utility: 'default',
  };

  return typeVariantMap[type ?? ''] ?? 'default';
};

const formatTypeLabel = (type: AgentType): string => {
  if (!type) return 'Unknown';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const getScopeLabel = (agent: Agent): string => {
  return agent.projectId !== null ? 'Project' : 'Global';
};

const getStatusLabel = (agent: Agent): string => {
  return agent.deactivatedAt === null ? 'Active' : 'Inactive';
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Table view component for displaying agents in a structured grid with column headers.
 * Provides a data-dense view following the established WorkflowTable pattern for consistency.
 *
 * Features:
 * - Table layout with sortable columns: Name, Type, Status, Scope, Actions
 * - Row click handler for view/edit functionality
 * - Color indicator and agent metadata
 * - Status toggle for activation/deactivation
 * - Action buttons for edit, duplicate, override, reset, and delete
 * - Integrated edit dialog using controlled state pattern
 */
export const AgentTable = ({
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
  ref,
  selectedProjectId,
  ...props
}: AgentTableProps) => {
  const [editDialogAgent, setEditDialogAgent] = useState<Agent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (agent: Agent) => {
    setEditDialogAgent(agent);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogChange = (isOpen: boolean) => {
    setIsEditDialogOpen(isOpen);
    if (!isOpen) {
      setEditDialogAgent(null);
    }
  };

  const handleRowClick = (agent: Agent) => {
    handleEditClick(agent);
  };

  const isActionDisabled =
    isCreatingOverride || isDeleting || isDuplicating || isResetting || isToggling;

  return (
    <div
      className={cn('overflow-x-auto rounded-lg border border-border', className)}
      ref={ref}
      {...props}
    >
      <table className={'w-full border-collapse text-sm'}>
        {/* Table Header */}
        <thead className={'border-b border-border bg-muted/50'}>
          <tr>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Name'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Type'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Status'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Scope'}
            </th>
            <th
              className={'px-4 py-3 text-right font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Actions'}
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className={'divide-y divide-border'}>
          {agents.map((agent) => {
            const isActive = agent.deactivatedAt === null;
            const isCustomAgent = agent.builtInAt === null;
            const isCustomized = agent.parentAgentId !== null;
            const isGlobalAgent = agent.projectId === null;
            const isProjectScoped = agent.projectId !== null;

            // Show override action only for global agents when a project is selected
            const isOverrideAvailable =
              isGlobalAgent && selectedProjectId !== null && selectedProjectId !== undefined;

            const handleCreateOverrideClick = () => {
              onCreateOverride?.(agent);
            };

            const handleDeleteClick = () => {
              onDelete?.(agent.id);
            };

            const handleDuplicateClick = () => {
              onDuplicate?.(agent);
            };

            const handleResetClick = () => {
              onReset?.(agent.id);
            };

            const handleToggleChange = (checked: boolean) => {
              onToggleActive?.(agent.id, checked);
            };

            return (
              <tr
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/30',
                  !isActive && 'opacity-60'
                )}
                key={agent.id}
                onClick={() => handleRowClick(agent)}
              >
                {/* Name Cell */}
                <td className={'px-4 py-3'}>
                  <div className={'flex items-center gap-2'}>
                    {/* Color Indicator */}
                    <div
                      aria-hidden={'true'}
                      className={cn('size-3 shrink-0 rounded-full', getAgentColorClass(agent.color))}
                    />
                    <button
                      className={cn(
                        'text-left font-medium text-foreground hover:text-accent',
                        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
                        'focus-visible:outline-none'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(agent);
                      }}
                      type={'button'}
                    >
                      {agent.displayName}
                    </button>
                    {/* Origin Badges */}
                    <div className={'flex items-center gap-1'}>
                      {isCustomAgent && (
                        <Badge size={'sm'} variant={'custom'}>
                          {'Custom'}
                        </Badge>
                      )}
                      {isCustomized && (
                        <Badge size={'sm'} variant={'default'}>
                          {'Customized'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </td>

                {/* Type Cell */}
                <td className={'px-4 py-3'}>
                  <Badge size={'sm'} variant={getTypeVariant(agent.type)}>
                    {formatTypeLabel(agent.type)}
                  </Badge>
                </td>

                {/* Status Cell */}
                <td className={'px-4 py-3'}>
                  <div
                    className={'flex items-center gap-2'}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className={'text-xs text-muted-foreground'}>
                      {getStatusLabel(agent)}
                    </span>
                    <Switch
                      aria-label={isActive ? 'Deactivate agent' : 'Activate agent'}
                      checked={isActive}
                      disabled={isToggling}
                      onCheckedChange={handleToggleChange}
                      size={'sm'}
                    />
                  </div>
                </td>

                {/* Scope Cell */}
                <td className={'px-4 py-3'}>
                  <Badge size={'sm'} variant={isProjectScoped ? 'project' : 'default'}>
                    {getScopeLabel(agent)}
                  </Badge>
                </td>

                {/* Actions Cell */}
                <td className={'px-4 py-3'}>
                  <div
                    className={'flex items-center justify-end gap-1'}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* View/Edit */}
                    <Button
                      aria-label={`Edit ${agent.displayName}`}
                      disabled={isActionDisabled}
                      onClick={() => handleEditClick(agent)}
                      size={'sm'}
                      variant={'ghost'}
                    >
                      <Eye aria-hidden={'true'} className={'size-4'} />
                      {'View'}
                    </Button>

                    {/* Edit */}
                    <Button
                      aria-label={`Edit ${agent.displayName}`}
                      disabled={isActionDisabled}
                      onClick={() => handleEditClick(agent)}
                      size={'sm'}
                      variant={'ghost'}
                    >
                      <Pencil aria-hidden={'true'} className={'size-4'} />
                    </Button>

                    {/* Duplicate */}
                    <Button
                      aria-label={`Duplicate ${agent.displayName}`}
                      disabled={isActionDisabled}
                      onClick={handleDuplicateClick}
                      size={'sm'}
                      variant={'ghost'}
                    >
                      <Copy aria-hidden={'true'} className={'size-4'} />
                    </Button>

                    {/* Override */}
                    {isOverrideAvailable && (
                      <Button
                        aria-label={`Create project override for ${agent.displayName}`}
                        disabled={isActionDisabled}
                        onClick={handleCreateOverrideClick}
                        size={'sm'}
                        variant={'ghost'}
                      >
                        <FolderPlus aria-hidden={'true'} className={'size-4'} />
                      </Button>
                    )}

                    {/* Reset */}
                    {isCustomized && (
                      <Button
                        aria-label={`Reset ${agent.displayName} to default`}
                        disabled={isActionDisabled}
                        onClick={handleResetClick}
                        size={'sm'}
                        variant={'ghost'}
                      >
                        <RotateCcw aria-hidden={'true'} className={'size-4'} />
                      </Button>
                    )}

                    {/* Delete */}
                    {isCustomAgent && (
                      <Button
                        aria-label={`Delete ${agent.displayName}`}
                        disabled={isActionDisabled}
                        onClick={handleDeleteClick}
                        size={'sm'}
                        variant={'ghost'}
                      >
                        <Trash2 aria-hidden={'true'} className={'size-4 text-destructive'} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Edit Dialog */}
      {editDialogAgent && (
        <AgentEditorDialog
          agent={editDialogAgent}
          isOpen={isEditDialogOpen}
          mode={'edit'}
          onOpenChange={handleEditDialogChange}
        />
      )}
    </div>
  );
};
