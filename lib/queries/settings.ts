import { createQueryKeys } from "@lukemorales/query-key-factory";

export const settingKeys = createQueryKeys("settings", {
  all: null,
  byCategory: (category: string) => [category],
  byKey: (key: string) => [key],
  detail: (id: number) => [id],
  list: (filters?: { category?: string }) => [{ filters }],
});
