'use client';

import type { ReactNode } from 'react';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

type QueryErrorBoundaryProps = RequiredChildren & {
  fallback?: ReactNode;
};

/**
 * Extracts a user-friendly error message from an unknown error
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Extracts the error type/name for display when available
 */
const getErrorType = (error: unknown): null | string => {
  if (error instanceof Error && error.name && error.name !== 'Error') {
    return error.name;
  }

  return null;
};

export const QueryErrorBoundary = ({ children, fallback }: QueryErrorBoundaryProps) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => {
            const errorMessage = getErrorMessage(error);
            const errorType = getErrorType(error);

            if (fallback) {
              return fallback;
            }

            return (
              <div aria-atomic={'true'} aria-live={'polite'} role={'alert'}>
                <EmptyState
                  action={
                    <Button onClick={resetErrorBoundary} variant={'outline'}>
                      <RefreshCw aria-hidden={'true'} className={'size-4'} />
                      Try Again
                    </Button>
                  }
                  description={errorType ? `${errorType}: ${errorMessage}` : errorMessage}
                  icon={<AlertCircle aria-hidden={'true'} className={'size-6'} />}
                  title={'Failed to load data'}
                />
              </div>
            );
          }}
          onReset={reset}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
