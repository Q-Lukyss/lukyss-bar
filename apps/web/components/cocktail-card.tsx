import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { stonePlaceholder } from "@/lib/blur";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function imageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

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
      className={`flex flex-col gap-3 rounded-2xl border bg-stone-900 p-6 transition-all duration-300 ${
        outOfStock
          ? "border-stone-700/50 opacity-75"
          : "border-amber-800/30 hover:border-amber-600/60 hover:shadow-lg hover:shadow-amber-900/20 hover:-translate-y-0.5"
      }`}
    >
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
            className={`flex items-center justify-center bg-stone-950/75 ${
              cocktail.image ? "absolute inset-0" : "py-6"
            }`}
          >
            <span className="rounded-full bg-red-900/80 px-4 py-1 font-cinzel text-xs font-bold uppercase tracking-widest text-red-300">
              Hors stock
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        <Link
          href={`/cocktails/${cocktail.id}`}
          className="rounded-lg border border-amber-800/30 px-4 py-2 font-playfair text-xs text-amber-400 transition-colors hover:border-amber-600 hover:bg-amber-600/10"
        >
          Détail
        </Link>
        {outOfStock ? (
          <button
            disabled
            className="flex-1 cursor-not-allowed rounded-lg bg-stone-800 py-2 font-playfair text-sm text-stone-500"
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
