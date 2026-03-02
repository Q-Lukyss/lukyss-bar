import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: text('name').notNull(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  is_admin: boolean('is_admin').notNull(),
  is_active: boolean('is_active').notNull(),
});
