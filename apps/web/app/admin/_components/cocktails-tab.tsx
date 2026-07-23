"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cocktails, type CocktailRow } from "@lukyss-bar/api-types";
import { authConnection, getApiConnection } from "@/lib/api";
import { CocktailForm, type CocktailFormData } from "./cocktail-form";
import { CocktailIngredientManager } from "./cocktail-ingredient-manager";

import { imageUrl } from "@/lib/image-url";

export function CocktailsTab({ jwt }: { jwt: string }) {
  const [cocktailsList, setCocktailsList] = useState<CocktailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCocktailsList(await cocktails.list(getApiConnection()));
    } catch {
      setError("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data: CocktailFormData) => {
    setSaving(true);
    setError(null);
    try {
      const created = await cocktails.create(authConnection(jwt), {
        name: data.name,
        price: data.price,
        description: data.description || undefined,
        image: data.image ?? undefined,
      });
      setShowCreate(false);
      setEditId(created.id);
      await load();
    } catch {
      setError("Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: CocktailFormData) => {
    setSaving(true);
    setError(null);
    try {
      await cocktails.update(authConnection(jwt), id, {
        name: data.name,
        price: data.price,
        description: data.description || undefined,
        ...(data.image ? { image: data.image } : {}),
      });
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
          {loading
            ? "Chargement…"
            : `${cocktailsList.length} cocktail${cocktailsList.length > 1 ? "s" : ""}`}
        </p>
        {!showCreate && (
          <button
            onClick={() => {
              setShowCreate(true);
              setEditId(null);
            }}
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
        {cocktailsList.map((c) =>
          editId === c.id ? (
            <div
              key={c.id}
              className="flex flex-col gap-0 rounded-xl border border-amber-600/40 bg-stone-900"
            >
              <div className="p-5">
                <CocktailForm
                  initial={{
                    name: c.name,
                    price: c.price,
                    description: c.description,
                  }}
                  onSubmit={(data) => handleUpdate(c.id, data)}
                  onCancel={() => setEditId(null)}
                  loading={saving}
                />
                <CocktailIngredientManager cocktailId={c.id} jwt={jwt} />
              </div>
            </div>
          ) : (
            <div
              key={c.id}
              className="flex items-center gap-4 rounded-xl border border-amber-800/30 bg-stone-900 p-5 transition-colors hover:border-amber-800/50"
            >
              {c.image && (
                <Image
                  src={imageUrl(c.image)!}
                  alt={c.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-cinzel font-bold text-amber-400">
                  {c.name}
                </p>
                <p className="font-playfair text-sm text-stone-500">
                  {c.price.toFixed(2)} €
                </p>
                {c.description && (
                  <p className="mt-0.5 truncate font-playfair text-xs italic text-stone-600">
                    {c.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setEditId(c.id);
                  setShowCreate(false);
                }}
                className="font-playfair text-xs text-stone-500 transition-colors hover:text-amber-400"
              >
                Modifier
              </button>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
