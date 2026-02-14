'use client';

import type { PrListFilters as PrListFiltersType } from '@/types/github';

import { cn } from '@/lib/utils';

interface PrListFiltersProps {
  className?: string;
  filters: PrListFiltersType;
  onFiltersChange: (filters: PrListFiltersType) => void;
}

const STATE_TABS = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
  { label: 'Merged', value: 'merged' },
  { label: 'All', value: 'all' },
] as const;

export const PrListFilters = ({ className, filters, onFiltersChange }: PrListFiltersProps) => {
  const activeState = filters.state ?? 'open';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {STATE_TABS.map((tab) => (
        <button
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeState === tab.value
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
          key={tab.value}
          onClick={() => onFiltersChange({ ...filters, state: tab.value })}
          type={'button'}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
