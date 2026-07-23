import type { ApiConnection } from "@lukyss-bar/api-types";

export function getApiConnection(): ApiConnection {
  return {
    host: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  };
}

export function authConnection(token: string): ApiConnection {
  return { ...getApiConnection(), token };
}
