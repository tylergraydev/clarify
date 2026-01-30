'use client';

import type { ChangeEvent, ComponentPropsWithRef } from 'react';

import { format, subDays } from 'date-fns';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PresetOption {
  days: null | number;
  label: string;
}

const PRESET_OPTIONS: Array<PresetOption> = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: null, label: 'All time' },
];

interface DateRangeFilterProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string | undefined) => void;
  onDateToChange?: (value: string | undefined) => void;
}

export const DateRangeFilter = ({
  className,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  ref,
  ...props
}: DateRangeFilterProps) => {
  const isFiltersActive = dateFrom || dateTo;

  const handleDateFromChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDateFromChange?.(value || undefined);
  };

  const handleDateToChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDateToChange?.(value || undefined);
  };

  const handleClearClick = () => {
    onDateFromChange?.(undefined);
    onDateToChange?.(undefined);
  };

  const handlePresetClick = (days: null | number) => {
    if (days === null) {
      onDateFromChange?.(undefined);
      onDateToChange?.(undefined);
    } else {
      const today = new Date();
      const fromDate = subDays(today, days);
      onDateFromChange?.(format(fromDate, 'yyyy-MM-dd'));
      onDateToChange?.(format(today, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className={cn('flex flex-col gap-3', className)} ref={ref} {...props}>
      {/* Date Inputs */}
      <div className={'flex flex-wrap items-center gap-2'}>
        <div className={'flex items-center gap-2'}>
          <label className={'text-sm text-muted-foreground'} htmlFor={'date-from'}>
            {'From'}
          </label>
          <Input id={'date-from'} onChange={handleDateFromChange} size={'sm'} type={'date'} value={dateFrom ?? ''} />
        </div>

        <div className={'flex items-center gap-2'}>
          <label className={'text-sm text-muted-foreground'} htmlFor={'date-to'}>
            {'To'}
          </label>
          <Input id={'date-to'} onChange={handleDateToChange} size={'sm'} type={'date'} value={dateTo ?? ''} />
        </div>

        {isFiltersActive && (
          <Button aria-label={'Clear date filters'} onClick={handleClearClick} size={'sm'} variant={'ghost'}>
            <X aria-hidden={'true'} className={'size-4'} />
            {'Clear'}
          </Button>
        )}
      </div>

      {/* Preset Options */}
      <div className={'flex flex-wrap gap-2'}>
        {PRESET_OPTIONS.map((preset) => (
          <Button key={preset.label} onClick={() => handlePresetClick(preset.days)} size={'sm'} variant={'outline'}>
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
