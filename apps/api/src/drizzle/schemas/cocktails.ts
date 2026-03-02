import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const cocktails = pgTable('coktails', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  image: text('image'),
  price: integer('price').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
