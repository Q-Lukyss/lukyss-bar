"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CartButton } from "@/components/cart-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Nav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full border-b border-primary/45 bg-background/90 px-6 py-3 backdrop-blur-sm transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/" className="font-monoton text-sm text-brand">
          Lukyss&apos;Bar
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="rounded-full border border-border px-4 py-1.5 font-playfair text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Connexion
          </Link>
          <ThemeToggle />
          <CartButton />
        </div>
      </div>
    </nav>
  );
}
