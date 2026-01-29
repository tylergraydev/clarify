"use client";

import type { ComponentPropsWithRef } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const buttonGroupVariants = cva(
  `
    flex w-fit items-stretch
    *:focus-visible:relative *:focus-visible:z-10
  `,
  {
    defaultVariants: {
      orientation: "horizontal",
    },
    variants: {
      orientation: {
        horizontal: `
          [&>*:not(:first-child)]:rounded-l-none
          [&>*:not(:first-child)]:border-l-0
          [&>*:not(:last-child)]:rounded-r-none
        `,
        vertical: `
          flex-col
          [&>*:not(:first-child)]:rounded-t-none
          [&>*:not(:first-child)]:border-t-0
          [&>*:not(:last-child)]:rounded-b-none
        `,
      },
    },
  }
);

type ButtonGroupProps = ComponentPropsWithRef<"div"> &
  VariantProps<typeof buttonGroupVariants>;

export const ButtonGroup = ({
  className,
  orientation,
  ref,
  ...props
}: ButtonGroupProps) => {
  return (
    <div
      className={cn(buttonGroupVariants({ orientation }), className)}
      data-orientation={orientation}
      data-slot={"button-group"}
      ref={ref}
      role={"group"}
      {...props}
    />
  );
};

type ButtonGroupTextProps = ComponentPropsWithRef<"div">;

export const ButtonGroupText = ({
  className,
  ref,
  ...props
}: ButtonGroupTextProps) => {
  return (
    <div
      className={cn(
        `
          flex items-center gap-2 rounded-md border border-border bg-muted px-4
          text-sm font-medium
        `,
        `
          [&_svg]:pointer-events-none
          [&_svg:not([class*="size-"])]:size-4
        `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

type ButtonGroupSeparatorProps = ComponentPropsWithRef<typeof Separator>;

export const ButtonGroupSeparator = ({
  className,
  orientation = "vertical",
  ref,
  ...props
}: ButtonGroupSeparatorProps) => {
  return (
    <Separator
      className={cn(
        `
        relative m-0! self-stretch
        data-[orientation=vertical]:h-auto
      `,
        className
      )}
      data-slot={"button-group-separator"}
      orientation={orientation}
      ref={ref}
      {...props}
    />
  );
};
