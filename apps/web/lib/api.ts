import type { IConnection } from "@nestia/fetcher";

export function getApiConnection(): IConnection {
  return {
    host: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  };
}
