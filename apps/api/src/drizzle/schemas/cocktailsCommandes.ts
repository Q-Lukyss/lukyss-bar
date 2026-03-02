import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { cocktails } from './cocktails';
import { commandes } from './commandes';

export const cocktailsCommandes = pgTable('cocktails_commandes', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  cocktailId: text('cocktail_id')
    .notNull()
    .references(() => cocktails.id),
  quantity: integer('quantity').notNull(),
  commandeId: text('commande_id')
    .notNull()
    .references(() => commandes.id),
});
