import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const commandes = pgTable('commandes', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  status: text('status').notNull(),
});
