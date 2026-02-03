'use client';

import type { ComponentPropsWithRef } from 'react';

import { useCallback, useMemo } from 'react';

import type { DebugLogCategory, DebugLogFilters as DebugLogFiltersType, DebugLogLevel } from '@/types/debug-log';

import { DebugLogSearch } from '@/components/debug/debug-log-search';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';

/**
 * Available log levels for filtering.
 */
const LOG_LEVELS: Array<{ label: string; value: DebugLogLevel }> = [
  { label: 'Debug', value: 'debug' },
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
];

/**
 * Available log categories for filtering.
 */
const LOG_CATEGORIES: Array<{ label: string; value: DebugLogCategory }> = [
  { label: 'SDK Event', value: 'sdk_event' },
  { label: 'Tool Use', value: 'tool_use' },
  { label: 'Tool Result', value: 'tool_result' },
  { label: 'Thinking', value: 'thinking' },
  { label: 'Text', value: 'text' },
  { label: 'Permission', value: 'permission' },
  { label: 'Session', value: 'session' },
  { label: 'System', value: 'system' },
];

/**
 * Props for the DebugLogFilters component.
 */
interface DebugLogFiltersProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** Current filter values */
  filters: DebugLogFiltersType;
  /** Whether the filters are disabled */
  isDisabled?: boolean;
  /** Callback fired when filters change */
  onChange: (filters: Partial<DebugLogFiltersType>) => void;
  /** Array of available session IDs for the dropdown */
  sessionIds: Array<string>;
}

/**
 * Filter controls for debug log viewer.
 *
 * Includes:
 * - Text search input with debounce
 * - Level multi-select (info, warn, error, debug)
 * - Category multi-select
 * - Session ID dropdown
 *
 * @example
 * ```tsx
 * <DebugLogFilters
 *   filters={currentFilters}
 *   onChange={setFilters}
 *   sessionIds={availableSessionIds}
 *   isDisabled={isLoading}
 * />
 * ```
 */
export const DebugLogFilters = ({
  className,
  filters,
  isDisabled = false,
  onChange,
  ref,
  sessionIds,
  ...props
}: DebugLogFiltersProps) => {
  // Parse multi-value strings into arrays
  const selectedLevels = useMemo(() => {
    if (!filters.level) return [];
    return filters.level.split(',') as Array<DebugLogLevel>;
  }, [filters.level]);

  const selectedCategories = useMemo(() => {
    if (!filters.category) return [];
    return filters.category.split(',') as Array<DebugLogCategory>;
  }, [filters.category]);

  const handleTextChange = useCallback(
    (text: string) => {
      onChange({ text: text || undefined });
    },
    [onChange]
  );

  const handleLevelToggle = useCallback(
    (level: DebugLogLevel) => {
      const newLevels = selectedLevels.includes(level)
        ? selectedLevels.filter((l) => l !== level)
        : [...selectedLevels, level];

      onChange({ level: newLevels.length > 0 ? (newLevels.join(',') as DebugLogLevel) : undefined });
    },
    [onChange, selectedLevels]
  );

  const handleCategoryToggle = useCallback(
    (category: DebugLogCategory) => {
      const newCategories = selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category];

      onChange({ category: newCategories.length > 0 ? (newCategories.join(',') as DebugLogCategory) : undefined });
    },
    [onChange, selectedCategories]
  );

  const handleSessionChange = useCallback(
    (value: null | string) => {
      onChange({ sessionId: value === 'all' || value === '' ? undefined : (value ?? undefined) });
    },
    [onChange]
  );

  const sessionItems = useMemo(() => {
    const items: Record<string, string> = { all: 'All Sessions' };
    sessionIds.forEach((id) => {
      items[id] = id.slice(0, 8) + '...';
    });
    return items;
  }, [sessionIds]);

  return (
    <div
      className={cn('flex flex-col gap-4 rounded-md border border-border bg-card p-4', className)}
      ref={ref}
      {...props}
    >
      {/* Search Input */}
      <div>
        <label className={'mb-2 block text-xs font-medium text-muted-foreground'}>Search</label>
        <DebugLogSearch
          isDisabled={isDisabled}
          onChange={handleTextChange}
          placeholder={'Search log messages...'}
          value={filters.text ?? ''}
        />
      </div>

      {/* Level Multi-Select */}
      <div>
        <label className={'mb-2 block text-xs font-medium text-muted-foreground'}>Log Levels</label>
        <div className={'flex flex-wrap gap-3'}>
          {LOG_LEVELS.map(({ label, value }) => {
            const isChecked = selectedLevels.includes(value);
            return (
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2 text-sm',
                  isDisabled && 'cursor-not-allowed opacity-50'
                )}
                key={value}
              >
                <Checkbox
                  checked={isChecked}
                  disabled={isDisabled}
                  onCheckedChange={() => handleLevelToggle(value)}
                  size={'sm'}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Category Multi-Select */}
      <div>
        <label className={'mb-2 block text-xs font-medium text-muted-foreground'}>Categories</label>
        <div className={'flex flex-wrap gap-3'}>
          {LOG_CATEGORIES.map(({ label, value }) => {
            const isChecked = selectedCategories.includes(value);
            return (
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2 text-sm',
                  isDisabled && 'cursor-not-allowed opacity-50'
                )}
                key={value}
              >
                <Checkbox
                  checked={isChecked}
                  disabled={isDisabled}
                  onCheckedChange={() => handleCategoryToggle(value)}
                  size={'sm'}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Session ID Dropdown */}
      <div>
        <label className={'mb-2 block text-xs font-medium text-muted-foreground'}>Session</label>
        <SelectRoot
          disabled={isDisabled}
          items={sessionItems}
          onValueChange={handleSessionChange}
          value={filters.sessionId ?? 'all'}
        >
          <SelectTrigger size={'sm'}>
            <SelectValue placeholder={'Select session...'} />
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup size={'sm'}>
                <SelectList>
                  <SelectItem label={'All Sessions'} size={'sm'} value={'all'}>
                    All Sessions
                  </SelectItem>
                  {sessionIds.map((id) => (
                    <SelectItem key={id} label={`${id.slice(0, 8)}...`} size={'sm'} value={id}>
                      {id.slice(0, 8)}...
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
      </div>
    </div>
  );
};
