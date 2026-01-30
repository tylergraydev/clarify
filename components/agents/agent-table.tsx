'use client';

import type { Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef } from 'react';

import { Copy, Eye, FolderPlus, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Fragment, useCallback, useMemo, useState } from 'react';

import type { Agent } from '@/db/schema';

import { AgentEditorDialog } from '@/components/agents/agent-editor-dialog';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  createColumnHelper,
  DataTable,
  type DataTableRowAction,
  DataTableRowActions,
  type DataTableRowStyleCallback,
} from '@/components/ui/table';
import { getAgentColorClass } from '@/lib/colors/agent-colors';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AgentTableProps
  extends Omit<ComponentPropsWithRef<'div'>, 'onReset'> {
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

type BadgeVariant = NonNullable<
  Parameters<typeof badgeVariants>[0]
>['variant'];

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
// Column Helper
// ============================================================================

const columnHelper = createColumnHelper<Agent>();

// ============================================================================
// Main Component
// ============================================================================

/**
 * Table view component for displaying agents in a structured grid with column headers.
 * Uses the DataTable component for a consistent table experience with sorting, filtering,
 * and persistence capabilities.
 *
 * Features:
 * - Table layout with sortable columns: Name, Type, Status, Scope, Actions
 * - Row click handler for view/edit functionality
 * - Color indicator and agent metadata
 * - Status toggle for activation/deactivation
 * - Action buttons for edit, duplicate, override, reset, and delete
 * - Integrated edit dialog using controlled state pattern
 * - Column preferences persistence via tableId
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

  const handleEditClick = useCallback((agent: Agent) => {
    setEditDialogAgent(agent);
    setIsEditDialogOpen(true);
  }, []);

  const handleEditDialogChange = useCallback((isOpen: boolean) => {
    setIsEditDialogOpen(isOpen);
    if (!isOpen) {
      setEditDialogAgent(null);
    }
  }, []);

  const handleRowClick = useCallback(
    (row: Row<Agent>) => {
      handleEditClick(row.original);
    },
    [handleEditClick]
  );

  const isActionDisabled =
    isCreatingOverride ||
    isDeleting ||
    isDuplicating ||
    isResetting ||
    isToggling;

  // Define row actions dynamically based on agent state
  const getRowActions = useCallback(
    (row: Row<Agent>): Array<DataTableRowAction<Agent>> => {
      const agent = row.original;
      const isCustomAgent = agent.builtInAt === null;
      const isCustomized = agent.parentAgentId !== null;
      const isGlobalAgent = agent.projectId === null;

      // Show override action only for global agents when a project is selected
      const isOverrideAvailable =
        isGlobalAgent &&
        selectedProjectId !== null &&
        selectedProjectId !== undefined;

      const actions: Array<DataTableRowAction<Agent>> = [];

      // View/Edit action
      actions.push({
        disabled: isActionDisabled,
        icon: isCustomAgent ? (
          <Pencil aria-hidden={'true'} className={'size-4'} />
        ) : (
          <Eye aria-hidden={'true'} className={'size-4'} />
        ),
        label: isCustomAgent ? 'Edit' : 'View',
        onAction: (r) => handleEditClick(r.original),
        type: 'button',
      });

      // Duplicate action
      actions.push({
        disabled: isActionDisabled,
        icon: <Copy aria-hidden={'true'} className={'size-4'} />,
        label: 'Duplicate',
        onAction: (r) => onDuplicate?.(r.original),
        type: 'button',
      });

      // Override action (conditional)
      if (isOverrideAvailable) {
        actions.push({
          disabled: isActionDisabled,
          icon: <FolderPlus aria-hidden={'true'} className={'size-4'} />,
          label: 'Create Override',
          onAction: (r) => onCreateOverride?.(r.original),
          type: 'button',
        });
      }

      // Reset action (conditional)
      if (isCustomized) {
        actions.push({
          disabled: isActionDisabled,
          icon: <RotateCcw aria-hidden={'true'} className={'size-4'} />,
          label: 'Reset to Default',
          onAction: (r) => onReset?.(r.original.id),
          type: 'button',
        });
      }

      // Delete action (conditional)
      if (isCustomAgent) {
        actions.push({ type: 'separator' });
        actions.push({
          disabled: isActionDisabled,
          icon: (
            <Trash2
              aria-hidden={'true'}
              className={'size-4 text-destructive'}
            />
          ),
          label: 'Delete',
          onAction: (r) => onDelete?.(r.original.id),
          type: 'button',
          variant: 'destructive',
        });
      }

      return actions;
    },
    [
      handleEditClick,
      isActionDisabled,
      onCreateOverride,
      onDelete,
      onDuplicate,
      onReset,
      selectedProjectId,
    ]
  );

  // Row style callback for inactive agents
  const rowStyleCallback: DataTableRowStyleCallback<Agent> = useCallback(
    (row) => {
      const isActive = row.original.deactivatedAt === null;
      return isActive ? undefined : 'opacity-60';
    },
    []
  );

  // Define columns using the column helper
  const columns = useMemo(
    () => [
      // Name column
      columnHelper.accessor('displayName', {
        cell: ({ row }) => {
          const agent = row.original;
          const isCustomAgent = agent.builtInAt === null;
          const isCustomized = agent.parentAgentId !== null;

          return (
            <div className={'flex items-center gap-2'}>
              {/* Color Indicator */}
              <div
                aria-hidden={'true'}
                className={cn(
                  'size-3 shrink-0 rounded-full',
                  getAgentColorClass(agent.color)
                )}
              />

              {/* Agent Name */}
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
            </div>
          );
        },
        enableHiding: false,
        header: 'Name',
        size: 300,
      }),

      // Type column
      columnHelper.accessor('type', {
        cell: ({ row }) => {
          const agent = row.original;
          return (
            <Badge size={'sm'} variant={getTypeVariant(agent.type)}>
              {formatTypeLabel(agent.type)}
            </Badge>
          );
        },
        header: 'Type',
        size: 120,
      }),

      // Status column
      columnHelper.display({
        cell: ({ row }) => {
          const agent = row.original;
          const isActive = agent.deactivatedAt === null;

          const handleToggleChange = (checked: boolean) => {
            onToggleActive?.(agent.id, checked);
          };

          return (
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
          );
        },
        enableSorting: false,
        header: 'Status',
        id: 'status',
        size: 120,
      }),

      // Scope column
      columnHelper.display({
        cell: ({ row }) => {
          const agent = row.original;
          const isProjectScoped = agent.projectId !== null;
          return (
            <Badge
              size={'sm'}
              variant={isProjectScoped ? 'project' : 'default'}
            >
              {getScopeLabel(agent)}
            </Badge>
          );
        },
        header: 'Scope',
        id: 'scope',
        size: 100,
      }),

      // Actions column
      columnHelper.display({
        cell: ({ row }) => {
          const actions = getRowActions(row);
          return <DataTableRowActions actions={actions} row={row} size={'sm'} />;
        },
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        header: '',
        id: 'actions',
        meta: {
          cellClassName: 'text-right',
          headerClassName: 'text-right',
        },
        size: 60,
      }),
    ],
    [getRowActions, handleEditClick, isToggling, onToggleActive]
  );

  return (
    <Fragment>
      {/* Data Table */}
      <DataTable
        className={className}
        columns={columns}
        data={agents}
        density={'default'}
        emptyState={{
          noData: {
            description: 'Create a custom agent to get started.',
            title: 'No agents found',
          },
          noResults: {
            description: 'Try adjusting your search or filters.',
            title: 'No matching agents',
          },
        }}
        isPaginationEnabled={false}
        isToolbarVisible={true}
        onRowClick={handleRowClick}
        persistence={{
          persistedKeys: ['columnOrder', 'columnVisibility', 'columnSizing'],
          tableId: 'agents-table',
        }}
        ref={ref}
        rowStyleCallback={rowStyleCallback}
        searchPlaceholder={'Search agents...'}
        {...props}
      />

      {/* Edit Dialog */}
      {editDialogAgent && (
        <AgentEditorDialog
          agent={editDialogAgent}
          isOpen={isEditDialogOpen}
          mode={'edit'}
          onOpenChange={handleEditDialogChange}
        />
      )}
    </Fragment>
  );
};
