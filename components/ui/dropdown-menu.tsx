'use client';

import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

import { Menu as BaseMenu } from '@base-ui/react/menu';
import { cva, type VariantProps } from 'class-variance-authority';
import { cloneElement } from 'react';

import { cn } from '@/lib/utils';

/* Root */
export const DropdownMenuRoot = BaseMenu.Root;

/* Portal */
export const DropdownMenuPortal = BaseMenu.Portal;

/* Trigger */
type DropdownMenuTriggerProps = RequiredChildren;

export const DropdownMenuTrigger = ({ children }: DropdownMenuTriggerProps) => {
  return <BaseMenu.Trigger render={(props) => cloneElement(children as ReactElement<object>, props)} />;
};

/* Positioner */
type DropdownMenuPositionerProps = ComponentPropsWithRef<typeof BaseMenu.Positioner>;

export const DropdownMenuPositioner = ({ className, ref, ...props }: DropdownMenuPositionerProps) => {
  return <BaseMenu.Positioner className={cn('z-100 outline-none', className)} ref={ref} sideOffset={4} {...props} />;
};

/* Popup */
export const dropdownMenuPopupVariants = cva(
  `
    min-w-32 rounded-md border border-border bg-card p-1 shadow-md
    transition-opacity duration-150 outline-none
    data-ending-style:opacity-0
    data-starting-style:opacity-0
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'text-sm',
        sm: 'text-xs',
      },
    },
  }
);

type DropdownMenuPopupProps = ComponentPropsWithRef<typeof BaseMenu.Popup> &
  VariantProps<typeof dropdownMenuPopupVariants>;

export const DropdownMenuPopup = ({ className, ref, size, ...props }: DropdownMenuPopupProps) => {
  return <BaseMenu.Popup className={cn(dropdownMenuPopupVariants({ size }), className)} ref={ref} {...props} />;
};

/* Item */
export const dropdownMenuItemVariants = cva(
  `
    relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5
    text-foreground outline-none select-none
    data-disabled:pointer-events-none data-disabled:opacity-50
    data-highlighted:bg-muted
  `,
  {
    defaultVariants: {
      inset: false,
      size: 'default',
      variant: 'default',
    },
    variants: {
      inset: {
        false: '',
        true: 'pl-8',
      },
      size: {
        default: 'text-sm',
        sm: 'text-xs',
      },
      variant: {
        default: '',
        destructive: 'text-destructive data-highlighted:bg-destructive/10',
      },
    },
  }
);

type DropdownMenuItemProps = ComponentPropsWithRef<typeof BaseMenu.Item> &
  VariantProps<typeof dropdownMenuItemVariants>;

export const DropdownMenuItem = ({ className, inset, ref, size, variant, ...props }: DropdownMenuItemProps) => {
  return (
    <BaseMenu.Item className={cn(dropdownMenuItemVariants({ inset, size, variant }), className)} ref={ref} {...props} />
  );
};

/* Separator */
type DropdownMenuSeparatorProps = ComponentPropsWithRef<'div'>;

export const DropdownMenuSeparator = ({ className, ref, ...props }: DropdownMenuSeparatorProps) => {
  return (
    <div
      aria-orientation={'horizontal'}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      ref={ref}
      role={'separator'}
      {...props}
    />
  );
};

/* Group */
type DropdownMenuGroupProps = ComponentPropsWithRef<typeof BaseMenu.Group>;

export const DropdownMenuGroup = ({ className, ref, ...props }: DropdownMenuGroupProps) => {
  return <BaseMenu.Group className={cn(className)} ref={ref} {...props} />;
};

/* Group Label */
export const dropdownMenuGroupLabelVariants = cva(`px-2 py-1.5 font-semibold text-muted-foreground select-none`, {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'text-xs',
      sm: 'text-xs',
    },
  },
});

type DropdownMenuGroupLabelProps = ComponentPropsWithRef<typeof BaseMenu.GroupLabel> &
  VariantProps<typeof dropdownMenuGroupLabelVariants>;

export const DropdownMenuGroupLabel = ({ className, ref, size, ...props }: DropdownMenuGroupLabelProps) => {
  return (
    <BaseMenu.GroupLabel className={cn(dropdownMenuGroupLabelVariants({ size }), className)} ref={ref} {...props} />
  );
};

/* Item Icon */
interface DropdownMenuItemIconProps {
  /** The icon element to render */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

export const DropdownMenuItemIcon = ({ children, className }: DropdownMenuItemIconProps) => {
  return <span className={cn('size-4 shrink-0 text-muted-foreground', className)}>{children}</span>;
};

/* Shortcut */
interface DropdownMenuShortcutProps {
  /** The shortcut text to display */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

export const DropdownMenuShortcut = ({ children, className }: DropdownMenuShortcutProps) => {
  return <span className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}>{children}</span>;
};

/* Checkbox Item */
export const DropdownMenuCheckboxItem = BaseMenu.CheckboxItem;
export const DropdownMenuCheckboxItemIndicator = BaseMenu.CheckboxItemIndicator;

/* Radio Group */
export const DropdownMenuRadioGroup = BaseMenu.RadioGroup;
export const DropdownMenuRadioItem = BaseMenu.RadioItem;
export const DropdownMenuRadioItemIndicator = BaseMenu.RadioItemIndicator;
