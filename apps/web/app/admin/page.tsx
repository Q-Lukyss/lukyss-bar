"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@lukyss-bar/api-types";
import { getApiConnection } from "@/lib/api";
import { CommandesTab } from "./_components/commandes-tab";
import { CocktailsTab } from "./_components/cocktails-tab";
import { IngredientsTab } from "./_components/ingredients-tab";
import { CodesTab } from "./_components/codes-tab";
import { ThemeToggle } from "@/components/theme-toggle";

type Tab = "commandes" | "cocktails" | "ingredients" | "codes";

const TABS: { id: Tab; label: string }[] = [
  { id: "commandes", label: "Commandes" },
  { id: "cocktails", label: "Cocktails" },
  { id: "ingredients", label: "Ingrédients" },
  { id: "codes", label: "Codes promo" },
];

export default function AdminPage() {
  const [jwt, setJwt] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("commandes");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const result = await auth.login(getApiConnection(), {
        email: email.trim(),
        password,
      });
      setJwt(result.access_token);
      setUserName(result.user.name);
    } catch {
      setLoginError("Email ou mot de passe incorrect.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (!jwt) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-monoton text-3xl text-primary">Admin</h1>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="font-playfair text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                ← Accueil
              </Link>
              <ThemeToggle />
            </div>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-playfair text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@lukyss.bar"
                className="rounded-lg bg-secondary px-4 py-2.5 font-playfair text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-playfair text-sm text-muted-foreground">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="rounded-lg bg-secondary px-4 py-2.5 font-playfair text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {loginError && (
              <p className="font-playfair text-sm text-destructive">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 w-full rounded-xl bg-primary py-3 font-cinzel font-bold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="font-monoton text-3xl text-primary">Admin</h1>
          <div className="flex items-center gap-4">
            <span className="font-playfair text-sm text-muted-foreground">{userName}</span>
            <Link
              href="/"
              className="font-playfair text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Accueil
            </Link>
            <button
              onClick={() => { setJwt(null); setEmail(""); setPassword(""); }}
              className="font-playfair text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              Déconnexion
            </button>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 font-cinzel text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "commandes" && <CommandesTab jwt={jwt} />}
        {activeTab === "cocktails" && <CocktailsTab jwt={jwt} />}
        {activeTab === "ingredients" && <IngredientsTab jwt={jwt} />}
        {activeTab === "codes" && <CodesTab jwt={jwt} />}
      </div>
    </main>
  );
}
