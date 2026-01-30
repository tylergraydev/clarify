'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';

import { Switch, switchVariants } from '@/components/ui/switch';
import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

type SwitchFieldProps = ClassName &
  VariantProps<typeof switchVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
  };

export const SwitchField = ({ className, description, isDisabled, label, size }: SwitchFieldProps) => {
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
      {/* Switch with Inline Label */}
      <Field.Item className={'flex items-center gap-2'}>
        <Switch
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
        <Field.Description className={cn(descriptionVariants({ size }), 'pl-11')}>{description}</Field.Description>
      )}

      {/* Error */}
      {hasError && (
        <Field.Error className={cn(errorVariants({ size }), 'pl-11')} match={true}>
          {error}
        </Field.Error>
      )}
    </TanStackFieldRoot>
  );
};
