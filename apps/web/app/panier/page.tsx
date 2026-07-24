"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { commandes } from "@lukyss-bar/api-types";
import { getApiConnection } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PanierPage() {
  const { items, remove, clear, total, count } = useCart();
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await commandes.create(getApiConnection(), {
        customerName: customerName.trim(),
        promoCode: promoCode.trim(),
        items: items.map((i) => ({
          cocktailId: i.cocktailId,
          quantity: i.quantity,
        })),
      });
      clear();
      router.push(`/commandes/${result.commande.publicToken}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la commande.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-monoton text-3xl text-primary">Panier</h1>
            {count > 0 && (
              <p className="mt-1 font-playfair text-sm text-muted-foreground">
                {count} article{count > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/cocktails"
              className="font-playfair text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              ← Cocktails
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center flex flex-col items-center gap-4">
            <p className="font-playfair text-muted-foreground">Votre panier est vide.</p>
            <Link
              href="/cocktails"
              className="font-playfair text-primary transition-all hover:brightness-110"
            >
              → Voir les cocktails
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="rounded-xl border border-primary/60 bg-card p-6 flex flex-col gap-3">
              <h2 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Articles
              </h2>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li
                    key={item.cocktailId}
                    className="flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-cinzel text-sm text-primary">
                        {item.name}
                      </p>
                      <p className="font-playfair text-xs text-muted-foreground">
                        x{item.quantity} —{" "}
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.cocktailId)}
                      className="font-playfair text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border pt-3 flex justify-between font-playfair text-sm">
                <span className="text-muted-foreground">Total estimé</span>
                <span className="font-semibold text-primary">
                  {total.toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/60 bg-card p-6 flex flex-col gap-4">
              <h2 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Informations
              </h2>
              <div className="flex flex-col gap-1">
                <label className="font-playfair text-sm text-muted-foreground">
                  Votre prénom *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="Ex : Jean"
                  className="rounded-lg bg-secondary px-4 py-2 font-playfair text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-playfair text-sm text-muted-foreground">
                  Code promo
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Ex : LUKYSS10"
                  className="rounded-lg bg-secondary px-4 py-2 font-playfair text-foreground uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 font-playfair text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !customerName.trim()}
              className="w-full rounded-xl bg-primary py-3 font-cinzel font-bold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Commander"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
