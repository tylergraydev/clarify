'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';
import { cva } from 'class-variance-authority';

import {
  RadioGroup,
  RadioGroupItem,
  radioGroupVariants,
  radioIndicatorVariants,
  radioItemVariants,
} from '@/components/ui/radio-group';
import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

export const radioFieldOptionLabelVariants = cva('text-foreground', {
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

export const radioFieldOptionDescriptionVariants = cva('text-muted-foreground', {
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

interface RadioFieldOption {
  description?: string;
  isDisabled?: boolean;
  label: string;
  value: string;
}

type RadioFieldProps = ClassName &
  VariantProps<typeof radioGroupVariants> &
  VariantProps<typeof radioItemVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
    options: Array<RadioFieldOption>;
  };

export const RadioField = ({
  className,
  description,
  isDisabled,
  label,
  options,
  orientation = 'vertical',
  size,
}: RadioFieldProps) => {
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
      <Field.Label className={labelVariants({ size })} nativeLabel={false} render={<span />}>
        {label}
      </Field.Label>

      {/* Radio Group */}
      <RadioGroup
        disabled={isDisabled}
        onValueChange={(value) => field.handleChange(value)}
        orientation={orientation}
        value={field.state.value ?? ''}
      >
        {options.map((option) => {
          const _hasOptionDescription = Boolean(option.description);

          if (_hasOptionDescription) {
            return (
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-2',
                  option.isDisabled && 'cursor-not-allowed opacity-50'
                )}
                key={option.value}
              >
                <RadioGroupItem disabled={option.isDisabled} size={size} value={option.value} />
                <div className={'flex flex-col gap-0.5'}>
                  <span className={radioFieldOptionLabelVariants({ size })}>{option.label}</span>
                  <span className={radioFieldOptionDescriptionVariants({ size })}>{option.description}</span>
                </div>
              </label>
            );
          }

          return (
            <RadioGroupItem
              disabled={option.isDisabled}
              key={option.value}
              label={option.label}
              size={size}
              value={option.value}
            />
          );
        })}
      </RadioGroup>

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

export { radioGroupVariants, radioIndicatorVariants, radioItemVariants };
