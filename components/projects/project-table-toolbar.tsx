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

/** Available archive filter values */
export type ArchiveFilterValue = 'active' | 'all' | 'archived';

interface ProjectTableToolbarProps extends ComponentPropsWithRef<'div'> {
  /** Current archive filter value */
  archiveFilter: ArchiveFilterValue;
  /** Callback when archive filter changes */
  onArchiveFilterChange: (value: ArchiveFilterValue) => void;
  /** Callback when reset filters button is clicked */
  onResetFilters?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ARCHIVE_FILTER: ArchiveFilterValue = 'active';

const ARCHIVE_FILTER_OPTIONS = [
  { label: 'All projects', value: 'all' },
  { label: 'Active only', value: 'active' },
  { label: 'Archived only', value: 'archived' },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate the number of active filters
 */
const getActiveFilterCount = (archiveFilter: ArchiveFilterValue): number => {
  // Count as active if different from default
  return archiveFilter !== DEFAULT_ARCHIVE_FILTER ? 1 : 0;
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
 * Toolbar content component for the projects table with collapsible filters panel.
 *
 * Provides:
 * - Collapsible filters panel with archive status filter
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
 *     <ProjectTableToolbar
 *       archiveFilter={archiveFilter}
 *       onArchiveFilterChange={handleArchiveFilterChange}
 *       onResetFilters={handleResetFilters}
 *     />
 *   }
 * />
 * ```
 */
export const ProjectTableToolbar = memo(function ProjectTableToolbar({
  archiveFilter,
  className,
  onArchiveFilterChange,
  onResetFilters,
  ref,
  ...props
}: ProjectTableToolbarProps) {
  // Computed state
  const activeFilterCount = getActiveFilterCount(archiveFilter);
  const hasActiveFilters = activeFilterCount > 0;

  // Handlers
  const handleArchiveFilterChange = (value: null | string) => {
    onArchiveFilterChange((value || DEFAULT_ARCHIVE_FILTER) as ArchiveFilterValue);
  };

  const handleResetFilters = () => {
    onArchiveFilterChange(DEFAULT_ARCHIVE_FILTER);
    onResetFilters?.();
  };

  // Build items map for SelectRoot to display labels instead of raw values
  const archiveFilterItems = useMemo(() => optionsToItems(ARCHIVE_FILTER_OPTIONS), []);

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
            {'Filters'}
            <FilterCountBadge count={activeFilterCount} />
          </Button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverPositioner align={'start'}>
            <PopoverPopup className={'w-72'}>
              <PopoverHeader>
                <PopoverTitle>{'Filters'}</PopoverTitle>
              </PopoverHeader>

              <PopoverContent className={'space-y-4'}>
                {/* Archive Status Filter */}
                <div className={'space-y-1.5'}>
                  <label className={'text-xs font-medium text-muted-foreground'} id={'filter-status-label'}>
                    {'Status'}
                  </label>
                  <SelectRoot
                    items={archiveFilterItems}
                    onValueChange={handleArchiveFilterChange}
                    value={archiveFilter}
                  >
                    <SelectTrigger aria-labelledby={'filter-status-label'} className={'w-full'} size={'sm'}>
                      <SelectValue placeholder={'All projects'} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectPositioner>
                        <SelectPopup size={'sm'}>
                          <SelectList>
                            {ARCHIVE_FILTER_OPTIONS.map((option) => (
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
                    {'Reset Filters'}
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
