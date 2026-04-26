import { useState, useEffect, useCallback } from "react";

export type CartItem = {
  cocktailId: string;
  name: string;
  price: number;
  quantity: number;
};

const STORAGE_KEY = "lukyss-cart";
const CART_EVENT = "lukyss:cart";

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
  window.dispatchEvent(new Event(CART_EVENT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());

    const sync = () => setItems(readCart());
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, []);

  const add = useCallback((item: Omit<CartItem, "quantity">) => {
    const prev = readCart();
    const existing = prev.find((i) => i.cocktailId === item.cocktailId);
    const next = existing
      ? prev.map((i) =>
          i.cocktailId === item.cocktailId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        )
      : [...prev, { ...item, quantity: 1 }];
    writeCart(next);
    setItems(next);
  }, []);

  const remove = useCallback((cocktailId: string) => {
    const next = readCart().filter((i) => i.cocktailId !== cocktailId);
    writeCart(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(CART_EVENT));
    setItems([]);
  }, []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, add, remove, clear, total, count };
}
