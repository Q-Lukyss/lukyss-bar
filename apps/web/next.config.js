// Les images sont toujours servies en proxy par l'API elle-même
// (apps/api/src/uploads.rs), jamais directement depuis R2 : un seul hostname
// suffit, dérivé de NEXT_PUBLIC_API_URL plutôt qu'un wildcard "https://**".
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nécessaire pour l'image Docker (apps/web/Dockerfile) : produit un
  // dossier .next/standalone auto-suffisant (serveur Node minimal), sans
  // avoir à embarquer node_modules du monorepo entier dans l'image runtime.
  output: "standalone",
  transpilePackages: ["@lukyss-bar/api-types"],
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", ""),
        hostname: apiUrl.hostname,
        port: apiUrl.port,
      },
    ],
    // L'API locale (localhost:3001) résout vers une IP privée (127.0.0.1) :
    // sans ce flag, l'optimiseur d'images de Next la refuse par défaut
    // (protection anti-SSRF), même si le remotePattern ci-dessus matche.
    // Sans effet en prod puisque l'API y tourne sur un vrai domaine public.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
