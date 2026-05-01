"use client";

import { useState, useEffect } from "react";
import type { IConnection } from "@nestia/fetcher";
import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";

type IngredientLink = {
  id: string;
  ingredientId: string;
  name: string;
  stock: boolean;
  quantity: number;
  unity: string;
};

type AvailableIngredient = {
  id: string;
  name: string;
  stock: boolean;
};

function authConnection(jwt: string): IConnection {
  return { ...getApiConnection(), headers: { Authorization: `Bearer ${jwt}` } };
}

const UNITY_SUGGESTIONS = ["ml", "cl", "dl", "g", "dash", "trait", "pièce"];

export function CocktailIngredientManager({
  cocktailId,
  jwt,
}: {
  cocktailId: string;
  jwt: string;
}) {
  const [links, setLinks] = useState<IngredientLink[]>([]);
  const [allIngredients, setAllIngredients] = useState<AvailableIngredient[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unity, setUnity] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [linksData, ingredientsData] = await Promise.all([
        api.functional.cocktails.ingredients.getCocktailIngredients(
          getApiConnection(),
          cocktailId,
        ),
        api.functional.ingredients.list(getApiConnection()),
      ]);
      setLinks(
        linksData.map((l) => ({
          id: l.id,
          ingredientId: l.ingredientId,
          name: l.ingredientName,
          stock: l.ingredientStock,
          quantity: l.quantity,
          unity: l.unity,
        })),
      );
      setAllIngredients(ingredientsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [cocktailId]);

  const handleAdd = async () => {
    if (!selectedId || !quantity || !unity) return;
    setAdding(true);
    setError(null);
    try {
      await api.functional.cocktails.ingredients.addIngredient(
        authConnection(jwt),
        cocktailId,
        { ingredientId: selectedId, quantity: parseInt(quantity), unity },
      );
      setShowAddForm(false);
      setSelectedId("");
      setQuantity("");
      setUnity("");
      await loadAll();
    } catch {
      setError("Erreur lors de l'ajout.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    try {
      await api.functional.cocktails.ingredients.deleteIngredient(
        authConnection(jwt),
        cocktailId,
        linkId,
      );
      await loadAll();
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  const available = allIngredients.filter(
    (ing) => !links.some((l) => l.ingredientId === ing.id),
  );

  const inputClass =
    "rounded-lg bg-stone-800 px-3 py-2 font-playfair text-sm text-stone-100 outline-none transition-colors focus:ring-1 focus:ring-amber-600";

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-stone-800 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-stone-500">
          Ingrédients ({links.length})
        </h4>
        {!showAddForm && available.length > 0 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="font-playfair text-xs text-amber-400 transition-colors hover:text-amber-300"
          >
            + Ajouter
          </button>
        )}
      </div>

      {error && (
        <p className="font-playfair text-xs text-red-400">{error}</p>
      )}

      {showAddForm && (
        <div className="flex flex-col gap-2 rounded-lg border border-stone-700 bg-stone-800/50 p-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={inputClass}
          >
            <option value="">Choisir un ingrédient…</option>
            {available.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Quantité"
              min="0"
              className={`${inputClass} w-28`}
            />
            <input
              value={unity}
              onChange={(e) => setUnity(e.target.value)}
              placeholder="Unité"
              list="unity-suggestions"
              className={`${inputClass} flex-1`}
            />
            <datalist id="unity-suggestions">
              {UNITY_SUGGESTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding || !selectedId || !quantity || !unity}
              className="flex-1 rounded-lg bg-amber-600 py-1.5 font-playfair text-sm text-stone-950 transition-colors hover:bg-amber-500 disabled:opacity-50"
            >
              {adding ? "Ajout…" : "Confirmer"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-stone-700 px-3 py-1.5 font-playfair text-sm text-stone-400 transition-colors hover:text-stone-200"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-playfair text-xs text-stone-500">Chargement…</p>
      ) : links.length === 0 ? (
        <p className="font-playfair text-xs text-stone-600 italic">
          Aucun ingrédient ajouté.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between rounded-lg bg-stone-800/50 px-3 py-2"
            >
              <span className="font-playfair text-sm">
                <span
                  className={link.stock ? "text-stone-300" : "text-red-400 line-through"}
                >
                  {link.name}
                </span>
                <span className="ml-2 text-stone-500">
                  {link.quantity} {link.unity}
                </span>
              </span>
              <button
                onClick={() => handleDelete(link.id)}
                className="ml-4 font-mono text-stone-600 transition-colors hover:text-red-400"
                title="Supprimer"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
