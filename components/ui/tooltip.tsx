'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

import { cn } from '@/lib/utils';

export const TooltipProvider = BaseTooltip.Provider;
export const TooltipRoot = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;
export const TooltipPortal = BaseTooltip.Portal;
export const TooltipPositioner = BaseTooltip.Positioner;
export const TooltipArrow = BaseTooltip.Arrow;

type TooltipPopupProps = ComponentPropsWithRef<typeof BaseTooltip.Popup>;

export const TooltipPopup = ({ className, ref, ...props }: TooltipPopupProps) => {
  return (
    <BaseTooltip.Popup
      className={cn(
        `
          z-50 max-w-xs animate-in rounded-md bg-foreground px-2.5 py-1.5 text-sm
          text-background shadow-md fade-in-0 zoom-in-95
          data-[side=bottom]:slide-in-from-top-2
          data-[side=left]:slide-in-from-right-2
          data-[side=right]:slide-in-from-left-2
          data-[side=top]:slide-in-from-bottom-2
        `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  fullWidth?: boolean;
  side?: 'bottom' | 'left' | 'right' | 'top';
}

export const Tooltip = ({ children, content, fullWidth = false, side = 'top' }: TooltipProps) => {
  return (
    <TooltipRoot>
      <TooltipTrigger render={<span className={cn('inline-flex', fullWidth && 'w-full')} />}>{children}</TooltipTrigger>
      <TooltipPortal>
        <TooltipPositioner side={side} sideOffset={6}>
          <TooltipPopup>{content}</TooltipPopup>
        </TooltipPositioner>
      </TooltipPortal>
    </TooltipRoot>
  );
};
