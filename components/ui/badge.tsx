'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  `
    inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs
    font-medium whitespace-nowrap transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
  `,
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
        sm: 'px-2 py-0.5 text-xs',
      },
      variant: {
        anthropic: `
          bg-orange-200 text-orange-900
          dark:bg-orange-900/60 dark:text-orange-100
        `,
        azure: `
          bg-sky-200 text-sky-900
          dark:bg-sky-900/60 dark:text-sky-100
        `,
        backend: `
          bg-violet-200 text-violet-900
          dark:bg-violet-900/60 dark:text-violet-100
        `,
        bedrock: `
          bg-amber-200 text-amber-900
          dark:bg-amber-900/60 dark:text-amber-100
        `,
        'category-builtin': `
          bg-amber-200 text-amber-900
          dark:bg-amber-900/60 dark:text-amber-100
        `,
        clarifying: `
          bg-yellow-200 text-yellow-900
          dark:bg-yellow-900/60 dark:text-yellow-100
        `,
        'claude-cli': `
          bg-orange-200 text-orange-900
          dark:bg-orange-900/60 dark:text-orange-100
        `,
        cohere: `
          bg-rose-200 text-rose-900
          dark:bg-rose-900/60 dark:text-rose-100
        `,
        completed: `
          bg-green-200 text-green-900
          dark:bg-green-900/60 dark:text-green-100
        `,
        custom: `
          bg-teal-200 text-teal-900
          dark:bg-teal-900/60 dark:text-teal-100
        `,
        data: `
          bg-emerald-200 text-emerald-900
          dark:bg-emerald-900/60 dark:text-emerald-100
        `,
        deepseek: `
          bg-indigo-200 text-indigo-900
          dark:bg-indigo-900/60 dark:text-indigo-100
        `,
        default: `bg-muted text-muted-foreground`,
        describing: `
          bg-neutral-200 text-neutral-900
          dark:bg-neutral-900/60 dark:text-neutral-100
        `,
        draft: `
          bg-neutral-200 text-neutral-900
          dark:bg-neutral-900/60 dark:text-neutral-100
        `,
        electron: `
          bg-sky-200 text-sky-900
          dark:bg-sky-900/60 dark:text-sky-100
        `,
        environment: `
          bg-cyan-200 text-cyan-900
          dark:bg-cyan-900/60 dark:text-cyan-100
        `,
        failed: `
          bg-red-200 text-red-900
          dark:bg-red-900/60 dark:text-red-100
        `,
        google: `
          bg-blue-200 text-blue-900
          dark:bg-blue-900/60 dark:text-blue-100
        `,
        groq: `
          bg-lime-200 text-lime-900
          dark:bg-lime-900/60 dark:text-lime-100
        `,
        mistral: `
          bg-red-200 text-red-900
          dark:bg-red-900/60 dark:text-red-100
        `,
        ollama: `
          bg-fuchsia-200 text-fuchsia-900
          dark:bg-fuchsia-900/60 dark:text-fuchsia-100
        `,
        openai: `
          bg-emerald-200 text-emerald-900
          dark:bg-emerald-900/60 dark:text-emerald-100
        `,
        openrouter: `
          bg-pink-200 text-pink-900
          dark:bg-pink-900/60 dark:text-pink-100
        `,
        pending: `
          bg-amber-200 text-amber-900
          dark:bg-amber-900/60 dark:text-amber-100
        `,
        planning: `
          bg-purple-200 text-purple-900
          dark:bg-purple-900/60 dark:text-purple-100
        `,
        project: `
          bg-indigo-200 text-indigo-900
          dark:bg-indigo-900/60 dark:text-indigo-100
        `,
        researching: `
          bg-blue-200 text-blue-900
          dark:bg-blue-900/60 dark:text-blue-100
        `,
        review: `
          bg-yellow-200 text-yellow-900
          dark:bg-yellow-900/60 dark:text-yellow-100
        `,
        security: `
          bg-red-200 text-red-900
          dark:bg-red-900/60 dark:text-red-100
        `,
        specialist: `
          bg-blue-200 text-blue-900
          dark:bg-blue-900/60 dark:text-blue-100
        `,
        stale: `
          bg-amber-200 text-amber-900
          dark:bg-amber-900/60 dark:text-amber-100
        `,
        togetherai: `
          bg-teal-200 text-teal-900
          dark:bg-teal-900/60 dark:text-teal-100
        `,
        ui: `
          bg-blue-200 text-blue-900
          dark:bg-blue-900/60 dark:text-blue-100
        `,
        user: `
          bg-violet-200 text-violet-900
          dark:bg-violet-900/60 dark:text-violet-100
        `,
        xai: `
          bg-slate-200 text-slate-900
          dark:bg-slate-900/60 dark:text-slate-100
        `,
      },
    },
  }
);

type BadgeProps = ComponentPropsWithRef<'span'> & VariantProps<typeof badgeVariants>;

export const Badge = ({ className, ref, size, variant, ...props }: BadgeProps) => {
  return <span className={cn(badgeVariants({ className, size, variant }))} ref={ref} {...props} />;
};
