import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const codes = pgTable('codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
