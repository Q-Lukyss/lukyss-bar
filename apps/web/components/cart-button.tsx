"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/panier"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-primary/70 text-primary transition-colors hover:border-primary hover:bg-primary/10"
      aria-label="Voir le panier"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>

      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
