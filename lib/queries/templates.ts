import { createQueryKeys } from "@lukemorales/query-key-factory";

import type { TemplateListFilters } from "@/types/electron";

export const templateKeys = createQueryKeys("templates", {
  active: null,
  builtIn: null,
  byCategory: (category: TemplateListFilters["category"]) => [category],
  detail: (id: number) => [id],
  list: (filters?: TemplateListFilters) => [{ filters }],
  placeholders: (templateId: number) => [templateId],
});
