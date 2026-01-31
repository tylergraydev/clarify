'use client';

import type { ComponentPropsWithRef } from 'react';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { agentColors } from '@/db/schema/agents.schema';
import { agentColorClassMap, agentColorLabelMap } from '@/lib/colors/agent-colors';
import { cn } from '@/lib/utils';

type AgentColor = (typeof agentColors)[number];

interface AgentColorPickerProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  hasError?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  label?: string;
  onChange?: (color: AgentColor) => void;
  value?: '' | AgentColor | null;
}

/**
 * Color picker component for selecting agent colors.
 * Displays available agent colors as a horizontal radio group with visual swatches.
 *
 * @param props - Component props
 * @param props.className - Additional CSS classes
 * @param props.hasError - Whether to display error styling
 * @param props.isDisabled - Whether the picker is disabled
 * @param props.isRequired - Whether a selection is required
 * @param props.label - Label text to display above the picker
 * @param props.onChange - Callback when color selection changes
 * @param props.ref - Forwarded ref to the root div element
 * @param props.value - Currently selected color value
 */
export const AgentColorPicker = ({
  className,
  hasError = false,
  isDisabled = false,
  isRequired,
  label,
  onChange,
  ref,
  value,
  ...props
}: AgentColorPickerProps) => {
  return (
    <div className={cn('flex flex-col gap-2', className)} ref={ref} {...props}>
      {label && (
        <span className={'text-sm font-medium text-foreground'}>
          {label}
          {isRequired && (
            <span aria-hidden={'true'} className={'ml-0.5 text-destructive'}>
              *
            </span>
          )}
        </span>
      )}
      <RadioGroup
        className={cn('rounded-md border p-2', hasError ? 'border-destructive' : 'border-transparent')}
        disabled={isDisabled}
        onValueChange={(newValue) => onChange?.(newValue as AgentColor)}
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
            <div
              className={cn(
                'size-5 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all',
                agentColorClassMap[color],
                value === color ? 'ring-accent' : 'ring-transparent'
              )}
              title={agentColorLabelMap[color]}
            />
            <span className={'text-sm text-muted-foreground'}>{agentColorLabelMap[color]}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
};
