"use client";

import { useState, useEffect } from "react";
import type { IConnection } from "@nestia/fetcher";
import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";

type CodeRow = Awaited<ReturnType<typeof api.functional.codes.list>>[number];

function authConnection(jwt: string): IConnection {
  return { ...getApiConnection(), headers: { Authorization: `Bearer ${jwt}` } };
}

export function CodesTab({ jwt }: { jwt: string }) {
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setCodes(await api.functional.codes.list(authConnection(jwt)));
    } catch {
      setError("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.functional.codes.create(authConnection(jwt), {
        code: newCode.trim().toUpperCase() || undefined,
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
      await api.functional.codes._delete(authConnection(jwt), id);
      await load();
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-amber-800/30 bg-stone-900 p-5 flex flex-col gap-3">
        <h3 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-stone-500">
          Nouveau code promo
        </h3>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="Code (laisser vide pour auto-générer)"
            className="flex-1 rounded-lg bg-stone-800 px-4 py-2.5 font-playfair uppercase tracking-widest text-stone-100 outline-none focus:ring-1 focus:ring-amber-600"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-amber-600 px-5 py-2.5 font-cinzel font-bold text-stone-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "..." : "Créer"}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-4 font-playfair text-sm text-red-300">
          {error}
        </div>
      )}

      <p className="font-playfair text-sm text-stone-500">
        {loading ? "Chargement..." : `${codes.length} code${codes.length > 1 ? "s" : ""}`}
      </p>

      <div className="flex flex-col gap-2">
        {codes.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-amber-800/20 bg-stone-900 px-5 py-3 flex items-center justify-between gap-4"
          >
            <span className="font-mono text-sm font-bold tracking-widest text-amber-300">
              {c.code}
            </span>
            <button
              onClick={() => handleDelete(c.id)}
              disabled={deleting === c.id}
              className="font-playfair text-xs text-stone-600 transition-colors hover:text-red-400 disabled:opacity-50"
            >
              {deleting === c.id ? "..." : "Supprimer"}
            </button>
          </div>
        ))}
        {codes.length === 0 && !loading && (
          <p className="font-playfair text-stone-600">Aucun code promo.</p>
        )}
      </div>
    </div>
  );
}
