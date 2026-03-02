import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

export const cocktails = pgTable('cocktails', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: text('name').notNull(),
  image: text('image'),
  price: integer('price').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
