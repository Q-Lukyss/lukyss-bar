import type { Metadata } from "next";
import { cocktails, type CocktailView } from "@lukyss-bar/api-types";
import { getApiConnection } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { stonePlaceholder } from "@/lib/blur";
import { imageUrl } from "@/lib/image-url";

async function getCocktail(id: string): Promise<CocktailView> {
  return cocktails.getById(getApiConnection(), id);
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

  let cocktail: CocktailView;
  try {
    cocktail = await getCocktail(id);
  } catch {
    notFound();
  }

  const isOutOfStock = cocktail.ingredients.some((ing) => !ing.stock);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          {/* Navigation */}
          <div className="mb-8 flex items-center justify-between animate-fade-in">
            <Link
              href="/#cocktails"
              className="font-playfair text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              ← Retour à la carte
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/panier"
                className="rounded-full border border-primary/70 px-4 py-1.5 font-playfair text-sm text-primary transition-colors hover:border-primary hover:bg-primary/10"
              >
                Panier
              </Link>
              <ThemeToggle />
            </div>
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
                <div className="flex h-64 items-center justify-center rounded-2xl border border-primary/45 bg-card md:h-[480px]">
                  <span className="font-cinzel text-muted-foreground">
                    Pas d&apos;image
                  </span>
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <span className="rounded-full bg-destructive/90 px-6 py-2 font-cinzel text-sm font-bold uppercase tracking-widest text-destructive-foreground">
                    Hors stock
                  </span>
                </div>
              )}
            </div>

            {/* Colonne droite : infos */}
            <div className="animate-slide-in-right flex flex-col gap-6 rounded-2xl border border-primary/60 bg-card p-8">
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-cinzel text-3xl font-bold text-primary">
                  {cocktail.name}
                </h1>
                <span className="shrink-0 rounded-full bg-primary/25 px-4 py-1.5 font-playfair text-lg font-semibold text-foreground">
                  {cocktail.price.toFixed(2)} €
                </span>
              </div>

              {cocktail.description && (
                <p className="font-playfair text-sm italic leading-relaxed text-muted-foreground">
                  {cocktail.description}
                </p>
              )}

              {cocktail.ingredients.length > 0 && (
                <div>
                  <h2 className="mb-3 font-cinzel text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ingrédients
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {cocktail.ingredients.map((ing) => (
                      <li
                        key={ing.id}
                        className={`rounded-full px-3 py-1 font-playfair text-sm transition-colors ${
                          ing.stock
                            ? "bg-secondary text-foreground"
                            : "bg-destructive/10 text-destructive line-through"
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
                    className="w-full cursor-not-allowed rounded-lg bg-muted py-3 font-playfair text-muted-foreground"
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
