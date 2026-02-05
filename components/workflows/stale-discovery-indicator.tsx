'use client';

import type { ComponentPropsWithRef, ReactElement } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const staleDiscoveryIndicatorVariants = cva(
  `
    flex items-center justify-between gap-4
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: '',
        lg: 'p-6',
        sm: 'p-2',
      },
    },
  }
);

interface StaleDiscoveryIndicatorProps
  extends ComponentPropsWithRef<'div'>, VariantProps<typeof staleDiscoveryIndicatorVariants> {
  /** Timestamp when the discovery was completed */
  discoveryCompletedAt?: Date | null | string;
  /** Timestamp when the discovery was started */
  discoveryStartedAt?: Date | null | string;
  /** Whether a rediscovery operation is in progress */
  isRediscovering?: boolean;
  /** Callback when the user clicks to re-discover files */
  onRediscover?: () => void;
  /** Timestamp when the refinement was last updated */
  refinementUpdatedAt?: Date | null | string;
}

/**
 * StaleDiscoveryIndicator displays a warning when the feature refinement has been
 * updated after the file discovery was completed, indicating that the discovered
 * files may no longer be accurate for the updated requirements.
 *
 * @example
 * ```tsx
 * <StaleDiscoveryIndicator
 *   discoveryCompletedAt={step.discoveryCompletedAt}
 *   isRediscovering={isRediscovering}
 *   onRediscover={handleRediscover}
 *   refinementUpdatedAt={step.refinementUpdatedAt}
 * />
 * ```
 */
export const StaleDiscoveryIndicator = ({
  className,
  discoveryCompletedAt,
  discoveryStartedAt,
  isRediscovering = false,
  onRediscover,
  ref,
  refinementUpdatedAt,
  size,
  ...props
}: StaleDiscoveryIndicatorProps): null | ReactElement => {
  const isStale = useMemo(() => {
    // If no refinement updated timestamp, not stale
    if (!refinementUpdatedAt) {
      return false;
    }

    // Use completedAt if available, otherwise use startedAt as fallback
    // This handles the case when discovery is in progress (completedAt is null)
    const discoveryTimestamp = discoveryCompletedAt ?? discoveryStartedAt;

    // If no discovery timestamp at all, not stale (discovery hasn't started)
    if (!discoveryTimestamp) {
      return false;
    }

    // Convert to Date objects if strings
    const discoveryDate = discoveryTimestamp instanceof Date ? discoveryTimestamp : new Date(discoveryTimestamp);
    const refinementDate = refinementUpdatedAt instanceof Date ? refinementUpdatedAt : new Date(refinementUpdatedAt);

    // Stale if refinement was updated after discovery started/completed
    return refinementDate.getTime() > discoveryDate.getTime();
  }, [discoveryCompletedAt, discoveryStartedAt, refinementUpdatedAt]);

  // Don't render if not stale
  if (!isStale) {
    return null;
  }

  const handleRediscoverClick = () => {
    onRediscover?.();
  };

  return (
    <div className={cn(staleDiscoveryIndicatorVariants({ size }), className)} ref={ref} {...props}>
      <Alert className={'flex-1'} variant={'warning'}>
        <AlertTriangle className={'size-4'} />
        <div className={'flex flex-1 flex-col'}>
          <AlertTitle>Discovery May Be Outdated</AlertTitle>
          <AlertDescription>
            The feature refinement has been updated since the last file discovery. The discovered files may no longer
            accurately reflect the current requirements.
          </AlertDescription>
        </div>
        {onRediscover && (
          <Button
            className={'ml-auto shrink-0'}
            disabled={isRediscovering}
            onClick={handleRediscoverClick}
            size={'sm'}
            type={'button'}
            variant={'outline'}
          >
            {isRediscovering ? (
              <RefreshCw className={'mr-1.5 size-4 animate-spin'} />
            ) : (
              <RefreshCw className={'mr-1.5 size-4'} />
            )}
            {isRediscovering ? 'Re-discovering...' : 'Re-discover Files'}
          </Button>
        )}
      </Alert>
    </div>
  );
};
