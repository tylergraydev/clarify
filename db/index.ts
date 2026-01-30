import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

export { schema };

export type DrizzleDatabase = BetterSQLite3Database<typeof schema>;

let db: DrizzleDatabase | null = null;
let sqlite: Database.Database | null = null;

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}

export function getDatabase(): DrizzleDatabase {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function initializeDatabase(dbPath: string): DrizzleDatabase {
  if (db) return db;

  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  db = drizzle(sqlite, { schema });
  return db;
}
