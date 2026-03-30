import { integer, pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

export const commandeStatusEnum = pgEnum('commande_status', [
  'PENDING',
  'CONFIRMED',
  'IN_PREPARATION',
  'READY',
  'COMPLETED',
]);

export const commandes = pgTable('commandes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  customerName: text('customer_name').notNull(),
  promoCode: text('promo_code').notNull(),
  publicToken: text('public_token').notNull().unique(),
  totalPrice: integer('total_price').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  status: commandeStatusEnum('status').notNull().default('PENDING'),
});
