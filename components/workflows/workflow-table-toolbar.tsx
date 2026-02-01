'use client';

import type { ComponentPropsWithRef } from 'react';

import { Filter, RotateCcw } from 'lucide-react';
import { memo, useMemo } from 'react';

import { Button } from '@/components/ui/button';
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

/** Available workflow status filter values */
export type WorkflowStatusFilterValue =
  | 'all'
  | 'cancelled'
  | 'completed'
  | 'created'
  | 'editing'
  | 'failed'
  | 'paused'
  | 'running';

export interface WorkflowTableToolbarProps extends ComponentPropsWithRef<'div'> {
  /** Callback when reset filters button is clicked */
  onResetFilters?: () => void;
  /** Callback when status filter changes */
  onStatusFilterChange: (value: WorkflowStatusFilterValue) => void;
  /** Callback when type filter changes */
  onTypeFilterChange: (value: WorkflowTypeFilterValue) => void;
  /** Current status filter value */
  statusFilter: WorkflowStatusFilterValue;
  /** Current type filter value */
  typeFilter: WorkflowTypeFilterValue;
}

/** Available workflow type filter values */
export type WorkflowTypeFilterValue = 'all' | 'implementation' | 'planning';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_STATUS_FILTER: WorkflowStatusFilterValue = 'all';
const DEFAULT_TYPE_FILTER: WorkflowTypeFilterValue = 'all';

const STATUS_FILTER_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Created', value: 'created' },
  { label: 'Running', value: 'running' },
  { label: 'Paused', value: 'paused' },
  { label: 'Editing', value: 'editing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const;

const TYPE_FILTER_OPTIONS = [
  { label: 'All types', value: 'all' },
  { label: 'Planning', value: 'planning' },
  { label: 'Implementation', value: 'implementation' },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate the number of active filters
 */
const getActiveFilterCount = (statusFilter: WorkflowStatusFilterValue, typeFilter: WorkflowTypeFilterValue): number => {
  let count = 0;
  if (statusFilter !== DEFAULT_STATUS_FILTER) count++;
  if (typeFilter !== DEFAULT_TYPE_FILTER) count++;
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

// ============================================================================
// Main Component
// ============================================================================

/**
 * Toolbar content component for the workflows table with collapsible filters panel.
 *
 * Provides:
 * - Collapsible filters panel with status and type filters
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
 *     <WorkflowTableToolbar
 *       statusFilter={statusFilter}
 *       typeFilter={typeFilter}
 *       onStatusFilterChange={handleStatusFilterChange}
 *       onTypeFilterChange={handleTypeFilterChange}
 *       onResetFilters={handleResetFilters}
 *     />
 *   }
 * />
 * ```
 */
export const WorkflowTableToolbar = memo(function WorkflowTableToolbar({
  className,
  onResetFilters,
  onStatusFilterChange,
  onTypeFilterChange,
  ref,
  statusFilter,
  typeFilter,
  ...props
}: WorkflowTableToolbarProps) {
  // Computed state
  const activeFilterCount = getActiveFilterCount(statusFilter, typeFilter);
  const hasActiveFilters = activeFilterCount > 0;

  // Handlers
  const handleStatusFilterChange = (value: null | string) => {
    onStatusFilterChange((value || DEFAULT_STATUS_FILTER) as WorkflowStatusFilterValue);
  };

  const handleTypeFilterChange = (value: null | string) => {
    onTypeFilterChange((value || DEFAULT_TYPE_FILTER) as WorkflowTypeFilterValue);
  };

  const handleResetFilters = () => {
    onStatusFilterChange(DEFAULT_STATUS_FILTER);
    onTypeFilterChange(DEFAULT_TYPE_FILTER);
    onResetFilters?.();
  };

  // Build items maps for SelectRoot to display labels instead of raw values
  const statusFilterItems = useMemo(() => optionsToItems(STATUS_FILTER_OPTIONS), []);
  const typeFilterItems = useMemo(() => optionsToItems(TYPE_FILTER_OPTIONS), []);

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
            <PopoverPopup className={'w-72'}>
              <PopoverHeader>
                <PopoverTitle>Filters</PopoverTitle>
              </PopoverHeader>

              <PopoverContent className={'space-y-4'}>
                {/* Status Filter */}
                <div className={'space-y-1.5'}>
                  <label className={'text-xs font-medium text-muted-foreground'} id={'filter-status-label'}>
                    Status
                  </label>
                  <SelectRoot items={statusFilterItems} onValueChange={handleStatusFilterChange} value={statusFilter}>
                    <SelectTrigger aria-labelledby={'filter-status-label'} className={'w-full'} size={'sm'}>
                      <SelectValue placeholder={'All statuses'} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectPositioner>
                        <SelectPopup size={'sm'}>
                          <SelectList>
                            {STATUS_FILTER_OPTIONS.map((option) => (
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
