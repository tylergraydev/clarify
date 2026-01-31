'use client';

import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cloneElement } from 'react';

import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

export const DialogRoot = BaseDialog.Root;
export const DialogPortal = BaseDialog.Portal;

type DialogTriggerProps = RequiredChildren;

export const DialogTrigger = ({ children }: DialogTriggerProps) => {
  return <BaseDialog.Trigger render={(props) => cloneElement(children as ReactElement<object>, props)} />;
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
    return <BaseDialog.Close render={(props) => cloneElement(render, props)}>{children}</BaseDialog.Close>;
  }
  // Otherwise, clone children with dialog props (avoids nested buttons)
  return <BaseDialog.Close render={(props) => cloneElement(children as ReactElement<object>, props)} />;
};

export const dialogBackdropVariants = cva(
  `
    fixed inset-0 z-50 bg-black/50 transition-opacity duration-200
    data-ending-style:opacity-0
    data-starting-style:opacity-0
  `,
  {
    defaultVariants: {
      blur: 'default',
    },
    variants: {
      blur: {
        default: 'backdrop-blur-sm',
        none: '',
        strong: 'backdrop-blur-md',
      },
    },
  }
);

type DialogBackdropProps = ComponentPropsWithRef<typeof BaseDialog.Backdrop> &
  VariantProps<typeof dialogBackdropVariants>;

export const DialogBackdrop = ({ blur, className, ref, ...props }: DialogBackdropProps) => {
  return <BaseDialog.Backdrop className={cn(dialogBackdropVariants({ blur }), className)} ref={ref} {...props} />;
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
      scrollable: false,
      size: 'default',
    },
    variants: {
      scrollable: {
        false: '',
        true: 'flex max-h-[90vh] flex-col',
      },
      size: {
        '2xl': 'w-full max-w-3xl p-6',
        default: 'w-full max-w-md p-6',
        lg: 'w-full max-w-lg p-8',
        sm: 'w-full max-w-sm p-4',
        xl: 'w-full max-w-2xl p-6',
      },
    },
  }
);

type DialogPopupProps = ComponentPropsWithRef<typeof BaseDialog.Popup> & VariantProps<typeof dialogPopupVariants>;

export const DialogPopup = ({ className, ref, scrollable, size, ...props }: DialogPopupProps) => {
  return <BaseDialog.Popup className={cn(dialogPopupVariants({ scrollable, size }), className)} ref={ref} {...props} />;
};

type DialogTitleProps = ComponentPropsWithRef<typeof BaseDialog.Title>;

export const DialogTitle = ({ className, ref, ...props }: DialogTitleProps) => {
  return <BaseDialog.Title className={cn('text-lg font-semibold text-foreground', className)} ref={ref} {...props} />;
};

type DialogDescriptionProps = ComponentPropsWithRef<typeof BaseDialog.Description>;

export const DialogDescription = ({ className, ref, ...props }: DialogDescriptionProps) => {
  return (
    <BaseDialog.Description className={cn('mt-2 text-sm text-muted-foreground', className)} ref={ref} {...props} />
  );
};

// --- New Dialog Components ---

interface DialogCloseButtonProps {
  /** Optional custom aria-label */
  'aria-label'?: string;
  /** Optional className for styling */
  className?: string;
  /** Whether the close button is disabled */
  disabled?: boolean;
}

/**
 * An X close button for dialogs.
 * Uses BaseDialog.Close to automatically handle dialog closing.
 */
export const DialogCloseButton = ({
  'aria-label': ariaLabel = 'Close dialog',
  className,
  disabled,
}: DialogCloseButtonProps) => {
  return (
    <BaseDialog.Close
      render={(props) => (
        <IconButton {...props} aria-label={ariaLabel} className={cn('shrink-0', className)} disabled={disabled}>
          <X aria-hidden={'true'} className={'size-4'} />
        </IconButton>
      )}
    />
  );
};

interface DialogHeaderProps {
  /** Optional badges to display alongside the close button */
  badges?: ReactNode;
  /** Content (typically DialogTitle and DialogDescription) */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Custom aria-label for close button */
  closeButtonAriaLabel?: string;
  /** Whether to show the close button (default: true) */
  showCloseButton?: boolean;
}

/**
 * Dialog header with title area, optional badges, and close button.
 * Use DialogTitle and DialogDescription as children.
 */
export const DialogHeader = ({
  badges,
  children,
  className,
  closeButtonAriaLabel,
  showCloseButton = true,
}: DialogHeaderProps) => {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className={'min-w-0 flex-1'}>{children}</div>
      {(badges || showCloseButton) && (
        <div className={'flex shrink-0 items-center gap-2'}>
          {badges}
          {showCloseButton && <DialogCloseButton aria-label={closeButtonAriaLabel} />}
        </div>
      )}
    </div>
  );
};

interface DialogBodyProps {
  /** Content */
  children: ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Scrollable content area for dialogs.
 * Use with DialogPopup scrollable={true} for sticky footer behavior.
 */
export const DialogBody = ({ children, className }: DialogBodyProps) => {
  return <div className={cn('flex-1 overflow-y-auto py-4', className)}>{children}</div>;
};

export const dialogFooterVariants = cva('flex gap-3 bg-background pt-4', {
  defaultVariants: {
    alignment: 'end',
    sticky: true,
  },
  variants: {
    alignment: {
      between: 'justify-between',
      center: 'justify-center',
      end: 'justify-end',
      start: 'justify-start',
    },
    sticky: {
      false: 'mt-6',
      true: '-mx-6 -mb-6 border-t border-border px-6 pb-6',
    },
  },
});

type DialogFooterProps = ComponentPropsWithRef<'div'> & VariantProps<typeof dialogFooterVariants>;

/**
 * Dialog footer for action buttons.
 * Use sticky={true} (default) with DialogPopup scrollable={true} for sticky footer.
 * Use sticky={false} for non-scrollable dialogs (confirmation dialogs).
 */
export const DialogFooter = ({ alignment, className, ref, sticky, ...props }: DialogFooterProps) => {
  return (
    <div
      aria-label={'Dialog actions'}
      className={cn(dialogFooterVariants({ alignment, sticky }), className)}
      ref={ref}
      role={'group'}
      {...props}
    />
  );
};
