export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import api from "@ORGANIZATION/PROJECT-api";

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
  const list = await api.functional.cocktails.list(getApiConnection());
  return Promise.all(
    list.map((c) => api.functional.cocktails.getById(getApiConnection(), c.id))
  );
}

export default async function HomePage() {
  let cocktails: CocktailWithIngredients[] | null = null;
  let error: string | null = null;

  try {
    cocktails = await getCocktailsWithIngredients();
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

      {cocktails !== null && <CocktailsSection cocktails={cocktails} />}

      <Footer />
    </main>
  );
}
