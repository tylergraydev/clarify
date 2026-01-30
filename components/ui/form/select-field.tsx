'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';

import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  selectTriggerVariants,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/lib/forms/form-hook';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

type SelectFieldProps = ClassName &
  VariantProps<typeof selectTriggerVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
    /** Optional callback when value changes (in addition to form state update) */
    onChange?: (value: string) => void;
    options: Array<SelectOption>;
    placeholder?: string;
  };

interface SelectOption {
  isDisabled?: boolean;
  label: string;
  value: string;
}

export const SelectField = ({
  className,
  description,
  isDisabled,
  label,
  onChange,
  options,
  placeholder = 'Select an option',
  size,
}: SelectFieldProps) => {
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

      {/* Select */}
      <SelectRoot
        disabled={isDisabled}
        modal={false}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            field.handleBlur();
          }
        }}
        onValueChange={(value) => {
          const newValue = value ?? '';
          field.handleChange(newValue);
          onChange?.(newValue);
        }}
        value={field.state.value}
      >
        <SelectTrigger isInvalid={hasError} size={size}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup size={size}>
              <SelectList>
                {options.map((option) => (
                  <SelectItem
                    disabled={option.isDisabled}
                    key={option.value}
                    label={option.label}
                    size={size}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>

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
