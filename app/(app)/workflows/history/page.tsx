'use client';

import { History, Search } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { useRouter } from 'next/navigation';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import type { TerminalStatus, WorkflowHistorySortField, WorkflowHistorySortOrder } from '@/types/electron';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangeFilter } from '@/components/workflows/date-range-filter';
import { HistoryStatisticsCards } from '@/components/workflows/history-statistics-cards';
import { WorkflowHistoryTable } from '@/components/workflows/workflow-history-table';
import { useExportAuditLog } from '@/hooks/queries/use-audit-logs';
import { useProjects } from '@/hooks/queries/use-projects';
import { useWorkflowHistory, useWorkflowStatistics } from '@/hooks/queries/use-workflows';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { Route } from './route-type';

// Terminal statuses that appear in history
const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'] as const;
const SORT_FIELDS = ['featureName', 'status', 'durationMs', 'completedAt'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

// Type for valid sort fields in history (subset of WorkflowHistorySortField)
type HistorySortField = (typeof SORT_FIELDS)[number];

// Default pagination settings
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

/**
 * Loading skeleton for the workflow history table
 */
const WorkflowHistoryTableSkeleton = () => {
  return (
    <div className={'animate-pulse overflow-x-auto rounded-lg border border-border'}>
      <table className={'w-full border-collapse text-sm'}>
        <thead className={'border-b border-border bg-muted/50'}>
          <tr>
            {['Feature Name', 'Workflow Type', 'Final Status', 'Duration', 'Completed', 'Actions'].map((header) => (
              <th className={'px-4 py-3 text-left font-medium text-muted-foreground'} key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={'divide-y divide-border'}>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td className={'px-4 py-3'}>
                <div className={'h-4 w-40 rounded-sm bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'h-5 w-20 rounded-full bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'h-5 w-20 rounded-full bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'h-4 w-16 rounded-sm bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'h-4 w-24 rounded-sm bg-muted'} />
              </td>
              <td className={'px-4 py-3'}>
                <div className={'flex justify-end gap-2'}>
                  <div className={'h-8 w-16 rounded-sm bg-muted'} />
                  <div className={'h-8 w-20 rounded-sm bg-muted'} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Format status label for display
 */
const formatStatusLabel = (status: TerminalStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Workflow History page - Browse completed, failed, and cancelled workflows.
 *
 * Features:
 * - Statistics cards showing completion metrics
 * - Date range filtering with preset options
 * - Status filter (completed, failed, cancelled)
 * - Project filter
 * - Search by feature name
 * - Sortable table columns
 * - Pagination
 * - Export audit log functionality
 * - Navigate to workflow detail view
 */
function WorkflowHistoryPageContent() {
  const router = useRouter();
  const toast = useToast();

  // URL state management with nuqs
  const [queryState, setQueryState] = useQueryStates({
    dateFrom: parseAsString,
    dateTo: parseAsString,
    page: parseAsInteger.withDefault(DEFAULT_PAGE),
    pageSize: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
    projectId: parseAsInteger,
    search: parseAsString.withDefault(''),
    sortBy: parseAsStringLiteral(SORT_FIELDS).withDefault('completedAt'),
    sortOrder: parseAsStringLiteral(SORT_ORDERS).withDefault('desc'),
    status: parseAsStringLiteral(TERMINAL_STATUSES),
  });

  const { dateFrom, dateTo, page, pageSize, projectId, search, sortBy, sortOrder, status } = queryState;

  // Build filters for workflow history query
  const historyFilters = useMemo(
    () => ({
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      projectId: projectId ?? undefined,
      searchTerm: search || undefined,
      sortBy: sortBy as WorkflowHistorySortField,
      sortOrder: sortOrder as WorkflowHistorySortOrder,
      statuses: status ? [status as TerminalStatus] : undefined,
    }),
    [dateFrom, dateTo, page, pageSize, projectId, search, sortBy, sortOrder, status]
  );

  // Data fetching
  const { data: historyResult, isLoading: isLoadingHistory } = useWorkflowHistory(historyFilters);
  const { data: statistics, isLoading: isLoadingStatistics } = useWorkflowStatistics({
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
    projectId: projectId ?? undefined,
  });
  const { data: projects, isLoading: isLoadingProjects } = useProjects();

  // Mutations
  const exportAuditLogMutation = useExportAuditLog();

  const isLoading = isLoadingHistory || isLoadingProjects;

  // Build project options for filter
  const projectOptions = useMemo(() => {
    if (!projects) return [];
    return projects
      .filter((project) => project.archivedAt === null)
      .map((project) => ({
        label: project.name,
        value: project.id,
      }));
  }, [projects]);

  // Computed values
  const workflows = historyResult?.workflows ?? [];
  const totalItems = historyResult?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Handlers
  const handleDateFromChange = (value: string | undefined) => {
    void setQueryState({ dateFrom: value ?? null, page: DEFAULT_PAGE });
  };

  const handleDateToChange = (value: string | undefined) => {
    void setQueryState({ dateTo: value ?? null, page: DEFAULT_PAGE });
  };

  const handleStatusChange = (newStatus: null | string) => {
    if (!newStatus) {
      void setQueryState({ page: DEFAULT_PAGE, status: null });
    } else {
      void setQueryState({
        page: DEFAULT_PAGE,
        status: newStatus as TerminalStatus,
      });
    }
  };

  const handleProjectChange = (newProjectId: null | number) => {
    void setQueryState({ page: DEFAULT_PAGE, projectId: newProjectId });
  };

  const handleSearchChange = (newSearch: string) => {
    void setQueryState({ page: DEFAULT_PAGE, search: newSearch || null });
  };

  const handleSortChange = (field: WorkflowHistorySortField, order: WorkflowHistorySortOrder) => {
    // Only accept valid history sort fields (subset of WorkflowHistorySortField)
    if (SORT_FIELDS.includes(field as HistorySortField)) {
      void setQueryState({
        sortBy: field as HistorySortField,
        sortOrder: order,
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    void setQueryState({ page: newPage });
  };

  const handleViewDetails = (workflowId: number) => {
    router.push(
      $path({
        route: '/workflows/[id]',
        routeParams: { id: String(workflowId) },
      })
    );
  };

  const handleExportAuditLog = async (workflowId: number) => {
    try {
      const result = await exportAuditLogMutation.mutateAsync(workflowId);

      if (result.success && result.content) {
        toast.success({
          description: 'Audit log exported successfully.',
        });
      } else {
        toast.error({
          description: result.error ?? 'Failed to export audit log.',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred while exporting.';
      toast.error({ description: message });
    }
  };

  const handleClearFilters = () => {
    void setQueryState({
      dateFrom: null,
      dateTo: null,
      page: DEFAULT_PAGE,
      projectId: null,
      search: null,
      status: null,
    });
  };

  // Derived state
  const hasActiveFilters =
    Boolean(dateFrom) || Boolean(dateTo) || Boolean(status) || Boolean(projectId) || Boolean(search);
  const hasNoHistory = !isLoading && totalItems === 0 && !hasActiveFilters;
  const hasNoFilteredHistory = !isLoading && totalItems === 0 && hasActiveFilters;
  const _showPagination = !isLoading && totalItems > 0;

  return (
    <div className={'space-y-6'}>
      {/* Page heading */}
      <div className={'space-y-1'}>
        <h1 className={'text-2xl font-semibold tracking-tight'}>{'Workflow History'}</h1>
        <p className={'text-muted-foreground'}>{'Browse completed and archived workflow runs.'}</p>
      </div>

      {/* Statistics Cards */}
      <HistoryStatisticsCards isLoading={isLoadingStatistics} statistics={statistics} />

      {/* Filters section */}
      <div className={'space-y-4'}>
        {/* Date range filter */}
        <DateRangeFilter
          dateFrom={dateFrom ?? undefined}
          dateTo={dateTo ?? undefined}
          onDateFromChange={handleDateFromChange}
          onDateToChange={handleDateToChange}
        />

        {/* Other filters */}
        <div className={'flex flex-wrap items-center gap-4'}>
          {/* Status filter */}
          <SelectRoot onValueChange={(newValue) => handleStatusChange(newValue)} value={status ?? ''}>
            <SelectTrigger aria-label={'Filter by status'} className={'w-40'} size={'sm'}>
              <SelectValue placeholder={'All statuses'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    <SelectItem size={'sm'} value={''}>
                      {'All statuses'}
                    </SelectItem>
                    {TERMINAL_STATUSES.map((terminalStatus) => (
                      <SelectItem
                        key={terminalStatus}
                        label={formatStatusLabel(terminalStatus)}
                        size={'sm'}
                        value={terminalStatus}
                      >
                        {formatStatusLabel(terminalStatus)}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>

          {/* Project filter */}
          <SelectRoot
            onValueChange={(newValue) => handleProjectChange(newValue ? Number(newValue) : null)}
            value={projectId ? String(projectId) : ''}
          >
            <SelectTrigger aria-label={'Filter by project'} className={'w-48'} size={'sm'}>
              <SelectValue placeholder={'All projects'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    <SelectItem size={'sm'} value={''}>
                      {'All projects'}
                    </SelectItem>
                    {projectOptions.map((option) => (
                      <SelectItem key={option.value} label={option.label} size={'sm'} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>

          {/* Search input */}
          <div className={'relative flex-1 md:max-w-xs'}>
            <Search
              aria-hidden={'true'}
              className={cn('absolute top-1/2 left-2.5 size-4 -translate-y-1/2', 'text-muted-foreground')}
            />
            <Input
              aria-label={'Search workflows'}
              className={'pl-8'}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={'Search by feature name...'}
              size={'sm'}
              type={'search'}
              value={search}
            />
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button onClick={handleClearFilters} size={'sm'} variant={'ghost'}>
              {'Clear filters'}
            </Button>
          )}
        </div>
      </div>

      {/* Workflow history content */}
      <QueryErrorBoundary>
        {isLoading ? (
          // Loading skeleton
          <WorkflowHistoryTableSkeleton />
        ) : hasNoHistory ? (
          // Empty state when no history exists
          <EmptyState
            description={'Completed workflows will appear here. Start a new workflow to build your history.'}
            icon={<History aria-hidden={'true'} className={'size-6'} />}
            title={'No workflow history'}
          />
        ) : hasNoFilteredHistory ? (
          // Empty state when filters hide all history
          <EmptyState
            action={
              <Button onClick={handleClearFilters} variant={'outline'}>
                {'Clear filters'}
              </Button>
            }
            description={'No workflows match your current filters. Try adjusting your search criteria.'}
            icon={<Search aria-hidden={'true'} className={'size-6'} />}
            title={'No matching workflows'}
          />
        ) : (
          // Workflow history table
          <WorkflowHistoryTable
            onExportAuditLog={handleExportAuditLog}
            onSortChange={handleSortChange}
            onViewDetails={handleViewDetails}
            sortBy={sortBy as WorkflowHistorySortField}
            sortOrder={sortOrder as WorkflowHistorySortOrder}
            workflows={workflows}
          />
        )}
      </QueryErrorBoundary>

      {/* Pagination */}
      {_showPagination && (
        <Pagination
          currentPage={page}
          onPageChange={handlePageChange}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}

export default withParamValidation(WorkflowHistoryPageContent, Route);
