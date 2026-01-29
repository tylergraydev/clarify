"use client";

import type { ComponentPropsWithRef } from "react";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export const Collapsible = BaseCollapsible.Root;

export const collapsibleTriggerVariants = cva(
  `
    group flex items-center gap-2 rounded-md text-sm font-medium
    transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
    data-disabled:pointer-events-none data-disabled:opacity-50
  `,
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "hover:bg-muted",
        ghost: "hover:text-foreground",
      },
    },
  }
);

type CollapsibleTriggerProps = ComponentPropsWithRef<
  typeof BaseCollapsible.Trigger
> &
  VariantProps<typeof collapsibleTriggerVariants> & {
    isHideChevron?: boolean;
  };

export const CollapsibleTrigger = ({
  children,
  className,
  isHideChevron = false,
  ref,
  variant,
  ...props
}: CollapsibleTriggerProps) => {
  return (
    <BaseCollapsible.Trigger
      className={cn(collapsibleTriggerVariants({ className, variant }))}
      ref={ref}
      {...props}
    >
      {!isHideChevron && (
        <ChevronRight
          aria-hidden={"true"}
          className={`
            size-4 shrink-0 transition-transform duration-200 ease-out
            group-data-panel-open:rotate-90
          `}
        />
      )}
      {children}
    </BaseCollapsible.Trigger>
  );
};

export const collapsibleContentVariants = cva(
  `
    flex h-(--collapsible-panel-height) flex-col overflow-hidden transition-all
    duration-200 ease-out
    data-ending-style:h-0
    data-starting-style:h-0
    [&[hidden]:not([hidden='until-found'])]:hidden
  `,
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "",
        padded: "pl-6",
      },
    },
  }
);

type CollapsibleContentProps = ComponentPropsWithRef<
  typeof BaseCollapsible.Panel
> &
  VariantProps<typeof collapsibleContentVariants>;

export const CollapsibleContent = ({
  className,
  ref,
  variant,
  ...props
}: CollapsibleContentProps) => {
  return (
    <BaseCollapsible.Panel
      className={cn(collapsibleContentVariants({ className, variant }))}
      ref={ref}
      {...props}
    />
  );
};
