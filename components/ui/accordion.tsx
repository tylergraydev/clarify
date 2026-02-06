'use client';

import type { ComponentPropsWithRef } from 'react';

import { Accordion } from '@base-ui/react/accordion';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

// ============================================================================
// Root
// ============================================================================

export const AccordionRoot = Accordion.Root;

// ============================================================================
// Item
// ============================================================================

export const accordionItemVariants = cva(`border-b border-border`, {
  defaultVariants: {
    status: 'default',
  },
  variants: {
    status: {
      completed: 'border-l-2 border-l-green-500',
      default: '',
      paused: 'border-l-2 border-l-orange-500',
      pending: '',
      running: 'border-l-2 border-l-blue-500',
      skipped: 'border-l-2 border-l-yellow-500',
    },
  },
});

type AccordionItemProps = ComponentPropsWithRef<typeof Accordion.Item> & VariantProps<typeof accordionItemVariants>;

export const AccordionItem = ({ className, ref, status, ...props }: AccordionItemProps) => {
  return <Accordion.Item className={cn(accordionItemVariants({ className, status }))} ref={ref} {...props} />;
};

// ============================================================================
// Header
// ============================================================================

type AccordionHeaderProps = ComponentPropsWithRef<typeof Accordion.Header>;

export const AccordionHeader = ({ className, ref, ...props }: AccordionHeaderProps) => {
  return <Accordion.Header className={cn('m-0', className)} ref={ref} {...props} />;
};

// ============================================================================
// Trigger
// ============================================================================

export const accordionTriggerVariants = cva(
  `
    group flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm
    font-medium transition-colors
    hover:bg-muted focus-visible:ring-2 focus-visible:ring-accent
    focus-visible:ring-offset-0
    focus-visible:outline-none
    data-disabled:pointer-events-none data-disabled:opacity-50
  `,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: '',
        ghost: 'hover:text-foreground',
      },
    },
  }
);

type AccordionTriggerProps = ComponentPropsWithRef<typeof Accordion.Trigger> &
  VariantProps<typeof accordionTriggerVariants> & {
    isHideChevron?: boolean;
  };

export const AccordionTrigger = ({
  children,
  className,
  isHideChevron = false,
  ref,
  variant,
  ...props
}: AccordionTriggerProps) => {
  return (
    <Accordion.Trigger className={cn(accordionTriggerVariants({ className, variant }))} ref={ref} {...props}>
      {children}
      {!isHideChevron && (
        <ChevronRight
          aria-hidden={'true'}
          className={`
            ml-auto size-4 shrink-0 transition-transform duration-200 ease-out
            group-data-panel-open:rotate-90
          `}
        />
      )}
    </Accordion.Trigger>
  );
};

// ============================================================================
// Panel
// ============================================================================

export const accordionPanelVariants = cva(
  `
    flex h-(--accordion-panel-height) flex-col overflow-hidden transition-all
    duration-200 ease-out
    data-ending-style:h-0
    data-starting-style:h-0
    [&[hidden]:not([hidden='until-found'])]:hidden
  `,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: '',
        padded: 'p-3',
      },
    },
  }
);

type AccordionPanelProps = ComponentPropsWithRef<typeof Accordion.Panel> & VariantProps<typeof accordionPanelVariants>;

export const AccordionPanel = ({ className, ref, variant, ...props }: AccordionPanelProps) => {
  return <Accordion.Panel className={cn(accordionPanelVariants({ className, variant }))} ref={ref} {...props} />;
};
