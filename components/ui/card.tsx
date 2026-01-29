"use client";

import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/utils";

type CardProps = ComponentPropsWithRef<"div">;

export const Card = ({ className, ref, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-card-border bg-card shadow-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

type CardHeaderProps = ComponentPropsWithRef<"h3">;

export const CardHeader = ({ className, ref, ...props }: CardHeaderProps) => {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      ref={ref}
      {...props}
    />
  );
};

type CardTitleProps = ComponentPropsWithRef<"h3">;

export const CardTitle = ({ className, ref, ...props }: CardTitleProps) => {
  return (
    <h3
      className={cn(
        "text-lg leading-none font-semibold tracking-tight",
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

type CardDescriptionProps = ComponentPropsWithRef<"p">;

export const CardDescription = ({
  className,
  ref,
  ...props
}: CardDescriptionProps) => {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      ref={ref}
      {...props}
    />
  );
};

type CardContentProps = CardProps;

export const CardContent = ({ className, ref, ...props }: CardContentProps) => {
  return <div className={cn("p-6 pt-0", className)} ref={ref} {...props} />;
};

type CardFooterProps = CardProps;

export const CardFooter = ({ className, ref, ...props }: CardFooterProps) => {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      ref={ref}
      {...props}
    />
  );
};
