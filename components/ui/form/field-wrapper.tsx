'use client';

import { cva } from 'class-variance-authority';

/**
 * CVA variants for form field styling.
 * Used by TanStackFieldRoot and Field subcomponents.
 */

export const fieldWrapperVariants = cva('flex flex-col gap-1.5', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: '',
      lg: '',
      sm: '',
    },
  },
});

export const labelVariants = cva('font-medium text-foreground', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'text-sm',
      lg: 'text-base',
      sm: 'text-xs',
    },
  },
});

export const descriptionVariants = cva('text-muted-foreground', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'text-sm',
      lg: 'text-sm',
      sm: 'text-xs',
    },
  },
});

export const errorVariants = cva('text-destructive', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'text-sm',
      lg: 'text-sm',
      sm: 'text-xs',
    },
  },
});
