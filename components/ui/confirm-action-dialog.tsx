'use client';

import type { VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ConfirmActionDialogAlert {
  /** Optional override for the alert container styles */
  containerClassName?: string;
  /** Alert content */
  description: ReactNode;
  /** Optional override for the alert text styles */
  textClassName?: string;
  /** Alert tone (destructive = red, warning = amber) */
  tone?: ConfirmActionDialogAlertTone;
}

type ConfirmActionDialogAlertTone = 'destructive' | 'warning';

interface ConfirmActionDialogProps {
  /** Additional warning/notice blocks displayed below the description */
  alerts?: Array<ConfirmActionDialogAlert>;
  /** Cancel button label (defaults to "Cancel") */
  cancelLabel?: string;
  /** Confirm button aria-describedby id (defaults to descriptionId) */
  confirmAriaDescribedById?: string;
  /** Confirm button aria-label */
  confirmAriaLabel?: string;
  /** Confirm button label */
  confirmLabel: string;
  /** Confirm button variant */
  confirmVariant?: VariantProps<typeof buttonVariants>['variant'];
  /** Description content */
  description: ReactNode;
  /** Description element id */
  descriptionId?: string;
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Confirm button loading label */
  loadingLabel?: string;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** Dialog role (defaults to "alertdialog") */
  role?: ConfirmActionDialogRole;
  /** Dialog popup size */
  size?: ComponentPropsWithRef<typeof DialogPopup>['size'];
  /** Title text */
  title: string;
  /** Title element id */
  titleId?: string;
}

type ConfirmActionDialogRole = 'alertdialog' | 'dialog';

const ALERT_TONE_STYLES: Record<ConfirmActionDialogAlertTone, { container: string; text: string }> = {
  destructive: {
    container: 'mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3',
    text: 'text-sm text-destructive',
  },
  warning: {
    container: 'mt-4 rounded-md border border-warning-border bg-warning-bg p-3',
    text: 'text-sm text-warning-text',
  },
};

export const ConfirmActionDialog = ({
  alerts = [],
  cancelLabel = 'Cancel',
  confirmAriaDescribedById,
  confirmAriaLabel,
  confirmLabel,
  confirmVariant = 'destructive',
  description,
  descriptionId,
  isLoading = false,
  isOpen,
  loadingLabel,
  onConfirm,
  onOpenChange,
  role = 'alertdialog',
  size,
  title,
  titleId,
}: ConfirmActionDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  const confirmButtonLabel = confirmAriaLabel ?? confirmLabel;
  const confirmButtonDescribedById = confirmAriaDescribedById ?? descriptionId;
  const confirmButtonText = isLoading ? (loadingLabel ?? confirmLabel) : confirmLabel;

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={role} size={size}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle id={titleId}>{title}</DialogTitle>
            <DialogDescription id={descriptionId}>{description}</DialogDescription>
          </DialogHeader>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div>
              {alerts.map((alert, index) => {
                const tone = alert.tone ?? 'destructive';
                const toneStyles = ALERT_TONE_STYLES[tone];
                return (
                  <div
                    aria-live={'polite'}
                    className={cn(toneStyles.container, alert.containerClassName)}
                    key={`${tone}-${index}`}
                    role={'alert'}
                  >
                    <p className={cn(toneStyles.text, alert.textClassName)}>{alert.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <DialogFooter sticky={false}>
            <DialogClose>
              <Button disabled={isLoading} variant={'outline'}>
                {cancelLabel}
              </Button>
            </DialogClose>
            <Button
              aria-describedby={confirmButtonDescribedById}
              aria-label={confirmButtonLabel}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={confirmVariant}
            >
              {confirmButtonText}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
