'use client';

import { AlertCircle, CheckCircle2, Clock, History, RefreshCw, Workflow, XCircle, XOctagon } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { useRouter } from 'next/navigation';
import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs';
import { useQueryStates } from 'nuqs';
import { type ReactNode, useCallback, useMemo } from 'react';

import type { WorkflowHistoryFilters, WorkflowHistorySortField, WorkflowHistorySortOrder } from '@/types/electron';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTableSkeleton } from '@/components/ui/table';
import {
  type HistoryStatusValue,
  HistoryTableToolbar,
  type HistoryTypeFilterValue,
  type ProjectFilterOption,
  WorkflowHistoryTable,
} from '@/components/workflows';
import { useProjects } from '@/hooks/queries/use-projects';
import { useWorkflowHistory, useWorkflowStatistics } from '@/hooks/queries/use-workflows';
import { useToast } from '@/hooks/use-toast';

import { Route, sortFields, sortOrders, terminalStatuses, workflowTypeFilters } from './route-type';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT_BY: WorkflowHistorySortField = 'createdAt';
const DEFAULT_SORT_ORDER: WorkflowHistorySortOrder = 'desc';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate pagination offset from page number and page size
 */
const calculateOffset = (page: number, pageSize: number): number => {
  return (page - 1) * pageSize;
};

/**
 * Calculate total page count from total items and page size
 */
const calculatePageCount = (total: number, pageSize: number): number => {
  return Math.ceil(total / pageSize);
};

/**
 * Format duration in milliseconds to a human-readable string
 */
const formatDuration = (durationMs: null | number): string => {
  if (durationMs === null || durationMs <= 0) {
    return 'N/A';
  }

  const minutes = Math.round(durationMs / 60000);

  if (minutes === 0) {
    return '<1m';
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

// ============================================================================
// Statistics Components
// ============================================================================

interface StatisticCardProps {
  description: string;
  icon: ReactNode;
  isLoading?: boolean;
  title: string;
  value: string;
}

const StatisticCardSkeleton = () => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading statistic'}
      className={'flex animate-pulse items-center gap-3 rounded-lg border border-card-border bg-card p-3'}
      role={'article'}
    >
      {/* Icon placeholder */}
      <div className={'size-8 shrink-0 rounded-full bg-muted'} />

      {/* Content placeholder */}
      <div className={'min-w-0 flex-1 space-y-1'}>
        <div className={'h-3 w-16 rounded-sm bg-muted'} />
        <div className={'h-5 w-12 rounded-sm bg-muted'} />
      </div>
    </div>
  );
};

