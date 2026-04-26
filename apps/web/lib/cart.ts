import { useState, useEffect, useCallback } from "react";

export type CartItem = {
  cocktailId: string;
  name: string;
  price: number;
  quantity: number;
};

const STORAGE_KEY = "lukyss-cart";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());
  }, []);

  const add = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.cocktailId === item.cocktailId);
      const next = existing
        ? prev.map((i) =>
            i.cocktailId === item.cocktailId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [...prev, { ...item, quantity: 1 }];
      writeCart(next);
      return next;
    });
  }, []);

  const remove = useCallback((cocktailId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.cocktailId !== cocktailId);
      writeCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, add, remove, clear, total, count };
}
