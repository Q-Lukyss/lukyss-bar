"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";

type CommandeView = Awaited<
  ReturnType<typeof api.functional.commandes._public.getByPublicToken>
>;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de confirmation",
  CONFIRMED: "Confirmée",
  IN_PREPARATION: "En préparation",
  READY: "Prête à récupérer !",
  COMPLETED: "Terminée",
};

const STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "IN_PREPARATION",
  "READY",
  "COMPLETED",
];

export default function CommandeTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<CommandeView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const fetchCommande = useCallback(async () => {
    try {
      const result =
        await api.functional.commandes._public.getByPublicToken(
          getApiConnection(),
          token,
        );
      setData(result);
      setError(null);
    } catch {
      setError("Commande introuvable ou lien expiré.");
    }
  }, [token]);

  useEffect(() => {
    fetchCommande();
  }, [fetchCommande]);

  useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

    const socket = io(apiUrl, { transports: ["websocket"] });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join:commande", token);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("commande:status", ({ status }: { status: string }) => {
      setData((prev) =>
        prev
          ? { ...prev, commande: { ...prev.commande, status: status as CommandeView["commande"]["status"] } }
          : prev,
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6">
        <div className="text-center">
          <p className="font-playfair text-red-400">{error}</p>
          <Link
            href="/cocktails"
            className="mt-4 inline-block font-playfair text-sm text-amber-400 hover:text-amber-300"
          >
            → Retour aux cocktails
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950">
        <p className="animate-pulse font-playfair text-stone-400">
          Chargement...
        </p>
      </main>
    );
  }

  const { commande, items } = data;
  const currentIdx = STATUS_ORDER.indexOf(commande.status);

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-12">
      <div className="mx-auto max-w-xl flex flex-col gap-8">
        <div>
          <h1 className="font-monoton text-2xl text-amber-500">
            Suivi de commande
          </h1>
          <p className="mt-1 flex items-center gap-2 font-playfair text-sm text-stone-500">
            {commande.customerName}
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                connected ? "bg-green-500" : "bg-stone-600"
              }`}
              title={connected ? "Connecté en temps réel" : "Déconnecté"}
            />
            <span className="text-xs">
              {connected ? "temps réel" : "reconnexion..."}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-amber-800/30 bg-stone-900 p-6">
          <ol className="flex flex-col gap-4">
            {STATUS_ORDER.map((status, idx) => {
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <li key={status} className="flex items-center gap-3">
                  <span
                    className={`flex h-4 w-4 shrink-0 rounded-full transition-all duration-500 ${
                      isCurrent
                        ? "bg-amber-500 ring-4 ring-amber-500/25"
                        : isPast
                          ? "bg-amber-800"
                          : "bg-stone-700"
                    }`}
                  />
                  <span
                    className={`font-playfair text-sm transition-colors duration-300 ${
                      isCurrent
                        ? "font-semibold text-amber-400"
                        : isPast
                          ? "text-stone-600 line-through"
                          : "text-stone-600"
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-xl border border-amber-800/30 bg-stone-900 p-6 flex flex-col gap-3">
          <h2 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-stone-500">
            Articles
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between font-playfair text-sm"
              >
                <span className="text-stone-300">
                  {item.cocktailName} ×{item.quantity}
                </span>
                <span className="text-stone-500">
                  {item.lineTotal.toFixed(2)} €
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-stone-800 pt-3 flex justify-between font-playfair text-sm">
            <span className="text-stone-400">Total</span>
            <span className="font-semibold text-amber-400">
              {commande.totalPrice.toFixed(2)} €
            </span>
          </div>
        </div>

        <Link
          href="/cocktails"
          className="text-center font-playfair text-sm text-stone-500 transition-colors hover:text-amber-400"
        >
          → Commander autre chose
        </Link>
      </div>
    </main>
  );
}
