/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lukyss-bar/api-types"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3001" },
      { protocol: "https", hostname: "**" },
    ],
    // L'API locale (localhost:3001) résout vers une IP privée (127.0.0.1) :
    // sans ce flag, l'optimiseur d'images de Next la refuse par défaut
    // (protection anti-SSRF), même si le remotePattern ci-dessus matche.
    // Sans effet en prod puisque l'API y tourne sur un vrai domaine public.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
