'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

type QueryProviderProps = RequiredChildren;

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // Electron doesn't need this
            staleTime: 5 * 60 * 1000, // 5 minutes (IPC is fast, cache aggressively)
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools buttonPosition={'top-right'} initialIsOpen={false} position={'top'} />
    </QueryClientProvider>
  );
}
