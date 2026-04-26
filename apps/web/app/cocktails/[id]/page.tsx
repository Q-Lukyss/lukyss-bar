import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";

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

  const price = (cocktail.price / 100).toFixed(2);

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/cocktails"
            className="font-playfair text-sm text-stone-400 transition-colors hover:text-amber-400"
          >
            ← Retour
          </Link>
          <Link
            href="/panier"
            className="rounded-full border border-amber-800/40 px-4 py-1.5 font-playfair text-sm text-amber-400 transition-colors hover:border-amber-600 hover:bg-amber-600/10"
          >
            Panier
          </Link>
        </div>

        <div className="rounded-2xl border border-amber-800/30 bg-stone-900 p-8 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-cinzel text-3xl font-bold text-amber-400">
              {cocktail.name}
            </h1>
            <span className="shrink-0 rounded-full bg-amber-600/20 px-4 py-1.5 font-playfair text-lg font-semibold text-amber-300">
              {price} €
            </span>
          </div>

          {cocktail.image && (
            <img
              src={cocktail.image}
              alt={cocktail.name}
              className="h-56 w-full rounded-xl object-cover"
            />
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
                    className={`rounded-full px-3 py-1 font-playfair text-sm ${
                      ing.stock
                        ? "bg-stone-800 text-stone-300"
                        : "bg-red-950/40 text-red-400 line-through"
                    }`}
                  >
                    {ing.name} — {ing.quantity} {ing.unity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AddToCartButton
            cocktailId={cocktail.id}
            name={cocktail.name}
            price={cocktail.price}
          />
        </div>
      </div>
    </main>
  );
}
