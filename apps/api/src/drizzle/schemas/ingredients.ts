import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

export const ingredients = pgTable('ingredients', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: text('name').notNull(),
  stock: boolean('stock').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
