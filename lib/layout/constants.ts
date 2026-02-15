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

// Shell layout storage keys
export const SHELL_SIDEBAR_COLLAPSED_STORAGE_KEY = 'app:shell-sidebar-collapsed';
export const SHELL_NAV_ITEMS_EXPANDED_STORAGE_KEY = 'app:shell-nav-items-expanded';

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

// Shell layout defaults
export const DEFAULT_SHELL_SIDEBAR_COLLAPSED = false;
export const DEFAULT_SHELL_NAV_ITEMS_EXPANDED: Array<string> = [];

// File explorer panel storage keys
export const FILE_EXPLORER_PANEL_OPEN_STORAGE_KEY = 'app:file-explorer-panel-open';
export const FILE_EXPLORER_PANEL_WIDTH_STORAGE_KEY = 'app:file-explorer-panel-width';

// File explorer panel defaults
export const DEFAULT_FILE_EXPLORER_PANEL_OPEN = false;
export const DEFAULT_FILE_EXPLORER_PANEL_WIDTH = 288;

// Terminal panel storage keys
export const TERMINAL_PANEL_HEIGHT_STORAGE_KEY = 'app:terminal-panel-height';
export const TERMINAL_PANEL_OPEN_STORAGE_KEY = 'app:terminal-panel-open';

// Terminal panel defaults
export const DEFAULT_TERMINAL_PANEL_HEIGHT = 300;
export const DEFAULT_TERMINAL_PANEL_OPEN = false;

// Workflow detail storage keys
export const WORKFLOW_DETAIL_STREAMING_PANEL_HEIGHT_STORAGE_KEY = 'app:workflow-detail-streaming-panel-height';
export const WORKFLOW_DETAIL_STREAMING_PANEL_COLLAPSED_STORAGE_KEY = 'app:workflow-detail-streaming-panel-collapsed';
export const WORKFLOW_DETAIL_ACTIVE_STREAMING_TAB_STORAGE_KEY = 'app:workflow-detail-active-streaming-tab';
export const WORKFLOW_DETAIL_EXPANDED_STEPS_STORAGE_KEY = 'app:workflow-detail-expanded-steps';

// Workflow detail defaults
export const DEFAULT_WORKFLOW_DETAIL_STREAMING_PANEL_HEIGHT = 250;
export const DEFAULT_WORKFLOW_DETAIL_STREAMING_PANEL_COLLAPSED = true;
export const DEFAULT_WORKFLOW_DETAIL_ACTIVE_STREAMING_TAB = 'clarification' as const;
export const DEFAULT_WORKFLOW_DETAIL_EXPANDED_STEPS: Array<string> = [];
