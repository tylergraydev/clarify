/**
 * Default Settings Seed Data
 *
 * Seeds default application settings on first run.
 * Settings are organized by category:
 * - workflow: Workflow execution settings
 * - worktree: Git worktree settings
 * - logging: Logging and audit settings
 * - ui: User interface settings
 */
import { eq } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewSetting } from '../schema';

import { agents, settings } from '../schema';

/**
 * Setting definition for seeding
 */
interface SettingDefinition {
  category: 'chat' | 'logging' | 'terminal' | 'ui' | 'workflow' | 'worktree';
  defaultValue: null | string;
  description: string;
  displayName: string;
  key: string;
  value: string;
  valueType: 'boolean' | 'json' | 'number' | 'string';
}

/**
 * Default settings to seed on first run
 */
const DEFAULT_SETTINGS: Array<SettingDefinition> = [
  // === Workflow Settings ===
  {
    category: 'workflow',
    defaultValue: null,
    description: 'The planning agent used by default for the clarification step in new workflows',
    displayName: 'Default Clarification Agent',
    key: 'defaultClarificationAgentId',
    value: '',
    valueType: 'number',
  },
  {
    category: 'workflow',
    defaultValue: null,
    description: 'The planning agent used by default for the refinement step in new workflows',
    displayName: 'Default Refinement Agent',
    key: 'defaultRefinementAgentId',
    value: '',
    valueType: 'number',
  },
  {
    category: 'workflow',
    defaultValue: '3',
    description: 'Maximum number of workflows that can run simultaneously',
    displayName: 'Max Concurrent Workflows',
    key: 'maxConcurrentWorkflows',
    value: '3',
    valueType: 'number',
  },
  // === Worktree Settings ===
  {
    category: 'worktree',
    defaultValue: 'true',
    description: 'Automatically create a git worktree with feature branch when starting workflows',
    displayName: 'Create Feature Branch',
    key: 'worktreeCreateFeatureBranch',
    value: 'true',
    valueType: 'boolean',
  },
  {
    category: 'worktree',
    defaultValue: 'true',
    description: 'Automatically remove worktrees when workflows complete, fail, or are cancelled',
    displayName: 'Auto-cleanup Worktrees',
    key: 'worktreeAutoCleanup',
    value: 'true',
    valueType: 'boolean',
  },
  // === Chat Settings ===
  {
    category: 'chat',
    defaultValue: '80000',
    description: 'Token count threshold that triggers the compaction notification',
    displayName: 'Compaction Token Threshold',
    key: 'chatCompactionTokenThreshold',
    value: '80000',
    valueType: 'number',
  },
  {
    category: 'chat',
    defaultValue: 'true',
    description: 'Show a notification when conversation context grows large',
    displayName: 'Auto-prompt Compaction',
    key: 'chatAutoPromptCompaction',
    value: 'true',
    valueType: 'boolean',
  },
  {
    category: 'chat',
    defaultValue: 'true',
    description: 'Automatically generate conversation titles using AI after the first exchange',
    displayName: 'Auto-generate Titles',
    key: 'chatAutoGenerateTitle',
    value: 'true',
    valueType: 'boolean',
  },
  {
    category: 'chat',
    defaultValue: '10',
    description: 'Number of messages between title re-generation attempts',
    displayName: 'Title Regeneration Interval',
    key: 'chatTitleRegenerateInterval',
    value: '10',
    valueType: 'number',
  },
  // === Terminal Settings ===
  {
    category: 'terminal',
    defaultValue: '',
    description: 'Path to the shell executable (leave empty for system default)',
    displayName: 'Shell Path',
    key: 'terminal.shellPath',
    value: '',
    valueType: 'string',
  },
  {
    category: 'terminal',
    defaultValue: '13',
    description: 'Font size in pixels for the terminal',
    displayName: 'Font Size',
    key: 'terminal.fontSize',
    value: '13',
    valueType: 'number',
  },
  {
    category: 'terminal',
    defaultValue: '',
    description: 'Font family for the terminal (leave empty for Geist Mono)',
    displayName: 'Font Family',
    key: 'terminal.fontFamily',
    value: '',
    valueType: 'string',
  },
  {
    category: 'terminal',
    defaultValue: 'true',
    description: 'Whether the terminal cursor should blink',
    displayName: 'Cursor Blink',
    key: 'terminal.cursorBlink',
    value: 'true',
    valueType: 'boolean',
  },
  {
    category: 'terminal',
    defaultValue: '1000',
    description: 'Number of lines to keep in the terminal scrollback buffer',
    displayName: 'Scrollback',
    key: 'terminal.scrollback',
    value: '1000',
    valueType: 'number',
  },
];

/**
 * Seed default settings if they don't already exist.
 * This function is idempotent - it checks for existing settings
 * before inserting.
 *
 * @param db - The Drizzle database instance
 */
export function seedDefaultSettings(db: DrizzleDatabase): void {
  // Upsert pattern: insert each default setting only if its key doesn't already exist.
  // This ensures new settings are seeded for existing installations while preserving
  // user-configured values.
  for (const settingDef of DEFAULT_SETTINGS) {
    const existing = db.select().from(settings).where(eq(settings.key, settingDef.key)).get();
    if (!existing) {
      db.insert(settings)
        .values({
          category: settingDef.category,
          defaultValue: settingDef.defaultValue,
          description: settingDef.description,
          displayName: settingDef.displayName,
          key: settingDef.key,
          value: settingDef.value,
          valueType: settingDef.valueType,
        } satisfies NewSetting)
        .run();
    }
  }
}

// ============================================================================
// Agent Setting Links
// ============================================================================

/**
 * Mapping of built-in agent names to their corresponding default setting keys.
 * Used to auto-populate agent ID settings after seeding.
 */
const AGENT_SETTING_LINKS = [
  { agentName: 'refinement-agent', settingKey: 'defaultRefinementAgentId' },
  { agentName: 'clarification-agent', settingKey: 'defaultClarificationAgentId' },
] as const;

/**
 * Link built-in agents to their default settings.
 * This function runs after agents and settings are seeded to populate
 * the agent ID settings with the actual IDs from the database.
 *
 * Only updates settings that have empty values (not manually configured).
 *
 * @param db - The Drizzle database instance
 */
export function linkAgentSettings(db: DrizzleDatabase): void {
  for (const { agentName, settingKey } of AGENT_SETTING_LINKS) {
    // Find the agent by name
    const agent = db.select().from(agents).where(eq(agents.name, agentName)).get();

    if (!agent) continue;

    // Find the setting
    const setting = db.select().from(settings).where(eq(settings.key, settingKey)).get();

    if (!setting) continue;

    // Only update if setting value is empty (not manually configured)
    if (!setting.value) {
      db.update(settings).set({ value: agent.id.toString() }).where(eq(settings.key, settingKey)).run();
    }
  }
}
