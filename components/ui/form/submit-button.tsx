"use client";

import type { VariantProps } from "class-variance-authority";

import { useStore } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useFormContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

type SubmitButtonProps = ClassName &
  RequiredChildren &
  VariantProps<typeof buttonVariants>;

export function SubmitButton({
  children,
  className,
  size,
  variant,
}: SubmitButtonProps) {
  const form = useFormContext();

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <Button
      aria-busy={isSubmitting || undefined}
      aria-disabled={isSubmitting || undefined}
      className={cn(className)}
      disabled={isSubmitting}
      size={size}
      type={"submit"}
      variant={variant}
    >
      {isSubmitting && (
        <Loader2 aria-hidden={"true"} className={"size-4 animate-spin"} />
      )}
      {children}
    </Button>
  );
}
