"use client";

import type { ComponentPropsWithRef } from "react";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle, Info, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";

export const ToastProvider = BaseToast.Provider;
export const ToastViewport = BaseToast.Viewport;
export const ToastPortal = BaseToast.Portal;
export const ToastRoot = BaseToast.Root;
export const ToastContent = BaseToast.Content;
export const ToastAction = BaseToast.Action;

export const toastRootVariants = cva(
  `
    pointer-events-auto relative flex w-80 flex-col gap-1 rounded-lg border
    bg-background p-4 shadow-lg transition-all duration-300
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
    data-ending-style:translate-x-full data-ending-style:opacity-0
    data-starting-style:translate-x-full data-starting-style:opacity-0
    data-swipe-direction-left:data-ending-style:-translate-x-full
    data-swipe-direction-right:data-ending-style:translate-x-full
  `,
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "border-border",
        error: "border-destructive/50",
        info: "border-accent/50",
        loading: "border-border",
        success: "border-green-500/50",
        warning: "border-amber-500/50",
      },
    },
  }
);

type ToastRootStyledProps = ComponentPropsWithRef<typeof BaseToast.Root> &
  VariantProps<typeof toastRootVariants>;

export const ToastRootStyled = ({
  className,
  ref,
  variant,
  ...props
}: ToastRootStyledProps) => {
  return (
    <BaseToast.Root
      className={cn(toastRootVariants({ className, variant }))}
      ref={ref}
      {...props}
    />
  );
};

type ToastTitleProps = ComponentPropsWithRef<typeof BaseToast.Title>;

export const ToastTitle = ({ className, ref, ...props }: ToastTitleProps) => {
  return (
    <BaseToast.Title
      className={cn("text-sm font-medium text-foreground", className)}
      ref={ref}
      {...props}
    />
  );
};

type ToastDescriptionProps = ComponentPropsWithRef<
  typeof BaseToast.Description
>;

export const ToastDescription = ({
  className,
  ref,
  ...props
}: ToastDescriptionProps) => {
  return (
    <BaseToast.Description
      className={cn("text-sm text-muted-foreground", className)}
      ref={ref}
      {...props}
    />
  );
};

type ToastCloseProps = ComponentPropsWithRef<typeof BaseToast.Close>;

export const ToastClose = ({ className, ref, ...props }: ToastCloseProps) => {
  return (
    <BaseToast.Close
      className={cn(
        `
          absolute top-2 right-2 rounded-sm p-1 text-muted-foreground opacity-70
          transition-opacity
          hover:opacity-100
          focus-visible:ring-2 focus-visible:ring-accent
          focus-visible:ring-offset-0 focus-visible:outline-none
        `,
        className
      )}
      ref={ref}
      {...props}
    >
      <X className={"size-4"} />
    </BaseToast.Close>
  );
};

/** Toast type to variant icon mapping */
export type ToastType =
  | "default"
  | "error"
  | "info"
  | "loading"
  | "success"
  | "warning";

interface ToastIconProps extends ComponentPropsWithRef<"span"> {
  type: ToastType;
}

export const ToastIcon = ({
  className,
  ref,
  type,
  ...props
}: ToastIconProps) => {
  const iconClasses = cn("size-4 shrink-0", className);

  switch (type) {
    case "error":
      return (
        <span ref={ref} {...props}>
          <AlertCircle className={cn(iconClasses, "text-destructive")} />
        </span>
      );
    case "info":
      return (
        <span ref={ref} {...props}>
          <Info className={cn(iconClasses, "text-accent")} />
        </span>
      );
    case "loading":
      return (
        <span ref={ref} {...props}>
          <Loader2
            className={cn(
              iconClasses,
              `
            animate-spin text-muted-foreground
          `
            )}
          />
        </span>
      );
    case "success":
      return (
        <span ref={ref} {...props}>
          <CheckCircle
            className={cn(
              iconClasses,
              `
            text-green-600
            dark:text-green-400
          `
            )}
          />
        </span>
      );
    case "warning":
      return (
        <span ref={ref} {...props}>
          <AlertCircle
            className={cn(
              iconClasses,
              `
            text-amber-600
            dark:text-amber-400
          `
            )}
          />
        </span>
      );
    default:
      return null;
  }
};
