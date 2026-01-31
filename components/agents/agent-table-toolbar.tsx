'use client';

import type { ComponentPropsWithRef } from 'react';

import { Download, Filter, RotateCcw, Upload } from 'lucide-react';
import { memo, useMemo } from 'react';

import type { Project } from '@/db/schema';

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
import { agentTypes } from '@/db/schema/agents.schema';
import { DEFAULT_AGENT_SHOW_BUILTIN, DEFAULT_AGENT_SHOW_DEACTIVATED } from '@/lib/layout/constants';
import { cn, optionsToItems } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AgentTableToolbarProps extends ComponentPropsWithRef<'div'> {
  /** Whether to show built-in agents */
  isShowingBuiltIn: boolean;
  /** Whether to show deactivated agents */
  isShowingDeactivated: boolean;
  /** Callback when export selected button is clicked */
  onExportSelected?: () => void;
  /** Callback when import button is clicked */
  onImport?: () => void;
  /** Callback when show built-in toggle changes */
  onIsShowingBuiltInChange: (value: boolean) => void;
  /** Callback when show deactivated toggle changes */
  onIsShowingDeactivatedChange: (value: boolean) => void;
  /** Callback when project filter changes */
  onProjectFilterChange: (value: null | string) => void;
  /** Callback when reset filters button is clicked */
  onResetFilters?: () => void;
  /** Callback when status filter changes */
  onStatusFilterChange: (value: null | string) => void;
  /** Callback when type filter changes */
  onTypeFilterChange: (value: null | string) => void;
  /** Current project filter value */
  projectFilter: null | string;
  /** List of projects for dropdown options */
  projects: Array<Project>;
  /** Number of selected rows for export button state */
  selectedCount?: number;
  /** Current status filter value */
  statusFilter: null | string;
  /** Current type filter value */
  typeFilter: null | string;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = [
  { label: 'All statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format agent type for display (capitalize first letter)
 */
const formatTypeLabel = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Calculate the number of active filters
 */
const getActiveFilterCount = (
  typeFilter: null | string,
  projectFilter: null | string,
  statusFilter: null | string,
  isShowingBuiltIn: boolean,
  isShowingDeactivated: boolean
): number => {
  let count = 0;
  if (typeFilter !== null) count++;
  if (projectFilter !== null) count++;
  if (statusFilter !== null) count++;
  // Count toggles if they differ from defaults
  if (isShowingBuiltIn !== DEFAULT_AGENT_SHOW_BUILTIN) count++;
  if (isShowingDeactivated !== DEFAULT_AGENT_SHOW_DEACTIVATED) count++;
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
 * Toolbar content component for the agents table with collapsible filters panel.
 *
 * Provides:
 * - Collapsible filters panel with type, project, and status filters
 * - Show built-in and show deactivated toggles inside the filter panel
 * - Active filter count badge on the Filters button
 * - Import and Export Selected actions
 *
 * Designed to integrate with DataTable's toolbarContent slot for
 * consistent toolbar styling and layout.
 *
 * @example
 * ```tsx
 * <DataTable
 *   // ...other props
 *   toolbarContent={
 *     <AgentTableToolbar
 *       isShowingBuiltIn={isShowingBuiltIn}
 *       isShowingDeactivated={isShowingDeactivated}
 *       onIsShowingBuiltInChange={handleIsShowingBuiltInChange}
 *       onIsShowingDeactivatedChange={handleIsShowingDeactivatedChange}
 *       onProjectFilterChange={handleProjectFilterChange}
 *       onStatusFilterChange={handleStatusFilterChange}
 *       onTypeFilterChange={handleTypeFilterChange}
 *       projectFilter={projectFilter}
 *       projects={projects}
 *       statusFilter={statusFilter}
 *       typeFilter={typeFilter}
 *     />
 *   }
 * />
 * ```
 */
export const AgentTableToolbar = memo(function AgentTableToolbar({
  className,
  isShowingBuiltIn,
  isShowingDeactivated,
  onExportSelected,
  onImport,
  onIsShowingBuiltInChange,
  onIsShowingDeactivatedChange,
  onProjectFilterChange,
  onResetFilters,
  onStatusFilterChange,
  onTypeFilterChange,
  projectFilter,
  projects,
  ref,
  selectedCount = 0,
  statusFilter,
  typeFilter,
  ...props
}: AgentTableToolbarProps) {
  // Computed state
  const activeFilterCount = getActiveFilterCount(
    typeFilter,
    projectFilter,
    statusFilter,
    isShowingBuiltIn,
    isShowingDeactivated
  );
  const hasActiveFilters = activeFilterCount > 0;
  const isExportDisabled = selectedCount === 0;

  // Handlers
  const handleTypeChange = (value: null | string) => {
    onTypeFilterChange(value === '' ? null : value);
  };

  const handleProjectChange = (value: null | string) => {
    onProjectFilterChange(value === '' ? null : value);
  };

  const handleStatusChange = (value: null | string) => {
    onStatusFilterChange(value === '' ? null : value);
  };

  const handleIsShowingBuiltInToggle = (isChecked: boolean) => {
    onIsShowingBuiltInChange(isChecked);
  };

  const handleIsShowingDeactivatedToggle = (isChecked: boolean) => {
    onIsShowingDeactivatedChange(isChecked);
  };

  const handleImportClick = () => {
    onImport?.();
  };

  const handleExportSelectedClick = () => {
    onExportSelected?.();
  };

  const handleResetFilters = () => {
    // Reset all filters to defaults
    onTypeFilterChange(null);
    onProjectFilterChange(null);
    onStatusFilterChange(null);
    onIsShowingBuiltInChange(DEFAULT_AGENT_SHOW_BUILTIN);
    onIsShowingDeactivatedChange(DEFAULT_AGENT_SHOW_DEACTIVATED);
    onResetFilters?.();
  };

  // Build items maps for SelectRoot to display labels instead of raw values
  const typeItems = useMemo(
    () => ({
      '': 'All types',
      ...Object.fromEntries(agentTypes.map((t) => [t, formatTypeLabel(t)])),
    }),
    []
  );

  const projectItems = useMemo(
    () => ({
      '': 'All projects',
      global: 'Global only',
      ...Object.fromEntries(projects.map((p) => [String(p.id), p.name])),
    }),
    [projects]
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
                {/* Type Filter */}
                <div className={'space-y-1.5'}>
                  <label className={'text-xs font-medium text-muted-foreground'} id={'filter-type-label'}>
                    {'Type'}
                  </label>
                  <SelectRoot items={typeItems} onValueChange={handleTypeChange} value={typeFilter ?? ''}>
                    <SelectTrigger aria-labelledby={'filter-type-label'} className={'w-full'} size={'sm'}>
                      <SelectValue placeholder={'All types'} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectPositioner>
                        <SelectPopup size={'sm'}>
                          <SelectList>
                            <SelectItem label={'All types'} size={'sm'} value={''}>
                              {'All types'}
                            </SelectItem>
                            {agentTypes.map((type) => (
                              <SelectItem key={type} label={formatTypeLabel(type)} size={'sm'} value={type}>
                                {formatTypeLabel(type)}
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
                    {'Project'}
                  </label>
                  <SelectRoot items={projectItems} onValueChange={handleProjectChange} value={projectFilter ?? ''}>
                    <SelectTrigger aria-labelledby={'filter-project-label'} className={'w-full'} size={'sm'}>
                      <SelectValue placeholder={'All projects'} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectPositioner>
                        <SelectPopup size={'sm'}>
                          <SelectList>
                            <SelectItem label={'All projects'} size={'sm'} value={''}>
                              {'All projects'}
                            </SelectItem>
                            <SelectItem label={'Global only'} size={'sm'} value={'global'}>
                              {'Global only'}
                            </SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} label={project.name} size={'sm'} value={String(project.id)}>
                                {project.name}
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
                    {'Status'}
                  </label>
                  <SelectRoot items={statusItems} onValueChange={handleStatusChange} value={statusFilter ?? ''}>
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
                      {'Show built-in agents'}
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
                      {'Show deactivated agents'}
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
                    {'Reset Filters'}
                  </Button>
                </PopoverFooter>
              )}
            </PopoverPopup>
          </PopoverPositioner>
        </PopoverPortal>
      </PopoverRoot>

      {/* Actions Separator */}
      {(onImport || onExportSelected) && <div aria-hidden={'true'} className={'mx-1 h-5 w-px shrink-0 bg-border'} />}

      {/* Import/Export Actions */}
      {onImport && (
        <Button
          aria-label={'Import agents'}
          className={'shrink-0'}
          onClick={handleImportClick}
          size={'sm'}
          variant={'outline'}
        >
          <Upload aria-hidden={'true'} className={'size-4'} />
          {'Import'}
        </Button>
      )}

      {onExportSelected && (
        <Button
          aria-label={`Export ${selectedCount} selected agent${selectedCount !== 1 ? 's' : ''}`}
          className={'shrink-0'}
          disabled={isExportDisabled}
          onClick={handleExportSelectedClick}
          size={'sm'}
          variant={'outline'}
        >
          <Download aria-hidden={'true'} className={'size-4'} />
          {'Export Selected'}
          {selectedCount > 0 && (
            <span
              className={
                'ml-1 inline-flex size-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground'
              }
            >
              {selectedCount}
            </span>
          )}
        </Button>
      )}
    </div>
  );
});
