'use client';

import type { Row } from '@tanstack/react-table';
import type { ComponentPropsWithRef } from 'react';

import { memo, useCallback, useMemo } from 'react';

import type { DiscoveredFile } from '@/db/schema';

import { Badge } from '@/components/ui/badge';
import {
  createColumnHelper,
  DataTable,
  DataTableColumnHeader,
  type DataTableRowStyleCallback,
} from '@/components/ui/table';
import { Tooltip } from '@/components/ui/tooltip';
import { useToggleDiscoveredFile } from '@/hooks/queries/use-discovered-files';
import { useDiscoveryStore } from '@/lib/stores/discovery-store';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface DiscoveredFilesTableProps extends Omit<ComponentPropsWithRef<'div'>, 'onToggle'> {
  /** Discovered files to display */
  files: Array<DiscoveredFile>;
  /** Callback when a file's inclusion status is toggled */
  onFileToggle?: (file: DiscoveredFile) => void;
}

type FileAction = 'create' | 'delete' | 'modify' | 'reference';
type FilePriority = 'high' | 'low' | 'medium';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get badge variant for file action
 */
const getActionBadgeVariant = (action: string): 'completed' | 'default' | 'failed' | 'specialist' => {
  const actionVariantMap: Record<string, 'completed' | 'default' | 'failed' | 'specialist'> = {
    create: 'completed',
    delete: 'failed',
    modify: 'specialist',
    reference: 'default',
  };

  return actionVariantMap[action] ?? 'default';
};

/**
 * Get priority badge color classes
 */
const getPriorityBadgeClass = (priority: string): string => {
  const priorityClassMap: Record<string, string> = {
    high: 'bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-100',
    low: 'bg-green-200 text-green-900 dark:bg-green-900/60 dark:text-green-100',
    medium: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/60 dark:text-yellow-100',
  };

  return priorityClassMap[priority] ?? '';
};

/**
 * Format action label for display
 */
const formatActionLabel = (action: FileAction): string => {
  return action.charAt(0).toUpperCase() + action.slice(1);
};

/**
 * Format priority label for display
 */
const formatPriorityLabel = (priority: FilePriority): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

// ============================================================================
// Column Helper
// ============================================================================

const columnHelper = createColumnHelper<DiscoveredFile>();

// ============================================================================
// Memoized Cell Components
// ============================================================================

interface PathCellProps {
  file: DiscoveredFile;
}

/**
 * Memoized path cell with tooltip for full path
 */
const PathCell = memo(function PathCell({ file }: PathCellProps) {
  const isIncluded = file.includedAt !== null;
  const fileName = file.filePath.split(/[\\/]/).pop() ?? file.filePath;
  const directoryPath = file.filePath.slice(0, file.filePath.length - fileName.length);

  return (
    <Tooltip content={file.filePath} side={'bottom'}>
      <div className={cn('flex flex-col gap-0.5', !isIncluded && 'opacity-50')}>
        <span className={'truncate font-medium text-foreground'}>{fileName}</span>
        {directoryPath && (
          <span className={'truncate text-xs text-muted-foreground'}>{directoryPath.slice(0, -1)}</span>
        )}
      </div>
    </Tooltip>
  );
});

interface PriorityCellProps {
  priority: string;
}

/**
 * Memoized priority cell with color-coded badge
 */
const PriorityCell = memo(function PriorityCell({ priority }: PriorityCellProps) {
  const priorityClass = getPriorityBadgeClass(priority);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium',
        priorityClass
      )}
    >
      {formatPriorityLabel(priority as FilePriority)}
    </span>
  );
});

interface ActionCellProps {
  action: string;
}

/**
 * Memoized action cell with color-coded badge
 */
const ActionCell = memo(function ActionCell({ action }: ActionCellProps) {
  return (
    <Badge size={'sm'} variant={getActionBadgeVariant(action)}>
      {formatActionLabel(action as FileAction)}
    </Badge>
  );
});

interface RoleCellProps {
  role: null | string;
}

/**
 * Memoized role cell
 */
const RoleCell = memo(function RoleCell({ role }: RoleCellProps) {
  if (!role) return <span className={'text-muted-foreground'}>-</span>;

  return (
    <Tooltip content={role} side={'bottom'}>
      <span className={'truncate text-sm'}>{role}</span>
    </Tooltip>
  );
});

interface RelevanceCellProps {
  relevanceExplanation: null | string;
}

/**
 * Memoized relevance cell with tooltip
 */
const RelevanceCell = memo(function RelevanceCell({ relevanceExplanation }: RelevanceCellProps) {
  if (!relevanceExplanation) return <span className={'text-muted-foreground'}>-</span>;

  return (
    <Tooltip content={relevanceExplanation} side={'bottom'}>
      <span className={'line-clamp-2 text-sm text-muted-foreground'}>{relevanceExplanation}</span>
    </Tooltip>
  );
});

interface InclusionCellProps {
  file: DiscoveredFile;
}

/**
 * Memoized inclusion status cell
 */
