import type { Metadata } from "next";
import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Footer } from "@/components/footer";
import { stonePlaceholder } from "@/lib/blur";
import { imageUrl } from "@/lib/image-url";

type CocktailDetail = Awaited<
  ReturnType<typeof api.functional.cocktails.getById>
>;

async function getCocktail(id: string): Promise<CocktailDetail> {
  return api.functional.cocktails.getById(getApiConnection(), id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const cocktail = await getCocktail(id);
    return { title: cocktail.name };
  } catch {
    return { title: "Cocktail" };
  }
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
    <div className="flex min-h-screen flex-col bg-stone-950">
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          {/* Navigation */}
          <div className="mb-8 flex items-center justify-between animate-fade-in">
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
            <div className="animate-slide-in-left relative h-64 overflow-hidden rounded-2xl md:h-[480px]">
              {cocktail.image ? (
                <Image
                  src={imageUrl(cocktail.image)!}
                  alt={cocktail.name}
                  fill
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={stonePlaceholder}
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-amber-800/20 bg-stone-900 md:h-[480px]">
                  <span className="font-cinzel text-stone-600">
                    Pas d&apos;image
                  </span>
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
            <div className="animate-slide-in-right flex flex-col gap-6 rounded-2xl border border-amber-800/30 bg-stone-900 p-8">
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-cinzel text-3xl font-bold text-amber-400">
                  {cocktail.name}
                </h1>
                <span className="shrink-0 rounded-full bg-amber-600/20 px-4 py-1.5 font-playfair text-lg font-semibold text-amber-300">
                  {cocktail.price.toFixed(2)} €
                </span>
              </div>

              {cocktail.description && (
                <p className="font-playfair text-sm italic leading-relaxed text-stone-300">
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
      <Footer />
    </div>
  );
}
