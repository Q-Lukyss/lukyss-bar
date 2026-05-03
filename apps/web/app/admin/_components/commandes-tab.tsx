"use client";

import { useState } from "react";
import type { IConnection } from "@nestia/fetcher";
import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";

type CommandeRow = Awaited<
  ReturnType<typeof api.functional.commandes.listAll>
>[number];

type CommandeView = Awaited<
  ReturnType<typeof api.functional.commandes.getById>
>;

type CocktailView = Awaited<
  ReturnType<typeof api.functional.cocktails.getById>
>;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  IN_PREPARATION: "En préparation",
  READY: "Prête",
  COMPLETED: "Terminée",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as Array<
  keyof typeof STATUS_LABELS
>;

function authConnection(jwt: string): IConnection {
  return { ...getApiConnection(), headers: { Authorization: `Bearer ${jwt}` } };
}

export function CommandesTab({ jwt }: { jwt: string }) {
  const [commandes, setCommandes] = useState<CommandeRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commandeDetails, setCommandeDetails] = useState<Record<string, CommandeView>>({});
  const [cocktailDetails, setCocktailDetails] = useState<Record<string, CocktailView>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCommandes(
        await api.functional.commandes.listAll(authConnection(jwt)),
      );
    } catch {
      setError("Erreur lors du chargement des commandes.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.functional.commandes.status.updateStatus(
        authConnection(jwt),
        id,
        { status: status as CommandeRow["status"] },
      );
      await load();
    } catch {
      setError("Erreur lors de la mise à jour.");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      await api.functional.commandes._delete(authConnection(jwt), id);
      setConfirmDelete(null);
      await load();
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setDeleting(null);
    }
  };

  const toggleDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (commandeDetails[id]) return;

    setLoadingDetail(id);
    try {
      const view = await api.functional.commandes.getById(authConnection(jwt), id);
      setCommandeDetails((prev) => ({ ...prev, [id]: view }));

      const uniqueCocktailIds = [...new Set(view.items.map((i) => i.cocktailId))];
      const missing = uniqueCocktailIds.filter((cid) => !cocktailDetails[cid]);

      if (missing.length > 0) {
        const results = await Promise.all(
          missing.map((cid) => api.functional.cocktails.getById(getApiConnection(), cid)),
        );
        setCocktailDetails((prev) => {
          const next = { ...prev };
          missing.forEach((cid, i) => { next[cid] = results[i]!; });
          return next;
        });
      }
    } catch {
      setError("Erreur lors du chargement du détail.");
    } finally {
      setLoadingDetail(null);
    }
  };

  if (!commandes && !loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="font-playfair text-stone-500">
          Cliquez pour charger les commandes.
        </p>
        <button
          onClick={load}
          className="rounded-xl bg-amber-600 px-6 py-2.5 font-cinzel font-bold text-stone-950 transition-colors hover:bg-amber-500"
        >
          Charger
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {commandes !== null && (
          <p className="font-playfair text-sm text-stone-500">
            {commandes.length} commande{commandes.length > 1 ? "s" : ""}
          </p>
        )}
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto rounded-lg border border-amber-800/40 px-4 py-1.5 font-playfair text-sm text-amber-400 transition-colors hover:border-amber-600 disabled:opacity-50"
        >
          {loading ? "Chargement…" : "Rafraîchir"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-4 font-playfair text-sm text-red-300">
          {error}
        </div>
      )}

      {commandes?.length === 0 && (
        <p className="font-playfair text-stone-600">Aucune commande.</p>
      )}

      {commandes?.map((cmd) => {
        const detail = commandeDetails[cmd.id];
        const isExpanded = expandedId === cmd.id;
        const isLoadingDetail = loadingDetail === cmd.id;

        return (
          <div
            key={cmd.id}
            className="flex flex-col gap-3 rounded-xl border border-amber-800/30 bg-stone-900 p-5 transition-colors hover:border-amber-800/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-cinzel font-bold text-amber-400">
                  {cmd.customerName}
                </p>
                <p className="font-mono text-xs text-stone-600">{cmd.id}</p>
                {cmd.promoCode && (
                  <p className="font-playfair text-xs text-stone-500">
                    Code : {cmd.promoCode}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-amber-600/20 px-3 py-1 font-playfair text-xs text-amber-300">
                {cmd.totalPrice.toFixed(2)} €
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-playfair text-sm text-stone-400">
                  Statut :
                </span>
                <select
                  value={cmd.status}
                  disabled={updating === cmd.id}
                  onChange={(e) => updateStatus(cmd.id, e.target.value)}
                  className="rounded-lg bg-stone-800 px-3 py-1.5 font-playfair text-sm text-stone-100 outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                {updating === cmd.id && (
                  <span className="animate-pulse font-playfair text-xs text-stone-500">
                    Mise à jour…
                  </span>
                )}
              </div>

              {confirmDelete === cmd.id ? (
                <div className="flex items-center gap-2">
                  <span className="font-playfair text-xs text-stone-400">
                    Confirmer ?
                  </span>
                  <button
                    onClick={() => handleDelete(cmd.id)}
                    disabled={deleting === cmd.id}
                    className="rounded-lg bg-red-900/60 px-3 py-1 font-playfair text-xs text-red-300 transition-colors hover:bg-red-800/60 disabled:opacity-50"
                  >
                    {deleting === cmd.id ? "…" : "Oui"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="font-playfair text-xs text-stone-600 transition-colors hover:text-stone-400"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(cmd.id)}
                  className="font-playfair text-xs text-stone-600 transition-colors hover:text-red-400"
                >
                  Supprimer
                </button>
              )}
            </div>

            <button
              onClick={() => toggleDetail(cmd.id)}
              className="self-start font-playfair text-xs text-stone-500 transition-colors hover:text-amber-400"
            >
              {isLoadingDetail
                ? "Chargement…"
                : isExpanded
                  ? "▲ Masquer le détail"
                  : "▼ Voir le détail"}
            </button>

            {isExpanded && detail && (
              <div className="flex flex-col gap-3 border-t border-stone-800 pt-3">
                {detail.items.map((item) => {
                  const cocktail = cocktailDetails[item.cocktailId];
                  return (
                    <div key={item.id} className="flex flex-col gap-1.5">
                      <p className="font-cinzel text-sm font-semibold text-amber-300">
                        {item.cocktailName}{" "}
                        <span className="text-stone-400">× {item.quantity}</span>
                      </p>
                      {cocktail ? (
                        <ul className="ml-3 flex flex-col gap-0.5">
                          {cocktail.ingredients.map((ing) => (
                            <li
                              key={ing.id}
                              className={`font-playfair text-xs ${ing.stock ? "text-stone-400" : "text-red-400 line-through"}`}
                            >
                              {ing.name} — {ing.quantity} {ing.unity}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="ml-3 font-playfair text-xs text-stone-600">
                          Chargement des ingrédients…
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
