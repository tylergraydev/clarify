import { createQueryKeys } from '@lukemorales/query-key-factory';

export const mcpServerKeys = createQueryKeys('mcpServers', {
  list: null,
  projectServers: (dirPath: string) => [dirPath],
});
