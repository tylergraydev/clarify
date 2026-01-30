'use client';

import type { ComponentPropsWithRef } from 'react';

import { RotateCcw } from 'lucide-react';
import { Fragment } from 'react';

import type { Project } from '@/db/schema';

import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AgentTableToolbarProps extends ComponentPropsWithRef<'div'> {
  /** Callback when project filter changes */
  onProjectFilterChange: (value: null | string) => void;
  /** Callback when reset filters button is clicked */
  onResetFilters?: () => void;
  /** Callback when show built-in toggle changes */
  onShowBuiltInChange: (value: boolean) => void;
  /** Callback when show deactivated toggle changes */
  onShowDeactivatedChange: (value: boolean) => void;
  /** Callback when status filter changes */
  onStatusFilterChange: (value: null | string) => void;
  /** Callback when type filter changes */
  onTypeFilterChange: (value: null | string) => void;
  /** Current project filter value */
  projectFilter: null | string;
  /** List of projects for dropdown options */
  projects: Array<Project>;
  /** Whether to show built-in agents */
  showBuiltIn: boolean;
  /** Whether to show deactivated agents */
  showDeactivated: boolean;
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

// ============================================================================
// Main Component
// ============================================================================

/**
 * Toolbar content component for the agents table with faceted filters.
 *
 * Provides:
 * - Type filter dropdown (All types / Planning / Specialist / Review)
 * - Project filter dropdown (All projects / Global only / [Project names...])
 * - Status filter dropdown (All statuses / Active / Inactive)
 * - Show built-in toggle switch
 * - Show deactivated toggle switch
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
 *       typeFilter={typeFilter}
 *       projectFilter={projectFilter}
 *       statusFilter={statusFilter}
 *       showBuiltIn={showBuiltIn}
 *       showDeactivated={showDeactivated}
 *       onTypeFilterChange={handleTypeFilterChange}
 *       onProjectFilterChange={handleProjectFilterChange}
 *       onStatusFilterChange={handleStatusFilterChange}
 *       onShowBuiltInChange={handleShowBuiltInChange}
 *       onShowDeactivatedChange={handleShowDeactivatedChange}
 *       projects={projects}
 *     />
 *   }
 * />
 * ```
 */
export const AgentTableToolbar = ({
  className,
  onProjectFilterChange,
  onResetFilters,
  onShowBuiltInChange,
  onShowDeactivatedChange,
  onStatusFilterChange,
  onTypeFilterChange,
  projectFilter,
  projects,
  ref,
  showBuiltIn,
  showDeactivated,
  statusFilter,
  typeFilter,
  ...props
}: AgentTableToolbarProps) => {
  // Computed state
  const hasActiveFilters = Boolean(
    typeFilter !== null || projectFilter !== null || statusFilter !== null
  );

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

  const handleShowBuiltInToggle = (isChecked: boolean) => {
    onShowBuiltInChange(isChecked);
  };

  const handleShowDeactivatedToggle = (isChecked: boolean) => {
    onShowDeactivatedChange(isChecked);
  };

  return (
    <div
      className={cn('flex flex-wrap items-center gap-3', className)}
      ref={ref}
      {...props}
    >
      {/* Type Filter */}
      <SelectRoot
        onValueChange={handleTypeChange}
        value={typeFilter ?? ''}
      >
        <SelectTrigger
          aria-label={'Filter by type'}
          className={'w-32'}
          size={'sm'}
        >
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
                  <SelectItem
                    key={type}
                    label={formatTypeLabel(type)}
                    size={'sm'}
                    value={type}
                  >
                    {formatTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>

      {/* Project Filter */}
      <SelectRoot
        onValueChange={handleProjectChange}
        value={projectFilter ?? ''}
      >
        <SelectTrigger
          aria-label={'Filter by project'}
          className={'w-40'}
          size={'sm'}
        >
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
                  <SelectItem
                    key={project.id}
                    label={project.name}
                    size={'sm'}
                    value={String(project.id)}
                  >
                    {project.name}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>

      {/* Status Filter */}
      <SelectRoot
        onValueChange={handleStatusChange}
        value={statusFilter ?? ''}
      >
        <SelectTrigger
          aria-label={'Filter by status'}
          className={'w-32'}
          size={'sm'}
        >
          <SelectValue placeholder={'All statuses'} />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup size={'sm'}>
              <SelectList>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    label={option.label}
                    size={'sm'}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>

      {/* Separator */}
      <div
        aria-hidden={'true'}
        className={'mx-1 h-5 w-px bg-border'}
      />

      {/* Show Built-in Toggle */}
      <div className={'flex items-center gap-2'}>
        <Switch
          aria-label={'Show built-in agents'}
          checked={showBuiltIn}
          onCheckedChange={handleShowBuiltInToggle}
          size={'sm'}
        />
        <span className={'text-sm text-muted-foreground'}>
          {'Show built-in'}
        </span>
      </div>

      {/* Show Deactivated Toggle */}
      <div className={'flex items-center gap-2'}>
        <Switch
          aria-label={'Show deactivated agents'}
          checked={showDeactivated}
          onCheckedChange={handleShowDeactivatedToggle}
          size={'sm'}
        />
        <span className={'text-sm text-muted-foreground'}>
          {'Show deactivated'}
        </span>
      </div>

      {/* Reset Filters Button */}
      {hasActiveFilters && onResetFilters && (
        <Fragment>
          <div
            aria-hidden={'true'}
            className={'mx-1 h-5 w-px bg-border'}
          />
          <Button
            aria-label={'Reset all filters'}
            onClick={onResetFilters}
            size={'sm'}
            variant={'ghost'}
          >
            <RotateCcw aria-hidden={'true'} className={'size-4'} />
            {'Reset Filters'}
          </Button>
        </Fragment>
      )}
    </div>
  );
};
