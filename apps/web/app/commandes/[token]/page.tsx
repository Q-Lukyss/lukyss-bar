"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { commandes, type CommandeView } from "@lukyss-bar/api-types";
import { getApiConnection } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

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
      const result = await commandes.getByPublicToken(getApiConnection(), token);
      setData(result);
      setError(null);
    } catch {
      setError("Commande introuvable ou lien expiré.");
    }
  }, [token]);

  useEffect(() => {
    fetchCommande();
  }, [fetchCommande]);

  // WebSocket natif (remplace le client Socket.IO) : le token est dans l'URL,
  // pas de handshake "join:commande" nécessaire. Reconnexion avec un léger
  // délai tant que la page reste montée, pour retrouver le comportement de
  // reconnexion automatique de Socket.IO.
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const connect = () => {
      const wsUrl = commandes.wsUrl(getApiConnection(), token);
      socket = new WebSocket(wsUrl);

      socket.addEventListener("open", () => setConnected(true));

      socket.addEventListener("message", (event) => {
        try {
          const { status } = JSON.parse(event.data) as { status: string };
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  commande: {
                    ...prev.commande,
                    status: status as CommandeView["commande"]["status"],
                  },
                }
              : prev,
          );
        } catch {
          // message non-JSON ignoré
        }
      });

      socket.addEventListener("close", () => {
        setConnected(false);
        if (!stopped) reconnectTimer = setTimeout(connect, 2000);
      });
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [token]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <p className="font-playfair text-destructive">{error}</p>
          <Link
            href="/cocktails"
            className="mt-4 inline-block font-playfair text-sm text-primary hover:brightness-110"
          >
            → Retour aux cocktails
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="animate-pulse font-playfair text-muted-foreground">
          Chargement...
        </p>
      </main>
    );
  }

  const { commande, items } = data;
  const currentIdx = STATUS_ORDER.indexOf(commande.status);

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-xl flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-monoton text-2xl text-primary">
              Suivi de commande
            </h1>
            <p className="mt-1 flex items-center gap-2 font-playfair text-sm text-muted-foreground">
              {commande.customerName}
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  connected ? "bg-success" : "bg-muted-foreground"
                }`}
                title={connected ? "Connecté en temps réel" : "Déconnecté"}
              />
              <span className="text-xs">
                {connected ? "temps réel" : "reconnexion..."}
              </span>
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="rounded-xl border border-primary/60 bg-card p-6">
          <ol className="flex flex-col gap-4">
            {STATUS_ORDER.map((status, idx) => {
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <li key={status} className="flex items-center gap-3">
                  <span
                    className={`flex h-4 w-4 shrink-0 rounded-full transition-all duration-500 ${
                      isCurrent
                        ? "bg-primary ring-4 ring-primary/25"
                        : isPast
                          ? "bg-primary/90"
                          : "bg-muted"
                    }`}
                  />
                  <span
                    className={`font-playfair text-sm transition-colors duration-300 ${
                      isCurrent
                        ? "font-semibold text-primary"
                        : isPast
                          ? "text-muted-foreground line-through"
                          : "text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-xl border border-primary/60 bg-card p-6 flex flex-col gap-3">
          <h2 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Articles
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between font-playfair text-sm"
              >
                <span className="text-foreground">
                  {item.cocktailName} ×{item.quantity}
                </span>
                <span className="text-muted-foreground">
                  {item.lineTotal.toFixed(2)} €
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-3 flex justify-between font-playfair text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold text-primary">
              {commande.totalPrice.toFixed(2)} €
            </span>
          </div>
        </div>

        <Link
          href="/cocktails"
          className="text-center font-playfair text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          → Commander autre chose
        </Link>
      </div>
    </main>
  );
}
