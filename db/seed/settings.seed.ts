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
import type { DrizzleDatabase } from '../index';
import type { NewSetting } from '../schema';

import { settings } from '../schema';

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
