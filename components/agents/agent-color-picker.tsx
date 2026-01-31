'use client';

import type { ComponentPropsWithRef } from 'react';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { agentColors } from '@/db/schema/agents.schema';
import { agentColorClassMap, agentColorLabelMap } from '@/lib/colors/agent-colors';
import { cn } from '@/lib/utils';

type AgentColor = (typeof agentColors)[number];

interface AgentColorPickerProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  isDisabled?: boolean;
  isError?: boolean;
  isRequired?: boolean;
  label?: string;
  onChange?: (color: AgentColor) => void;
  value?: '' | AgentColor | null;
}

export const AgentColorPicker = ({
  className,
  isDisabled = false,
  isError = false,
  isRequired,
  label,
  onChange,
  ref,
  value,
  ...props
}: AgentColorPickerProps) => {
  const handleColorChange = (newValue: string) => {
    onChange?.(newValue as AgentColor);
  };

  const isSelected = (color: AgentColor) => value === color;
  const hasLabel = Boolean(label);

  return (
    <div className={cn('flex flex-col gap-2', className)} ref={ref} {...props}>
      {/* Label */}
      {hasLabel && (
        <span className={'text-sm font-medium text-foreground'} id={'agent-color-picker-label'}>
          {label}
          {isRequired && (
            <span aria-hidden={'true'} className={'ml-0.5 text-destructive'}>
              *
            </span>
          )}
        </span>
      )}

      {/* Color Options */}
      <RadioGroup
        aria-labelledby={hasLabel ? 'agent-color-picker-label' : undefined}
        className={cn('rounded-md border p-2', isError ? 'border-destructive' : 'border-transparent')}
        disabled={isDisabled}
        onValueChange={handleColorChange}
        orientation={'horizontal'}
        value={value ?? ''}
      >
        {agentColors.map((color) => (
          <label
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5',
              'transition-colors hover:bg-muted/50',
              isDisabled && 'cursor-not-allowed opacity-50'
            )}
            key={color}
          >
            <RadioGroupItem className={'sr-only'} disabled={isDisabled} value={color} />

            {/* Color Indicator */}
            <div
              className={cn(
                'size-5 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all',
                agentColorClassMap[color],
                isSelected(color) ? 'ring-accent' : 'ring-transparent'
              )}
              title={agentColorLabelMap[color]}
            />

            {/* Color Label */}
            <span className={'text-sm text-muted-foreground'}>{agentColorLabelMap[color]}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
};
