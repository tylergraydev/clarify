import { createQueryKeys } from '@lukemorales/query-key-factory';

export const providerKeys = createQueryKeys('providers', {
  configured: null,
  list: null,
  maskedKey: (provider: string) => [provider],
});
