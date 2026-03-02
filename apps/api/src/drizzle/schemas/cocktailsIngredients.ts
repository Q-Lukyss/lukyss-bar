import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { cocktails } from './cocktails';
import { ingredients } from './ingredients';

export const cocktailsIngredients = pgTable('cocktails_ingredients', {
  id: text('id').primaryKey(),
  cocktailId: text('cocktail_id')
    .notNull()
    .references(() => cocktails.id),
  ingredientId: text('ingredient_id')
    .notNull()
    .references(() => ingredients.id),
  quantity: integer('quantity').notNull(),
  unity: text('quantity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
