'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';

import { Checkbox, checkboxVariants } from '@/components/ui/checkbox';
import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

type CheckboxFieldProps = ClassName &
  VariantProps<typeof checkboxVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
  };

export const CheckboxField = ({ className, description, isDisabled, label, size }: CheckboxFieldProps) => {
  const field = useFieldContext<boolean>();

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
      {/* Checkbox with Inline Label */}
      <Field.Item className={'flex items-center gap-2'}>
        <Checkbox
          checked={field.state.value ?? false}
          disabled={isDisabled}
          onCheckedChange={(isChecked) => field.handleChange(isChecked)}
          size={size}
        />
        <Field.Label className={labelVariants({ size })} nativeLabel={false} render={<span />}>
          {label}
        </Field.Label>
      </Field.Item>

      {/* Description */}
      {description && !hasError && (
        <Field.Description className={cn(descriptionVariants({ size }), 'pl-6')}>{description}</Field.Description>
      )}

      {/* Error */}
      {hasError && (
        <Field.Error className={cn(errorVariants({ size }), 'pl-6')} match={true}>
          {error}
        </Field.Error>
      )}
    </TanStackFieldRoot>
  );
};
