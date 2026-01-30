'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';

import {
  NumberInputDecrement,
  NumberInputField,
  NumberInputGroup,
  NumberInputIncrement,
  NumberInputRoot,
  numberInputVariants,
} from '@/components/ui/number-input';
import { useFieldContext } from '@/lib/forms/form-hook';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

type NumberFieldComponentProps = ClassName &
  VariantProps<typeof numberInputVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
    max?: number;
    min?: number;
    step?: number;
  };

export const NumberFieldComponent = ({
  className,
  description,
  isDisabled,
  label,
  max,
  min,
  size,
  step = 1,
}: NumberFieldComponentProps) => {
  const field = useFieldContext<null | number>();

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
      <Field.Label className={labelVariants({ size })}>{label}</Field.Label>

      {/* Number Input */}
      <NumberInputRoot
        disabled={isDisabled}
        max={max}
        min={min}
        onValueChange={(value) => field.handleChange(value)}
        step={step}
        value={field.state.value}
      >
        <NumberInputGroup>
          <NumberInputDecrement size={size} />
          <NumberInputField onBlur={field.handleBlur} size={size} />
          <NumberInputIncrement size={size} />
        </NumberInputGroup>
      </NumberInputRoot>

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
