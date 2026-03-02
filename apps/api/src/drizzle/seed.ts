import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import {
  ingredients,
  cocktails,
  cocktailsIngredients,
  commandes,
  cocktailsCommandes,
  codes,
  users,
} from './schema'; // ton barrel schema.ts qui export tout

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL manquante');

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  // Optionnel : reset en dev (attention, ça supprime TOUT)
  // Si tu veux un seed "rejouable", c'est pratique.
  await db.delete(cocktailsCommandes);
  await db.delete(cocktailsIngredients);
  await db.delete(commandes);
  await db.delete(cocktails);
  await db.delete(ingredients);
  await db.delete(codes);
  await db.delete(users);

  // 1) Ingredients
  const insertedIngredients = await db
    .insert(ingredients)
    .values([
      { name: 'Rhum blanc', stock: true },
      { name: 'Menthe', stock: true },
      { name: 'Citron vert', stock: true },
      { name: 'Sucre de canne', stock: true },
      { name: 'Eau gazeuse', stock: true },
      { name: 'Vodka', stock: true },
      { name: "Jus d'orange", stock: true },
      { name: 'Grenadine', stock: true },
    ])
    .returning();

  const ing = Object.fromEntries(insertedIngredients.map((i) => [i.name, i]));

  // 2) Cocktails
  const insertedCocktails = await db
    .insert(cocktails)
    .values([
      { name: 'Mojito', image: null, price: 9 },
      { name: 'Screwdriver', image: null, price: 8 },
      { name: 'Tequila Sunrise', image: null, price: 9 },
    ])
    .returning();

  const c = Object.fromEntries(insertedCocktails.map((x) => [x.name, x]));

  // 3) Cocktail <-> Ingredients (recettes)
  await db.insert(cocktailsIngredients).values([
    // Mojito
    {
      cocktailId: c['Mojito'].id,
      ingredientId: ing['Rhum blanc'].id,
      quantity: 5,
      unity: 'cl',
    },
    {
      cocktailId: c['Mojito'].id,
      ingredientId: ing['Menthe'].id,
      quantity: 10,
      unity: 'feuilles',
    },
    {
      cocktailId: c['Mojito'].id,
      ingredientId: ing['Citron vert'].id,
      quantity: 1,
      unity: 'pièce',
    },
    {
      cocktailId: c['Mojito'].id,
      ingredientId: ing['Sucre de canne'].id,
      quantity: 2,
      unity: 'cl',
    },
    {
      cocktailId: c['Mojito'].id,
      ingredientId: ing['Eau gazeuse'].id,
      quantity: 10,
      unity: 'cl',
    },

    // Screwdriver
    {
      cocktailId: c['Screwdriver'].id,
      ingredientId: ing['Vodka'].id,
      quantity: 5,
      unity: 'cl',
    },
    {
      cocktailId: c['Screwdriver'].id,
      ingredientId: ing["Jus d'orange"].id,
      quantity: 15,
      unity: 'cl',
    },

    // Tequila Sunrise (sans tequila dans ta liste, tu peux l’ajouter)
    {
      cocktailId: c['Tequila Sunrise'].id,
      ingredientId: ing["Jus d'orange"].id,
      quantity: 15,
      unity: 'cl',
    },
    {
      cocktailId: c['Tequila Sunrise'].id,
      ingredientId: ing['Grenadine'].id,
      quantity: 2,
      unity: 'cl',
    },
  ]);

  // 4) Commandes
  const insertedCommandes = await db
    .insert(commandes)
    .values([{ status: 'PENDING' }, { status: 'PAID' }])
    .returning();

  // 5) Cocktails <-> Commandes (lignes de commande)
  await db.insert(cocktailsCommandes).values([
    {
      commandeId: insertedCommandes[0].id,
      cocktailId: c['Mojito'].id,
      quantity: 2,
    },
    {
      commandeId: insertedCommandes[0].id,
      cocktailId: c['Screwdriver'].id,
      quantity: 1,
    },
    {
      commandeId: insertedCommandes[1].id,
      cocktailId: c['Tequila Sunrise'].id,
      quantity: 1,
    },
  ]);

  // 6) Codes (exemple)
  await db.insert(codes).values([{ code: 'GRANDOPENING' }]);

  // Users
  await db.insert(users).values([
    {
      name: 'Quentin Lachery',
      email: 'quentin.lkss@gmail.com',
      password: 'masterbarman',
      is_active: true,
      is_admin: true,
    },
  ]);

  await pool.end();
  console.log('✅ Seed OK');
}

main().catch((err) => {
  console.error('❌ Seed échoué:', err);
  process.exit(1);
});
