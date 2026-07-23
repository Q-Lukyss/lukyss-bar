export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { cocktails } from "@lukyss-bar/api-types";

export const metadata: Metadata = { title: "Accueil" };
import { getApiConnection } from "@/lib/api";
import { Nav } from "@/components/nav";
import { HeroSection } from "@/components/hero-section";
import {
  CocktailsSection,
  type CocktailWithIngredients,
} from "@/components/cocktails-section";
import { Footer } from "@/components/footer";

async function getCocktailsWithIngredients(): Promise<
  CocktailWithIngredients[]
> {
  const list = await cocktails.list(getApiConnection());
  return Promise.all(
    list.map((c) => cocktails.getById(getApiConnection(), c.id))
  );
}

export default async function HomePage() {
  let cocktailsList: CocktailWithIngredients[] | null = null;
  let error: string | null = null;

  try {
    cocktailsList = await getCocktailsWithIngredients();
  } catch {
    error =
      "Impossible de contacter l'API. Vérifiez que le serveur est démarré sur le port 3001.";
  }

  return (
    <main className="min-h-screen bg-stone-950">
      <Nav />
      <HeroSection />

      {error && (
        <div className="px-6 py-4">
          <div className="mx-auto max-w-4xl rounded-xl border border-red-800/50 bg-red-950/40 p-6 font-playfair text-red-300">
            {error}
          </div>
        </div>
      )}

      {cocktailsList !== null && <CocktailsSection cocktails={cocktailsList} />}

      <Footer />
    </main>
  );
}
