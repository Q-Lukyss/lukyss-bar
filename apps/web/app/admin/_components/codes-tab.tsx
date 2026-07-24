"use client";

import { useState, useEffect } from "react";
import { codes, type CodeRow } from "@lukyss-bar/api-types";
import { authConnection } from "@/lib/api";

export function CodesTab({ jwt }: { jwt: string }) {
  const [codesList, setCodesList] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setCodesList(await codes.list(authConnection(jwt)));
    } catch {
      setError("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- load n'est pas mémoïsée, ne l'exécuter qu'au montage
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await codes.create(authConnection(jwt), {
        code: newCode.trim().toUpperCase() || null,
      });
      setNewCode("");
      await load();
    } catch {
      setError("Erreur lors de la création.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      await codes.delete(authConnection(jwt), id);
      await load();
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-primary/60 bg-card p-5 flex flex-col gap-3">
        <h3 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nouveau code promo
        </h3>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="Code (laisser vide pour auto-générer)"
            className="flex-1 rounded-lg bg-secondary px-4 py-2.5 font-playfair uppercase tracking-widest text-foreground outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-primary px-5 py-2.5 font-cinzel font-bold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "..." : "Créer"}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 font-playfair text-sm text-destructive">
          {error}
        </div>
      )}

      <p className="font-playfair text-sm text-muted-foreground">
        {loading ? "Chargement..." : `${codesList.length} code${codesList.length > 1 ? "s" : ""}`}
      </p>

      <div className="flex flex-col gap-2">
        {codesList.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-primary/45 bg-card px-5 py-3 flex items-center justify-between gap-4"
          >
            <span className="font-mono text-sm font-bold tracking-widest text-primary">
              {c.code}
            </span>
            <button
              onClick={() => handleDelete(c.id)}
              disabled={deleting === c.id}
              className="font-playfair text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
            >
              {deleting === c.id ? "..." : "Supprimer"}
            </button>
          </div>
        ))}
        {codesList.length === 0 && !loading && (
          <p className="font-playfair text-muted-foreground">Aucun code promo.</p>
        )}
      </div>
    </div>
  );
}