const InclusionCell = memo(function InclusionCell({ file }: InclusionCellProps) {
  const isIncluded = file.includedAt !== null;

  return (
    <Badge size={'sm'} variant={isIncluded ? 'completed' : 'default'}>
      {isIncluded ? 'Included' : 'Excluded'}
    </Badge>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * Table component for displaying discovered files in the file discovery workflow step.
 *
 * Features:
 * - Columns: Path, Priority, Action, Role, Relevance, Inclusion Status
 * - Row click to toggle inclusion/exclusion
 * - Priority badges with color coding (High=red, Medium=yellow, Low=green)
 * - Action badges with color coding (Create=green, Modify=blue, Delete=red, Reference=gray)
 * - Column persistence via tableId
 * - Subtle styling for excluded files
 *
 * @example
 * ```tsx
 * <DiscoveredFilesTable
 *   files={discoveredFiles}
 *   onFileToggle={(file) => console.log('Toggled:', file.id)}
 * />
 * ```
 */
export const DiscoveredFilesTable = ({ className, files, onFileToggle, ref, ...props }: DiscoveredFilesTableProps) => {
  const toggleMutation = useToggleDiscoveredFile();
  const { filters, searchTerm } = useDiscoveryStore();

  // Memoize data to prevent infinite re-renders
  const data = useMemo(() => [...files], [files]);

  // Filter data based on search term and filters from Zustand store
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (file) =>
          file.filePath.toLowerCase().includes(lowerSearchTerm) ||
          file.role?.toLowerCase().includes(lowerSearchTerm) ||
          file.relevanceExplanation?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Apply action filter
    if (filters.actionFilter !== 'all') {
      result = result.filter((file) => file.action === filters.actionFilter);
    }

    // Apply priority filter
    if (filters.priorityFilter !== 'all') {
      result = result.filter((file) => file.priority.toLowerCase() === filters.priorityFilter.toLowerCase());
    }

    // Apply inclusion filter
    if (filters.inclusionFilter !== 'all') {
      if (filters.inclusionFilter === 'included') {
        result = result.filter((file) => file.includedAt !== null);
      } else if (filters.inclusionFilter === 'excluded') {
        result = result.filter((file) => file.includedAt === null);
      }
    }

    return result;
  }, [data, filters.actionFilter, filters.inclusionFilter, filters.priorityFilter, searchTerm]);

  // Handle row click to toggle inclusion
  const handleRowClick = useCallback(
    (row: Row<DiscoveredFile>) => {
      const file = row.original;
      toggleMutation.mutate(file.id, {
        onSuccess: (updatedFile) => {
          if (updatedFile) {
            onFileToggle?.(updatedFile);
          }
        },
      });
    },
    [onFileToggle, toggleMutation]
  );

  // Row style callback for excluded files
  const rowStyleCallback: DataTableRowStyleCallback<DiscoveredFile> = useCallback((row) => {
    const isIncluded = row.original.includedAt !== null;
    return isIncluded ? undefined : 'bg-muted/30';
  }, []);

  // Define columns using the column helper
  const columns = useMemo(
    () => [
      // Path column
      columnHelper.accessor('filePath', {
        cell: ({ row }) => <PathCell file={row.original} />,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Path'} />,
        size: 300,
      }),

      // Priority column
      columnHelper.accessor('priority', {
        cell: ({ row }) => <PriorityCell priority={row.original.priority} />,
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Priority'} />,
        size: 100,
      }),

      // Action column
      columnHelper.accessor('action', {
        cell: ({ row }) => <ActionCell action={row.original.action} />,
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Action'} />,
        size: 100,
      }),

      // Role column
      columnHelper.accessor('role', {
        cell: ({ row }) => <RoleCell role={row.original.role} />,
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Role'} />,
        size: 150,
      }),

      // Relevance column
      columnHelper.accessor('relevanceExplanation', {
        cell: ({ row }) => <RelevanceCell relevanceExplanation={row.original.relevanceExplanation} />,
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Relevance'} />,
        meta: {
          isFillerColumn: true,
        },
        size: 200,
      }),

      // Inclusion status column
      columnHelper.display({
        cell: ({ row }) => <InclusionCell file={row.original} />,
        enableSorting: false,
        header: 'Status',
        id: 'inclusionStatus',
        size: 100,
      }),
    ],
    []
  );

  return (
    <DataTable
      className={className}
      columns={columns}
      data={filteredData}
      density={'compact'}
      emptyState={{
        noData: {
          description: 'Run file discovery to find relevant files for this feature.',
          title: 'No files discovered',
        },
        noResults: {
          description: 'Try adjusting your search or filters.',
          title: 'No matching files',
        },
      }}
      getRowId={(file) => String(file.id)}
      isPaginationEnabled={false}
      isToolbarVisible={false}
      onRowClick={handleRowClick}
      persistence={{
        persistedKeys: ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting'],
        tableId: 'discovered-files-table',
      }}
      ref={ref}
      rowStyleCallback={rowStyleCallback}
      {...props}
    />
  );
};
