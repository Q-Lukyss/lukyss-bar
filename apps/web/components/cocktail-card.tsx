import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";

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
};

export function CocktailCard({ cocktail }: { cocktail: CocktailCardData }) {
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
