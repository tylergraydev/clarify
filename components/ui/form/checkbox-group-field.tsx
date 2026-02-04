'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';
import { cva } from 'class-variance-authority';

import { Checkbox, checkboxVariants } from '@/components/ui/checkbox';
import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

export const checkboxGroupFieldOptionLabelVariants = cva('text-foreground', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'text-sm',
      lg: 'text-base',
      sm: 'text-xs',
    },
  },
});

export const checkboxGroupFieldOptionDescriptionVariants = cva('text-muted-foreground', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'text-xs',
      lg: 'text-sm',
      sm: 'text-[11px]',
    },
  },
});

interface CheckboxGroupFieldOption {
  description?: string;
  isDisabled?: boolean;
  label: string;
  value: string;
}

type CheckboxGroupFieldProps = ClassName &
  VariantProps<typeof checkboxVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
    options: Array<CheckboxGroupFieldOption>;
  };

export const CheckboxGroupField = ({
  className,
  description,
  isDisabled,
  label,
  options,
  size,
}: CheckboxGroupFieldProps) => {
  const field = useFieldContext<Array<string>>();

  const error = field.state.meta.errors[0]?.message;
  const hasError = Boolean(error);

  const _handleCheckboxChange = (optionValue: string, isChecked: boolean) => {
    const currentValue = field.state.value ?? [];

    if (isChecked) {
      // Add value to array if not already present
      if (!currentValue.includes(optionValue)) {
        field.handleChange([...currentValue, optionValue]);
      }
    } else {
      // Remove value from array
      field.handleChange(currentValue.filter((v) => v !== optionValue));
    }
  };

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
      </Field.Label>

      {/* Checkbox Group */}
      <div className={'flex flex-col gap-2'}>
        {options.map((option) => {
          const _hasOptionDescription = Boolean(option.description);
          const _isChecked = (field.state.value ?? []).includes(option.value);

          if (_hasOptionDescription) {
            return (
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-2',
                  (option.isDisabled || isDisabled) && 'cursor-not-allowed opacity-50'
                )}
                key={option.value}
              >
                <Checkbox
                  checked={_isChecked}
                  disabled={option.isDisabled || isDisabled}
                  onCheckedChange={(checked) => _handleCheckboxChange(option.value, checked)}
                  size={size}
                />
                <div className={'flex flex-col gap-0.5'}>
                  <span className={checkboxGroupFieldOptionLabelVariants({ size })}>{option.label}</span>
                  <span className={checkboxGroupFieldOptionDescriptionVariants({ size })}>
                    {option.description}
                  </span>
                </div>
              </label>
            );
          }

          return (
            <label
              className={cn(
                'flex cursor-pointer items-center gap-2',
                (option.isDisabled || isDisabled) && 'cursor-not-allowed opacity-50'
              )}
              key={option.value}
            >
              <Checkbox
                checked={_isChecked}
                disabled={option.isDisabled || isDisabled}
                onCheckedChange={(checked) => _handleCheckboxChange(option.value, checked)}
                size={size}
              />
              <span className={checkboxGroupFieldOptionLabelVariants({ size })}>{option.label}</span>
            </label>
          );
        })}
      </div>

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

export { checkboxVariants };
