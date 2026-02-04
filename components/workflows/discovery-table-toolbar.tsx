'use client';

import type { ChangeEvent, ComponentPropsWithRef } from 'react';

import { Check, Filter, RotateCcw, Search, X } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';

import type { DiscoveredFile } from '@/db/schema';
import type {
  DiscoveryActionFilter,
  DiscoveryFilters,
  DiscoveryInclusionFilter,
  DiscoveryPriorityFilter,
} from '@/lib/stores/discovery-store';

import { Button } from '@/components/ui/button';
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
import { useExcludeFile, useIncludeFile } from '@/hooks/queries/use-discovered-files';
import { useDiscoveryStore } from '@/lib/stores/discovery-store';
import { cn, optionsToItems } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface DiscoveryTableToolbarProps extends ComponentPropsWithRef<'div'> {
  /** Discovered files for bulk operations */
  files: Array<DiscoveredFile>;
  /** Whether bulk operations are in progress */
  isBulkOperating?: boolean;
  /** Callback when bulk exclude all is triggered */
  onExcludeAll?: () => void;
  /** Callback when bulk include all is triggered */
  onIncludeAll?: () => void;
}

interface FilterOption<T extends string> {
  label: string;
  value: T;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ACTION_FILTER: DiscoveryActionFilter = 'all';
const DEFAULT_INCLUSION_FILTER: DiscoveryInclusionFilter = 'all';
const DEFAULT_PRIORITY_FILTER: DiscoveryPriorityFilter = 'all';

const ACTION_FILTER_OPTIONS: Array<FilterOption<DiscoveryActionFilter>> = [
  { label: 'All actions', value: 'all' },
  { label: 'Create', value: 'create' },
  { label: 'Modify', value: 'modify' },
  { label: 'Delete', value: 'delete' },
  { label: 'Reference', value: 'reference' },
];

const PRIORITY_FILTER_OPTIONS: Array<FilterOption<DiscoveryPriorityFilter>> = [
  { label: 'All priorities', value: 'all' },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
];

const INCLUSION_FILTER_OPTIONS: Array<FilterOption<DiscoveryInclusionFilter>> = [
  { label: 'All files', value: 'all' },
  { label: 'Included', value: 'included' },
  { label: 'Excluded', value: 'excluded' },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate the number of active filters
 */
const getActiveFilterCount = (filters: DiscoveryFilters): number => {
  let count = 0;
  if (filters.actionFilter !== DEFAULT_ACTION_FILTER) count++;
  if (filters.priorityFilter !== DEFAULT_PRIORITY_FILTER) count++;
  if (filters.inclusionFilter !== DEFAULT_INCLUSION_FILTER) count++;
  return count;
};

// ============================================================================
// Sub-components
// ============================================================================

interface FilterCountBadgeProps {
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
 * Toolbar component for the discovered files table with search, filters, and bulk actions.
 *
 * Features:
 * - Text search input for filtering files by path
 * - Action filter dropdown (all, create, modify, delete, reference)
 * - Priority filter dropdown (all, High, Medium, Low)
 * - Inclusion filter dropdown (all, included, excluded)
 * - Bulk action buttons: Include All, Exclude All
 * - Integration with discovery Zustand store for filter state
 *
 * @example
 * ```tsx
 * <DiscoveryTableToolbar
 *   files={discoveredFiles}
 *   isBulkOperating={isBulkMutating}
 *   onIncludeAll={handleIncludeAll}
 *   onExcludeAll={handleExcludeAll}
 * />
 * ```
 */
export const DiscoveryTableToolbar = memo(function DiscoveryTableToolbar({
  className,
  files,
  isBulkOperating = false,
  onExcludeAll,
  onIncludeAll,
  ref,
  ...props
}: DiscoveryTableToolbarProps) {
  const { filters, searchTerm, setFilters, setSearchTerm } = useDiscoveryStore();
  const includeMutation = useIncludeFile();
  const excludeMutation = useExcludeFile();

  // Calculate active filter count
  const activeFilterCount = getActiveFilterCount(filters);
  const hasActiveFilters = activeFilterCount > 0;

  // Count files by inclusion status
  const includedCount = useMemo(() => files.filter((f) => f.includedAt !== null).length, [files]);
  const excludedCount = useMemo(() => files.filter((f) => f.includedAt === null).length, [files]);

  // Build items maps for SelectRoot
  const actionFilterItems = useMemo(() => optionsToItems(ACTION_FILTER_OPTIONS), []);
  const priorityFilterItems = useMemo(() => optionsToItems(PRIORITY_FILTER_OPTIONS), []);
  const inclusionFilterItems = useMemo(() => optionsToItems(INCLUSION_FILTER_OPTIONS), []);

  // Handlers
  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, [setSearchTerm]);

  const handleActionFilterChange = useCallback(
    (value: null | string) => {
      setFilters({ actionFilter: (value || DEFAULT_ACTION_FILTER) as DiscoveryActionFilter });
    },
    [setFilters]
  );

  const handlePriorityFilterChange = useCallback(
    (value: null | string) => {
      setFilters({ priorityFilter: (value || DEFAULT_PRIORITY_FILTER) as DiscoveryPriorityFilter });
    },
    [setFilters]
  );

  const handleInclusionFilterChange = useCallback(
    (value: null | string) => {
      setFilters({ inclusionFilter: (value || DEFAULT_INCLUSION_FILTER) as DiscoveryInclusionFilter });
    },
    [setFilters]
  );

  const handleResetFilters = useCallback(() => {
    setFilters({
      actionFilter: DEFAULT_ACTION_FILTER,
      inclusionFilter: DEFAULT_INCLUSION_FILTER,
      priorityFilter: DEFAULT_PRIORITY_FILTER,
    });
  }, [setFilters]);

  const handleIncludeAll = useCallback(() => {
    if (onIncludeAll) {
      onIncludeAll();
      return;
    }

    // Default implementation: include all excluded files
    const excludedFiles = files.filter((f) => f.includedAt === null);
    for (const file of excludedFiles) {
      includeMutation.mutate(file.id);
    }
  }, [files, includeMutation, onIncludeAll]);

  const handleExcludeAll = useCallback(() => {
    if (onExcludeAll) {
      onExcludeAll();
      return;
    }

    // Default implementation: exclude all included files
    const includedFiles = files.filter((f) => f.includedAt !== null);
    for (const file of includedFiles) {
      excludeMutation.mutate(file.id);
    }
  }, [excludeMutation, files, onExcludeAll]);

  const isIncludeAllDisabled = isBulkOperating || excludedCount === 0;
  const isExcludeAllDisabled = isBulkOperating || includedCount === 0;

  return (
    <div className={cn('flex items-center justify-between gap-3', className)} ref={ref} {...props}>
      {/* Left Side: Search and Filters */}
      <div className={'flex items-center gap-3'}>
        {/* Search Input */}
        <div className={'relative'}>
          <Search
            aria-hidden={'true'}
            className={'pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground'}
          />
          <Input
            className={'w-64 px-8'}
            onChange={handleSearchChange}
            placeholder={'Search files...'}
            size={'sm'}
            value={searchTerm}
          />
          {searchTerm && (
            <button
              aria-label={'Clear search'}
              className={cn(
                'absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5',
                'text-muted-foreground hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
              )}
              onClick={handleClearSearch}
              type={'button'}
            >
              <X aria-hidden={'true'} className={'size-3.5'} />
            </button>
          )}
        </div>

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
                  {/* Action Filter */}
                  <div className={'space-y-1.5'}>
                    <label className={'text-xs font-medium text-muted-foreground'} id={'filter-action-label'}>
                      Action
                    </label>
                    <SelectRoot
                      items={actionFilterItems}
                      onValueChange={handleActionFilterChange}
                      value={filters.actionFilter}
                    >
                      <SelectTrigger aria-labelledby={'filter-action-label'} className={'w-full'} size={'sm'}>
                        <SelectValue placeholder={'All actions'} />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectPositioner>
                          <SelectPopup size={'sm'}>
                            <SelectList>
                              {ACTION_FILTER_OPTIONS.map((option) => (
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

                  {/* Priority Filter */}
                  <div className={'space-y-1.5'}>
                    <label className={'text-xs font-medium text-muted-foreground'} id={'filter-priority-label'}>
                      Priority
                    </label>
                    <SelectRoot
                      items={priorityFilterItems}
                      onValueChange={handlePriorityFilterChange}
                      value={filters.priorityFilter}
                    >
                      <SelectTrigger aria-labelledby={'filter-priority-label'} className={'w-full'} size={'sm'}>
                        <SelectValue placeholder={'All priorities'} />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectPositioner>
                          <SelectPopup size={'sm'}>
                            <SelectList>
                              {PRIORITY_FILTER_OPTIONS.map((option) => (
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

                  {/* Inclusion Filter */}
                  <div className={'space-y-1.5'}>
                    <label className={'text-xs font-medium text-muted-foreground'} id={'filter-inclusion-label'}>
                      Inclusion
                    </label>
                    <SelectRoot
                      items={inclusionFilterItems}
                      onValueChange={handleInclusionFilterChange}
                      value={filters.inclusionFilter}
                    >
                      <SelectTrigger aria-labelledby={'filter-inclusion-label'} className={'w-full'} size={'sm'}>
                        <SelectValue placeholder={'All files'} />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectPositioner>
                          <SelectPopup size={'sm'}>
                            <SelectList>
                              {INCLUSION_FILTER_OPTIONS.map((option) => (
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

      {/* Right Side: Bulk Actions */}
      <div className={'flex items-center gap-2'}>
        {/* Include All Button */}
        <Button disabled={isIncludeAllDisabled} onClick={handleIncludeAll} size={'sm'} variant={'outline'}>
          <Check aria-hidden={'true'} className={'size-4'} />
          Include All
          {excludedCount > 0 && <span className={'text-muted-foreground'}>({excludedCount})</span>}
        </Button>

        {/* Exclude All Button */}
        <Button disabled={isExcludeAllDisabled} onClick={handleExcludeAll} size={'sm'} variant={'outline'}>
          <X aria-hidden={'true'} className={'size-4'} />
          Exclude All
          {includedCount > 0 && <span className={'text-muted-foreground'}>({includedCount})</span>}
        </Button>
      </div>
    </div>
  );
});