const StatisticCard = ({ description, icon, isLoading = false, title, value }: StatisticCardProps) => {
  if (isLoading) {
    return <StatisticCardSkeleton />;
  }

  return (
    <div className={'flex items-center gap-3 rounded-lg border border-card-border bg-card p-3'} role={'article'}>
      {/* Icon */}
      <div
        className={`
          flex size-8 shrink-0 items-center justify-center rounded-full
          bg-accent/10 text-accent
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <div className={'min-w-0 flex-1'}>
        <p className={'text-xs text-muted-foreground'}>{title}</p>
        <p className={'text-lg font-semibold tracking-tight'} title={description}>
          {value}
        </p>
      </div>
    </div>
  );
};

interface StatisticsSectionProps {
  averageDurationMs: null | number;
  cancelledCount: number;
  completedCount: number;
  failedCount: number;
  isLoading: boolean;
  successRate: number;
}

const StatisticsSection = ({
  averageDurationMs,
  cancelledCount,
  completedCount,
  failedCount,
  isLoading,
  successRate,
}: StatisticsSectionProps) => {
  const totalCount = completedCount + failedCount + cancelledCount;

  return (
    <section
      aria-busy={isLoading}
      aria-label={isLoading ? 'Loading statistics' : 'Workflow statistics'}
      aria-live={'polite'}
      className={'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'}
      role={'region'}
    >
      {/* Total Workflows */}
      <StatisticCard
        description={'Total terminal workflows'}
        icon={<Workflow aria-hidden={'true'} className={'size-4'} />}
        isLoading={isLoading}
        title={'Total'}
        value={totalCount.toString()}
      />

      {/* Success Rate */}
      <StatisticCard
        description={'Percentage of successful completions'}
        icon={<CheckCircle2 aria-hidden={'true'} className={'size-4'} />}
        isLoading={isLoading}
        title={'Success Rate'}
        value={`${Math.round(successRate)}%`}
      />

      {/* Average Duration */}
      <StatisticCard
        description={'Average time to completion'}
        icon={<Clock aria-hidden={'true'} className={'size-4'} />}
        isLoading={isLoading}
        title={'Avg Duration'}
        value={formatDuration(averageDurationMs)}
      />

      {/* Completed Count */}
      <StatisticCard
        description={'Successfully completed workflows'}
        icon={<CheckCircle2 aria-hidden={'true'} className={'size-4 text-green-600 dark:text-green-400'} />}
        isLoading={isLoading}
        title={'Completed'}
        value={completedCount.toString()}
      />

      {/* Failed Count */}
      <StatisticCard
        description={'Workflows that failed'}
        icon={<XCircle aria-hidden={'true'} className={'size-4 text-destructive'} />}
        isLoading={isLoading}
        title={'Failed'}
        value={failedCount.toString()}
      />

      {/* Cancelled Count */}
      <StatisticCard
        description={'Workflows that were cancelled'}
        icon={<XOctagon aria-hidden={'true'} className={'size-4 text-amber-600 dark:text-amber-400'} />}
        isLoading={isLoading}
        title={'Cancelled'}
        value={cancelledCount.toString()}
      />
    </section>
  );
};

// ============================================================================
// Page Content
// ============================================================================

/**
 * Workflow History page - Displays completed, failed, and cancelled workflows.
 *
 * Features:
 * - Server-side pagination with TanStack Table integration
 * - Multi-filter support (status, type, project, date range, search)
 * - URL state persistence for all filter and pagination values
 * - View Details navigation to individual workflow pages
 * - Loading skeleton during data fetching
 * - Error and empty states with appropriate actions
 */
function WorkflowHistoryContent() {
  const router = useRouter();
  const toast = useToast();

  // URL state management with nuqs
  const [queryState, setQueryState] = useQueryStates({
    dateFrom: parseAsString,
    dateTo: parseAsString,
    page: parseAsInteger.withDefault(DEFAULT_PAGE),
    pageSize: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
    project: parseAsInteger,
    search: parseAsString,
    sortBy: parseAsStringLiteral(sortFields).withDefault(DEFAULT_SORT_BY),
    sortOrder: parseAsStringLiteral(sortOrders).withDefault(DEFAULT_SORT_ORDER),
    status: parseAsArrayOf(parseAsStringLiteral(terminalStatuses)),
    type: parseAsStringLiteral(workflowTypeFilters).withDefault('all'),
  });

  // Build WorkflowHistoryFilters from URL state
  const filters = useMemo<WorkflowHistoryFilters>(() => {
    const baseFilters: WorkflowHistoryFilters = {
      limit: queryState.pageSize,
      offset: calculateOffset(queryState.page, queryState.pageSize),
      sortBy: queryState.sortBy as WorkflowHistorySortField,
      sortOrder: queryState.sortOrder as WorkflowHistorySortOrder,
    };

    // Add optional filters only if they have values
    if (queryState.status && queryState.status.length > 0) {
      baseFilters.statuses = queryState.status as Array<'cancelled' | 'completed' | 'failed'>;
    }
    if (queryState.type && queryState.type !== 'all') {
      baseFilters.type = queryState.type;
    }
    if (queryState.project) {
      baseFilters.projectId = queryState.project;
    }
    if (queryState.dateFrom) {
      baseFilters.dateFrom = queryState.dateFrom;
    }
    if (queryState.dateTo) {
      baseFilters.dateTo = queryState.dateTo;
    }
    if (queryState.search) {
      baseFilters.searchTerm = queryState.search;
    }

    return baseFilters;
  }, [queryState]);

  // Data fetching
  const {
    data: historyResult,
    error: historyError,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useWorkflowHistory(filters);

  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  // Build statistics filter (matches history filters for date/project)
  const statisticsFilters = useMemo(() => {
    const statsFilters: { dateFrom?: string; dateTo?: string; projectId?: number } = {};

    if (queryState.project) {
      statsFilters.projectId = queryState.project;
    }
    if (queryState.dateFrom) {
      statsFilters.dateFrom = queryState.dateFrom;
    }
    if (queryState.dateTo) {
      statsFilters.dateTo = queryState.dateTo;
    }

    return Object.keys(statsFilters).length > 0 ? statsFilters : undefined;
  }, [queryState.dateFrom, queryState.dateTo, queryState.project]);

  const { data: statistics, isLoading: isStatisticsLoading } = useWorkflowStatistics(statisticsFilters);

  // Build project map for WorkflowHistoryTable
  const projectMap = useMemo(() => {
    return projects.reduce<Record<number, string>>((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {});
  }, [projects]);

  // Build project filter options for toolbar
  const projectFilterOptions = useMemo<Array<ProjectFilterOption>>(() => {
    return projects.map((project) => ({
      label: project.name,
      value: String(project.id),
    }));
  }, [projects]);

  // Extract data from history result
  const workflows = historyResult?.workflows ?? [];
  const totalWorkflows = historyResult?.total ?? 0;
  const pageCount = calculatePageCount(totalWorkflows, queryState.pageSize);

  // Event handlers
  const handleViewDetails = useCallback(
    (workflowId: number) => {
      router.push(
        $path({
          route: '/workflows/[id]',
          routeParams: { id: workflowId },
        })
      );
    },
    [router]
  );

  const handleStatusFilterChange = useCallback(
    (values: Array<HistoryStatusValue>) => {
      void setQueryState({
        page: DEFAULT_PAGE, // Reset to first page on filter change
        status: values.length > 0 ? values : null,
      });
    },
    [setQueryState]
  );

  const handleTypeFilterChange = useCallback(
    (value: HistoryTypeFilterValue) => {
      void setQueryState({
        page: DEFAULT_PAGE,
        type: value === 'all' ? null : value,
      });
    },
    [setQueryState]
  );

  const handleProjectFilterChange = useCallback(
    (value: string) => {
      void setQueryState({
        page: DEFAULT_PAGE,
        project: value === 'all' ? null : parseInt(value, 10),
      });
    },
    [setQueryState]
  );

  const handleDateFromFilterChange = useCallback(
    (value: string) => {
      void setQueryState({
        dateFrom: value || null,
        page: DEFAULT_PAGE,
      });
    },
    [setQueryState]
  );

  const handleDateToFilterChange = useCallback(
    (value: string) => {
      void setQueryState({
        dateTo: value || null,
        page: DEFAULT_PAGE,
      });
    },
    [setQueryState]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      void setQueryState({
        page: DEFAULT_PAGE, // Reset to first page on search change
        search: value || null,
      });
    },
    [setQueryState]
  );

  const handleResetFilters = useCallback(() => {
    void setQueryState({
      dateFrom: null,
      dateTo: null,
      page: DEFAULT_PAGE,
      project: null,
      search: null,
      status: null,
      type: null,
    });
  }, [setQueryState]);

  const handleRefresh = useCallback(() => {
    void refetchHistory();
    toast.success({
      description: 'Workflow history has been refreshed.',
      title: 'Refreshed',
    });
  }, [refetchHistory, toast]);

  const handlePaginationChange = useCallback(
    (
      updater:
        | ((old: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number })
        | { pageIndex: number; pageSize: number }
    ) => {
      const newPagination =
        typeof updater === 'function'
          ? updater({ pageIndex: queryState.page - 1, pageSize: queryState.pageSize })
          : updater;

      void setQueryState({
        page: newPagination.pageIndex + 1,
        pageSize: newPagination.pageSize,
      });
    },
    [queryState.page, queryState.pageSize, setQueryState]
  );

  // Derived state
  const isLoading = isHistoryLoading || isProjectsLoading;
  const hasError = !isLoading && historyError;

  // Check if any filters are applied
  const hasActiveFilters = Boolean(
    (queryState.status && queryState.status.length > 0) ||
    (queryState.type && queryState.type !== 'all') ||
    queryState.project ||
    queryState.dateFrom ||
    queryState.dateTo ||
    queryState.search
  );

  // Only show empty state when truly empty (no filters applied and no results)
  const isHistoryEmpty = !isLoading && !hasError && workflows.length === 0 && totalWorkflows === 0 && !hasActiveFilters;
  // Show table when we have results OR when filters are applied (even if no results)
  const hasHistory = !isLoading && !hasError && (workflows.length > 0 || totalWorkflows > 0 || hasActiveFilters);

  // Loading State
  if (isLoading) {
    return (
      <main aria-label={'Workflow History'} className={'space-y-6'}>
        {/* Page Header */}
        <div className={'flex items-center justify-between'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>Workflow History</h1>
        </div>

        {/* Statistics Section - Loading */}
        <StatisticsSection
          averageDurationMs={null}
          cancelledCount={0}
          completedCount={0}
          failedCount={0}
          isLoading={true}
          successRate={0}
        />

        {/* Table Skeleton */}
        <DataTableSkeleton columnCount={8} density={'default'} rowCount={5} />
      </main>
    );
  }

  // Error State
  if (hasError) {
    return (
      <main aria-label={'Workflow History'} className={'space-y-6'}>
        {/* Page Header */}
        <div className={'flex items-center justify-between'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>Workflow History</h1>
          <Button onClick={handleRefresh} size={'sm'} variant={'outline'}>
            <RefreshCw aria-hidden={'true'} className={'size-4'} />
            Retry
          </Button>
        </div>

        {/* Error Message */}
        <EmptyState
          action={
            <Button onClick={handleRefresh} variant={'outline'}>
              <RefreshCw aria-hidden={'true'} className={'size-4'} />
              Try Again
            </Button>
          }
          description={'Failed to load workflow history. Please try again.'}
          icon={<AlertCircle className={'size-6'} />}
          title={'Error Loading History'}
        />
      </main>
    );
  }

  // Empty State
  if (isHistoryEmpty) {
    return (
      <main aria-label={'Workflow History'} className={'space-y-6'}>
        {/* Page Header */}
        <div className={'flex items-center justify-between'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>Workflow History</h1>
        </div>

        {/* Empty State */}
        <EmptyState
          description={'Completed, failed, and cancelled workflows will appear here.'}
          icon={<History className={'size-6'} />}
          title={'No Workflow History'}
        />
      </main>
    );
  }

  // Content State
  if (hasHistory) {
    return (
      <QueryErrorBoundary>
        <main aria-label={'Workflow History'} className={'space-y-6'}>
          {/* Page Header */}
          <div className={'flex items-center justify-between'}>
            <h1 className={'text-2xl font-semibold tracking-tight'}>Workflow History</h1>
            <Button onClick={handleRefresh} size={'sm'} variant={'ghost'}>
              <RefreshCw aria-hidden={'true'} className={'size-4'} />
              Refresh
            </Button>
          </div>

          {/* Statistics Section */}
          <StatisticsSection
            averageDurationMs={statistics?.averageDurationMs ?? null}
            cancelledCount={statistics?.cancelledCount ?? 0}
            completedCount={statistics?.completedCount ?? 0}
            failedCount={statistics?.failedCount ?? 0}
            isLoading={isStatisticsLoading}
            successRate={statistics?.successRate ?? 0}
          />

          {/* Workflow History Table */}
          <WorkflowHistoryTable
            onGlobalFilterChange={handleSearchChange}
            onPaginationChange={handlePaginationChange}
            onViewDetails={handleViewDetails}
            pageCount={pageCount}
            pagination={{
              pageIndex: queryState.page - 1,
              pageSize: queryState.pageSize,
            }}
            projectMap={projectMap}
            rowCount={totalWorkflows}
            toolbarContent={
              <HistoryTableToolbar
                dateFromFilter={queryState.dateFrom ?? undefined}
                dateToFilter={queryState.dateTo ?? undefined}
                onDateFromFilterChange={handleDateFromFilterChange}
                onDateToFilterChange={handleDateToFilterChange}
                onProjectFilterChange={handleProjectFilterChange}
                onResetFilters={handleResetFilters}
                onStatusFilterChange={handleStatusFilterChange}
                onTypeFilterChange={handleTypeFilterChange}
                projectFilter={queryState.project ? String(queryState.project) : 'all'}
                projects={projectFilterOptions}
                statusFilter={queryState.status ?? []}
                typeFilter={queryState.type ?? 'all'}
              />
            }
            workflows={workflows}
          />
        </main>
      </QueryErrorBoundary>
    );
  }

  return null;
}

// ============================================================================
// Export
// ============================================================================

export default withParamValidation(WorkflowHistoryContent, Route);
