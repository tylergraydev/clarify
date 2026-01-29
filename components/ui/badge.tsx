"use client";

import type { ComponentPropsWithRef } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  `
    inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs
    font-medium whitespace-nowrap transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
  `,
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        sm: "px-2 py-0.5 text-xs",
      },
      variant: {
        anthropic: `
          bg-orange-500/15 text-orange-700
          dark:bg-orange-500/20 dark:text-orange-400
        `,
        azure: `
          bg-sky-500/15 text-sky-700
          dark:bg-sky-500/20 dark:text-sky-400
        `,
        backend: `
          bg-violet-500/15 text-violet-700
          dark:bg-violet-500/20 dark:text-violet-400
        `,
        bedrock: `
          bg-amber-500/15 text-amber-700
          dark:bg-amber-500/20 dark:text-amber-400
        `,
        "category-builtin": `
          bg-amber-500/15 text-amber-700
          dark:bg-amber-500/20 dark:text-amber-400
        `,
        clarifying: `
          bg-yellow-500/15 text-yellow-700
          dark:bg-yellow-500/20 dark:text-yellow-400
        `,
        "claude-cli": `
          bg-orange-500/15 text-orange-700
          dark:bg-orange-500/20 dark:text-orange-400
        `,
        cohere: `
          bg-rose-500/15 text-rose-700
          dark:bg-rose-500/20 dark:text-rose-400
        `,
        completed: `
          bg-green-500/15 text-green-700
          dark:bg-green-500/20 dark:text-green-400
        `,
        data: `
          bg-emerald-500/15 text-emerald-700
          dark:bg-emerald-500/20 dark:text-emerald-400
        `,
        deepseek: `
          bg-indigo-500/15 text-indigo-700
          dark:bg-indigo-500/20 dark:text-indigo-400
        `,
        default: `bg-muted text-muted-foreground`,
        describing: `
          bg-neutral-500/15 text-neutral-700
          dark:bg-neutral-500/20 dark:text-neutral-400
        `,
        draft: `
          bg-neutral-500/15 text-neutral-700
          dark:bg-neutral-500/20 dark:text-neutral-400
        `,
        electron: `
          bg-sky-500/15 text-sky-700
          dark:bg-sky-500/20 dark:text-sky-400
        `,
        environment: `
          bg-cyan-500/15 text-cyan-700
          dark:bg-cyan-500/20 dark:text-cyan-400
        `,
        failed: `
          bg-red-500/15 text-red-700
          dark:bg-red-500/20 dark:text-red-400
        `,
        google: `
          bg-blue-500/15 text-blue-700
          dark:bg-blue-500/20 dark:text-blue-400
        `,
        groq: `
          bg-lime-500/15 text-lime-700
          dark:bg-lime-500/20 dark:text-lime-400
        `,
        mistral: `
          bg-red-500/15 text-red-700
          dark:bg-red-500/20 dark:text-red-400
        `,
        ollama: `
          bg-fuchsia-500/15 text-fuchsia-700
          dark:bg-fuchsia-500/20 dark:text-fuchsia-400
        `,
        openai: `
          bg-emerald-500/15 text-emerald-700
          dark:bg-emerald-500/20 dark:text-emerald-400
        `,
        openrouter: `
          bg-pink-500/15 text-pink-700
          dark:bg-pink-500/20 dark:text-pink-400
        `,
        planning: `
          bg-purple-500/15 text-purple-700
          dark:bg-purple-500/20 dark:text-purple-400
        `,
        researching: `
          bg-blue-500/15 text-blue-700
          dark:bg-blue-500/20 dark:text-blue-400
        `,
        review: `
          bg-yellow-500/15 text-yellow-700
          dark:bg-yellow-500/20 dark:text-yellow-400
        `,
        security: `
          bg-red-500/15 text-red-700
          dark:bg-red-500/20 dark:text-red-400
        `,
        specialist: `
          bg-blue-500/15 text-blue-700
          dark:bg-blue-500/20 dark:text-blue-400
        `,
        stale: `
          bg-amber-500/15 text-amber-700
          dark:bg-amber-500/20 dark:text-amber-400
        `,
        togetherai: `
          bg-teal-500/15 text-teal-700
          dark:bg-teal-500/20 dark:text-teal-400
        `,
        ui: `
          bg-blue-500/15 text-blue-700
          dark:bg-blue-500/20 dark:text-blue-400
        `,
        user: `
          bg-violet-500/15 text-violet-700
          dark:bg-violet-500/20 dark:text-violet-400
        `,
        xai: `
          bg-slate-500/15 text-slate-700
          dark:bg-slate-500/20 dark:text-slate-400
        `,
      },
    },
  }
);

type BadgeProps = ComponentPropsWithRef<"span"> &
  VariantProps<typeof badgeVariants>;

export const Badge = ({
  className,
  ref,
  size,
  variant,
  ...props
}: BadgeProps) => {
  return (
    <span
      className={cn(badgeVariants({ className, size, variant }))}
      ref={ref}
      {...props}
    />
  );
};
