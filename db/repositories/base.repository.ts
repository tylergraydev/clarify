import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';

import { eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

export interface BaseRepository<TSelect, TInsert> {
  create(data: TInsert): TSelect;
  delete(id: number): boolean;
  findById(id: number): TSelect | undefined;
  update(id: number, data: Partial<TInsert>): TSelect | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableWithIdAndTimestamps = SQLiteTableWithColumns<any> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  id: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedAt: any;
};

export function createBaseRepository<
  TTable extends TableWithIdAndTimestamps,
  TSelect,
  TInsert,
>(db: DrizzleDatabase, table: TTable): BaseRepository<TSelect, TInsert> {
  return {
    create(data: TInsert): TSelect {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return db.insert(table).values(data as any).returning().get() as TSelect;
    },

    delete(id: number): boolean {
      const result = db.delete(table).where(eq(table.id, id)).run();
      return result.changes > 0;
    },

    findById(id: number): TSelect | undefined {
      return db.select().from(table).where(eq(table.id, id)).get() as TSelect | undefined;
    },

    update(id: number, data: Partial<TInsert>): TSelect | undefined {
      return db
        .update(table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` } as any)
        .where(eq(table.id, id))
        .returning()
        .get() as TSelect | undefined;
    },
  };
}
