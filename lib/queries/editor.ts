import { createQueryKeys } from '@lukemorales/query-key-factory';

export const editorKeys = createQueryKeys('editor', {
  detected: null,
  preferred: null,
  registry: null,
});
