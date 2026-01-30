'use client';

import type { ComponentPropsWithRef } from 'react';

import { Copy, Eye, FolderPlus, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { Agent } from '@/db/schema';

import { AgentEditorDialog } from '@/components/agents/agent-editor-dialog';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/icon-button';
import { Switch } from '@/components/ui/switch';
import { getAgentColorClass } from '@/lib/colors/agent-colors';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AgentListItemProps extends Omit<ComponentPropsWithRef<'li'>, 'onClick' | 'onReset'> {
  agent: Agent;
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
  selectedProjectId?: null | number;
}
interface AgentListProps extends Omit<ComponentPropsWithRef<'ul'>, 'onReset'> {
  agents: Array<Agent>;
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

type AgentType = Agent['type'];

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];

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

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Individual agent list item rendered as a horizontal row.
 * Includes color indicator, display name, type badge, status toggle,
 * and action buttons for edit, duplicate, override, reset, and delete.
 */
const AgentListItem = ({
  agent,
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
}: AgentListItemProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isActive = agent.deactivatedAt === null;
  const isCustomAgent = agent.builtInAt === null;
  const isCustomized = agent.parentAgentId !== null;
  const isGlobalAgent = agent.projectId === null;
  const isProjectScoped = agent.projectId !== null;

  // Show override action only for global agents when a project is selected
  const isOverrideAvailable = isGlobalAgent && selectedProjectId !== null && selectedProjectId !== undefined;

  const handleCreateOverrideClick = () => {
    onCreateOverride?.(agent);
  };

  const handleDeleteClick = () => {
    onDelete?.(agent.id);
  };

  const handleDuplicateClick = () => {
    onDuplicate?.(agent);
  };

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleResetClick = () => {
    onReset?.(agent.id);
  };

  const handleToggleChange = (checked: boolean) => {
    onToggleActive?.(agent.id, checked);
  };

  const isActionDisabled = isCreatingOverride || isDeleting || isDuplicating || isResetting || isToggling;

  return (
    <li
      className={cn(
        'flex items-center gap-4 rounded-md border border-border bg-card px-4 py-3 transition-opacity',
        !isActive && 'opacity-60',
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Color Indicator */}
      <div aria-hidden={'true'} className={cn('size-3 shrink-0 rounded-full', getAgentColorClass(agent.color))} />

      {/* Agent Name */}
      <div className={'min-w-0 flex-1'}>
        <span className={'truncate text-sm font-medium'}>{agent.displayName}</span>
      </div>

      {/* Type Badge */}
      <Badge className={'shrink-0'} size={'sm'} variant={getTypeVariant(agent.type)}>
        {formatTypeLabel(agent.type)}
      </Badge>

      {/* Origin Badges */}
      <div className={'flex shrink-0 items-center gap-1'}>
        {isProjectScoped && (
          <Badge size={'sm'} variant={'project'}>
            {'Project'}
          </Badge>
        )}
        {!isCustomAgent && (
          <Badge size={'sm'} variant={'category-builtin'}>
            {'Built-in'}
          </Badge>
        )}
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

      {/* Status Toggle */}
      <div className={'flex shrink-0 items-center gap-2'}>
        <span className={'text-xs text-muted-foreground'}>{isActive ? 'Active' : 'Inactive'}</span>
        <Switch
          aria-label={isActive ? 'Deactivate agent' : 'Activate agent'}
          checked={isActive}
          disabled={isToggling}
          onCheckedChange={handleToggleChange}
          size={'sm'}
        />
      </div>

      {/* Action Buttons */}
      <div className={'flex shrink-0 items-center gap-1'}>
        <IconButton
          aria-label={isCustomAgent ? 'Edit agent' : 'View agent'}
          disabled={isActionDisabled}
          onClick={handleEditClick}
          type={'button'}
        >
          {isCustomAgent ? (
            <Pencil aria-hidden={'true'} className={'size-4'} />
          ) : (
            <Eye aria-hidden={'true'} className={'size-4'} />
          )}
        </IconButton>
        <IconButton
          aria-label={'Duplicate agent'}
          disabled={isActionDisabled}
          onClick={handleDuplicateClick}
          type={'button'}
        >
          <Copy aria-hidden={'true'} className={'size-4'} />
        </IconButton>
        {isOverrideAvailable && (
          <IconButton
            aria-label={'Create project override for this agent'}
            disabled={isActionDisabled}
            onClick={handleCreateOverrideClick}
            type={'button'}
          >
            <FolderPlus aria-hidden={'true'} className={'size-4'} />
          </IconButton>
        )}
        {isCustomized && (
          <IconButton
            aria-label={'Reset agent to default'}
            disabled={isActionDisabled}
            onClick={handleResetClick}
            type={'button'}
          >
            <RotateCcw aria-hidden={'true'} className={'size-4'} />
          </IconButton>
        )}
        {isCustomAgent && (
          <IconButton
            aria-label={'Delete agent'}
            disabled={isActionDisabled}
            onClick={handleDeleteClick}
            type={'button'}
          >
            <Trash2 aria-hidden={'true'} className={'size-4 text-destructive'} />
          </IconButton>
        )}
      </div>

      {/* Edit Dialog */}
      <AgentEditorDialog agent={agent} isOpen={isEditDialogOpen} mode={'edit'} onOpenChange={setIsEditDialogOpen} />
    </li>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * List view component for displaying agents in a compact vertical layout.
 * Renders agents as horizontal rows optimized for scanning many agents quickly.
 *
 * Features:
 * - Compact horizontal row layout
 * - Agent color indicator and display name
 * - Type badge and origin badges (Project, Custom, Customized)
 * - Status toggle for activation/deactivation
 * - Action buttons for edit, duplicate, override, reset, and delete
 * - Integrated edit dialog using controlled state pattern
 */
export const AgentList = ({
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
}: AgentListProps) => {
  return (
    <ul
      aria-label={`${agents.length} agents`}
      className={cn('flex flex-col gap-2', className)}
      ref={ref}
      role={'list'}
      {...props}
    >
      {agents.map((agent) => (
        <AgentListItem
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
    </ul>
  );
};
