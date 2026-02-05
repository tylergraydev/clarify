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
  category: 'logging' | 'ui' | 'workflow' | 'worktree';
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
];

/**
 * Seed default settings if they don't already exist.
 * This function is idempotent - it checks for existing settings
 * before inserting.
 *
 * @param db - The Drizzle database instance
 */
export function seedDefaultSettings(db: DrizzleDatabase): void {
  // Check if any settings already exist
  const existingSettings = db.select().from(settings).all();

  if (existingSettings.length > 0) {
    // Settings already seeded, skip
    return;
  }

  // Insert each default setting
  for (const settingDef of DEFAULT_SETTINGS) {
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
