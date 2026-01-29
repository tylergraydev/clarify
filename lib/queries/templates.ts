import { createQueryKeys } from '@lukemorales/query-key-factory';

export const templateKeys = createQueryKeys('templates', {
  active: null,
  builtIn: null,
  byCategory: (category: string) => [category],
  detail: (id: number) => [id],
  list: (filters?: { category?: string; includeDeactivated?: boolean }) => [{ filters }],
});
