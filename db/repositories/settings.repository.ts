import { eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { type NewSetting, type Setting, settings } from '../schema';
import { createBaseRepository } from './base.repository';

export interface SettingsRepository {
  create(data: NewSetting): Setting;
  delete(id: number): void;
  findAll(options?: { category?: string }): Array<Setting>;
  findByCategory(category: string): Array<Setting>;
  findById(id: number): Setting | undefined;
  findByKey(key: string): Setting | undefined;
  getTypedValue<T>(key: string): T | undefined;
  getValue(key: string): string | undefined;
  resetToDefault(key: string): Setting | undefined;
  setValue(key: string, value: string): Setting | undefined;
  update(id: number, data: Partial<Omit<NewSetting, 'createdAt' | 'id'>>): Setting | undefined;
  upsert(key: string, value: string, category?: string, displayName?: string): Setting;
}

export function createSettingsRepository(db: DrizzleDatabase): SettingsRepository {
  const base = createBaseRepository<typeof settings, Setting, NewSetting>(db, settings);

  return {
    create(data: NewSetting): Setting {
      const result = db.insert(settings).values(data).returning().get();
      if (!result) {
        throw new Error('Failed to create setting');
      }
      return result;
    },

    delete(id: number): void {
      db.delete(settings).where(eq(settings.id, id)).run();
    },

    findAll(options?: { category?: string }): Array<Setting> {
      if (options?.category) {
        return db.select().from(settings).where(eq(settings.category, options.category)).all();
      }
      return db.select().from(settings).all();
    },

    findByCategory(category: string): Array<Setting> {
      return db.select().from(settings).where(eq(settings.category, category)).all();
    },

    findById: base.findById,

    findByKey(key: string): Setting | undefined {
      return db.select().from(settings).where(eq(settings.key, key)).get();
    },

    getTypedValue<T>(key: string): T | undefined {
      const setting = db.select().from(settings).where(eq(settings.key, key)).get();
      if (!setting) {
        return undefined;
      }

      switch (setting.valueType) {
        case 'boolean':
          return (setting.value === 'true') as T;
        case 'number':
          return Number(setting.value) as T;
        case 'json':
          try {
            return JSON.parse(setting.value) as T;
          } catch {
            return undefined;
          }
        case 'string':
        default:
          return setting.value as T;
      }
    },

    getValue(key: string): string | undefined {
      return db.select().from(settings).where(eq(settings.key, key)).get()?.value;
    },

    resetToDefault(key: string): Setting | undefined {
      const setting = db.select().from(settings).where(eq(settings.key, key)).get();
      if (!setting || setting.defaultValue === null) {
        return undefined;
      }

      return db
        .update(settings)
        .set({
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
          userModifiedAt: null,
          value: setting.defaultValue,
        })
        .where(eq(settings.key, key))
        .returning()
        .get();
    },

    setValue(key: string, value: string): Setting | undefined {
      return db
        .update(settings)
        .set({
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
          userModifiedAt: sql`(CURRENT_TIMESTAMP)`,
          value,
        })
        .where(eq(settings.key, key))
        .returning()
        .get();
    },

    update(id: number, data: Partial<Omit<NewSetting, 'createdAt' | 'id'>>): Setting | undefined {
      return db
        .update(settings)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(settings.id, id))
        .returning()
        .get();
    },

    upsert(key: string, value: string, category?: string, displayName?: string): Setting {
      const existing = db.select().from(settings).where(eq(settings.key, key)).get();

      if (existing) {
        const result = db
          .update(settings)
          .set({
            ...(category !== undefined && { category }),
            ...(displayName !== undefined && { displayName }),
            updatedAt: sql`(CURRENT_TIMESTAMP)`,
            userModifiedAt: sql`(CURRENT_TIMESTAMP)`,
            value,
          })
          .where(eq(settings.key, key))
          .returning()
          .get();
        if (!result) {
          throw new Error('Failed to update setting');
        }
        return result;
      }

      if (!category || !displayName) {
        throw new Error('Category and displayName are required when creating a new setting');
      }

      const result = db
        .insert(settings)
        .values({
          category,
          displayName,
          key,
          userModifiedAt: sql`(CURRENT_TIMESTAMP)`,
          value,
        })
        .returning()
        .get();
      if (!result) {
        throw new Error('Failed to create setting');
      }
      return result;
    },
  };
}
