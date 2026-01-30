'use client';

import type { Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { format } from 'date-fns';
import {
  Copy,
  Eye,
  FolderInput,
  FolderOutput,
  FolderPlus,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Fragment, useCallback, useMemo, useState } from 'react';

import type { Agent, AgentSkill, AgentTool, Project } from '@/db/schema';

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

/**
 * Extended Agent type that includes optional tools and skills arrays
 * for display in the unified table view.
 */
export interface AgentWithRelations extends Agent {
  skills?: Array<AgentSkill>;
  tools?: Array<AgentTool>;
}

interface AgentTableProps
  extends Omit<ComponentPropsWithRef<'div'>, 'onReset'> {
  agents: Array<AgentWithRelations>;
  isCopyingToProject?: boolean;
  isCreatingOverride?: boolean;
  isDeleting?: boolean;
  isDuplicating?: boolean;
  isMovingToProject?: boolean;
  isResetting?: boolean;
  isToggling?: boolean;
  onCopyToProject?: (agent: AgentWithRelations, projectId: number) => void;
  onCreateOverride?: (agent: AgentWithRelations) => void;
  onDelete?: (agentId: number) => void;
  onDuplicate?: (agent: AgentWithRelations) => void;
  onMoveToProject?: (agent: AgentWithRelations, projectId: null | number) => void;
  onReset?: (agentId: number) => void;
  onToggleActive?: (agentId: number, isActive: boolean) => void;
  /** List of projects for resolving project names in the table */
  projects?: Array<Project>;
  /** Additional toolbar content to render in the DataTable toolbar */
  toolbarContent?: ReactNode;
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

const getScopeLabel = (agent: Agent, projects?: Array<Project>): string => {
  if (agent.projectId === null) {
    return 'Global';
  }
  const project = projects?.find((p) => p.id === agent.projectId);
  return project?.name ?? `Project #${agent.projectId}`;
};

const getStatusLabel = (agent: Agent): string => {
  return agent.deactivatedAt === null ? 'Active' : 'Inactive';
};

const formatDate = (dateString: null | string | undefined): string => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return '-';
  }
};

// ============================================================================
// Column Helper
// ============================================================================

const columnHelper = createColumnHelper<AgentWithRelations>();

// ============================================================================
// Main Component
// ============================================================================

/**
 * Table view component for displaying agents in a structured grid with column headers.
 * Uses the DataTable component for a consistent table experience with sorting, filtering,
 * and persistence capabilities.
 *
 * Features:
 * - Table layout with sortable columns: Name, Type, Project, Tools, Skills, Status, Created, Updated, Actions
 * - Row click handler for view/edit functionality
 * - Color indicator and agent metadata
 * - Status toggle for activation/deactivation
 * - Action buttons for edit, duplicate, override, move, copy, reset, and delete
 * - Integrated edit dialog using controlled state pattern
 * - Column preferences persistence via tableId
 * - Subtle styling for built-in agents
 */
