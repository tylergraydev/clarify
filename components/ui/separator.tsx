"use client";

import type { ComponentPropsWithRef } from "react";

import { Separator as BaseSeparator } from "@base-ui/react/separator";

import { cn } from "@/lib/utils";

type SeparatorProps = ComponentPropsWithRef<typeof BaseSeparator>;

export const Separator = ({
  className,
  orientation = "horizontal",
  ref,
  ...props
}: SeparatorProps) => {
  return (
    <BaseSeparator
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal"
          ? `
        h-px w-full
      `
          : `h-full w-px`,
        className
      )}
      orientation={orientation}
      ref={ref}
      {...props}
    />
  );
};
