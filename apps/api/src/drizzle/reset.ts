import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL manquante');

  const pool = new Pool({ connectionString: databaseUrl });

  await pool.query(`
    DROP TABLE IF EXISTS cocktails_commandes, cocktails_ingredients, commandes, cocktails, ingredients, codes, users CASCADE;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
  `);

  await pool.end();
  console.log('✅ Reset OK — relance db:migrate puis db:seed');
}

main().catch((err) => {
  console.error('❌ Reset échoué:', err);
  process.exit(1);
});
