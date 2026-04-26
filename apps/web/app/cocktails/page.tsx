export const dynamic = "force-dynamic";

import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { CartButton } from "@/components/cart-button";

type CocktailItem = Awaited<
  ReturnType<typeof api.functional.cocktails.list>
>[number];

async function getCocktails(): Promise<CocktailItem[]> {
  const connection = getApiConnection();
  return api.functional.cocktails.list(connection);
}

function CocktailCard({ cocktail }: { cocktail: CocktailItem }) {
  const price = cocktail.price.toFixed(2);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-800/30 bg-stone-900 p-6 transition-colors hover:border-amber-600/60">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/cocktails/${cocktail.id}`}>
          <h2 className="font-cinzel text-lg font-bold text-amber-400 transition-colors hover:text-amber-300">
            {cocktail.name}
          </h2>
        </Link>
        <span className="shrink-0 rounded-full bg-amber-600/20 px-3 py-1 font-playfair text-sm font-semibold text-amber-300">
          {price} €
        </span>
      </div>
      {cocktail.image && (
        <img
          src={cocktail.image}
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

export default async function CocktailsPage() {
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
            <p className="font-playfair text-stone-400">
              Liste récupérée via le{" "}
              <span className="text-amber-400">SDK Nestia</span> —{" "}
              <code className="rounded bg-stone-800 px-1 py-0.5 text-xs text-stone-300">
                api.functional.cocktails.list()
              </code>
            </p>
          </div>
          <CartButton />
        </div>

        {error && (
          <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-6 text-red-300 font-playfair">
            {error}
          </div>
        )}

        {cocktails && cocktails.length === 0 && (
          <p className="font-playfair text-stone-400">
            Aucun cocktail trouvé. Lance le seed :{" "}
            <code className="text-amber-400">npm run db:seed</code>
          </p>
        )}

        {cocktails && cocktails.length > 0 && (
          <>
            <p className="mb-6 font-playfair text-sm text-stone-500">
              {cocktails.length} cocktail{cocktails.length > 1 ? "s" : ""}{" "}
              trouvé{cocktails.length > 1 ? "s" : ""}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cocktails.map((cocktail) => (
                <CocktailCard key={cocktail.id} cocktail={cocktail} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
