/**
 * Database Seeding Module
 *
 * Orchestrates seeding of built-in data (templates, agents, settings)
 * on first run or after migrations. All seed operations are idempotent.
 */
import type { DrizzleDatabase } from '../index';

import { seedBuiltInAgents } from './agents.seed';
import { linkAgentSettings, seedDefaultSettings } from './settings.seed';
import { seedBuiltInTemplates } from './templates.seed';

/**
 * Seed the database with built-in data.
 * This function is idempotent - safe to call multiple times.
 *
 * @param db - The Drizzle database instance
 */
export function seedDatabase(db: DrizzleDatabase): void {
  // Seed built-in templates
  seedBuiltInTemplates(db);

  // Seed built-in agents
  seedBuiltInAgents(db);

  // Seed default settings
  seedDefaultSettings(db);

  // Link built-in agents to their default settings
  linkAgentSettings(db);
}
