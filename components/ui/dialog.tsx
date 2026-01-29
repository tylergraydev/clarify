"use client";

import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cloneElement } from "react";

import { cn } from "@/lib/utils";

export const DialogRoot = BaseDialog.Root;
export const DialogPortal = BaseDialog.Portal;

type DialogTriggerProps = RequiredChildren;

export const DialogTrigger = ({ children }: DialogTriggerProps) => {
  return (
    <BaseDialog.Trigger
      render={(props) => cloneElement(children as ReactElement<object>, props)}
    />
  );
};

interface DialogCloseProps {
  /** The element to render as the close button */
  children: ReactNode;
  /** Optional render prop for custom element (children will be passed to it) */
  render?: ReactElement<object>;
}

export const DialogClose = ({ children, render }: DialogCloseProps) => {
  // If render prop is provided, use it and pass children to the rendered element
  if (render) {
    return (
      <BaseDialog.Close render={(props) => cloneElement(render, props)}>
        {children}
      </BaseDialog.Close>
    );
  }
  // Otherwise, clone children with dialog props (avoids nested buttons)
  return (
    <BaseDialog.Close
      render={(props) => cloneElement(children as ReactElement<object>, props)}
    />
  );
};

export const dialogBackdropVariants = cva(
  `
    fixed inset-0 z-50 bg-black/50 transition-opacity duration-200
    data-ending-style:opacity-0
    data-starting-style:opacity-0
  `,
  {
    defaultVariants: {
      blur: "default",
    },
    variants: {
      blur: {
        default: "backdrop-blur-sm",
        none: "",
        strong: "backdrop-blur-md",
      },
    },
  }
);

type DialogBackdropProps = ComponentPropsWithRef<typeof BaseDialog.Backdrop> &
  VariantProps<typeof dialogBackdropVariants>;

export const DialogBackdrop = ({
  blur,
  className,
  ref,
  ...props
}: DialogBackdropProps) => {
  return (
    <BaseDialog.Backdrop
      className={cn(dialogBackdropVariants({ blur }), className)}
      ref={ref}
      {...props}
    />
  );
};

export const dialogPopupVariants = cva(
  `
    fixed top-1/2 left-1/2 z-50 -translate-1/2 rounded-lg border border-border
    bg-background shadow-lg transition-all duration-200 outline-none
    data-ending-style:scale-95 data-ending-style:opacity-0
    data-starting-style:scale-95 data-starting-style:opacity-0
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "w-full max-w-md p-6",
        lg: "w-full max-w-lg p-8",
        sm: "w-full max-w-sm p-4",
      },
    },
  }
);

type DialogPopupProps = ComponentPropsWithRef<typeof BaseDialog.Popup> &
  VariantProps<typeof dialogPopupVariants>;

export const DialogPopup = ({
  className,
  ref,
  size,
  ...props
}: DialogPopupProps) => {
  return (
    <BaseDialog.Popup
      className={cn(dialogPopupVariants({ size }), className)}
      ref={ref}
      {...props}
    />
  );
};

type DialogTitleProps = ComponentPropsWithRef<typeof BaseDialog.Title>;

export const DialogTitle = ({ className, ref, ...props }: DialogTitleProps) => {
  return (
    <BaseDialog.Title
      className={cn("text-lg font-semibold text-foreground", className)}
      ref={ref}
      {...props}
    />
  );
};

type DialogDescriptionProps = ComponentPropsWithRef<
  typeof BaseDialog.Description
>;

export const DialogDescription = ({
  className,
  ref,
  ...props
}: DialogDescriptionProps) => {
  return (
    <BaseDialog.Description
      className={cn("mt-2 text-sm text-muted-foreground", className)}
      ref={ref}
      {...props}
    />
  );
};
