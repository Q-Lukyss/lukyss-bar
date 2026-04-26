"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";

const TYPE_STYLES = {
  info: "bg-blue-100 border-blue-400 text-blue-800",
  success: "bg-green-100 border-green-400 text-green-800",
  error: "bg-red-100 border-red-400 text-red-800",
};

export default function NotificationsPage() {
  const notifications = useQuery(api.notifications.list);
  const add = useMutation(api.notifications.add);
  const markRead = useMutation(api.notifications.markRead);
  const remove = useMutation(api.notifications.remove);

  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "error">("info");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    await add({ message: message.trim(), type });
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Notifications (Convex POC)</h1>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="border rounded px-2 py-2 text-sm"
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded text-sm"
          >
            Ajouter
          </button>
        </form>

        {notifications === undefined && (
          <p className="text-gray-400 text-sm">Chargement...</p>
        )}

        {notifications?.length === 0 && (
          <p className="text-gray-400 text-sm">Aucune notification.</p>
        )}

        <ul className="space-y-2">
          {notifications?.map((n) => (
            <li
              key={n._id}
              className={`border rounded px-4 py-3 flex items-start justify-between gap-3 ${TYPE_STYLES[n.type]} ${n.read ? "opacity-50" : ""}`}
            >
              <span className="text-sm flex-1">{n.message}</span>
              <div className="flex gap-2 shrink-0">
                {!n.read && (
                  <button
                    onClick={() => markRead({ id: n._id })}
                    className="text-xs underline"
                  >
                    Lu
                  </button>
                )}
                <button
                  onClick={() => remove({ id: n._id })}
                  className="text-xs underline"
                >
                  Suppr.
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
