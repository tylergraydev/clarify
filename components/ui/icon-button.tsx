"use client";

import type { ComponentPropsWithRef } from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";

const iconButtonStyles = `
  inline-flex size-9 items-center justify-center rounded-md
  text-muted-foreground transition-colors
  hover:bg-muted hover:text-foreground
  focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
  focus-visible:outline-none
  disabled:pointer-events-none disabled:opacity-50
`;

type IconButtonProps = ComponentPropsWithRef<"button">;

export const IconButton = ({ className, ref, ...props }: IconButtonProps) => {
  return (
    <button className={cn(iconButtonStyles, className)} ref={ref} {...props} />
  );
};

type IconButtonLinkProps = ComponentPropsWithRef<typeof Link>;

export const IconButtonLink = ({
  className,
  ref,
  ...props
}: IconButtonLinkProps) => {
  return (
    <Link className={cn(iconButtonStyles, className)} ref={ref} {...props} />
  );
};
