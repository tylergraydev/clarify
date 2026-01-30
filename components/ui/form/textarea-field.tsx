'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';

import { Textarea, textareaVariants } from '@/components/ui/textarea';
import { useFieldContext } from '@/lib/forms/form-hook';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

type TextareaFieldProps = ClassName &
  VariantProps<typeof textareaVariants> & {
    description?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
    label: string;
    placeholder?: string;
    rows?: number;
  };

export const TextareaField = ({
  className,
  description,
  isDisabled,
  isRequired,
  label,
  placeholder,
  rows = 3,
  size,
}: TextareaFieldProps) => {
  const field = useFieldContext<string>();

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
      <Field.Label className={labelVariants({ size })}>
        {label}
        {isRequired && (
          <span aria-hidden={'true'} className={'ml-0.5 text-destructive'}>
            *
          </span>
        )}
      </Field.Label>

      {/* Textarea */}
      <Textarea
        disabled={isDisabled}
        isInvalid={hasError}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        size={size}
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
