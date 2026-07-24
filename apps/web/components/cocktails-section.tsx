"use client";

import { useState } from "react";
import { CocktailCard } from "@/components/cocktail-card";

export type CocktailWithIngredients = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  description: string | null;
  ingredients: {
    id: string;
    name: string;
    stock: boolean;
    quantity: number;
    unity: string;
  }[];
};

const SPIRIT_FILTERS = [
  { label: "Tous", value: "" },
  { label: "Rhum", value: "rhum" },
  { label: "Vodka", value: "vodka" },
  { label: "Gin", value: "gin" },
  { label: "Whisky", value: "whisky" },
  { label: "Tequila", value: "tequila" },
  { label: "Autres", value: "autres" },
];

const KNOWN_SPIRITS = ["rhum", "vodka", "gin", "whisky", "whiskey", "tequila"];

function matchesFilter(
  cocktail: CocktailWithIngredients,
  filter: string,
): boolean {
  if (!filter) return true;
  if (filter === "autres") {
    return !KNOWN_SPIRITS.some((spirit) =>
      cocktail.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(spirit),
      ),
    );
  }
  return cocktail.ingredients.some((ing) =>
    ing.name.toLowerCase().includes(filter),
  );
}

export function CocktailsSection({
  cocktails,
}: {
  cocktails: CocktailWithIngredients[];
}) {
  const [activeFilter, setActiveFilter] = useState("");
  const [search, setSearch] = useState("");

  const filtered = cocktails.filter(
    (c) =>
      (matchesFilter(c, activeFilter) &&
        c.name.toLowerCase().includes(search.toLowerCase())) ||
      c.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <section id="cocktails" className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-primary/60" />
            <h2 className="font-cinzel text-2xl font-bold text-primary">
              La Carte
            </h2>
            <div className="h-px flex-1 bg-primary/60" />
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un cocktail ou ingrédient…"
            className="w-full rounded-xl border border-primary/60 bg-card px-4 py-2.5 font-playfair text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/90"
          />

          <div className="flex flex-wrap gap-2">
            {SPIRIT_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-1.5 font-playfair text-sm transition-all duration-200 ${
                  activeFilter === filter.value
                    ? "bg-primary font-semibold text-primary-foreground scale-105"
                    : "border border-primary/70 text-primary hover:border-primary hover:bg-primary/10"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <p className="font-playfair text-sm text-muted-foreground">
            {filtered.length} cocktail{filtered.length > 1 ? "s" : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="font-playfair text-muted-foreground">Aucun cocktail trouvé.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cocktail, index) => (
              <div
                key={cocktail.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CocktailCard
                  cocktail={{
                    ...cocktail,
                    isOutOfStock: cocktail.ingredients.some(
                      (ing) => !ing.stock,
                    ),
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
