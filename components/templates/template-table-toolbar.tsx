'use client';

import type { ComponentPropsWithRef } from 'react';

import { Filter, RotateCcw } from 'lucide-react';
import { memo, useMemo } from 'react';

import type { TemplateCategory } from '@/db/schema';

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
import { Switch } from '@/components/ui/switch';
import { templateCategories } from '@/db/schema/templates.schema';
import { DEFAULT_TEMPLATE_SHOW_BUILTIN, DEFAULT_TEMPLATE_SHOW_DEACTIVATED } from '@/lib/layout/constants';
import { cn, optionsToItems } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type StatusFilterValue = 'active' | 'all' | 'inactive';

interface TemplateTableToolbarProps extends ComponentPropsWithRef<'div'> {
  /** Current category filter value */
  categoryFilter: null | TemplateCategory;
  /** Whether to show built-in templates */
  isShowingBuiltIn: boolean;
  /** Whether to show deactivated templates */
  isShowingDeactivated: boolean;
  /** Callback when category filter changes */
  onCategoryFilterChange: (value: null | TemplateCategory) => void;
  /** Callback when show built-in toggle changes */
  onIsShowingBuiltInChange: (value: boolean) => void;
  /** Callback when show deactivated toggle changes */
  onIsShowingDeactivatedChange: (value: boolean) => void;
  /** Callback when reset filters button is clicked */
  onResetFilters?: () => void;
  /** Callback when status filter changes */
  onStatusFilterChange: (value: null | StatusFilterValue) => void;
  /** Current status filter value */
  statusFilter: null | StatusFilterValue;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format category for display (capitalize first letter)
 */
const formatCategoryLabel = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

/**
 * Calculate the number of active filters
 */
const getActiveFilterCount = (
  categoryFilter: null | TemplateCategory,
  statusFilter: null | StatusFilterValue,
  isShowingBuiltIn: boolean,
  isShowingDeactivated: boolean
): number => {
  let count = 0;
  if (categoryFilter !== null) count++;
  if (statusFilter !== null && statusFilter !== 'all') count++;
  // Count toggles if they differ from defaults
  if (isShowingBuiltIn !== DEFAULT_TEMPLATE_SHOW_BUILTIN) count++;
  if (isShowingDeactivated !== DEFAULT_TEMPLATE_SHOW_DEACTIVATED) count++;
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
 * Toolbar content component for the templates table with collapsible filters panel.
 *
 * Provides:
 * - Collapsible filters panel with category and status filters
 * - Show built-in and show deactivated toggles inside the filter panel
 * - Active filter count badge on the Filters button
 * - Reset Filters button when filters are active
 *
 * Designed to integrate with DataTable's toolbarContent slot for
 * consistent toolbar styling and layout.
 *
 * @example
 * ```tsx
 * <DataTable
 *   // ...other props
 *   toolbarContent={
 *     <TemplateTableToolbar
 *       categoryFilter={categoryFilter}
 *       isShowingBuiltIn={isShowingBuiltIn}
 *       isShowingDeactivated={isShowingDeactivated}
 *       onCategoryFilterChange={handleCategoryFilterChange}
 *       onIsShowingBuiltInChange={handleIsShowingBuiltInChange}
 *       onIsShowingDeactivatedChange={handleIsShowingDeactivatedChange}
 *       onStatusFilterChange={handleStatusFilterChange}
 *       statusFilter={statusFilter}
 *     />
 *   }
 * />
 * ```
 */
export const TemplateTableToolbar = memo(function TemplateTableToolbar({
  categoryFilter,
  className,
  isShowingBuiltIn,
  isShowingDeactivated,
  onCategoryFilterChange,
  onIsShowingBuiltInChange,
  onIsShowingDeactivatedChange,
  onResetFilters,
  onStatusFilterChange,
  ref,
  statusFilter,
  ...props
}: TemplateTableToolbarProps) {
  // Computed state
  const activeFilterCount = getActiveFilterCount(
    categoryFilter,
    statusFilter,
    isShowingBuiltIn,
    isShowingDeactivated
  );
  const hasActiveFilters = activeFilterCount > 0;

  // Handlers
  const handleCategoryChange = (value: null | string) => {
    onCategoryFilterChange(value === '' ? null : (value as TemplateCategory));
  };

  const handleStatusChange = (value: null | string) => {
    const normalizedValue = value === '' || value === 'all' ? null : (value as StatusFilterValue);
    onStatusFilterChange(normalizedValue);
  };

  const handleIsShowingBuiltInToggle = (isChecked: boolean) => {
    onIsShowingBuiltInChange(isChecked);
  };

  const handleIsShowingDeactivatedToggle = (isChecked: boolean) => {
    onIsShowingDeactivatedChange(isChecked);
  };

  const handleResetFilters = () => {
    // Reset all filters to defaults
    onCategoryFilterChange(null);
    onStatusFilterChange(null);
    onIsShowingBuiltInChange(DEFAULT_TEMPLATE_SHOW_BUILTIN);
    onIsShowingDeactivatedChange(DEFAULT_TEMPLATE_SHOW_DEACTIVATED);
    onResetFilters?.();
  };

  // Build items maps for SelectRoot to display labels instead of raw values
  const categoryItems = useMemo(
    () => ({
      '': 'All categories',
      ...Object.fromEntries(templateCategories.map((c) => [c, formatCategoryLabel(c)])),
    }),
    []
  );

  const statusItems = useMemo(() => optionsToItems(STATUS_OPTIONS), []);

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
                {/* Category Filter */}
                <div className={'space-y-1.5'}>
                  <label className={'text-xs font-medium text-muted-foreground'} id={'filter-category-label'}>
                    Category
                  </label>
                  <SelectRoot items={categoryItems} onValueChange={handleCategoryChange} value={categoryFilter ?? ''}>
                    <SelectTrigger aria-labelledby={'filter-category-label'} className={'w-full'} size={'sm'}>
                      <SelectValue placeholder={'All categories'} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectPositioner>
                        <SelectPopup size={'sm'}>
                          <SelectList>
                            <SelectItem label={'All categories'} size={'sm'} value={''}>
                              All categories
                            </SelectItem>
                            {templateCategories.map((category) => (
                              <SelectItem key={category} label={formatCategoryLabel(category)} size={'sm'} value={category}>
                                {formatCategoryLabel(category)}
                              </SelectItem>
                            ))}
                          </SelectList>
                        </SelectPopup>
                      </SelectPositioner>
                    </SelectPortal>
                  </SelectRoot>
                </div>

                {/* Status Filter */}
                <div className={'space-y-1.5'}>
                  <label className={'text-xs font-medium text-muted-foreground'} id={'filter-status-label'}>
                    Status
                  </label>
                  <SelectRoot items={statusItems} onValueChange={handleStatusChange} value={statusFilter ?? 'all'}>
                    <SelectTrigger aria-labelledby={'filter-status-label'} className={'w-full'} size={'sm'}>
                      <SelectValue placeholder={'All statuses'} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectPositioner>
                        <SelectPopup size={'sm'}>
                          <SelectList>
                            {STATUS_OPTIONS.map((option) => (
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

                {/* Separator */}
                <div aria-hidden={'true'} className={'h-px bg-border'} role={'separator'} />

                {/* Toggle Switches */}
                <div className={'space-y-3'}>
                  {/* Show Built-in Toggle */}
                  <div className={'flex items-center justify-between'}>
                    <label className={'text-sm'} htmlFor={'filter-show-builtin'}>
                      Show built-in templates
                    </label>
                    <Switch
                      checked={isShowingBuiltIn}
                      id={'filter-show-builtin'}
                      onCheckedChange={handleIsShowingBuiltInToggle}
                      size={'sm'}
                    />
                  </div>

                  {/* Show Deactivated Toggle */}
                  <div className={'flex items-center justify-between'}>
                    <label className={'text-sm'} htmlFor={'filter-show-deactivated'}>
                      Show deactivated templates
                    </label>
                    <Switch
                      checked={isShowingDeactivated}
                      id={'filter-show-deactivated'}
                      onCheckedChange={handleIsShowingDeactivatedToggle}
                      size={'sm'}
                    />
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
