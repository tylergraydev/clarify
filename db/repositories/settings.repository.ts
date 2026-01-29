import { eq } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { type NewSetting, type Setting, settings } from '../schema';

export interface SettingsRepository {
  create(data: NewSetting): Promise<Setting>;
  delete(id: number): Promise<void>;
  findAll(options?: { category?: string }): Promise<Array<Setting>>;
  findByCategory(category: string): Promise<Array<Setting>>;
  findById(id: number): Promise<Setting | undefined>;
  findByKey(key: string): Promise<Setting | undefined>;
  getTypedValue<T>(key: string): Promise<T | undefined>;
  getValue(key: string): Promise<string | undefined>;
  resetToDefault(key: string): Promise<Setting | undefined>;
  setValue(key: string, value: string): Promise<Setting | undefined>;
  update(id: number, data: Partial<Omit<NewSetting, 'createdAt' | 'id'>>): Promise<Setting | undefined>;
  upsert(
    key: string,
    value: string,
    category?: string,
    displayName?: string
  ): Promise<Setting>;
}

export function createSettingsRepository(db: DrizzleDatabase): SettingsRepository {
  return {
    async create(data: NewSetting): Promise<Setting> {
      const result = await db.insert(settings).values(data).returning();
      if (!result[0]) {
        throw new Error('Failed to create setting');
      }
      return result[0];
    },

    async delete(id: number): Promise<void> {
      await db.delete(settings).where(eq(settings.id, id));
    },

    async findAll(options?: { category?: string }): Promise<Array<Setting>> {
      if (options?.category) {
        return db.select().from(settings).where(eq(settings.category, options.category));
      }
      return db.select().from(settings);
    },

    async findByCategory(category: string): Promise<Array<Setting>> {
      return db.select().from(settings).where(eq(settings.category, category));
    },

    async findById(id: number): Promise<Setting | undefined> {
      const result = await db.select().from(settings).where(eq(settings.id, id));
      return result[0];
    },

    async findByKey(key: string): Promise<Setting | undefined> {
      const result = await db.select().from(settings).where(eq(settings.key, key));
      return result[0];
    },

    async getTypedValue<T>(key: string): Promise<T | undefined> {
      const result = await db.select().from(settings).where(eq(settings.key, key));
      const setting = result[0];
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

    async getValue(key: string): Promise<string | undefined> {
      const result = await db.select().from(settings).where(eq(settings.key, key));
      return result[0]?.value;
    },

    async resetToDefault(key: string): Promise<Setting | undefined> {
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      const setting = existing[0];
      if (!setting || setting.defaultValue === null) {
        return undefined;
      }

      const now = new Date().toISOString();
      const result = await db
        .update(settings)
        .set({
          updatedAt: now,
          userModifiedAt: null,
          value: setting.defaultValue,
        })
        .where(eq(settings.key, key))
        .returning();
      return result[0];
    },

    async setValue(key: string, value: string): Promise<Setting | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(settings)
        .set({
          updatedAt: now,
          userModifiedAt: now,
          value,
        })
        .where(eq(settings.key, key))
        .returning();
      return result[0];
    },

    async update(
      id: number,
      data: Partial<Omit<NewSetting, 'createdAt' | 'id'>>
    ): Promise<Setting | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(settings)
        .set({ ...data, updatedAt: now })
        .where(eq(settings.id, id))
        .returning();
      return result[0];
    },

    async upsert(
      key: string,
      value: string,
      category?: string,
      displayName?: string
    ): Promise<Setting> {
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      const now = new Date().toISOString();

      if (existing[0]) {
        const result = await db
          .update(settings)
          .set({
            ...(category !== undefined && { category }),
            ...(displayName !== undefined && { displayName }),
            updatedAt: now,
            userModifiedAt: now,
            value,
          })
          .where(eq(settings.key, key))
          .returning();
        if (!result[0]) {
          throw new Error('Failed to update setting');
        }
        return result[0];
      }

      if (!category || !displayName) {
        throw new Error('Category and displayName are required when creating a new setting');
      }

      const result = await db
        .insert(settings)
        .values({
          category,
          displayName,
          key,
          userModifiedAt: now,
          value,
        })
        .returning();
      if (!result[0]) {
        throw new Error('Failed to create setting');
      }
      return result[0];
    },
  };
}
