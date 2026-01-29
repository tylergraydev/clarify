"use client";

import type { VariantProps } from "class-variance-authority";

import { Field } from "@base-ui/react/field";
import { FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  descriptionVariants,
  errorVariants,
  labelVariants,
} from "@/components/ui/form/field-wrapper";
import { TanStackFieldRoot } from "@/components/ui/form/tanstack-field-root";
import { Input, inputVariants } from "@/components/ui/input";
import { useElectronDialog } from "@/hooks/use-electron";
import { useFieldContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

type PathInputFieldProps = ClassName &
  VariantProps<typeof inputVariants> & {
    description?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
    label: string;
    placeholder?: string;
  };

export const PathInputField = ({
  className,
  description,
  isDisabled,
  isRequired,
  label,
  placeholder,
  size,
}: PathInputFieldProps) => {
  const field = useFieldContext<string>();
  const { isElectron, openDirectory } = useElectronDialog();

  const error = field.state.meta.errors[0]?.message;
  const hasError = Boolean(error);

  const handleBrowseClick = async () => {
    const selectedPath = await openDirectory();
    if (selectedPath) {
      field.handleChange(selectedPath);
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
      <Field.Label className={labelVariants({ size })}>
        {label}
        {isRequired && (
          <span aria-hidden={"true"} className={"ml-0.5 text-destructive"}>
            *
          </span>
        )}
      </Field.Label>

      {/* Input Group */}
      <div className={"flex gap-2"}>
        <Input
          className={"flex-1"}
          disabled={isDisabled}
          isInvalid={hasError}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          size={size}
          type={"text"}
          value={field.state.value ?? ""}
        />
        <Button
          aria-label={"Browse for directory"}
          disabled={isDisabled || !isElectron}
          onClick={handleBrowseClick}
          size={size === "sm" ? "icon-sm" : "icon"}
          type={"button"}
          variant={"outline"}
        >
          <FolderOpen aria-hidden={"true"} className={cn("size-4")} />
        </Button>
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
