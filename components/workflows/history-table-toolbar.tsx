'use client';

import type { ChangeEvent, ComponentPropsWithRef } from 'react';

import { Filter, RotateCcw } from 'lucide-react';
import { memo, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { cn, optionsToItems } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

/** Terminal workflow status values for history filtering */
export type HistoryStatusValue = 'cancelled' | 'completed' | 'failed';

export interface HistoryTableToolbarProps extends ComponentPropsWithRef<'div'> {
  /** Date range start filter value (ISO date string YYYY-MM-DD) */
  dateFromFilter?: string;
  /** Date range end filter value (ISO date string YYYY-MM-DD) */
  dateToFilter?: string;
  /** Callback when date range start filter changes */
  onDateFromFilterChange?: (value: string) => void;
  /** Callback when date range end filter changes */
  onDateToFilterChange?: (value: string) => void;
  /** Callback when project filter changes */
  onProjectFilterChange?: (value: string) => void;
  /** Callback when reset filters button is clicked */
  onResetFilters?: () => void;
  /** Callback when status filter changes */
  onStatusFilterChange: (values: Array<HistoryStatusValue>) => void;
  /** Callback when type filter changes */
  onTypeFilterChange: (value: HistoryTypeFilterValue) => void;
  /** Current project filter value */
  projectFilter?: string;
  /** Available projects for filtering */
  projects?: Array<ProjectFilterOption>;
  /** Current status filter values (multi-select) */
  statusFilter: Array<HistoryStatusValue>;
  /** Current type filter value */
  typeFilter: HistoryTypeFilterValue;
}

/** Available workflow type filter values */
export type HistoryTypeFilterValue = 'all' | 'implementation' | 'planning';

/** Project option for project filter select */
export interface ProjectFilterOption {
  label: string;
  value: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DATE_FROM_FILTER = '';
const DEFAULT_DATE_TO_FILTER = '';
const DEFAULT_PROJECT_FILTER = 'all';
const DEFAULT_STATUS_FILTER: Array<HistoryStatusValue> = [];
const DEFAULT_TYPE_FILTER: HistoryTypeFilterValue = 'all';

/** Terminal status filter options for workflow history (completed, cancelled, failed) */
export const TERMINAL_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  label: string;
  value: HistoryStatusValue;
}> = [
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Failed', value: 'failed' },
] as const;

const TYPE_FILTER_OPTIONS = [
  { label: 'All types', value: 'all' },
  { label: 'Planning', value: 'planning' },
  { label: 'Implementation', value: 'implementation' },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

interface FilterCountParams {
  dateFromFilter?: string;
  dateToFilter?: string;
  projectFilter?: string;
  statusFilter: Array<HistoryStatusValue>;
  typeFilter: HistoryTypeFilterValue;
}

/**
 * Calculate the number of active filters
 */
const getActiveFilterCount = ({
  dateFromFilter,
  dateToFilter,
  projectFilter,
  statusFilter,
  typeFilter,
}: FilterCountParams): number => {
  let count = 0;
  if (statusFilter.length > 0) count++;
  if (typeFilter !== DEFAULT_TYPE_FILTER) count++;
  if (projectFilter && projectFilter !== DEFAULT_PROJECT_FILTER) count++;
  if (dateFromFilter && dateFromFilter !== DEFAULT_DATE_FROM_FILTER) count++;
  if (dateToFilter && dateToFilter !== DEFAULT_DATE_TO_FILTER) count++;
  return count;
};

// ============================================================================
// Sub-components
// ============================================================================

interface FilterCountBadgeProps {
  /** Number of active filters */
  count: number;
}

/**
 * Badge showing the count of active filters
 */
const FilterCountBadge = ({ count }: FilterCountBadgeProps) => {
  if (count === 0) return null;
  return (
    <span
      aria-label={`${count} filter${count !== 1 ? 's' : ''} active`}
      className={
        'ml-1 inline-flex size-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground'
      }
    >
      {count}
    </span>
  );
};

interface StatusCheckboxItemProps {
  /** Whether the status is checked */
  isChecked: boolean;
  /** Label for the status */
  label: string;
  /** Callback when checkbox changes */
  onCheckedChange: (isChecked: boolean) => void;
  /** Value of the status */
  value: HistoryStatusValue;
}

/**
 * Individual checkbox item for status multi-select
 */
const StatusCheckboxItem = ({ isChecked, label, onCheckedChange, value }: StatusCheckboxItemProps) => {
  const handleCheckedChange = (checked: boolean) => {
    onCheckedChange(checked);
  };

  return (
    <label className={'flex cursor-pointer items-center gap-2'} htmlFor={`status-${value}`}>
      <Checkbox checked={isChecked} id={`status-${value}`} onCheckedChange={handleCheckedChange} size={'sm'} />
      <span className={'text-sm'}>{label}</span>
    </label>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Toolbar content component for the workflow history table with collapsible filters panel.
 *
 * Provides:
 * - Status multi-select for terminal statuses (completed, cancelled, failed)
 * - Type single-select filter (all, planning, implementation)
 * - Project single-select filter
 * - Date range inputs for filtering by date
 * - Active filter count badge on the Filters button
 * - Reset filters button when filters are active
 *
 * Designed to integrate with DataTable's toolbarContent slot for
 * consistent toolbar styling and layout.
 *
 * @example
 * ```tsx
 * <DataTable
 *   // ...other props
 *   toolbarContent={
 *     <HistoryTableToolbar
 *       statusFilter={statusFilter}
 *       typeFilter={typeFilter}
 *       dateFromFilter={dateFromFilter}
 *       dateToFilter={dateToFilter}
 *       onStatusFilterChange={handleStatusFilterChange}
 *       onTypeFilterChange={handleTypeFilterChange}
 *       onDateFromFilterChange={handleDateFromFilterChange}
 *       onDateToFilterChange={handleDateToFilterChange}
 *       onResetFilters={handleResetFilters}
 *     />
 *   }
 * />
 * ```
 */
export const HistoryTableToolbar = memo(function HistoryTableToolbar({
  className,
  dateFromFilter,
  dateToFilter,
  onDateFromFilterChange,
  onDateToFilterChange,
  onProjectFilterChange,
  onResetFilters,
  onStatusFilterChange,
  onTypeFilterChange,
  projectFilter,
  projects,
  ref,
  statusFilter,
  typeFilter,
  ...props
}: HistoryTableToolbarProps) {
  // Computed state
  const activeFilterCount = getActiveFilterCount({
    dateFromFilter,
    dateToFilter,
    projectFilter,
    statusFilter,
    typeFilter,
  });
  const hasActiveFilters = activeFilterCount > 0;

  // Handlers
  const handleStatusChange = (value: HistoryStatusValue, isChecked: boolean) => {
    if (isChecked) {
      onStatusFilterChange([...statusFilter, value]);
    } else {
      onStatusFilterChange(statusFilter.filter((s) => s !== value));
    }
  };

  const handleProjectFilterChange = (value: null | string) => {
    onProjectFilterChange?.(value || DEFAULT_PROJECT_FILTER);
  };

  const handleTypeFilterChange = (value: null | string) => {
    onTypeFilterChange((value || DEFAULT_TYPE_FILTER) as HistoryTypeFilterValue);
  };

  const handleDateFromChange = (event: ChangeEvent<HTMLInputElement>) => {
    onDateFromFilterChange?.(event.target.value);
  };

  const handleDateToChange = (event: ChangeEvent<HTMLInputElement>) => {
    onDateToFilterChange?.(event.target.value);
  };

  const handleResetFilters = () => {
    onStatusFilterChange(DEFAULT_STATUS_FILTER);
    onTypeFilterChange(DEFAULT_TYPE_FILTER);
    onProjectFilterChange?.(DEFAULT_PROJECT_FILTER);
    onDateFromFilterChange?.(DEFAULT_DATE_FROM_FILTER);
    onDateToFilterChange?.(DEFAULT_DATE_TO_FILTER);
    onResetFilters?.();
  };

  // Build items maps for SelectRoot to display labels instead of raw values
  const projectFilterOptions = useMemo(() => {
    const allOption = { label: 'All projects', value: 'all' };
    return [allOption, ...(projects || [])];
  }, [projects]);
  const projectFilterItems = useMemo(() => optionsToItems(projectFilterOptions), [projectFilterOptions]);
  const typeFilterItems = useMemo(() => optionsToItems(TYPE_FILTER_OPTIONS), []);

  // Helper to check if a status is selected
  const isStatusSelected = (value: HistoryStatusValue): boolean => {
    return statusFilter.includes(value);
  };

  return (
    <div className={cn('flex items-center gap-3', className)} ref={ref} {...props}>
      {/* Filters Popover */}
      <PopoverRoot>
        <PopoverTrigger>
          <Button
            aria-label={`Filters${hasActiveFilters ? `, ${activeFilterCount} active` : ''}`}
            size={'sm'}
            variant={'outline'}
          >
            <Filter aria-hidden={'true'} className={'size-4'} />
            Filters
            <FilterCountBadge count={activeFilterCount} />
          </Button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverPositioner align={'start'}>
            <PopoverPopup className={'w-80'}>
              <PopoverHeader>
                <PopoverTitle>Filters</PopoverTitle>
              </PopoverHeader>

              <PopoverContent className={'space-y-4'}>
                {/* Status Filter (Multi-select) */}
                <div className={'space-y-2'}>
                  <span className={'text-xs font-medium text-muted-foreground'} id={'filter-status-label'}>
                    Status
                  </span>
                  <div aria-labelledby={'filter-status-label'} className={'flex flex-col gap-2'} role={'group'}>
                    {TERMINAL_STATUS_FILTER_OPTIONS.map((option) => (
                      <StatusCheckboxItem
                        isChecked={isStatusSelected(option.value)}
                        key={option.value}
                        label={option.label}
                        onCheckedChange={(isChecked) => handleStatusChange(option.value, isChecked)}
                        value={option.value}
                      />
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div className={'space-y-1.5'}>
                  <label className={'text-xs font-medium text-muted-foreground'} id={'filter-type-label'}>
                    Type
                  </label>
                  <SelectRoot items={typeFilterItems} onValueChange={handleTypeFilterChange} value={typeFilter}>
                    <SelectTrigger aria-labelledby={'filter-type-label'} className={'w-full'} size={'sm'}>
                      <SelectValue placeholder={'All types'} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectPositioner>
                        <SelectPopup size={'sm'}>
                          <SelectList>
                            {TYPE_FILTER_OPTIONS.map((option) => (
                              <SelectItem key={option.value} label={option.label} size={'sm'} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectList>
                        </SelectPopup>
                      </SelectPositioner>
                    </SelectPortal>
                  </SelectRoot>
                </div>

                {/* Project Filter */}
                <div className={'space-y-1.5'}>
                  <label className={'text-xs font-medium text-muted-foreground'} id={'filter-project-label'}>
                    Project
                  </label>
                  <SelectRoot
                    items={projectFilterItems}
                    onValueChange={handleProjectFilterChange}
                    value={projectFilter || DEFAULT_PROJECT_FILTER}
                  >
                    <SelectTrigger aria-labelledby={'filter-project-label'} className={'w-full'} size={'sm'}>
                      <SelectValue placeholder={'All projects'} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectPositioner>
                        <SelectPopup size={'sm'}>
                          <SelectList>
                            {projectFilterOptions.map((option) => (
                              <SelectItem key={option.value} label={option.label} size={'sm'} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectList>
                        </SelectPopup>
                      </SelectPositioner>
                    </SelectPortal>
                  </SelectRoot>
                </div>

                {/* Date Range Filter */}
                <div className={'space-y-1.5'}>
                  <span className={'text-xs font-medium text-muted-foreground'}>Date Range</span>
                  <div className={'flex items-center gap-2'}>
                    <div className={'flex-1'}>
                      <label className={'sr-only'} htmlFor={'filter-date-from'}>
                        From date
                      </label>
                      <Input
                        aria-label={'From date'}
                        id={'filter-date-from'}
                        onChange={handleDateFromChange}
                        placeholder={'From'}
                        size={'sm'}
                        type={'date'}
                        value={dateFromFilter || ''}
                      />
                    </div>
                    <span className={'text-muted-foreground'}>to</span>
                    <div className={'flex-1'}>
                      <label className={'sr-only'} htmlFor={'filter-date-to'}>
                        To date
                      </label>
                      <Input
                        aria-label={'To date'}
                        id={'filter-date-to'}
                        onChange={handleDateToChange}
                        placeholder={'To'}
                        size={'sm'}
                        type={'date'}
                        value={dateToFilter || ''}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <PopoverFooter>
                  <Button className={'w-full'} onClick={handleResetFilters} size={'sm'} variant={'ghost'}>
                    <RotateCcw aria-hidden={'true'} className={'size-4'} />
                    Reset Filters
                  </Button>
                </PopoverFooter>
              )}
            </PopoverPopup>
          </PopoverPositioner>
        </PopoverPortal>
      </PopoverRoot>
    </div>
  );
});
