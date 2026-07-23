import { auth, type ApiConnection } from "@lukyss-bar/api-types";

export function apiUrl(): string {
  return process.env.API_URL ?? "http://localhost:3001";
}

export function anonConnection(): ApiConnection {
  return { host: apiUrl() };
}

// Identifiants de l'utilisateur admin seedé par `apps/api/src/bin/seed.rs`
// (`npm run db:seed -w @lukyss-bar/api`) — il n'existe pas de route
// d'inscription, ces tests dépendent donc d'une base migrée + seedée.
const SEED_ADMIN_EMAIL = "quentin.lkss@gmail.com";
const SEED_ADMIN_PASSWORD = "masterbarman";

export async function adminConnection(): Promise<ApiConnection> {
  const { access_token } = await auth.login(anonConnection(), {
    email: SEED_ADMIN_EMAIL,
    password: SEED_ADMIN_PASSWORD,
  });
  return { host: apiUrl(), token: access_token };
}

/** Nom unique par exécution, pour ne pas entrer en collision entre deux runs
 * successifs sur la même base (les fixtures créées par ces tests ne sont pas
 * nettoyées après coup). */
export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
