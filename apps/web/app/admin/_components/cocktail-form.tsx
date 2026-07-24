"use client";

import { useState, useRef } from "react";

export type CocktailFormData = {
  name: string;
  price: number;
  description: string;
  image: File | null;
};

type InitialValues = {
  name?: string;
  price?: number;
  description?: string | null;
};

export function CocktailForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: InitialValues;
  onSubmit: (data: CocktailFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputClass =
    "rounded-lg bg-secondary px-4 py-2.5 font-playfair text-foreground outline-none transition-colors focus:ring-1 focus:ring-primary";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-primary/60 bg-card p-5">
      <h3 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {initial ? "Modifier le cocktail" : "Nouveau cocktail"}
      </h3>

      <div className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du cocktail"
          className={inputClass}
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Prix (€)"
          min="0"
          step="0.01"
          className={inputClass}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnelle) — visible sur la page détail"
          rows={3}
          className={`${inputClass} resize-none`}
        />
        <div className="flex flex-col gap-1">
          <label className="font-playfair text-sm text-muted-foreground">
            Image {initial && "(laisser vide pour conserver)"}
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="font-playfair text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:font-playfair file:text-foreground file:transition-colors file:hover:brightness-110"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() =>
            onSubmit({ name, price: parseFloat(price), description, image })
          }
          disabled={loading || !name.trim() || !price}
          className="flex-1 rounded-xl bg-primary py-2.5 font-cinzel font-bold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2.5 font-playfair text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
