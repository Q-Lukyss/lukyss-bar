"use client";

import { useState, useEffect, useRef } from "react";
import type { IConnection } from "@nestia/fetcher";
import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const imageUrl = (p: string | null) =>
  !p ? null : p.startsWith("http") ? p : `${API_URL}${p}`;

type CocktailRow = Awaited<ReturnType<typeof api.functional.cocktails.list>>[number];

function authConnection(jwt: string): IConnection {
  return { ...getApiConnection(), headers: { Authorization: `Bearer ${jwt}` } };
}

function CocktailForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: CocktailRow;
  onSubmit: (data: { name: string; price: number; image: File | null }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [image, setImage] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-amber-800/30 bg-stone-900 p-5 flex flex-col gap-4">
      <h3 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-stone-500">
        {initial ? "Modifier le cocktail" : "Nouveau cocktail"}
      </h3>
      <div className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du cocktail"
          className="rounded-lg bg-stone-800 px-4 py-2.5 font-playfair text-stone-100 outline-none focus:ring-1 focus:ring-amber-600"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Prix (€)"
          min="0"
          step="0.01"
          className="rounded-lg bg-stone-800 px-4 py-2.5 font-playfair text-stone-100 outline-none focus:ring-1 focus:ring-amber-600"
        />
        <div className="flex flex-col gap-1">
          <label className="font-playfair text-sm text-stone-400">
            Image {initial && "(laisser vide pour conserver)"}
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="font-playfair text-sm text-stone-400 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-700 file:px-3 file:py-1.5 file:font-playfair file:text-stone-300"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onSubmit({ name, price: parseFloat(price), image })}
          disabled={loading || !name.trim() || !price}
          className="flex-1 rounded-xl bg-amber-600 py-2.5 font-cinzel font-bold text-stone-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-stone-700 px-4 py-2.5 font-playfair text-sm text-stone-400 transition-colors hover:text-stone-200"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

export function CocktailsTab({ jwt }: { jwt: string }) {
  const [cocktails, setCocktails] = useState<CocktailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCocktails(await api.functional.cocktails.list(getApiConnection()));
    } catch {
      setError("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: { name: string; price: number; image: File | null }) => {
    setSaving(true);
    setError(null);
    try {
      await api.functional.cocktails.create(authConnection(jwt), {
        name: data.name,
        price: data.price,
        image: data.image ?? undefined,
      });
      setShowCreate(false);
      await load();
    } catch {
      setError("Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: { name: string; price: number; image: File | null }) => {
    setSaving(true);
    setError(null);
    try {
      await api.functional.cocktails.update(authConnection(jwt), id, {
        name: data.name,
        price: data.price,
        ...(data.image ? { image: data.image } : {}),
      });
      setEditId(null);
      await load();
    } catch {
      setError("Erreur lors de la modification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-playfair text-sm text-stone-500">
          {loading ? "Chargement..." : `${cocktails.length} cocktail${cocktails.length > 1 ? "s" : ""}`}
        </p>
        {!showCreate && (
          <button
            onClick={() => { setShowCreate(true); setEditId(null); }}
            className="rounded-lg border border-amber-800/40 px-4 py-1.5 font-playfair text-sm text-amber-400 transition-colors hover:border-amber-600"
          >
            + Nouveau
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-4 font-playfair text-sm text-red-300">
          {error}
        </div>
      )}

      {showCreate && (
        <CocktailForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={saving}
        />
      )}

      <div className="flex flex-col gap-3">
        {cocktails.map((c) =>
          editId === c.id ? (
            <CocktailForm
              key={c.id}
              initial={c}
              onSubmit={(data) => handleUpdate(c.id, data)}
              onCancel={() => setEditId(null)}
              loading={saving}
            />
          ) : (
            <div
              key={c.id}
              className="rounded-xl border border-amber-800/30 bg-stone-900 p-5 flex items-center gap-4"
            >
              {c.image && (
                <img src={imageUrl(c.image)!} alt={c.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-cinzel font-bold text-amber-400 truncate">{c.name}</p>
                <p className="font-playfair text-sm text-stone-500">{c.price.toFixed(2)} €</p>
              </div>
              <button
                onClick={() => { setEditId(c.id); setShowCreate(false); }}
                className="font-playfair text-xs text-stone-500 transition-colors hover:text-amber-400"
              >
                Modifier
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
