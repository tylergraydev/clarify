export const AGENT_LAYOUT_STORAGE_KEY = "app:agent-layout";
export const AGENT_SHOW_BUILTIN_STORAGE_KEY = "app:agent-show-builtin";
export const AGENT_SHOW_DEACTIVATED_STORAGE_KEY = "app:agent-show-deactivated";

export type AgentLayout = "card" | "list" | "table";

export const DEFAULT_AGENT_LAYOUT: AgentLayout = "card";
export const DEFAULT_AGENT_SHOW_BUILTIN = true;
export const DEFAULT_AGENT_SHOW_DEACTIVATED = false;
