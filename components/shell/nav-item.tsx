"use client";

import type { ComponentPropsWithRef, ElementType } from "react";

import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const navItemVariants = cva(
  `
    inline-flex w-full items-center gap-3 rounded-md text-sm font-medium
    transition-colors
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
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1.5 text-xs",
      },
      variant: {
        active: `
          bg-accent text-accent-foreground
          hover:bg-accent-hover
        `,
        default: `
          text-muted-foreground
          hover:bg-muted hover:text-foreground
        `,
        nested: `
          pl-9 text-muted-foreground
          hover:bg-muted hover:text-foreground
        `,
      },
    },
  }
);

interface NavItemProps
  extends
    NavItemVariants,
    Omit<ComponentPropsWithRef<typeof Link>, "children"> {
  href: string;
  icon?: ElementType;
  isActive?: boolean;
  isCollapsed?: boolean;
  isNested?: boolean;
  label: string;
}

type NavItemVariants = VariantProps<typeof navItemVariants>;

export const NavItem = ({
  className,
  href,
  icon: Icon,
  isActive = false,
  isCollapsed = false,
  isNested = false,
  label,
  ref,
  size,
  variant,
  ...props
}: NavItemProps) => {
  const computedVariant =
    variant ?? (isActive ? "active" : isNested ? "nested" : "default");

  const linkContent = (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        navItemVariants({ className, size, variant: computedVariant }),
        isCollapsed && "justify-center px-0"
      )}
      href={href}
      ref={ref}
      {...props}
    >
      {/* Icon */}
      {Icon && (
        <Icon
          aria-hidden={"true"}
          className={cn(
            "size-4 shrink-0",
            isActive && "text-accent-foreground"
          )}
        />
      )}

      {/* Label */}
      {!isCollapsed && <span className={"truncate"}>{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} side={"right"}>
        {linkContent}
      </Tooltip>
    );
  }

  return linkContent;
};
