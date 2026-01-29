"use client";

import type { ComponentPropsWithRef } from "react";

import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  `
    inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium
    whitespace-nowrap transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
    data-disabled:pointer-events-none data-disabled:opacity-50
  `,
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 px-4 py-2",
        icon: "size-9",
        "icon-sm": "size-8",
        lg: "h-10 px-6",
        sm: "h-8 px-3 text-xs",
      },
      variant: {
        default: `
          bg-accent text-accent-foreground
          hover:bg-accent-hover
        `,
        destructive: `
          bg-destructive text-destructive-foreground
          hover:bg-destructive/90
        `,
        ghost: "hover:bg-muted hover:text-foreground",
        link: `
          text-accent underline-offset-4
          hover:underline
        `,
        outline: `
          border border-border bg-transparent
          hover:bg-muted hover:text-foreground
        `,
        secondary: `
          bg-muted text-foreground
          hover:bg-muted/80
        `,
      },
    },
  }
);

type ButtonProps = ComponentPropsWithRef<typeof BaseButton> &
  VariantProps<typeof buttonVariants>;

export const Button = ({
  className,
  ref,
  size,
  variant,
  ...props
}: ButtonProps) => {
  return (
    <BaseButton
      className={cn(buttonVariants({ className, size, variant }))}
      ref={ref}
      {...props}
    />
  );
};
