'use client';

import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

import { Popover as BasePopover } from '@base-ui/react/popover';
import { cva, type VariantProps } from 'class-variance-authority';
import { cloneElement } from 'react';

import { cn } from '@/lib/utils';

// ============================================================================
// Root
// ============================================================================

export const PopoverRoot = BasePopover.Root;

// ============================================================================
// Trigger
// ============================================================================

interface PopoverTriggerProps extends RequiredChildren {
  /**
   * How long to wait before closing the popover that was opened on hover.
   * Specified in milliseconds.
   * @default 0
   */
  closeDelay?: number;
  /**
   * How long to wait before the popover may be opened on hover. Specified in milliseconds.
   * @default 300
   */
  delay?: number;
  /**
   * Whether the popover should also open when the trigger is hovered.
   * @default false
   */
  openOnHover?: boolean;
}

export const PopoverTrigger = ({ children, closeDelay, delay, openOnHover }: PopoverTriggerProps) => {
  return (
    <BasePopover.Trigger
      closeDelay={closeDelay}
      delay={delay}
      openOnHover={openOnHover}
      render={(props) => cloneElement(children as ReactElement<object>, props)}
    />
  );
};

// ============================================================================
// Portal
// ============================================================================

export const PopoverPortal = BasePopover.Portal;

// ============================================================================
// Positioner
// ============================================================================

type PopoverPositionerProps = ComponentPropsWithRef<typeof BasePopover.Positioner>;

export const PopoverPositioner = ({ className, ref, ...props }: PopoverPositionerProps) => {
  return <BasePopover.Positioner className={cn('z-100 outline-none', className)} ref={ref} sideOffset={4} {...props} />;
};

// ============================================================================
// Popup
// ============================================================================

export const popoverPopupVariants = cva(
  `
    rounded-lg border border-border bg-card shadow-lg
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

type PopoverPopupProps = ComponentPropsWithRef<typeof BasePopover.Popup> & VariantProps<typeof popoverPopupVariants>;

export const PopoverPopup = ({ className, ref, size, ...props }: PopoverPopupProps) => {
  return <BasePopover.Popup className={cn(popoverPopupVariants({ size }), className)} ref={ref} {...props} />;
};

// ============================================================================
// Title
// ============================================================================

type PopoverTitleProps = ComponentPropsWithRef<typeof BasePopover.Title>;

export const PopoverTitle = ({ className, ref, ...props }: PopoverTitleProps) => {
  return <BasePopover.Title className={cn('text-sm font-medium', className)} ref={ref} {...props} />;
};

// ============================================================================
// Description
// ============================================================================

type PopoverDescriptionProps = ComponentPropsWithRef<typeof BasePopover.Description>;

export const PopoverDescription = ({ className, ref, ...props }: PopoverDescriptionProps) => {
  return <BasePopover.Description className={cn('text-sm text-muted-foreground', className)} ref={ref} {...props} />;
};

// ============================================================================
// Close
// ============================================================================

type PopoverCloseProps = RequiredChildren;

export const PopoverClose = ({ children }: PopoverCloseProps) => {
  return <BasePopover.Close render={(props) => cloneElement(children as ReactElement<object>, props)} />;
};

// ============================================================================
// Header (convenience wrapper)
// ============================================================================

interface PopoverHeaderProps {
  /** Child elements */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

export const PopoverHeader = ({ children, className }: PopoverHeaderProps) => {
  return (
    <div className={cn('flex items-center justify-between border-b border-border px-4 py-3', className)}>
      {children}
    </div>
  );
};

// ============================================================================
// Content (convenience wrapper)
// ============================================================================

interface PopoverContentProps {
  /** Child elements */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

export const PopoverContent = ({ children, className }: PopoverContentProps) => {
  return <div className={cn('p-4', className)}>{children}</div>;
};

// ============================================================================
// Footer (convenience wrapper)
// ============================================================================

interface PopoverFooterProps {
  /** Child elements */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

export const PopoverFooter = ({ children, className }: PopoverFooterProps) => {
  return <div className={cn('border-t border-border px-4 py-3', className)}>{children}</div>;
};
