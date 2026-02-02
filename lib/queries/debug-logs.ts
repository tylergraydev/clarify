import { createQueryKeys } from '@lukemorales/query-key-factory';

import type { DebugLogFilters } from '@/types/debug-log';

export const debugLogKeys = createQueryKeys('debugLogs', {
  list: (filters?: DebugLogFilters) => [{ filters }],
  logPath: null,
  sessionIds: null,
});
