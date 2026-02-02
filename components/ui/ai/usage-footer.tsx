'use client';

import type { ComponentProps } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { ActivityIcon } from 'lucide-react';
import { memo } from 'react';

import { cn } from '@/lib/utils';

const usageFooterVariants = cva('flex items-center gap-4 rounded-md border px-3 py-2 text-xs text-muted-foreground', {
  defaultVariants: { variant: 'default' },
  variants: {
    variant: {
      compact: 'border-transparent bg-transparent px-0',
      default: 'border-border bg-muted/30',
    },
  },
});

export interface UsageFooterProps extends ComponentProps<'div'>, VariantProps<typeof usageFooterVariants> {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  totalTokens: number;
}

export const UsageFooter = memo(
  ({ className, inputTokens, outputTokens, reasoningTokens, totalTokens, variant, ...props }: UsageFooterProps) => {
    const _hasReasoningTokens = reasoningTokens !== undefined && reasoningTokens > 0;

    return (
      <div className={cn(usageFooterVariants({ className, variant }))} {...props}>
        <ActivityIcon className={'size-3.5'} />
        <span>Input: {inputTokens.toLocaleString()}</span>
        <span>Output: {outputTokens.toLocaleString()}</span>
        {_hasReasoningTokens && <span>Reasoning: {reasoningTokens.toLocaleString()}</span>}
        <span className={'font-medium'}>Total: {totalTokens.toLocaleString()}</span>
      </div>
    );
  }
);

UsageFooter.displayName = 'UsageFooter';
