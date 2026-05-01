import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function imageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

type CocktailDetail = Awaited<
  ReturnType<typeof api.functional.cocktails.getById>
>;

async function getCocktail(id: string): Promise<CocktailDetail> {
  return api.functional.cocktails.getById(getApiConnection(), id);
}

export default async function CocktailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let cocktail: CocktailDetail;
  try {
    cocktail = await getCocktail(id);
  } catch {
    notFound();
  }

  const isOutOfStock = cocktail.ingredients.some((ing) => !ing.stock);

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/#cocktails"
            className="font-playfair text-sm text-stone-400 transition-colors hover:text-amber-400"
          >
            ← Retour à la carte
          </Link>
          <Link
            href="/panier"
            className="rounded-full border border-amber-800/40 px-4 py-1.5 font-playfair text-sm text-amber-400 transition-colors hover:border-amber-600 hover:bg-amber-600/10"
          >
            Panier
          </Link>
        </div>

        {/* Layout 2 colonnes */}
        <div className="grid items-start gap-8 md:grid-cols-2">
          {/* Colonne gauche : image */}
          <div className="relative overflow-hidden rounded-2xl">
            {cocktail.image ? (
              <img
                src={imageUrl(cocktail.image)!}
                alt={cocktail.name}
                className="w-full object-cover md:h-[480px]"
              />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-amber-800/20 bg-stone-900 md:h-[480px]">
                <span className="font-cinzel text-stone-600">Pas d&apos;image</span>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-950/70">
                <span className="rounded-full bg-red-900/80 px-6 py-2 font-cinzel text-sm font-bold uppercase tracking-widest text-red-300">
                  Hors stock
                </span>
              </div>
            )}
          </div>

          {/* Colonne droite : infos */}
          <div className="flex flex-col gap-6 rounded-2xl border border-amber-800/30 bg-stone-900 p-8">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-cinzel text-3xl font-bold text-amber-400">
                {cocktail.name}
              </h1>
              <span className="shrink-0 rounded-full bg-amber-600/20 px-4 py-1.5 font-playfair text-lg font-semibold text-amber-300">
                {cocktail.price.toFixed(2)} €
              </span>
            </div>

            {cocktail.description && (
              <p className="font-playfair text-sm leading-relaxed text-stone-300 italic">
                {cocktail.description}
              </p>
            )}

            {cocktail.ingredients.length > 0 && (
              <div>
                <h2 className="mb-3 font-cinzel text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Ingrédients
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {cocktail.ingredients.map((ing) => (
                    <li
                      key={ing.id}
                      className={`rounded-full px-3 py-1 font-playfair text-sm transition-colors ${
                        ing.stock
                          ? "bg-stone-800 text-stone-300"
                          : "bg-red-950/40 text-red-400 line-through"
                      }`}
                    >
                      {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto">
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-lg bg-stone-800 py-3 font-playfair text-stone-500"
                >
                  Non disponible
                </button>
              ) : (
                <AddToCartButton
                  cocktailId={cocktail.id}
                  name={cocktail.name}
                  price={cocktail.price}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
