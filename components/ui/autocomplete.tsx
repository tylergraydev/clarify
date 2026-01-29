"use client";

import type { ComponentPropsWithRef } from "react";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/* Root */
export const AutocompleteRoot = BaseAutocomplete.Root;

/* Input */
export const autocompleteInputVariants = cva(
  `
    w-full rounded-md border border-border bg-transparent text-foreground
    placeholder:text-muted-foreground
    focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:outline-none
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-invalid:border-destructive
    data-invalid:focus:ring-destructive
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "h-9 px-3 text-sm",
        lg: "h-10 px-4 text-base",
        sm: "h-8 px-2 text-xs",
      },
    },
  }
);

type AutocompleteInputProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Input
> &
  VariantProps<typeof autocompleteInputVariants> & {
    isInvalid?: boolean;
  };

export const AutocompleteInput = ({
  className,
  isInvalid,
  ref,
  size,
  ...props
}: AutocompleteInputProps) => {
  return (
    <BaseAutocomplete.Input
      className={cn(autocompleteInputVariants({ size }), className)}
      data-invalid={isInvalid || undefined}
      ref={ref}
      {...props}
    />
  );
};

/* Trigger */
type AutocompleteTriggerProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Trigger
>;

export const AutocompleteTrigger = ({
  className,
  ref,
  ...props
}: AutocompleteTriggerProps) => {
  return (
    <BaseAutocomplete.Trigger
      className={cn(
        "flex items-center justify-center rounded-sm bg-transparent p-0",
        `
          text-muted-foreground
          hover:text-foreground
        `,
        `
          focus-visible:ring-2 focus-visible:ring-accent
          focus-visible:ring-offset-0 focus-visible:outline-none
        `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

/* Clear */
type AutocompleteClearProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Clear
>;

export const AutocompleteClear = ({
  children,
  className,
  ref,
  ...props
}: AutocompleteClearProps) => {
  return (
    <BaseAutocomplete.Clear
      className={cn(
        "flex items-center justify-center rounded-sm bg-transparent p-0",
        `
          text-muted-foreground
          hover:text-foreground
        `,
        `
          focus-visible:ring-2 focus-visible:ring-accent
          focus-visible:ring-offset-0 focus-visible:outline-none
        `,
        className
      )}
      ref={ref}
      {...props}
    >
      {children ?? <X aria-hidden={"true"} className={"size-4"} />}
    </BaseAutocomplete.Clear>
  );
};

/* Portal */
export const AutocompletePortal = BaseAutocomplete.Portal;

/* Positioner */
type AutocompletePositionerProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Positioner
>;

export const AutocompletePositioner = ({
  className,
  ref,
  ...props
}: AutocompletePositionerProps) => {
  return (
    <BaseAutocomplete.Positioner
      className={cn("z-50 outline-none", className)}
      ref={ref}
      sideOffset={4}
      {...props}
    />
  );
};

/* Popup */
export const autocompletePopupVariants = cva(
  `
    max-w-(--available-width) min-w-(--anchor-width) rounded-md border
    border-border bg-card p-1 shadow-md transition-all duration-150 outline-none
    data-ending-style:scale-95 data-ending-style:opacity-0
    data-starting-style:scale-95 data-starting-style:opacity-0
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "text-sm",
        lg: "text-base",
        sm: "text-xs",
      },
    },
  }
);

type AutocompletePopupProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Popup
> &
  VariantProps<typeof autocompletePopupVariants>;

export const AutocompletePopup = ({
  className,
  ref,
  size,
  ...props
}: AutocompletePopupProps) => {
  return (
    <BaseAutocomplete.Popup
      className={cn(autocompletePopupVariants({ size }), className)}
      ref={ref}
      {...props}
    />
  );
};

/* List */
type AutocompleteListProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.List
>;

