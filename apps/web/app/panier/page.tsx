"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";

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
      const result = await api.functional.commandes.create(getApiConnection(), {
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
    <main className="min-h-screen bg-stone-950 px-6 py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-monoton text-3xl text-amber-500">Panier</h1>
            {count > 0 && (
              <p className="mt-1 font-playfair text-sm text-stone-400">
                {count} article{count > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Link
            href="/cocktails"
            className="font-playfair text-sm text-stone-400 transition-colors hover:text-amber-400"
          >
            ← Cocktails
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-stone-800 bg-stone-900 p-10 text-center flex flex-col items-center gap-4">
            <p className="font-playfair text-stone-400">Votre panier est vide.</p>
            <Link
              href="/cocktails"
              className="font-playfair text-amber-400 transition-colors hover:text-amber-300"
            >
              → Voir les cocktails
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="rounded-xl border border-amber-800/30 bg-stone-900 p-6 flex flex-col gap-3">
              <h2 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-stone-500">
                Articles
              </h2>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li
                    key={item.cocktailId}
                    className="flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-cinzel text-sm text-amber-300">
                        {item.name}
                      </p>
                      <p className="font-playfair text-xs text-stone-500">
                        x{item.quantity} —{" "}
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.cocktailId)}
                      className="font-playfair text-xs text-stone-600 transition-colors hover:text-red-400"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-stone-800 pt-3 flex justify-between font-playfair text-sm">
                <span className="text-stone-400">Total estimé</span>
                <span className="font-semibold text-amber-400">
                  {total.toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-800/30 bg-stone-900 p-6 flex flex-col gap-4">
              <h2 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-stone-500">
                Informations
              </h2>
              <div className="flex flex-col gap-1">
                <label className="font-playfair text-sm text-stone-400">
                  Votre prénom *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="Ex : Jean"
                  className="rounded-lg bg-stone-800 px-4 py-2 font-playfair text-stone-100 outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-playfair text-sm text-stone-400">
                  Code promo
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Ex : LUKYSS10"
                  className="rounded-lg bg-stone-800 px-4 py-2 font-playfair text-stone-100 uppercase tracking-widest outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-4 font-playfair text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !customerName.trim()}
              className="w-full rounded-xl bg-amber-600 py-3 font-cinzel font-bold text-stone-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Commander"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
