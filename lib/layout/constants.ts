// Agent layout storage keys
export const AGENT_SHOW_BUILTIN_STORAGE_KEY = 'app:agent-show-builtin';
export const AGENT_SHOW_DEACTIVATED_STORAGE_KEY = 'app:agent-show-deactivated';

// Project storage keys
export const PROJECT_ARCHIVE_FILTER_STORAGE_KEY = 'app:project-archive-filter';

// Template layout storage keys
export const TEMPLATE_SHOW_BUILTIN_STORAGE_KEY = 'app:template-show-builtin';
export const TEMPLATE_SHOW_DEACTIVATED_STORAGE_KEY = 'app:template-show-deactivated';

// Active workflows storage keys
export const ACTIVE_WORKFLOWS_COLLAPSED_GROUPS_STORAGE_KEY = 'app:active-workflows-collapsed-groups';
export const ACTIVE_WORKFLOWS_GROUP_BY_PROJECT_STORAGE_KEY = 'app:active-workflows-group-by-project';
export const ACTIVE_WORKFLOWS_SORT_COLUMN_STORAGE_KEY = 'app:active-workflows-sort-column';
export const ACTIVE_WORKFLOWS_SORT_DIRECTION_STORAGE_KEY = 'app:active-workflows-sort-direction';
export const ACTIVE_WORKFLOWS_STATUS_FILTER_STORAGE_KEY = 'app:active-workflows-status-filter';
export const ACTIVE_WORKFLOWS_TYPE_FILTER_STORAGE_KEY = 'app:active-workflows-type-filter';

// Agent layout defaults
export const DEFAULT_AGENT_SHOW_BUILTIN = true;
export const DEFAULT_AGENT_SHOW_DEACTIVATED = false;

// Project defaults
export const DEFAULT_PROJECT_ARCHIVE_FILTER = 'active' as const;

// Template layout defaults
export const DEFAULT_TEMPLATE_SHOW_BUILTIN = true;
export const DEFAULT_TEMPLATE_SHOW_DEACTIVATED = false;

// Active workflows defaults
// Note: Types are defined in active-workflows-store.ts to avoid circular dependencies
export const DEFAULT_ACTIVE_WORKFLOWS_COLLAPSED_GROUPS = new Set<string>();
export const DEFAULT_ACTIVE_WORKFLOWS_GROUP_BY_PROJECT = true;
export const DEFAULT_ACTIVE_WORKFLOWS_SORT_COLUMN = 'updatedAt' as const;
export const DEFAULT_ACTIVE_WORKFLOWS_SORT_DIRECTION = 'desc' as const;
export const DEFAULT_ACTIVE_WORKFLOWS_STATUS_FILTER = 'all' as const;
export const DEFAULT_ACTIVE_WORKFLOWS_TYPE_FILTER = 'all' as const;
