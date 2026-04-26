export const dynamic = "force-dynamic";

import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { CartButton } from "@/components/cart-button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function imageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

type CocktailItem = Awaited<
  ReturnType<typeof api.functional.cocktails.list>
>[number];

async function getCocktails(): Promise<CocktailItem[]> {
  return api.functional.cocktails.list(getApiConnection());
}

function CocktailCard({ cocktail }: { cocktail: CocktailItem }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-800/30 bg-stone-900 p-6 transition-colors hover:border-amber-600/60">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/cocktails/${cocktail.id}`}>
          <h2 className="font-cinzel text-lg font-bold text-amber-400 transition-colors hover:text-amber-300">
            {cocktail.name}
          </h2>
        </Link>
        <span className="shrink-0 rounded-full bg-amber-600/20 px-3 py-1 font-playfair text-sm font-semibold text-amber-300">
          {cocktail.price.toFixed(2)} €
        </span>
      </div>
      {cocktail.image && (
        <img
          src={imageUrl(cocktail.image)!}
          alt={cocktail.name}
          className="h-40 w-full rounded-xl object-cover"
        />
      )}
      <AddToCartButton
        cocktailId={cocktail.id}
        name={cocktail.name}
        price={cocktail.price}
      />
    </div>
  );
}

export default async function HomePage() {
  let cocktails: CocktailItem[] | null = null;
  let error: string | null = null;

  try {
    cocktails = await getCocktails();
  } catch {
    error =
      "Impossible de contacter l'API. Vérifiez que le serveur est démarré sur le port 3001.";
  }

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-monoton text-3xl text-amber-500">Cocktails</h1>
            {cocktails && (
              <p className="font-playfair text-sm text-stone-500">
                {cocktails.length} cocktail{cocktails.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="rounded-full border border-amber-800/40 px-4 py-1.5 font-playfair text-sm text-amber-400 transition-colors hover:border-amber-600 hover:bg-amber-600/10"
            >
              Notifications
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-stone-700 px-4 py-1.5 font-playfair text-sm text-stone-400 transition-colors hover:border-stone-500 hover:text-stone-200"
            >
              Connexion
            </Link>
            <CartButton />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-6 font-playfair text-red-300">
            {error}
          </div>
        )}

        {cocktails?.length === 0 && (
          <p className="font-playfair text-stone-400">
            Aucun cocktail trouvé. Lance le seed :{" "}
            <code className="text-amber-400">npm run db:seed</code>
          </p>
        )}

        {cocktails && cocktails.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cocktails.map((cocktail) => (
              <CocktailCard key={cocktail.id} cocktail={cocktail} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
