const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function imageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}
