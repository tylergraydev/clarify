import { createQueryKeys } from "@lukemorales/query-key-factory";

export const agentKeys = createQueryKeys("agents", {
  active: (projectId?: number) => [{ projectId }],
  builtIn: null,
  byProject: (projectId: number) => [projectId],
  byType: (type: string) => [type],
  detail: (id: number) => [id],
  list: (filters?: {
    includeDeactivated?: boolean;
    projectId?: number;
    type?: string;
  }) => [{ filters }],
});
