"use client";

import { useState } from "react";
import {
  commandes,
  cocktails,
  type CommandeRow,
  type CommandeView,
  type CocktailView,
} from "@lukyss-bar/api-types";
import { authConnection, getApiConnection } from "@/lib/api";

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

export function CommandesTab({ jwt }: { jwt: string }) {
  const [commandesList, setCommandesList] = useState<CommandeRow[] | null>(null);
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
      setCommandesList(await commandes.listAll(authConnection(jwt)));
    } catch {
      setError("Erreur lors du chargement des commandes.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await commandes.updateStatus(authConnection(jwt), id, {
        status,
      });
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
      await commandes.delete(authConnection(jwt), id);
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
      const view = await commandes.getById(authConnection(jwt), id);
      setCommandeDetails((prev) => ({ ...prev, [id]: view }));

      const uniqueCocktailIds = [...new Set(view.items.map((i) => i.cocktailId))];
      const missing = uniqueCocktailIds.filter((cid) => !cocktailDetails[cid]);

      if (missing.length > 0) {
        const results = await Promise.all(
          missing.map((cid) => cocktails.getById(getApiConnection(), cid)),
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

  if (!commandesList && !loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="font-playfair text-muted-foreground">
          Cliquez pour charger les commandes.
        </p>
        <button
          onClick={load}
          className="rounded-xl bg-primary px-6 py-2.5 font-cinzel font-bold text-primary-foreground transition-all hover:brightness-110"
        >
          Charger
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {commandesList !== null && (
          <p className="font-playfair text-sm text-muted-foreground">
            {commandesList.length} commande{commandesList.length > 1 ? "s" : ""}
          </p>
        )}
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto rounded-lg border border-primary/70 px-4 py-1.5 font-playfair text-sm text-primary transition-colors hover:border-primary disabled:opacity-50"
        >
          {loading ? "Chargement…" : "Rafraîchir"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 font-playfair text-sm text-destructive">
          {error}
        </div>
      )}

      {commandesList?.length === 0 && (
        <p className="font-playfair text-muted-foreground">Aucune commande.</p>
      )}

      {commandesList?.map((cmd) => {
        const detail = commandeDetails[cmd.id];
        const isExpanded = expandedId === cmd.id;
        const isLoadingDetail = loadingDetail === cmd.id;

        return (
          <div
            key={cmd.id}
            className="flex flex-col gap-3 rounded-xl border border-primary/60 bg-card p-5 transition-colors hover:border-primary/75"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-cinzel font-bold text-primary">
                  {cmd.customerName}
                </p>
                <p className="font-mono text-xs text-muted-foreground">{cmd.id}</p>
                {cmd.promoCode && (
                  <p className="font-playfair text-xs text-muted-foreground">
                    Code : {cmd.promoCode}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-primary/25 px-3 py-1 font-playfair text-xs font-semibold text-foreground">
                {cmd.totalPrice.toFixed(2)} €
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-playfair text-sm text-muted-foreground">
                  Statut :
                </span>
                <select
                  value={cmd.status}
                  disabled={updating === cmd.id}
                  onChange={(e) => updateStatus(cmd.id, e.target.value)}
                  className="rounded-lg bg-secondary px-3 py-1.5 font-playfair text-sm text-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                {updating === cmd.id && (
                  <span className="animate-pulse font-playfair text-xs text-muted-foreground">
                    Mise à jour…
                  </span>
                )}
              </div>

              {confirmDelete === cmd.id ? (
                <div className="flex items-center gap-2">
                  <span className="font-playfair text-xs text-muted-foreground">
                    Confirmer ?
                  </span>
                  <button
                    onClick={() => handleDelete(cmd.id)}
                    disabled={deleting === cmd.id}
                    className="rounded-lg bg-destructive/20 px-3 py-1 font-playfair text-xs text-destructive transition-colors hover:bg-destructive/30 disabled:opacity-50"
                  >
                    {deleting === cmd.id ? "…" : "Oui"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="font-playfair text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(cmd.id)}
                  className="font-playfair text-xs text-muted-foreground transition-colors hover:text-destructive"
                >
                  Supprimer
                </button>
              )}
            </div>

            <button
              onClick={() => toggleDetail(cmd.id)}
              className="self-start font-playfair text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              {isLoadingDetail
                ? "Chargement…"
                : isExpanded
                  ? "▲ Masquer le détail"
                  : "▼ Voir le détail"}
            </button>

            {isExpanded && detail && (
              <div className="flex flex-col gap-3 border-t border-border pt-3">
                {detail.items.map((item) => {
                  const cocktail = cocktailDetails[item.cocktailId];
                  return (
                    <div key={item.id} className="flex flex-col gap-1.5">
                      <p className="font-cinzel text-sm font-semibold text-primary">
                        {item.cocktailName}{" "}
                        <span className="text-muted-foreground">× {item.quantity}</span>
                      </p>
                      {cocktail ? (
                        <ul className="ml-3 flex flex-col gap-0.5">
                          {cocktail.ingredients.map((ing) => (
                            <li
                              key={ing.id}
                              className={`font-playfair text-xs ${ing.stock ? "text-muted-foreground" : "text-destructive line-through"}`}
                            >
                              {ing.name} — {ing.quantity} {ing.unity}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="ml-3 font-playfair text-xs text-muted-foreground">
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
