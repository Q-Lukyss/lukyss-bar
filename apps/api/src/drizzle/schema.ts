import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

export const coktails = pgTable('coktails', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const cocktailsIngredients = pgTable('cocktails_ingredients', {
  id: text('id').primaryKey(),
  cocktailId: text('cocktail_id')
    .notNull()
    .references(() => coktails.id),
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

export const ingredients = pgTable('ingredients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  stock: integer('stock').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
export const commandes = pgTable('commandes', {});
export const users = pgTable('users', {});
