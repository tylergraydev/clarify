import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dbCredentials: {
    url: './clarify-dev.db',
  },
  dialect: 'sqlite',
  out: './drizzle',
  schema: ['db/schema/index.ts'],
});