export const AutocompleteList = ({
  className,
  ref,
  ...props
}: AutocompleteListProps) => {
  return (
    <BaseAutocomplete.List
      className={cn(
        `
          max-h-[min(23rem,var(--available-height))] overflow-y-auto
          overscroll-contain py-1 outline-none
        `,
        `
          scroll-py-1
          data-empty:p-0
        `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

/* Item */
export const autocompleteItemVariants = cva(
  `
    relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5
    text-foreground outline-none select-none
    data-disabled:pointer-events-none data-disabled:opacity-50
    data-highlighted:bg-muted
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "text-sm",
        lg: "text-base",
        sm: "text-xs",
      },
    },
  }
);

type AutocompleteItemProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Item
> &
  VariantProps<typeof autocompleteItemVariants>;

export const AutocompleteItem = ({
  className,
  ref,
  size,
  ...props
}: AutocompleteItemProps) => {
  return (
    <BaseAutocomplete.Item
      className={cn(autocompleteItemVariants({ size }), className)}
      ref={ref}
      {...props}
    />
  );
};

/* Empty */
type AutocompleteEmptyProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Empty
>;

export const AutocompleteEmpty = ({
  className,
  ref,
  ...props
}: AutocompleteEmptyProps) => {
  return (
    <BaseAutocomplete.Empty
      className={cn(
        `
        p-4 text-sm text-muted-foreground
        empty:m-0 empty:p-0
      `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

/* Status */
type AutocompleteStatusProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Status
>;

export const AutocompleteStatus = ({
  className,
  ref,
  ...props
}: AutocompleteStatusProps) => {
  return (
    <BaseAutocomplete.Status
      className={cn(
        `
        flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground
      `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

/* Group */
export const AutocompleteGroup = BaseAutocomplete.Group;

/* Group Label */
export const autocompleteGroupLabelVariants = cva(
  `px-2 py-1.5 font-semibold text-muted-foreground select-none`,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "text-xs",
        lg: "text-sm",
        sm: "text-xs",
      },
    },
  }
);

type AutocompleteGroupLabelProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.GroupLabel
> &
  VariantProps<typeof autocompleteGroupLabelVariants>;

export const AutocompleteGroupLabel = ({
  className,
  ref,
  size,
  ...props
}: AutocompleteGroupLabelProps) => {
  return (
    <BaseAutocomplete.GroupLabel
      className={cn(autocompleteGroupLabelVariants({ size }), className)}
      ref={ref}
      {...props}
    />
  );
};

/* Separator */
type AutocompleteSeparatorProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Separator
>;

export const AutocompleteSeparator = ({
  className,
  ref,
  ...props
}: AutocompleteSeparatorProps) => {
  return (
    <BaseAutocomplete.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      ref={ref}
      {...props}
    />
  );
};

/* Arrow */
type AutocompleteArrowProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Arrow
>;

export const AutocompleteArrow = ({
  className,
  ref,
  ...props
}: AutocompleteArrowProps) => {
  return (
    <BaseAutocomplete.Arrow
      className={cn(
        `
    fill-card stroke-border stroke-1
  `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

/* Backdrop */
type AutocompleteBackdropProps = ComponentPropsWithRef<
  typeof BaseAutocomplete.Backdrop
>;

export const AutocompleteBackdrop = ({
  className,
  ref,
  ...props
}: AutocompleteBackdropProps) => {
  return (
    <BaseAutocomplete.Backdrop
      className={cn("fixed inset-0", className)}
      ref={ref}
      {...props}
    />
  );
};

/* Value */
export const AutocompleteValue = BaseAutocomplete.Value;

/* Icon */
export const AutocompleteIcon = BaseAutocomplete.Icon;

/* Collection */
export const AutocompleteCollection = BaseAutocomplete.Collection;

/* Row */
export const AutocompleteRow = BaseAutocomplete.Row;

/* useFilter hook re-export */
export const useAutocompleteFilter = BaseAutocomplete.useFilter;