export const AgentTable = ({
  agents,
  className,
  isCopyingToProject = false,
  isCreatingOverride = false,
  isDeleting = false,
  isDuplicating = false,
  isMovingToProject = false,
  isResetting = false,
  isToggling = false,
  onCopyToProject,
  onCreateOverride,
  onDelete,
  onDuplicate,
  onMoveToProject,
  onReset,
  onToggleActive,
  projects,
  ref,
  toolbarContent,
  ...props
}: AgentTableProps) => {
  const [editDialogAgent, setEditDialogAgent] = useState<AgentWithRelations | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = useCallback((agent: AgentWithRelations) => {
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
    (row: Row<AgentWithRelations>) => {
      handleEditClick(row.original);
    },
    [handleEditClick]
  );

  const isActionDisabled =
    isCreatingOverride ||
    isCopyingToProject ||
    isDeleting ||
    isDuplicating ||
    isMovingToProject ||
    isResetting ||
    isToggling;

  // Define row actions dynamically based on agent state
  const getRowActions = useCallback(
    (row: Row<AgentWithRelations>): Array<DataTableRowAction<AgentWithRelations>> => {
      const agent = row.original;
      const isCustomAgent = agent.builtInAt === null;
      const isCustomized = agent.parentAgentId !== null;
      const isGlobalAgent = agent.projectId === null;
      const isProjectAgent = agent.projectId !== null;

      const actions: Array<DataTableRowAction<AgentWithRelations>> = [];

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

      // Create Project Copy action (only for global agents)
      if (isGlobalAgent && onCreateOverride) {
        actions.push({
          disabled: isActionDisabled,
          icon: <FolderPlus aria-hidden={'true'} className={'size-4'} />,
          label: 'Create Project Copy',
          onAction: (r) => onCreateOverride(r.original),
          type: 'button',
        });
      }

      // Move to Project action (only for custom agents that can be moved)
      if (onMoveToProject && isCustomAgent) {
        actions.push({
          disabled: isActionDisabled,
          icon: <FolderOutput aria-hidden={'true'} className={'size-4'} />,
          label: isGlobalAgent ? 'Move to Project' : 'Change Project',
          onAction: (r) => {
            // This will trigger the parent to show a project selection dialog
            // For now, we pass null as a signal to show the dialog
            onMoveToProject(r.original, null);
          },
          type: 'button',
        });
      }

      // Copy to Project action (for project-scoped agents to copy to another project)
      if (isProjectAgent && onCopyToProject) {
        actions.push({
          disabled: isActionDisabled,
          icon: <FolderInput aria-hidden={'true'} className={'size-4'} />,
          label: 'Copy to Project',
          onAction: (r) => {
            // This will trigger the parent to show a project selection dialog
            // For now, we pass 0 as a signal to show the dialog
            onCopyToProject(r.original, 0);
          },
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
      onCopyToProject,
      onCreateOverride,
      onDelete,
      onDuplicate,
      onMoveToProject,
      onReset,
    ]
  );

  // Row style callback for built-in and inactive agents
  const rowStyleCallback: DataTableRowStyleCallback<AgentWithRelations> = useCallback(
    (row) => {
      const isActive = row.original.deactivatedAt === null;
      const isBuiltIn = row.original.builtInAt !== null;

      // Apply subtle background for built-in agents, reduced opacity for inactive
      if (!isActive) {
        return isBuiltIn ? 'bg-muted/30 opacity-60' : 'opacity-60';
      }

      return isBuiltIn ? 'bg-muted/30' : undefined;
    },
    []
  );

  // Define columns using the column helper
  const columns = useMemo(
    () => [
      // Actions column (first for easy access)
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
          cellClassName: 'text-left',
          headerClassName: 'text-left',
        },
        size: 60,
      }),

      // Name column with color indicator
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
                  'cursor-pointer text-left font-medium text-foreground hover:text-accent',
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
        size: 280,
      }),

      // Type column with badge variants
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
        size: 100,
      }),

      // Project/Scope column
      columnHelper.accessor('projectId', {
        cell: ({ row }) => {
          const agent = row.original;
          const isProjectScoped = agent.projectId !== null;
          return (
            <Badge
              size={'sm'}
              variant={isProjectScoped ? 'project' : 'default'}
            >
              {getScopeLabel(agent, projects)}
            </Badge>
          );
        },
        header: 'Project',
        size: 140,
      }),

      // Tools count column
      columnHelper.display({
        cell: ({ row }) => {
          const agent = row.original;
          const toolCount = agent.tools?.length ?? 0;
          return (
            <span className={'text-muted-foreground'}>
              {toolCount}
            </span>
          );
        },
        header: 'Tools',
        id: 'toolCount',
        size: 70,
      }),

      // Skills count column
      columnHelper.display({
        cell: ({ row }) => {
          const agent = row.original;
          const skillCount = agent.skills?.length ?? 0;
          return (
            <span className={'text-muted-foreground'}>
              {skillCount}
            </span>
          );
        },
        header: 'Skills',
        id: 'skillCount',
        size: 70,
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
        size: 110,
      }),

      // Created At column
      columnHelper.accessor('createdAt', {
        cell: ({ row }) => {
          const agent = row.original;
          return (
            <span className={'text-sm text-muted-foreground'}>
              {formatDate(agent.createdAt)}
            </span>
          );
        },
        header: 'Created',
        size: 110,
      }),

      // Updated At column
      columnHelper.accessor('updatedAt', {
        cell: ({ row }) => {
          const agent = row.original;
          return (
            <span className={'text-sm text-muted-foreground'}>
              {formatDate(agent.updatedAt)}
            </span>
          );
        },
        header: 'Updated',
        size: 110,
      }),
    ],
    [getRowActions, handleEditClick, isToggling, onToggleActive, projects]
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
        toolbarContent={toolbarContent}
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
