import { createQueryKeys } from '@lukemorales/query-key-factory';

/**
 * Query keys for project-related queries.
 *
 * Key structure:
 * - `projects.list()` - Active projects only (default view)
 * - `projects.list({ includeArchived: true })` - All projects including archived
 * - `projects.detail(id)` - Single project by ID
 */
export const projectKeys = createQueryKeys('projects', {
  /**
   * Query key for a single project by ID.
   */
  detail: (id: number) => [id],
  /**
   * Query key for project lists with optional filtering.
   * @param filters - Optional filters
   * @param filters.includeArchived - When true, includes archived projects in results
   */
  list: (filters?: { includeArchived?: boolean }) => [{ filters }],
});
