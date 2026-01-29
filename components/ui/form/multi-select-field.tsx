"use client";

import type { VariantProps } from "class-variance-authority";

import { Field } from "@base-ui/react/field";
import { cva } from "class-variance-authority";

import { Checkbox, checkboxVariants } from "@/components/ui/checkbox";
import { useFieldContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

import {
  descriptionVariants,
  errorVariants,
  labelVariants,
} from "./field-wrapper";
import { TanStackFieldRoot } from "./tanstack-field-root";

export const multiSelectFieldVariants = cva("flex flex-col gap-2", {
  defaultVariants: {
    size: "default",
  },
  variants: {
    size: {
      default: "gap-2",
      lg: "gap-2.5",
      sm: "gap-1.5",
    },
  },
});

type MultiSelectFieldProps = ClassName &
  VariantProps<typeof checkboxVariants> & {
    description?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
    label: string;
    options: Array<MultiSelectOption>;
  };

interface MultiSelectOption {
  isDisabled?: boolean;
  label: string;
  value: number;
}

export const MultiSelectField = ({
  className,
  description,
  isDisabled,
  isRequired,
  label,
  options,
  size,
}: MultiSelectFieldProps) => {
  const field = useFieldContext<Array<number>>();

  // Handle both string and object error formats from TanStack Form
  const rawError = field.state.meta.errors[0];
  const error = typeof rawError === "string" ? rawError : rawError?.message;
  const hasError = Boolean(error);

  const selectedValues = field.state.value ?? [];

  const handleToggle = (value: number, isChecked: boolean) => {
    if (isChecked) {
      // Add to selection
      field.handleChange([...selectedValues, value]);
    } else {
      // Remove from selection
      field.handleChange(selectedValues.filter((v) => v !== value));
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
      <Field.Label
        className={labelVariants({ size })}
        nativeLabel={false}
        render={<span />}
      >
        {label}
        {isRequired && (
          <span aria-hidden={"true"} className={"ml-0.5 text-destructive"}>
            *
          </span>
        )}
      </Field.Label>

      {/* Options List */}
      <div className={multiSelectFieldVariants({ size })} role={"group"}>
        {options.map((option) => {
          const isChecked = selectedValues.includes(option.value);
          const isOptionDisabled = isDisabled || option.isDisabled;

          return (
            <label
              className={"flex cursor-pointer items-center gap-2"}
              key={option.value}
            >
              <Checkbox
                checked={isChecked}
                disabled={isOptionDisabled}
                onCheckedChange={(checked) =>
                  handleToggle(option.value, checked)
                }
                size={size}
              />
              <span
                className={cn(
                  labelVariants({ size }),
                  "font-normal",
                  isOptionDisabled && "cursor-not-allowed opacity-50"
                )}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      {/* Description */}
      {description && !hasError && (
        <Field.Description className={descriptionVariants({ size })}>
          {description}
        </Field.Description>
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
