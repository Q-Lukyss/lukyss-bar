"use client";

import { useState } from "react";
import type { IConnection } from "@nestia/fetcher";
import api from "@ORGANIZATION/PROJECT-api";
import { getApiConnection } from "@/lib/api";

type CommandeRow = Awaited<
  ReturnType<typeof api.functional.commandes.listAll>
>[number];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  IN_PREPARATION: "En préparation",
  READY: "Prête",
  COMPLETED: "Terminée",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as Array<
  keyof typeof STATUS_LABELS
>;

function authConnection(jwt: string): IConnection {
  return {
    ...getApiConnection(),
    headers: { Authorization: `Bearer ${jwt}` },
  };
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jwt, setJwt] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [commandes, setCommandes] = useState<CommandeRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

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
      loadCommandes(result.access_token);
    } catch {
      setLoginError("Email ou mot de passe incorrect.");
    } finally {
      setLoginLoading(false);
    }
  };

  const loadCommandes = async (token?: string) => {
    const t = token ?? jwt;
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.functional.commandes.listAll(authConnection(t));
      setCommandes(result);
    } catch {
      setError("Erreur lors du chargement des commandes.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!jwt) return;
    setUpdating(id);
    try {
      await api.functional.commandes.status.updateStatus(
        authConnection(jwt),
        id,
        { status: status as CommandeRow["status"] },
      );
      await loadCommandes();
    } catch {
      setError("Erreur lors de la mise à jour.");
    } finally {
      setUpdating(null);
    }
  };

  if (!jwt) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-8 font-monoton text-3xl text-amber-500">Admin</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-playfair text-sm text-stone-400">
                Email
              </label>
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
              <label className="font-playfair text-sm text-stone-400">
                Mot de passe
              </label>
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
            <span className="font-playfair text-sm text-stone-400">
              {userName}
            </span>
            <button
              onClick={() => {
                setJwt(null);
                setCommandes(null);
                setEmail("");
                setPassword("");
              }}
              className="font-playfair text-xs text-stone-600 transition-colors hover:text-red-400"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {commandes !== null && (
            <p className="font-playfair text-sm text-stone-500">
              {commandes.length} commande{commandes.length > 1 ? "s" : ""}
            </p>
          )}
          <button
            onClick={() => loadCommandes()}
            disabled={loading}
            className="ml-auto rounded-lg border border-amber-800/40 px-4 py-1.5 font-playfair text-sm text-amber-400 transition-colors hover:border-amber-600 disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Rafraîchir"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-4 font-playfair text-sm text-red-300">
            {error}
          </div>
        )}

        {commandes?.length === 0 && (
          <p className="font-playfair text-stone-600">Aucune commande.</p>
        )}

        {commandes?.map((cmd) => (
          <div
            key={cmd.id}
            className="rounded-xl border border-amber-800/30 bg-stone-900 p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-cinzel font-bold text-amber-400">
                  {cmd.customerName}
                </p>
                <p className="font-mono text-xs text-stone-600">{cmd.id}</p>
                {cmd.promoCode && (
                  <p className="font-playfair text-xs text-stone-500">
                    Code : {cmd.promoCode}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-amber-600/20 px-3 py-1 font-playfair text-xs text-amber-300">
                {cmd.totalPrice.toFixed(2)} €
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-playfair text-sm text-stone-400">
                Statut :
              </span>
              <select
                value={cmd.status}
                disabled={updating === cmd.id}
                onChange={(e) => updateStatus(cmd.id, e.target.value)}
                className="rounded-lg bg-stone-800 px-3 py-1.5 font-playfair text-sm text-stone-100 outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              {updating === cmd.id && (
                <span className="animate-pulse font-playfair text-xs text-stone-500">
                  Mise à jour...
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
