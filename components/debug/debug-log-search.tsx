'use client';

import type { ChangeEvent, ComponentPropsWithRef } from 'react';

import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Props for the DebugLogSearch component.
 */
interface DebugLogSearchProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** Debounce delay in milliseconds. Defaults to 300. */
  debounceMs?: number;
  /** Whether the search input is disabled */
  isDisabled?: boolean;
  /** Callback fired when search value changes (debounced) */
  onChange: (value: string) => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Current search value */
  value: string;
}

/**
 * Search input component with debounced onChange, search icon, and clear button.
 *
 * @example
 * ```tsx
 * <DebugLogSearch
 *   value={searchText}
 *   onChange={setSearchText}
 *   placeholder="Search logs..."
 * />
 * ```
 */
export const DebugLogSearch = ({
  className,
  debounceMs = 300,
  isDisabled = false,
  onChange,
  placeholder = 'Search logs...',
  ref,
  value,
  ...props
}: DebugLogSearchProps) => {
  const [internalValue, setInternalValue] = useState(value);

  // Sync internal value when external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced onChange effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange, value]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  }, []);

  const handleClearClick = useCallback(() => {
    setInternalValue('');
    onChange('');
  }, [onChange]);

  const hasValue = internalValue.length > 0;

  return (
    <div className={cn('relative', className)} ref={ref} {...props}>
      {/* Search Icon */}
      <Search
        aria-hidden={'true'}
        className={'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'}
      />

      {/* Search Input */}
      <Input
        className={'px-9'}
        disabled={isDisabled}
        onChange={handleInputChange}
        placeholder={placeholder}
        type={'text'}
        value={internalValue}
      />

      {/* Clear Button */}
      {hasValue && (
        <button
          aria-label={'Clear search'}
          className={`
            absolute top-1/2 right-3 -translate-y-1/2 rounded-sm
            text-muted-foreground transition-colors
            hover:text-foreground
            focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none
          `}
          disabled={isDisabled}
          onClick={handleClearClick}
          type={'button'}
        >
          <X aria-hidden={'true'} className={'size-4'} />
        </button>
      )}
    </div>
  );
};
