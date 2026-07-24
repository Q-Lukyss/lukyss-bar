import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { stonePlaceholder } from "@/lib/blur";
import { imageUrl } from "@/lib/image-url";

export type CocktailCardData = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  isOutOfStock?: boolean;
};

export function CocktailCard({ cocktail }: { cocktail: CocktailCardData }) {
  const outOfStock = cocktail.isOutOfStock ?? false;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border bg-card p-6 transition-all duration-300 ${
        outOfStock
          ? "border-border opacity-75"
          : "border-primary/60 hover:border-primary/90 hover:shadow-lg hover:shadow-primary/45 hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/cocktails/${cocktail.id}`}>
          <h2 className="font-cinzel text-lg font-bold text-primary transition-all hover:brightness-110">
            {cocktail.name}
          </h2>
        </Link>
        <span className="shrink-0 rounded-full bg-primary/25 px-3 py-1 font-playfair text-sm font-semibold text-foreground">
          {cocktail.price.toFixed(2)} €
        </span>
      </div>

      <div className="relative h-40 overflow-hidden rounded-xl">
        {cocktail.image && (
          <Image
            src={imageUrl(cocktail.image)!}
            alt={cocktail.name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            placeholder="blur"
            blurDataURL={stonePlaceholder}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        {outOfStock && (
          <div
            className={`flex items-center justify-center bg-background/75 ${
              cocktail.image ? "absolute inset-0" : "py-6"
            }`}
          >
            <span className="rounded-full bg-destructive/90 px-4 py-1 font-cinzel text-xs font-bold uppercase tracking-widest text-destructive-foreground">
              Hors stock
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        <Link
          href={`/cocktails/${cocktail.id}`}
          className="rounded-lg bg-primary px-4 py-2 font-playfair text-xs font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          Détail
        </Link>
        {outOfStock ? (
          <button
            disabled
            className="flex-1 cursor-not-allowed rounded-lg bg-muted py-2 font-playfair text-sm text-muted-foreground"
          >
            Non disponible
          </button>
        ) : (
          <div className="flex-1">
            <AddToCartButton
              cocktailId={cocktail.id}
              name={cocktail.name}
              price={cocktail.price}
            />
          </div>
        )}
      </div>
    </div>
  );
}
