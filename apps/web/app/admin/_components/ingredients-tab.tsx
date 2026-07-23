"use client";

import { useState, useEffect } from "react";
import { ingredients, type IngredientRow } from "@lukyss-bar/api-types";
import { authConnection, getApiConnection } from "@/lib/api";

export function IngredientsTab({ jwt }: { jwt: string }) {
  const [ingredientsList, setIngredientsList] = useState<IngredientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setIngredientsList(await ingredients.list(getApiConnection()));
    } catch {
      setError("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await ingredients.create(authConnection(jwt), { name: newName.trim(), stock: true });
      setNewName("");
      await load();
    } catch {
      setError("Erreur lors de la création.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(id);
    setError(null);
    try {
      await ingredients.update(authConnection(jwt), id, { name: editName.trim(), stock: null });
      setEditId(null);
      await load();
    } catch {
      setError("Erreur lors de la modification.");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(id);
    setError(null);
    try {
      await ingredients.delete(authConnection(jwt), id);
      await load();
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setSaving(null);
    }
  };

  const toggleStock = async (ing: IngredientRow) => {
    setSaving(ing.id);
    setError(null);
    try {
      if (ing.stock) {
        await ingredients.outOfStock(authConnection(jwt), ing.id);
      } else {
        await ingredients.inStock(authConnection(jwt), ing.id);
      }
      await load();
    } catch {
      setError("Erreur lors du changement de stock.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-amber-800/30 bg-stone-900 p-5 flex flex-col gap-3">
        <h3 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-stone-500">
          Nouvel ingrédient
        </h3>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom de l'ingrédient"
            className="flex-1 rounded-lg bg-stone-800 px-4 py-2.5 font-playfair text-stone-100 outline-none focus:ring-1 focus:ring-amber-600"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="rounded-xl bg-amber-600 px-5 py-2.5 font-cinzel font-bold text-stone-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "..." : "Ajouter"}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-4 font-playfair text-sm text-red-300">
          {error}
        </div>
      )}

      <p className="font-playfair text-sm text-stone-500">
        {loading ? "Chargement..." : `${ingredientsList.length} ingrédient${ingredientsList.length > 1 ? "s" : ""}`}
      </p>

      <div className="flex flex-col gap-2">
        {ingredientsList.map((ing) => (
          <div
            key={ing.id}
            className="rounded-xl border border-amber-800/20 bg-stone-900 px-5 py-3 flex items-center gap-3"
          >
            {editId === ing.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-lg bg-stone-800 px-3 py-1.5 font-playfair text-sm text-stone-100 outline-none focus:ring-1 focus:ring-amber-600"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdate(ing.id)}
                  disabled={saving === ing.id}
                  className="font-playfair text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50"
                >
                  {saving === ing.id ? "..." : "OK"}
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="font-playfair text-xs text-stone-500 hover:text-stone-300"
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 font-playfair text-sm text-stone-200">{ing.name}</span>
                <button
                  onClick={() => toggleStock(ing)}
                  disabled={saving === ing.id}
                  className={`rounded-full px-3 py-1 font-playfair text-xs transition-colors disabled:opacity-50 ${
                    ing.stock
                      ? "bg-green-900/40 text-green-300 hover:bg-green-900/60"
                      : "bg-red-950/40 text-red-300 hover:bg-red-950/60"
                  }`}
                >
                  {saving === ing.id ? "..." : ing.stock ? "En stock" : "Rupture"}
                </button>
                <button
                  onClick={() => { setEditId(ing.id); setEditName(ing.name); }}
                  className="font-playfair text-xs text-stone-500 transition-colors hover:text-amber-400"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(ing.id)}
                  disabled={saving === ing.id}
                  className="font-playfair text-xs text-stone-600 transition-colors hover:text-red-400 disabled:opacity-50"
                >
                  Supprimer
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
