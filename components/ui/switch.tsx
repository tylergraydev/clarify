"use client";

import type { ComponentPropsWithRef } from "react";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const switchVariants = cva(
  `
    relative inline-flex shrink-0 cursor-pointer rounded-full border-2
    border-transparent transition-colors duration-200 ease-in-out
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
    data-checked:bg-accent
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-unchecked:border-border data-unchecked:bg-muted
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "h-5 w-9",
        lg: "h-6 w-11",
        sm: "h-4 w-7",
      },
    },
  }
);

export const switchThumbVariants = cva(
  `
    pointer-events-none block rounded-full bg-white shadow-sm ring-0
    transition-transform duration-200 ease-in-out
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: `
          size-4
          data-checked:translate-x-4
          data-unchecked:translate-x-0
        `,
        lg: `
          size-5
          data-checked:translate-x-5
          data-unchecked:translate-x-0
        `,
        sm: `
          size-3
          data-checked:translate-x-3
          data-unchecked:translate-x-0
        `,
      },
    },
  }
);

type SwitchProps = Omit<
  ComponentPropsWithRef<typeof BaseSwitch.Root>,
  "children"
> &
  VariantProps<typeof switchVariants>;

export const Switch = ({ className, ref, size, ...props }: SwitchProps) => {
  return (
    <BaseSwitch.Root
      className={cn(switchVariants({ size }), className)}
      ref={ref}
      {...props}
    >
      <BaseSwitch.Thumb className={switchThumbVariants({ size })} />
    </BaseSwitch.Root>
  );
};
