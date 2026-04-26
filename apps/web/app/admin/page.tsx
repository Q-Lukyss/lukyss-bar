"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";
import { CommandesTab } from "./_components/commandes-tab";
import { CocktailsTab } from "./_components/cocktails-tab";
import { IngredientsTab } from "./_components/ingredients-tab";
import { CodesTab } from "./_components/codes-tab";

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
      const result = await api.functional.auth.login(getApiConnection(), {
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
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-monoton text-3xl text-amber-500">Admin</h1>
            <Link
              href="/"
              className="font-playfair text-sm text-stone-500 transition-colors hover:text-amber-400"
            >
              ← Accueil
            </Link>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-playfair text-sm text-stone-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@lukyss.bar"
                className="rounded-lg bg-stone-800 px-4 py-2.5 font-playfair text-stone-100 outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-playfair text-sm text-stone-400">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="rounded-lg bg-stone-800 px-4 py-2.5 font-playfair text-stone-100 outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
            {loginError && (
              <p className="font-playfair text-sm text-red-400">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 w-full rounded-xl bg-amber-600 py-3 font-cinzel font-bold text-stone-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-12">
      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="font-monoton text-3xl text-amber-500">Admin</h1>
          <div className="flex items-center gap-4">
            <span className="font-playfair text-sm text-stone-400">{userName}</span>
            <Link
              href="/"
              className="font-playfair text-xs text-stone-500 transition-colors hover:text-amber-400"
            >
              Accueil
            </Link>
            <button
              onClick={() => { setJwt(null); setEmail(""); setPassword(""); }}
              className="font-playfair text-xs text-stone-600 transition-colors hover:text-red-400"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="flex border-b border-stone-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 font-cinzel text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-amber-500 text-amber-400"
                  : "text-stone-500 hover:text-stone-300"
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
