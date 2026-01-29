"use client";

import type { ComponentPropsWithRef } from "react";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export const checkboxVariants = cva(
  `
    flex items-center justify-center rounded-sm border
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
    data-checked:border-accent data-checked:bg-accent
    data-checked:text-accent-foreground
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-unchecked:border-border data-unchecked:bg-transparent
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "size-4",
        lg: "size-5",
        sm: "size-3.5",
      },
    },
  }
);

export const checkboxIconVariants = cva("", {
  defaultVariants: {
    size: "default",
  },
  variants: {
    size: {
      default: "size-3",
      lg: "size-3.5",
      sm: "size-2.5",
    },
  },
});

type CheckboxProps = Omit<
  ComponentPropsWithRef<typeof BaseCheckbox.Root>,
  "children"
> &
  VariantProps<typeof checkboxVariants>;

export const Checkbox = ({ className, ref, size, ...props }: CheckboxProps) => {
  return (
    <BaseCheckbox.Root
      className={cn(checkboxVariants({ size }), className)}
      ref={ref}
      {...props}
    >
      <BaseCheckbox.Indicator
        className={`
        flex
        data-unchecked:hidden
      `}
      >
        <Check
          aria-hidden={"true"}
          className={cn(checkboxIconVariants({ size }))}
        />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
};
