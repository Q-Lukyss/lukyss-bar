import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL manquante');

  const pool = new Pool({ connectionString: databaseUrl });

  await pool.query(`
    ALTER TABLE "cocktails" ADD COLUMN IF NOT EXISTS "description" text;
  `);

  await pool.end();
  console.log('✅ Colonne description ajoutée à cocktails');
}

main().catch((err) => {
  console.error('❌ Migration échouée:', err);
  process.exit(1);
});
