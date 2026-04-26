"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import Link from "next/link";

const TYPE_LABELS = {
  info: "Info",
  success: "Succès",
  error: "Erreur",
};

const TYPE_BADGE: Record<string, string> = {
  info: "bg-amber-600/20 text-amber-300",
  success: "bg-green-900/40 text-green-300",
  error: "bg-red-950/40 text-red-300",
};

const TYPE_CARD: Record<string, string> = {
  info: "border-amber-800/30",
  success: "border-green-800/30",
  error: "border-red-800/30",
};

export default function NotificationsPage() {
  const notifications = useQuery(api.notifications.list);
  const add = useMutation(api.notifications.add);
  const markRead = useMutation(api.notifications.markRead);
  const remove = useMutation(api.notifications.remove);

  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "error">("info");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    await add({ message: message.trim(), type });
    setMessage("");
    setLoading(false);
  }

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-8">

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-monoton text-3xl text-amber-500">
              Notifications
            </h1>
            <p className="font-playfair text-sm text-stone-400">
              Temps réel via{" "}
              <span className="text-amber-400">Convex</span>{" "}
              <span className="text-stone-600">— POC</span>
            </p>
          </div>
          {unread > 0 && (
            <span className="mt-1 shrink-0 rounded-full bg-amber-600/20 px-3 py-1 font-playfair text-sm font-semibold text-amber-300">
              {unread} non lu{unread > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-amber-800/30 bg-stone-900 p-6 flex flex-col gap-4">
          <h2 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-stone-500">
            Nouvelle notification
          </h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message..."
              className="rounded-lg bg-stone-800 px-4 py-2.5 font-playfair text-stone-100 outline-none focus:ring-1 focus:ring-amber-600"
            />
            <div className="flex gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="rounded-lg bg-stone-800 px-3 py-2 font-playfair text-sm text-stone-100 outline-none focus:ring-1 focus:ring-amber-600"
              >
                <option value="info">Info</option>
                <option value="success">Succès</option>
                <option value="error">Erreur</option>
              </select>
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="flex-1 rounded-xl bg-amber-600 py-2 font-cinzel font-bold text-stone-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Envoi..." : "Ajouter"}
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-stone-500">
            {notifications === undefined
              ? "Chargement..."
              : `${notifications.length} notification${notifications.length > 1 ? "s" : ""}`}
          </h2>

          {notifications?.length === 0 && (
            <div className="rounded-xl border border-stone-800 bg-stone-900 p-10 text-center">
              <p className="font-playfair text-stone-500">
                Aucune notification pour l'instant.
              </p>
            </div>
          )}

          {notifications?.map((n) => (
            <div
              key={n._id}
              className={`rounded-xl border bg-stone-900 p-5 flex items-start justify-between gap-4 transition-opacity ${TYPE_CARD[n.type]} ${n.read ? "opacity-40" : ""}`}
            >
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span
                  className={`self-start rounded-full px-2.5 py-0.5 font-cinzel text-xs font-semibold ${TYPE_BADGE[n.type]}`}
                >
                  {TYPE_LABELS[n.type]}
                </span>
                <p className="font-playfair text-sm text-stone-200 break-words">
                  {n.message}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {!n.read && (
                  <button
                    onClick={() => markRead({ id: n._id })}
                    className="font-playfair text-xs text-stone-500 transition-colors hover:text-amber-400"
                  >
                    Marquer lu
                  </button>
                )}
                <button
                  onClick={() => remove({ id: n._id })}
                  className="font-playfair text-xs text-stone-600 transition-colors hover:text-red-400"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="self-start font-playfair text-sm text-stone-500 transition-colors hover:text-amber-400"
        >
          ← Retour
        </Link>
      </div>
    </main>
  );
}
