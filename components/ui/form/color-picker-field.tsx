'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';

import { AgentColorPicker } from '@/components/agents/agent-color-picker';
import { agentColors } from '@/db/schema/agents.schema';
import { useFieldContext } from '@/lib/forms/form-hook';

import { descriptionVariants, errorVariants, fieldWrapperVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

type AgentColor = (typeof agentColors)[number];

type ColorPickerFieldProps = ClassName &
  VariantProps<typeof fieldWrapperVariants> & {
    description?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
    label: string;
  };

export const ColorPickerField = ({
  className,
  description,
  isDisabled,
  isRequired,
  label,
  size,
}: ColorPickerFieldProps) => {
  const field = useFieldContext<'' | AgentColor>();

  const error = field.state.meta.errors[0]?.message;
  const hasError = Boolean(error);

  return (
    <TanStackFieldRoot
      className={className}
      isDirty={field.state.meta.isDirty}
      isDisabled={isDisabled}
      isInvalid={hasError}
      isTouched={field.state.meta.isTouched}
      name={field.name}
      size={size}
    >
      {/* Label */}
      <Field.Label className={labelVariants({ size })} nativeLabel={false} render={<span />}>
        {label}
        {isRequired && (
          <span aria-hidden={'true'} className={'ml-0.5 text-destructive'}>
            *
          </span>
        )}
      </Field.Label>

      {/* Color Picker */}
      <AgentColorPicker
        disabled={isDisabled}
        hasError={hasError}
        onChange={(color) => field.handleChange(color)}
        value={field.state.value ?? ''}
      />

      {/* Description */}
      {description && !hasError && (
        <Field.Description className={descriptionVariants({ size })}>{description}</Field.Description>
      )}

      {/* Error */}
      {hasError && (
        <Field.Error className={errorVariants({ size })} match={true}>
          {error}
        </Field.Error>
      )}
    </TanStackFieldRoot>
  );
};
