"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-primary/70 text-primary transition-colors hover:border-primary hover:bg-primary/10 ${className}`}
    >
      {mounted && (isDark ? <Sun size={18} /> : <Moon size={18} />)}
    </button>
  );
}
