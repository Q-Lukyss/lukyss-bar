"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

type Props = {
  cocktailId: string;
  name: string;
  price: number;
};

export function AddToCartButton({ cocktailId, name, price }: Props) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    add({ cocktailId, name, price });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      onClick={handleClick}
      className={`mt-auto w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
        added
          ? "bg-green-700 text-green-100"
          : "bg-amber-600 text-stone-950 hover:bg-amber-500 active:bg-amber-700"
      }`}
    >
      {added ? "Ajouté ✓" : "Ajouter au panier"}
    </button>
  );
}
